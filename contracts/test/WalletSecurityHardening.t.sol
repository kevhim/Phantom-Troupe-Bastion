// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BastionAccount.sol";
import "../src/MockToken.sol";
import "../src/RiskCircuitBreaker.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";
import "@account-abstraction/contracts/interfaces/UserOperation.sol";

/**
 * @title WalletSecurityHardeningTest
 * @notice Complete W3-02 security test suite validating all 10 Phase 2 mandatory test requirements.
 */
contract WalletSecurityHardeningTest is Test {
    EntryPoint public entryPoint;
    BastionAccount public account;
    MockToken public token;
    RiskCircuitBreaker public circuitBreaker;

    uint256 public ownerPrivateKey = 0xA11CE;
    address public owner;

    uint256 public agentPrivateKey = 0xB0B;
    address public agent;

    uint256 public juniorPrivateKey = 0xDE71CE1;
    address public junior;

    uint256 public seniorPrivateKey = 0xDE71CE2;
    address public senior;

    uint256 public revokerPrivateKey = 0x7777;
    address public revoker;

    address public allowedVendor = address(0x3333);
    address public attackerWallet = address(0x6666);
    address public beneficiary = address(0x9999);

    uint256 constant MAX_PER_TX = 50 * 1e6;   // 50 bUSD
    uint256 constant DAILY_LIMIT = 100 * 1e6; // 100 bUSD
    uint256 public initialDeposit = 2 ether;
    uint256 public initialTokenBalance = 1000 * 1e6; // 1,000 bUSD

    bytes32 public sId;

    function setUp() public {
        vm.warp(1000000); // stable non-zero timestamp

        owner = vm.addr(ownerPrivateKey);
        agent = vm.addr(agentPrivateKey);
        junior = vm.addr(juniorPrivateKey);
        senior = vm.addr(seniorPrivateKey);
        revoker = vm.addr(revokerPrivateKey);

        entryPoint = new EntryPoint();
        token = new MockToken(0);
        circuitBreaker = new RiskCircuitBreaker(owner);

        account = new BastionAccount(
            address(entryPoint),
            owner,
            agent,
            junior,
            senior,
            revoker,
            address(token),
            allowedVendor,
            MAX_PER_TX,
            DAILY_LIMIT,
            block.timestamp + 30 days
        );

        sId = keccak256(abi.encodePacked(agent));

        vm.prank(owner);
        account.setCircuitBreaker(address(circuitBreaker));

        vm.prank(owner);
        circuitBreaker.setAuthorizedAccount(address(account));

        // Fund account with ETH and prefund EntryPoint deposit
        vm.deal(address(account), 10 ether);
        entryPoint.depositTo{value: initialDeposit}(address(account));

        // Mint initial tokens to smart account
        token.mint(address(account), initialTokenBalance);
    }

    // Helper: Build and sign a UserOperation for executeAgentPayment
    function _buildSignedUserOp(
        address target,
        address recipient,
        uint256 amount,
        uint256 signerKey
    ) internal returns (UserOperation memory userOp, bytes32 userOpHash) {
        bytes memory callData = abi.encodeWithSelector(
            BastionAccount.executeAgentPayment.selector,
            target,
            recipient,
            amount
        );

        uint256 nonce = entryPoint.getNonce(address(account), 0);

        userOp = UserOperation({
            sender: address(account),
            nonce: nonce,
            initCode: "",
            callData: callData,
            callGasLimit: 350000,
            verificationGasLimit: 300000,
            preVerificationGas: 50000,
            maxFeePerGas: 2 gwei,
            maxPriorityFeePerGas: 1 gwei,
            paymasterAndData: "",
            signature: ""
        });

        userOpHash = entryPoint.getUserOpHash(userOp);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, userOpHash);
        userOp.signature = abi.encodePacked(r, s, v);
    }

    // -------------------------------------------------------------
    // Test 1: Authorized 20-token payment succeeds
    // -------------------------------------------------------------
    function test01_Authorized20TokenPaymentSucceeds() public {
        uint256 paymentAmount = 20 * 1e6;
        (UserOperation memory userOp, ) = _buildSignedUserOp(address(token), allowedVendor, paymentAmount, agentPrivateKey);

        UserOperation[] memory ops = new UserOperation[](1);
        ops[0] = userOp;

        entryPoint.handleOps(ops, payable(beneficiary));

        assertEq(token.balanceOf(allowedVendor), paymentAmount, "Vendor balance must be 20 bUSD");
        assertEq(token.balanceOf(address(account)), initialTokenBalance - paymentAmount, "Account balance must be 980 bUSD");
        assertEq(account.dailySpent(sId, block.timestamp / 86400), paymentAmount, "Daily spent must record 20 bUSD");
    }

    // -------------------------------------------------------------
    // Test 2: Oversized 500-token payment fails
    // -------------------------------------------------------------
    function test02_Oversized500TokenPaymentFails() public {
        uint256 paymentAmount = 500 * 1e6; // Exceeds 50 bUSD cap

        vm.prank(owner);
        vm.expectRevert("Policy violation: Amount exceeds maxPerTxLimit");
        account.executeAgentPayment(address(token), allowedVendor, paymentAmount);

        assertEq(token.balanceOf(allowedVendor), 0, "No tokens transferred to vendor");
        assertEq(token.balanceOf(address(account)), initialTokenBalance, "Account balance intact");
    }

    // -------------------------------------------------------------
    // Test 3: Unknown recipient fails
    // -------------------------------------------------------------
    function test03_UnknownRecipientFails() public {
        uint256 paymentAmount = 20 * 1e6;

        vm.prank(owner);
        vm.expectRevert("Policy violation: Recipient not allowed");
        account.executeAgentPayment(address(token), attackerWallet, paymentAmount);

        assertEq(token.balanceOf(attackerWallet), 0, "Attacker received nothing");
    }

    // -------------------------------------------------------------
    // Test 4: Unauthorized selector or target fails
    // -------------------------------------------------------------
    function test04_UnauthorizedSelectorOrTargetFails() public {
        MockToken unapprovedToken = new MockToken(0);

        // Target not allowed
        vm.prank(owner);
        vm.expectRevert("Policy violation: Target contract not allowed");
        account.executeAgentPayment(address(unapprovedToken), allowedVendor, 20 * 1e6);

        // Calling unauthorized selector directly on BastionAccount reverts
        vm.prank(agent);
        (bool success, ) = address(account).call(abi.encodeWithSignature("transfer(address,uint256)", allowedVendor, 20 * 1e6));
        assertFalse(success, "Arbitrary function call must revert on account");
    }

    // -------------------------------------------------------------
    // Test 5: Cumulative daily overspending fails
    // -------------------------------------------------------------
    function test05_CumulativeDailyOverspendingFails() public {
        // Payment 1: 45 tokens (within 50 cap)
        vm.prank(owner);
        account.executeAgentPayment(address(token), allowedVendor, 45 * 1e6);

        // Warp past burst window (305s) to test UTC calendar-day ceiling
        vm.warp(block.timestamp + 305);

        // Payment 2: 45 tokens (total: 90 tokens)
        vm.prank(owner);
        account.executeAgentPayment(address(token), allowedVendor, 45 * 1e6);

        assertEq(account.dailySpent(sId, block.timestamp / 86400), 90 * 1e6);

        vm.warp(block.timestamp + 305);

        // Payment 3: 20 tokens -> Total 110 > 100 DAILY_LIMIT -> REVERTS
        vm.prank(owner);
        vm.expectRevert("Policy violation: Daily spend cap exceeded");
        account.executeAgentPayment(address(token), allowedVendor, 20 * 1e6);

        // Total spent remains 90
        assertEq(account.dailySpent(sId, block.timestamp / 86400), 90 * 1e6);
        assertEq(token.balanceOf(allowedVendor), 90 * 1e6);
    }

    // -------------------------------------------------------------
    // Test 6: Expired and revoked keys fail
    // -------------------------------------------------------------
    function test06_ExpiredAndRevokedKeysFail() public {
        // Warp past session expiry (30 days)
        vm.warp(block.timestamp + 31 days);

        (UserOperation memory expiredOp, ) = _buildSignedUserOp(address(token), allowedVendor, 20 * 1e6, agentPrivateKey);
        UserOperation[] memory ops = new UserOperation[](1);
        ops[0] = expiredOp;

        // EntryPoint rejects op during validation
        vm.expectRevert();
        entryPoint.handleOps(ops, payable(beneficiary));

        // Direct execution also reverts
        vm.prank(owner);
        vm.expectRevert("Session has expired");
        account.executeAgentPayment(address(token), allowedVendor, 20 * 1e6);

        // Reset time and test revoked key
        vm.warp(1000000);
        vm.prank(revoker);
        account.revokeSession(sId, "Emergency compromised session");

        (UserOperation memory revokedOp, ) = _buildSignedUserOp(address(token), allowedVendor, 20 * 1e6, agentPrivateKey);
        ops[0] = revokedOp;

        vm.expectRevert();
        entryPoint.handleOps(ops, payable(beneficiary));

        vm.prank(owner);
        vm.expectRevert("Session is revoked on-chain");
        account.executeAgentPayment(address(token), allowedVendor, 20 * 1e6);
    }

    // -------------------------------------------------------------
    // Test 7: Modified or replayed owner approval fails
    // -------------------------------------------------------------
    function test07_ModifiedOrReplayedOwnerApprovalFails() public {
        uint256 exceptionAmount = 200 * 1e6; // 200 tokens (Junior cap: 2000)
        bytes memory expectedCalldata = abi.encodeWithSelector(bytes4(0xa9059cbb), allowedVendor, exceptionAmount);
        bytes32 calldataHash = keccak256(expectedCalldata);

        BastionAccount.PaymentIntent memory intent = BastionAccount.PaymentIntent({
            chainId: block.chainid,
            verifyingAccount: address(account),
            accountNonce: 0,
            requestId: "REQ-HARDENING-01",
            policyVersion: 1,
            actorSession: "agent-session",
            approvalTier: "JUNIOR_EXCEPTION",
            tokenAddress: address(token),
            targetContract: address(token),
            functionSelector: bytes4(0xa9059cbb),
            recipientAddress: allowedVendor,
            amountBaseUnits: exceptionAmount,
            maxPerTxException: exceptionAmount,
            deadline: block.timestamp + 300,
            calldataHash: calldataHash
        });

        bytes32 structHash = account.hashPaymentIntent(intent);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", account.DOMAIN_SEPARATOR(), structHash));

        // Valid signatures
        (uint8 vDev, bytes32 rDev, bytes32 sDev) = vm.sign(juniorPrivateKey, digest);
        bytes memory deviceSig = abi.encodePacked(rDev, sDev, vDev);

        (uint8 vOwn, bytes32 rOwn, bytes32 sOwn) = vm.sign(ownerPrivateKey, digest);
        bytes memory ownerSig = abi.encodePacked(rOwn, sOwn, vOwn);

        // 1. First execution succeeds
        vm.prank(owner);
        account.executeAuthorizedException(intent, deviceSig, ownerSig);
        assertEq(token.balanceOf(allowedVendor), exceptionAmount, "Exception payment transferred");

        // 2. Replay with same nonce must revert
        vm.prank(owner);
        vm.expectRevert("Exception: Nonce already used");
        account.executeAuthorizedException(intent, deviceSig, ownerSig);

        // 3. Modifying 1 field (e.g. amount to 250) causes calldata hash / signature mismatch
        intent.accountNonce = 1; // new nonce
        intent.amountBaseUnits = 250 * 1e6;

        vm.prank(owner);
        vm.expectRevert(); // signature or calldata mismatch
        account.executeAuthorizedException(intent, deviceSig, ownerSig);
    }

    // -------------------------------------------------------------
    // Test 8: Direct submission through real bundler still enforces restrictions
    // -------------------------------------------------------------
    function test08_DirectSubmissionThroughRealBundlerStillEnforcesRestrictions() public {
        // Attacker steals agent session key and attempts to send 500 tokens to attackerWallet via EntryPoint
        uint256 stolenAmount = 500 * 1e6;
        (UserOperation memory maliciousOp, bytes32 opHash) = _buildSignedUserOp(
            address(token),
            attackerWallet,
            stolenAmount,
            agentPrivateKey
        );

        UserOperation[] memory ops = new UserOperation[](1);
        ops[0] = maliciousOp;

        vm.recordLogs();
        entryPoint.handleOps(ops, payable(beneficiary));

        // Attacker wallet must NOT receive tokens
        assertEq(token.balanceOf(attackerWallet), 0, "Attacker wallet received 0 tokens");

        // Check that EntryPoint recorded failure for this userOpHash
        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32 userOpEventSignature = keccak256("UserOperationEvent(bytes32,address,address,uint256,bool,uint256,uint256)");
        bool eventFound = false;

        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == userOpEventSignature && entries[i].topics[1] == opHash) {
                eventFound = true;
                (, bool success, , ) = abi.decode(entries[i].data, (uint256, bool, uint256, uint256));
                assertFalse(success, "UserOperation execution must fail on-chain");
            }
        }
        assertTrue(eventFound, "UserOperationEvent must be recorded");
    }

    // -------------------------------------------------------------
    // Test 9: Device approval without required owner authorization fails
    // -------------------------------------------------------------
    function test09_DeviceApprovalWithoutRequiredOwnerAuthorizationFails() public {
        uint256 exceptionAmount = 200 * 1e6;
        bytes memory expectedCalldata = abi.encodeWithSelector(bytes4(0xa9059cbb), allowedVendor, exceptionAmount);
        bytes32 calldataHash = keccak256(expectedCalldata);

        BastionAccount.PaymentIntent memory intent = BastionAccount.PaymentIntent({
            chainId: block.chainid,
            verifyingAccount: address(account),
            accountNonce: 20,
            requestId: "REQ-HARDENING-09",
            policyVersion: 1,
            actorSession: "agent-session",
            approvalTier: "JUNIOR_EXCEPTION",
            tokenAddress: address(token),
            targetContract: address(token),
            functionSelector: bytes4(0xa9059cbb),
            recipientAddress: allowedVendor,
            amountBaseUnits: exceptionAmount,
            maxPerTxException: exceptionAmount,
            deadline: block.timestamp + 300,
            calldataHash: calldataHash
        });

        bytes32 structHash = account.hashPaymentIntent(intent);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", account.DOMAIN_SEPARATOR(), structHash));

        // Valid Junior device signature
        (uint8 vDev, bytes32 rDev, bytes32 sDev) = vm.sign(juniorPrivateKey, digest);
        bytes memory deviceSig = abi.encodePacked(rDev, sDev, vDev);

        // Missing or forged owner signature (signed by attacker)
        (uint8 vBad, bytes32 rBad, bytes32 sBad) = vm.sign(0xBAD, digest);
        bytes memory forgedOwnerSig = abi.encodePacked(rBad, sBad, vBad);

        vm.prank(owner);
        vm.expectRevert("Exception: Invalid owner co-signature");
        account.executeAuthorizedException(intent, deviceSig, forgedOwnerSig);

        // Empty owner signature also fails
        vm.prank(owner);
        vm.expectRevert("Exception: Invalid owner co-signature");
        account.executeAuthorizedException(intent, deviceSig, "");
    }

    // -------------------------------------------------------------
    // Test 10: Failed transfers cannot create incorrect daily spending totals
    // -------------------------------------------------------------
    function test10_FailedTransfersCannotCreateIncorrectDailySpendingTotals() public {
        uint256 initialDaySpent = account.dailySpent(sId, block.timestamp / 86400);
        assertEq(initialDaySpent, 0);

        // 1. Attempt transfer exceeding maxPerTxLimit
        vm.prank(owner);
        vm.expectRevert("Policy violation: Amount exceeds maxPerTxLimit");
        account.executeAgentPayment(address(token), allowedVendor, 51 * 1e6);
        assertEq(account.dailySpent(sId, block.timestamp / 86400), 0, "dailySpent must not change on revert");

        // 2. Successful payment of 30 bUSD
        vm.prank(owner);
        account.executeAgentPayment(address(token), allowedVendor, 30 * 1e6);
        assertEq(account.dailySpent(sId, block.timestamp / 86400), 30 * 1e6);

        // 3. Attempt transfer with unauthorized recipient
        vm.prank(owner);
        vm.expectRevert("Policy violation: Recipient not allowed");
        account.executeAgentPayment(address(token), attackerWallet, 10 * 1e6);
        assertEq(account.dailySpent(sId, block.timestamp / 86400), 30 * 1e6, "dailySpent must remain 30 bUSD");

        // 4. Attempt transfer where token balance is exhausted
        // Transfer out almost all tokens leaving only 5 bUSD
        uint256 currBal = token.balanceOf(address(account));
        vm.prank(address(account));
        token.transfer(address(0x123), currBal - 5 * 1e6);
        assertEq(token.balanceOf(address(account)), 5 * 1e6);

        // Agent tries to pay 10 bUSD (within policy but insufficient tokens)
        vm.prank(owner);
        vm.expectRevert("Insufficient balance"); // MockToken transfer reverts on insufficient balance
        account.executeAgentPayment(address(token), allowedVendor, 10 * 1e6);

        // Verify dailySpent is STILL exactly 30 bUSD, not 40 bUSD
        assertEq(account.dailySpent(sId, block.timestamp / 86400), 30 * 1e6, "dailySpent was not polluted by failed transfer");
    }
}
