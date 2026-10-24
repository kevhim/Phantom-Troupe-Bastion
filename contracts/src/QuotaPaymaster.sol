// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IEntryPoint.sol";

/**
 * @title QuotaPaymaster
 * @notice ERC-4337 Paymaster providing isolated, strictly capped gas sponsorship per AI agent.
 * @dev Enforces bounded financial exposure so gas-spam attacks from one agent cannot drain
 *      another agent's allocation or an unrestricted treasury.
 */
contract QuotaPaymaster is IPaymaster {
    address public immutable entryPoint;
    address public owner;

    struct AgentQuota {
        uint256 allocation;     // Total gas subsidy budget in wei
        uint256 spent;          // Gas subsidy consumed so far in wei
        uint256 maxCostPerOp;   // Max gas cost allowed for a single UserOp
        uint256 expiry;         // Expiration timestamp
        bool isActive;          // Active status
    }

    // agent / sender address => quota definition
    mapping(address => AgentQuota) public agentQuotas;

    event QuotaConfigured(address indexed agent, uint256 allocation, uint256 maxCostPerOp, uint256 expiry);
    event GasSponsored(address indexed agent, uint256 actualGasCost, uint256 totalSpent, uint256 remaining);
    event QuotaExhausted(address indexed agent, uint256 attemptedCost, uint256 remaining);
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "QuotaPaymaster: only owner");
        _;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "QuotaPaymaster: only entryPoint");
        _;
    }

    constructor(address _entryPoint, address _owner) {
        require(_entryPoint != address(0), "QuotaPaymaster: invalid entryPoint");
        require(_owner != address(0), "QuotaPaymaster: invalid owner");
        entryPoint = _entryPoint;
        owner = _owner;
    }

    /**
     * @notice Configures or updates the gas sponsorship quota for a specific agent.
     */
    function setQuota(
        address agent,
        uint256 allocation,
        uint256 maxCostPerOp,
        uint256 expiry
    ) external onlyOwner {
        require(agent != address(0), "QuotaPaymaster: invalid agent");
        require(expiry > block.timestamp, "QuotaPaymaster: expiry in past");

        agentQuotas[agent] = AgentQuota({
            allocation: allocation,
            spent: 0,
            maxCostPerOp: maxCostPerOp,
            expiry: expiry,
            isActive: true
        });

        emit QuotaConfigured(agent, allocation, maxCostPerOp, expiry);
    }

    /**
     * @notice Disables or re-enables an agent's gas sponsorship quota.
     */
    function setQuotaStatus(address agent, bool isActive) external onlyOwner {
        agentQuotas[agent].isActive = isActive;
    }

    /**
     * @notice Deposit funds directly to the EntryPoint for this paymaster.
     */
    function deposit() external payable {
        IEntryPoint(entryPoint).depositTo{value: msg.value}(address(this));
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Validates whether the UserOp qualifies for isolated gas sponsorship.
     * @dev Checks agent quota, single-tx cost ceiling, and expiry. Returns 1 on failure.
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 maxCost
    ) external override onlyEntryPoint returns (bytes memory context, uint256 validationData) {
        address agent = userOp.sender;
        AgentQuota storage quota = agentQuotas[agent];

        // 1. Quota active check
        if (!quota.isActive) {
            return ("", 1); // SIG_VALIDATION_FAILED
        }

        // 2. Expiration check
        if (block.timestamp > quota.expiry) {
            return ("", 1);
        }

        // 3. Max cost per operation check
        if (maxCost > quota.maxCostPerOp) {
            return ("", 1);
        }

        // 4. Financial quota isolation check
        if (quota.spent + maxCost > quota.allocation) {
            emit QuotaExhausted(agent, maxCost, quota.allocation > quota.spent ? quota.allocation - quota.spent : 0);
            return ("", 1);
        }

        // Pass sender in context for postOp accounting
        context = abi.encode(agent, maxCost);
        return (context, 0);
    }

    /**
     * @notice Post-operation handler: accounts for actual gas used against the agent's quota.
     * @dev Supports opSucceeded, opReverted, and postOpReverted modes.
     */
    function postOp(
        PostOpMode /* mode */,
        bytes calldata context,
        uint256 actualGasCost
    ) external override onlyEntryPoint {
        (address agent, ) = abi.decode(context, (address, uint256));
        AgentQuota storage quota = agentQuotas[agent];

        quota.spent += actualGasCost;
        uint256 remaining = quota.allocation > quota.spent ? quota.allocation - quota.spent : 0;

        emit GasSponsored(agent, actualGasCost, quota.spent, remaining);
    }

    // --- View Helpers ---

    function getRemainingQuota(address agent) external view returns (uint256 remaining, bool isActive) {
        AgentQuota storage q = agentQuotas[agent];
        if (!q.isActive || q.spent >= q.allocation || block.timestamp > q.expiry) {
            return (0, q.isActive);
        }
        return (q.allocation - q.spent, q.isActive);
    }

    function getDeposit() external view returns (uint256) {
        return IEntryPoint(entryPoint).balanceOf(address(this));
    }

    receive() external payable {
        IEntryPoint(entryPoint).depositTo{value: msg.value}(address(this));
    }
}
