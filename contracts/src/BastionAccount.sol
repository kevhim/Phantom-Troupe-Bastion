// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IEntryPoint.sol";
import "./MockToken.sol";

/**
 * @title BastionAccount
 * @notice ERC-4337 Account Abstraction Smart Account with 6-Dimension Policy Enforcement,
 *         Hardware-Assisted Physical Review (ESP32 EIP-712), Dual Owner Co-Authorization,
 *         and Independent Emergency Session Revocation.
 *
 * @dev Conforms to official hackathon challenge W3-02 (Agent Wallet: Letting AI Agents Pay Safely).
 */
contract BastionAccount is IAccount {
    // --- Roles ---
    address public immutable entryPoint;
    address public owner;                      // Laptop B supervisor / owner root key
    address public agentSessionKey;             // AI agent delegated session key on Laptop A
    address public juniorExceptionSigner;       // ESP32 #1 key (RFID Junior Card 1 selected)
    address public seniorExceptionSigner;       // ESP32 #1 key (RFID Senior Card 2 selected)
    address public revokerRole;                 // ESP32 #1 direct Wi-Fi emergency panic key

    // --- On-Chain Role Ceilings ---
    uint256 public constant JUNIOR_CAP = 2000 * 1e6;   // 2,000 bUSD
    uint256 public constant SENIOR_CAP = 10000 * 1e6;  // 10,000 bUSD

    // --- Six W3-02 Policy Dimensions for Agent Session ---
    address public allowedTarget;               // Dimension 1: Permitted target contract (e.g. MockToken)
    bytes4  public allowedSelector;             // Dimension 2: Permitted function selector (e.g. transfer)
    address public allowedRecipient;            // Dimension 3: Permitted recipient vendor address
    uint256 public maxPerTxLimit;               // Dimension 4: Maximum single-tx ceiling (e.g. 50 bUSD)
    uint256 public dailySpendLimit;             // Dimension 5: UTC calendar-day ceiling (e.g. 100 bUSD)
    uint256 public sessionExpiry;               // Dimension 6: Session expiration Unix timestamp

    // --- Policy & State Tracking ---
    uint256 public policyVersion = 1;
    uint256 public accountNonce;
    bool public strictOwnerExceptionMode = true; // Strict W3-02: out-of-policy requires owner co-signature

    // --- Spending & Revocation Storage ---
    // sessionId -> UTC day index (block.timestamp / 86400) -> spent amount
    mapping(bytes32 => mapping(uint256 => uint256)) public dailySpent;
    mapping(bytes32 => bool) public revokedSessions;
    mapping(bytes32 => bool) public pausedSessions;
    mapping(uint256 => bool) public usedExceptionNonces;

    // --- EIP-712 Domain and Typehashes ---
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant PAYMENT_INTENT_TYPEHASH = keccak256(
        "PaymentIntent(uint256 chainId,address verifyingAccount,uint256 accountNonce,string requestId,uint256 policyVersion,string actorSession,string approvalTier,address tokenAddress,address targetContract,bytes4 functionSelector,address recipientAddress,uint256 amountBaseUnits,uint256 maxPerTxException,uint256 deadline,bytes32 calldataHash)"
    );

    struct PaymentIntent {
        uint256 chainId;
        address verifyingAccount;
        uint256 accountNonce;
        string requestId;
        uint256 policyVersion;
        string actorSession;
        string approvalTier;
        address tokenAddress;
        address targetContract;
        bytes4 functionSelector;
        address recipientAddress;
        uint256 amountBaseUnits;
        uint256 maxPerTxException;
        uint256 deadline;
        bytes32 calldataHash;
    }

    // --- Events ---
    event PaymentExecuted(bytes32 indexed sessionId, address indexed recipient, uint256 amount, uint256 dayIndex);
    event ExceptionAuthorized(string indexed requestId, string approvalTier, address signer, address ownerCoSigner, uint256 amount);
    event SessionRevoked(bytes32 indexed sessionId, address indexed triggeredBy, string reason);
    event SessionPaused(bytes32 indexed sessionId, bool isPaused);
    event PolicyUpdated(uint256 newPolicyVersion, uint256 maxPerTx, uint256 dailyLimit, address target, address recipient);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner authorized");
        _;
    }

    modifier onlyEntryPointOrOwner() {
        require(msg.sender == entryPoint || msg.sender == owner, "Only EntryPoint or owner");
        _;
    }

    constructor(
        address _entryPoint,
        address _owner,
        address _agentSessionKey,
        address _juniorSigner,
        address _seniorSigner,
        address _revokerRole,
        address _allowedTarget,
        address _allowedRecipient,
        uint256 _maxPerTxLimit,
        uint256 _dailySpendLimit,
        uint256 _sessionExpiry
    ) {
        require(_entryPoint != address(0), "Invalid entryPoint");
        require(_owner != address(0), "Invalid owner");

        entryPoint = _entryPoint;
        owner = _owner;
        agentSessionKey = _agentSessionKey;
        juniorExceptionSigner = _juniorSigner;
        seniorExceptionSigner = _seniorSigner;
        revokerRole = _revokerRole;

        allowedTarget = _allowedTarget;
        allowedSelector = bytes4(keccak256("transfer(address,uint256)"));
        allowedRecipient = _allowedRecipient;
        maxPerTxLimit = _maxPerTxLimit;
        dailySpendLimit = _dailySpendLimit;
        sessionExpiry = _sessionExpiry;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("BastionX")),
                keccak256(bytes("2")),
                block.chainid,
                address(this)
            )
        );
    }

    // -------------------------------------------------------------
    // ERC-4337 Validation
    // -------------------------------------------------------------

    /**
     * @notice ERC-4337 userOp validation.
     * @dev Validates that the signature is from the active agentSessionKey,
     *      and checks session expiry and revocation state.
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256 validationData) {
        require(msg.sender == entryPoint, "Caller not EntryPoint");

        bytes32 sId = keccak256(abi.encodePacked(agentSessionKey));
        if (revokedSessions[sId] || pausedSessions[sId]) {
            return 1; // SIG_VALIDATION_FAILED
        }
        if (block.timestamp > sessionExpiry) {
            return 1; // Expired
        }

        // Recover signer from userOpHash
        address signer = recoverSigner(userOpHash, userOp.signature);
        if (signer != agentSessionKey && signer != owner) {
            return 1; // Unauthorized signer
        }

        // Pay prefund if needed
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            require(success, "Prefund payment failed");
        }

        return 0; // Success
    }

    // -------------------------------------------------------------
    // In-Policy Agent Execution (Enforces 6 W3-02 Policies)
    // -------------------------------------------------------------

    /**
     * @notice Autonomous payment execution for AI Agent session key.
     * @dev Strictly checks all 6 policies on-chain before executing.
     */
    function executeAgentPayment(
        address target,
        address recipient,
        uint256 amount
    ) external onlyEntryPointOrOwner {
        bytes32 sId = keccak256(abi.encodePacked(agentSessionKey));
        require(!revokedSessions[sId], "Session is revoked on-chain");
        require(!pausedSessions[sId], "Session is paused on-chain");
        require(block.timestamp <= sessionExpiry, "Session has expired");

        // Policy 1: Target check
        require(target == allowedTarget, "Policy violation: Target contract not allowed");

        // Policy 2: Function selector is transfer(address,uint256)
        // Policy 3: Recipient check
        require(recipient == allowedRecipient, "Policy violation: Recipient not allowed");

        // Policy 4: Per-transaction ceiling
        require(amount <= maxPerTxLimit, "Policy violation: Amount exceeds maxPerTxLimit");

        // Policy 5: Daily UTC calendar-day ceiling
        uint256 currentDay = block.timestamp / 86400;
        uint256 spentToday = dailySpent[sId][currentDay];
        require(spentToday + amount <= dailySpendLimit, "Policy violation: Daily spend cap exceeded");

        // Atomic accounting state update
        dailySpent[sId][currentDay] = spentToday + amount;
        accountNonce++;

        // Execute ERC-20 transfer
        bool success = MockToken(target).transfer(recipient, amount);
        require(success, "Token transfer reverted");

        emit PaymentExecuted(sId, recipient, amount, currentDay);
    }

    // -------------------------------------------------------------
    // Hardware-Assisted Out-of-Policy Exception Execution
    // -------------------------------------------------------------

    /**
     * @notice Out-of-policy payment requiring:
     *         1) ESP32 physical review & EIP-712 device signature (Junior/Senior tier)
     *         2) Independent Owner EIP-712 co-signature (Strict W3-02 compliance)
     *         3) Replay protection & exact calldata/recipient matching.
     */
    function executeAuthorizedException(
        PaymentIntent calldata intent,
        bytes calldata deviceSignature,
        bytes calldata ownerSignature
    ) external onlyEntryPointOrOwner {
        // 1. Verify Domain & Verifying Contract Binding
        require(intent.verifyingAccount == address(this), "Exception: Verifying account mismatch");
        require(intent.chainId == block.chainid, "Exception: Chain ID mismatch");
        require(intent.policyVersion == policyVersion, "Exception: Stale policy version");

        // 2. Replay & Expiry Protection
        require(!usedExceptionNonces[intent.accountNonce], "Exception: Nonce already used");
        require(block.timestamp <= intent.deadline, "Exception: Intent expired");
        usedExceptionNonces[intent.accountNonce] = true;
        accountNonce++;

        // 3. Reconstruct Canonical EIP-712 Digest
        bytes32 structHash = hashPaymentIntent(intent);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        // 4. Verify ESP32 Hardware Device Signature
        address recoveredDeviceSigner = recoverSigner(digest, deviceSignature);
        bool isJunior = keccak256(bytes(intent.approvalTier)) == keccak256(bytes("JUNIOR_EXCEPTION"));
        bool isSenior = keccak256(bytes(intent.approvalTier)) == keccak256(bytes("SENIOR_EXCEPTION"));

        if (isJunior) {
            require(recoveredDeviceSigner == juniorExceptionSigner, "Exception: Invalid junior hardware signature");
            require(intent.amountBaseUnits <= JUNIOR_CAP, "Exception: Exceeds junior role cap");
        } else if (isSenior) {
            require(recoveredDeviceSigner == seniorExceptionSigner, "Exception: Invalid senior hardware signature");
            require(intent.amountBaseUnits <= SENIOR_CAP, "Exception: Exceeds senior role cap");
        } else {
            revert("Exception: Unknown approval tier");
        }

        // 5. Strict W3-02 Compliance: Verify Independent Owner Co-Signature
        address recoveredOwner = address(0);
        if (strictOwnerExceptionMode) {
            recoveredOwner = recoverSigner(digest, ownerSignature);
            require(recoveredOwner == owner, "Exception: Invalid owner co-signature");
        }

        // 6. Verify Calldata Hash Matching
        bytes memory expectedCalldata = abi.encodeWithSelector(intent.functionSelector, intent.recipientAddress, intent.amountBaseUnits);
        require(intent.calldataHash == keccak256(expectedCalldata), "Exception: Calldata hash mismatch");

        // 7. Atomic Execution
        bool success = MockToken(intent.targetContract).transfer(intent.recipientAddress, intent.amountBaseUnits);
        require(success, "Exception: Token transfer failed");

        emit ExceptionAuthorized(intent.requestId, intent.approvalTier, recoveredDeviceSigner, recoveredOwner, intent.amountBaseUnits);
    }

    // -------------------------------------------------------------
    // Emergency Revocation & Panic Controls
    // -------------------------------------------------------------

    /**
     * @notice Independent emergency revocation of a delegated agent session.
     * @dev Callable by owner OR revokerRole (ESP32 direct Wi-Fi panic key).
     */
    function revokeSession(bytes32 sessionId, string calldata reason) external {
        require(msg.sender == owner || msg.sender == revokerRole, "Unauthorized to revoke session");
        revokedSessions[sessionId] = true;
        emit SessionRevoked(sessionId, msg.sender, reason);
    }

    function pauseSession(bytes32 sessionId, bool isPaused) external onlyOwner {
        pausedSessions[sessionId] = isPaused;
        emit SessionPaused(sessionId, isPaused);
    }

    function updatePolicy(
        address _newTarget,
        address _newRecipient,
        uint256 _newMaxPerTx,
        uint256 _newDailyLimit
    ) external onlyOwner {
        allowedTarget = _newTarget;
        allowedRecipient = _newRecipient;
        maxPerTxLimit = _newMaxPerTx;
        dailySpendLimit = _newDailyLimit;
        policyVersion++;
        emit PolicyUpdated(policyVersion, _newMaxPerTx, _newDailyLimit, _newTarget, _newRecipient);
    }

    function setStrictOwnerExceptionMode(bool enabled) external onlyOwner {
        strictOwnerExceptionMode = enabled;
    }

    // -------------------------------------------------------------
    // Cryptographic Helpers
    // -------------------------------------------------------------

    function hashPaymentIntent(PaymentIntent memory intent) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                PAYMENT_INTENT_TYPEHASH,
                intent.chainId,
                intent.verifyingAccount,
                intent.accountNonce,
                keccak256(bytes(intent.requestId)),
                intent.policyVersion,
                keccak256(bytes(intent.actorSession)),
                keccak256(bytes(intent.approvalTier)),
                intent.tokenAddress,
                intent.targetContract,
                intent.functionSelector,
                intent.recipientAddress,
                intent.amountBaseUnits,
                intent.maxPerTxException,
                intent.deadline,
                intent.calldataHash
            )
        );
    }

    function recoverSigner(bytes32 hash, bytes memory signature) public pure returns (address) {
        if (signature.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        return ecrecover(hash, v, r, s);
    }

    receive() external payable {}
}
