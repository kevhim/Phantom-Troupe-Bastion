// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBastionAccountRecovery {
    function owner() external view returns (address);
    function executeRecoveryRotation(address newOwner) external;
}

/**
 * @title GuardianRecovery
 * @notice 3-of-5 Guardian Recovery protocol with 48-hour timelock countdown and owner veto.
 * @dev Conforms to W3-02 Phase 2 emergency recovery specification.
 */
contract GuardianRecovery {
    enum RecoveryState {
        NONE,                   // 0: No active proposal
        COLLECTING_APPROVALS,   // 1: Proposal active, gathering guardian signatures (1 or 2)
        TIMELOCKED,             // 2: 3-of-5 quorum reached! 48h countdown active
        EXECUTED,               // 3: 48h delay elapsed and ownership successfully rotated
        VETOED                  // 4: Current owner executed veto; proposal permanently invalidated
    }

    uint256 public constant RECOVERY_DELAY = 48 hours;
    uint256 public constant REQUIRED_QUORUM = 3;
    uint256 public constant TOTAL_GUARDIANS = 5;

    address public accountAddress;
    address[TOTAL_GUARDIANS] public guardians;
    mapping(address => bool) public isGuardian;

    struct Proposal {
        uint256 id;
        address proposedOwner;
        uint256 createdAt;
        uint256 quorumReachedAt;
        uint256 readyAt;
        uint256 approvalCount;
        RecoveryState state;
        mapping(address => bool) hasVoted;
    }

    uint256 public proposalNonce;
    mapping(uint256 => Proposal) private _proposals;

    event RecoveryInitiated(uint256 indexed proposalId, address indexed proposedOwner, address indexed initiator);
    event GuardianVoted(uint256 indexed proposalId, address indexed guardian, uint256 currentApprovals);
    event QuorumReached(uint256 indexed proposalId, uint256 readyAt);
    event RecoveryVetoed(uint256 indexed proposalId, address indexed owner, string reason);
    event RecoveryExecuted(uint256 indexed proposalId, address indexed oldOwner, address indexed newOwner);

    modifier onlyAccountOwner() {
        require(msg.sender == IBastionAccountRecovery(accountAddress).owner(), "GuardianRecovery: caller not account owner");
        _;
    }

    modifier onlyGuardian() {
        require(isGuardian[msg.sender], "GuardianRecovery: caller not registered guardian");
        _;
    }

    constructor(address _accountAddress, address[TOTAL_GUARDIANS] memory _guardians) {
        require(_accountAddress != address(0), "GuardianRecovery: invalid account address");
        accountAddress = _accountAddress;

        for (uint256 i = 0; i < TOTAL_GUARDIANS; i++) {
            address g = _guardians[i];
            require(g != address(0), "GuardianRecovery: zero address guardian");
            require(!isGuardian[g], "GuardianRecovery: duplicate guardian address");
            guardians[i] = g;
            isGuardian[g] = true;
        }
    }

    /**
     * @notice Initiates a new recovery proposal for a new owner address.
     */
    function initiateRecovery(address proposedOwner) external onlyGuardian returns (uint256 proposalId) {
        require(proposedOwner != address(0), "GuardianRecovery: invalid proposed owner");
        require(proposedOwner != IBastionAccountRecovery(accountAddress).owner(), "GuardianRecovery: already current owner");

        proposalNonce++;
        proposalId = proposalNonce;

        Proposal storage prop = _proposals[proposalId];
        prop.id = proposalId;
        prop.proposedOwner = proposedOwner;
        prop.createdAt = block.timestamp;
        prop.state = RecoveryState.COLLECTING_APPROVALS;
        prop.approvalCount = 1;
        prop.hasVoted[msg.sender] = true;

        emit RecoveryInitiated(proposalId, proposedOwner, msg.sender);
        emit GuardianVoted(proposalId, msg.sender, 1);
    }

    /**
     * @notice Registered guardian casts their vote for an active proposal.
     */
    function voteRecovery(uint256 proposalId) external onlyGuardian {
        Proposal storage prop = _proposals[proposalId];
        require(prop.state == RecoveryState.COLLECTING_APPROVALS, "GuardianRecovery: proposal not in collecting state");
        require(!prop.hasVoted[msg.sender], "GuardianRecovery: guardian already voted on proposal");

        prop.hasVoted[msg.sender] = true;
        prop.approvalCount++;

        emit GuardianVoted(proposalId, msg.sender, prop.approvalCount);

        // When the 3rd distinct guardian vote is cast, trigger the 48-hour timelock countdown
        if (prop.approvalCount >= REQUIRED_QUORUM) {
            prop.state = RecoveryState.TIMELOCKED;
            prop.quorumReachedAt = block.timestamp;
            prop.readyAt = block.timestamp + RECOVERY_DELAY;
            emit QuorumReached(proposalId, prop.readyAt);
        }
    }

    /**
     * @notice Existing account owner vetoes a recovery proposal at any time before execution.
     */
    function vetoRecovery(uint256 proposalId, string calldata reason) external onlyAccountOwner {
        Proposal storage prop = _proposals[proposalId];
        require(
            prop.state == RecoveryState.COLLECTING_APPROVALS || prop.state == RecoveryState.TIMELOCKED,
            "GuardianRecovery: proposal not active or already finalized"
        );

        prop.state = RecoveryState.VETOED;
        emit RecoveryVetoed(proposalId, msg.sender, reason);
    }

    /**
     * @notice Executes recovery after 3-of-5 quorum and 48-hour delay have elapsed.
     */
    function executeRecovery(uint256 proposalId) external {
        Proposal storage prop = _proposals[proposalId];
        require(prop.state == RecoveryState.TIMELOCKED, "GuardianRecovery: quorum not reached or proposal vetoed");
        require(block.timestamp >= prop.readyAt, "GuardianRecovery: 48-hour timelock has not elapsed");

        prop.state = RecoveryState.EXECUTED;
        address oldOwner = IBastionAccountRecovery(accountAddress).owner();
        address newOwner = prop.proposedOwner;

        // Perform atomic on-chain ownership rotation and session key invalidation
        IBastionAccountRecovery(accountAddress).executeRecoveryRotation(newOwner);

        emit RecoveryExecuted(proposalId, oldOwner, newOwner);
    }

    // --- View Helpers ---

    function getProposal(uint256 proposalId) external view returns (
        uint256 id,
        address proposedOwner,
        uint256 createdAt,
        uint256 quorumReachedAt,
        uint256 readyAt,
        uint256 approvalCount,
        RecoveryState state
    ) {
        Proposal storage prop = _proposals[proposalId];
        return (
            prop.id,
            prop.proposedOwner,
            prop.createdAt,
            prop.quorumReachedAt,
            prop.readyAt,
            prop.approvalCount,
            prop.state
        );
    }

    function hasGuardianVoted(uint256 proposalId, address guardian) external view returns (bool) {
        return _proposals[proposalId].hasVoted[guardian];
    }

    function getGuardians() external view returns (address[TOTAL_GUARDIANS] memory) {
        return guardians;
    }
}
