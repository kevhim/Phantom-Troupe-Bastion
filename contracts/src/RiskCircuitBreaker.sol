// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title RiskCircuitBreaker
 * @notice On-chain spending velocity, burst anomaly detection, and stateful freeze engine for Bastion X.
 * @dev Enforces stateful freeze persistence WITHOUT reverting to ensure malicious transactions
 *      are halted while the frozen state is permanently stored on-chain.
 */
contract RiskCircuitBreaker {
    enum FreezeState {
        ACTIVE,             // 0: Normal operations
        FROZEN_AUTOMATIC,   // 1: Frozen automatically by circuit breaker anomaly
        FROZEN_MANUAL,      // 2: Frozen manually by operator/supervisor
        RECOVERY_PENDING,   // 3: 3-of-5 recovery quorum reached, waiting on 48h timelock
        RECOVERED           // 4: Ownership rotated, old sessions neutralized
    }

    address public owner;
    address public authorizedAccount;

    // Configurable Detection Thresholds
    uint256 public velocityWindow = 60;          // 60 seconds
    uint256 public maxVelocityCount = 3;         // 3 transactions within 60s triggers automatic freeze
    uint256 public burstWindow = 300;            // 300 seconds (5 minutes)
    uint256 public burstThresholdBps = 7000;     // 70.00% (7000/10000) of daily limit consumed in 5m

    struct SessionTracking {
        FreezeState state;
        uint256 windowStartTimestamp;
        uint256 windowTxCount;
        uint256 burstStartTimestamp;
        uint256 burstStartSpent;
        string lastFreezeReason;
    }

    mapping(bytes32 => SessionTracking) public sessionTracking;

    // Events
    event AnomalyDetected(bytes32 indexed sessionId, string rule, uint256 timestamp, string details);
    event CircuitBreakerFrozen(bytes32 indexed sessionId, FreezeState state, string reason);
    event CircuitBreakerUnfrozen(bytes32 indexed sessionId, address operator, string reason);
    event ThresholdsUpdated(uint256 velocityWindow, uint256 maxVelocityCount, uint256 burstWindow, uint256 burstThresholdBps);

    modifier onlyOwnerOrAccount() {
        require(msg.sender == owner || msg.sender == authorizedAccount, "RiskCircuitBreaker: unauthorized caller");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "RiskCircuitBreaker: invalid owner");
        owner = _owner;
    }

    function setAuthorizedAccount(address _account) external {
        require(msg.sender == owner, "RiskCircuitBreaker: only owner");
        authorizedAccount = _account;
    }

    function setThresholds(
        uint256 _velocityWindow,
        uint256 _maxVelocityCount,
        uint256 _burstWindow,
        uint256 _burstThresholdBps
    ) external {
        require(msg.sender == owner, "RiskCircuitBreaker: only owner");
        require(_burstThresholdBps <= 10000, "RiskCircuitBreaker: threshold exceeds 100%");
        velocityWindow = _velocityWindow;
        maxVelocityCount = _maxVelocityCount;
        burstWindow = _burstWindow;
        burstThresholdBps = _burstThresholdBps;
        emit ThresholdsUpdated(_velocityWindow, _maxVelocityCount, _burstWindow, _burstThresholdBps);
    }

    /**
     * @notice Evaluates payment metrics against velocity and burst anomaly rules.
     * @dev If an anomaly is detected, this function updates state to FROZEN_AUTOMATIC
     *      and returns (true, reason). The caller must NOT transfer tokens and must NOT revert.
     */
    function evaluateAndRecord(
        bytes32 sessionId,
        uint256 amount,
        uint256 dailyLimit,
        uint256 currentDailySpent
    ) external onlyOwnerOrAccount returns (bool isRisky, string memory reason) {
        SessionTracking storage track = sessionTracking[sessionId];

        // 1. If already frozen, immediately flag as risky
        if (track.state != FreezeState.ACTIVE) {
            return (true, track.lastFreezeReason);
        }

        uint256 nowTs = block.timestamp;

        // 2. Velocity Tracking (Count within rolling window)
        if (nowTs > track.windowStartTimestamp + velocityWindow) {
            track.windowStartTimestamp = nowTs;
            track.windowTxCount = 1;
        } else {
            track.windowTxCount++;
            if (track.windowTxCount >= maxVelocityCount) {
                track.state = FreezeState.FROZEN_AUTOMATIC;
                track.lastFreezeReason = "VELOCITY_BURST: >=3 tx within 60s";
                emit AnomalyDetected(sessionId, "HIGH_VELOCITY", nowTs, track.lastFreezeReason);
                emit CircuitBreakerFrozen(sessionId, FreezeState.FROZEN_AUTOMATIC, track.lastFreezeReason);
                return (true, track.lastFreezeReason);
            }
        }

        // 3. Spending Burst Tracking (Rapid budget consumption in 5 minutes)
        if (nowTs > track.burstStartTimestamp + burstWindow) {
            track.burstStartTimestamp = nowTs;
            track.burstStartSpent = currentDailySpent;
        } else {
            uint256 spentInWindow = (currentDailySpent + amount) > track.burstStartSpent
                ? (currentDailySpent + amount) - track.burstStartSpent
                : 0;
            if (dailyLimit > 0 && (spentInWindow * 10000) / dailyLimit >= burstThresholdBps) {
                track.state = FreezeState.FROZEN_AUTOMATIC;
                track.lastFreezeReason = "RAPID_BUDGET_CONSUMPTION: >=70% daily budget consumed in 5m";
                emit AnomalyDetected(sessionId, "RAPID_BUDGET_DRAIN", nowTs, track.lastFreezeReason);
                emit CircuitBreakerFrozen(sessionId, FreezeState.FROZEN_AUTOMATIC, track.lastFreezeReason);
                return (true, track.lastFreezeReason);
            }
        }

        return (false, "");
    }

    /**
     * @notice Manually freeze an agent session.
     */
    function manualFreeze(bytes32 sessionId, string calldata reason) external onlyOwnerOrAccount {
        SessionTracking storage track = sessionTracking[sessionId];
        track.state = FreezeState.FROZEN_MANUAL;
        track.lastFreezeReason = reason;
        emit CircuitBreakerFrozen(sessionId, FreezeState.FROZEN_MANUAL, reason);
    }

    /**
     * @notice Set state to RECOVERY_PENDING when 3-of-5 quorum is reached.
     */
    function setRecoveryPending(bytes32 sessionId, string calldata reason) external onlyOwnerOrAccount {
        SessionTracking storage track = sessionTracking[sessionId];
        track.state = FreezeState.RECOVERY_PENDING;
        track.lastFreezeReason = reason;
        emit CircuitBreakerFrozen(sessionId, FreezeState.RECOVERY_PENDING, reason);
    }

    /**
     * @notice Set state to RECOVERED when ownership rotation succeeds.
     */
    function setRecovered(bytes32 sessionId, string calldata reason) external onlyOwnerOrAccount {
        SessionTracking storage track = sessionTracking[sessionId];
        track.state = FreezeState.RECOVERED;
        track.lastFreezeReason = reason;
        emit CircuitBreakerFrozen(sessionId, FreezeState.RECOVERED, reason);
    }

    /**
     * @notice Unfreeze an agent session, returning it to ACTIVE state.
     */
    function unfreeze(bytes32 sessionId, string calldata reason) external {
        require(msg.sender == owner, "RiskCircuitBreaker: only owner can unfreeze");
        SessionTracking storage track = sessionTracking[sessionId];
        track.state = FreezeState.ACTIVE;
        track.windowTxCount = 0;
        track.windowStartTimestamp = block.timestamp;
        track.burstStartTimestamp = block.timestamp;
        track.burstStartSpent = 0;
        track.lastFreezeReason = "";
        emit CircuitBreakerUnfrozen(sessionId, msg.sender, reason);
    }

    function getFreezeState(bytes32 sessionId) external view returns (FreezeState state, string memory lastReason) {
        return (sessionTracking[sessionId].state, sessionTracking[sessionId].lastFreezeReason);
    }

    function isFrozen(bytes32 sessionId) external view returns (bool) {
        return sessionTracking[sessionId].state != FreezeState.ACTIVE;
    }
}
