// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/GuardianRecovery.sol";
import "../src/BastionAccount.sol";
import "../src/MockToken.sol";
import "../src/entrypoint/EntryPoint.sol";

contract GuardianRecoveryTest is Test {
    GuardianRecovery public recovery;
    BastionAccount public account;
    MockToken public token;
    EntryPoint public entryPoint;

    address public owner = address(0x1111);
    address public newOwner = address(0x9999);
    address public agent = address(0x2222);
    address public vendor = address(0x3333);
    address public junior = address(0x4444);
    address public senior = address(0x5555);
    address public revoker = address(0x6666);

    address public g1 = address(0xA1);
    address public g2 = address(0xA2);
    address public g3 = address(0xA3);
    address public g4 = address(0xA4);
    address public g5 = address(0xA5);

    function setUp() public {
        vm.warp(1000000);

        entryPoint = new EntryPoint();
        token = new MockToken(0);

        account = new BastionAccount(
            address(entryPoint),
            owner,
            agent,
            junior,
            senior,
            revoker,
            address(token),
            vendor,
            50 * 1e6,
            100 * 1e6,
            block.timestamp + 30 days
        );

        address[5] memory gList = [g1, g2, g3, g4, g5];
        recovery = new GuardianRecovery(address(account), gList);

        vm.prank(owner);
        account.setRecoveryManager(address(recovery));

        token.mint(address(account), 1000 * 1e6);
    }

    function testSingleGuardianCannotRecover() public {
        vm.prank(g1);
        uint256 propId = recovery.initiateRecovery(newOwner);

        (, , , , , uint256 approvals, GuardianRecovery.RecoveryState state) = recovery.getProposal(propId);
        assertEq(approvals, 1);
        assertEq(uint256(state), uint256(GuardianRecovery.RecoveryState.COLLECTING_APPROVALS));

        // Attempt execution immediately: must fail
        vm.expectRevert("GuardianRecovery: quorum not reached or proposal vetoed");
        recovery.executeRecovery(propId);
    }

    function testTwoGuardiansCannotRecover() public {
        vm.prank(g1);
        uint256 propId = recovery.initiateRecovery(newOwner);

        vm.prank(g2);
        recovery.voteRecovery(propId);

        (, , , , , uint256 approvals, GuardianRecovery.RecoveryState state) = recovery.getProposal(propId);
        assertEq(approvals, 2);
        assertEq(uint256(state), uint256(GuardianRecovery.RecoveryState.COLLECTING_APPROVALS));

        vm.expectRevert("GuardianRecovery: quorum not reached or proposal vetoed");
        recovery.executeRecovery(propId);
    }

    function testDuplicateVoteBySameGuardianFails() public {
        vm.prank(g1);
        uint256 propId = recovery.initiateRecovery(newOwner);

        // g1 votes again: must revert
        vm.prank(g1);
        vm.expectRevert("GuardianRecovery: guardian already voted on proposal");
        recovery.voteRecovery(propId);
    }

    function testNonGuardianCannotVote() public {
        vm.prank(g1);
        uint256 propId = recovery.initiateRecovery(newOwner);

        address rogue = address(0xBAD);
        vm.prank(rogue);
        vm.expectRevert("GuardianRecovery: caller not registered guardian");
        recovery.voteRecovery(propId);
    }

    function testThreeDistinctGuardiansReachQuorumAndSet48hDelay() public {
        uint256 t0 = block.timestamp;
        vm.prank(g1);
        uint256 propId = recovery.initiateRecovery(newOwner);

        vm.warp(t0 + 10);
        vm.prank(g2);
        recovery.voteRecovery(propId);

        vm.warp(t0 + 20);
        uint256 expectedQuorumAt = block.timestamp;
        vm.prank(g3);
        recovery.voteRecovery(propId);

        (, , , uint256 quorumAt, uint256 readyAt, uint256 approvals, GuardianRecovery.RecoveryState state) = recovery.getProposal(propId);
        assertEq(approvals, 3);
        assertEq(uint256(state), uint256(GuardianRecovery.RecoveryState.TIMELOCKED));
        assertEq(quorumAt, expectedQuorumAt);
        assertEq(readyAt, expectedQuorumAt + 48 hours);

        // Attempt execution at 47h59m: MUST REVERT
        vm.warp(readyAt - 1);
        vm.expectRevert("GuardianRecovery: 48-hour timelock has not elapsed");
        recovery.executeRecovery(propId);

        // Execute at or after 48h: MUST SUCCEED
        vm.warp(readyAt);
        recovery.executeRecovery(propId);

        assertEq(account.owner(), newOwner);
    }

    function testOwnerVetoCancelsPendingRecovery() public {
        vm.prank(g1);
        uint256 propId = recovery.initiateRecovery(newOwner);

        vm.prank(g2);
        recovery.voteRecovery(propId);

        vm.prank(g3);
        recovery.voteRecovery(propId);

        // Owner exercises veto
        vm.prank(owner);
        recovery.vetoRecovery(propId, "False alarm: key restored");

        (, , , , , , GuardianRecovery.RecoveryState state) = recovery.getProposal(propId);
        assertEq(uint256(state), uint256(GuardianRecovery.RecoveryState.VETOED));

        // Advance past 48h: must still be blocked!
        vm.warp(block.timestamp + 50 hours);
        vm.expectRevert("GuardianRecovery: quorum not reached or proposal vetoed");
        recovery.executeRecovery(propId);

        assertEq(account.owner(), owner, "Owner must not have changed");
    }

    function testOwnershipRotationInvalidatesOldAgentKey() public {
        vm.prank(g1);
        uint256 propId = recovery.initiateRecovery(newOwner);
        vm.prank(g2);
        recovery.voteRecovery(propId);
        vm.prank(g3);
        recovery.voteRecovery(propId);

        vm.warp(block.timestamp + 49 hours);
        recovery.executeRecovery(propId);

        assertEq(account.owner(), newOwner);

        // Verify old agent session key is invalidated on-chain
        assertEq(account.agentSessionKey(), address(0));
        bytes32 oldSId = keccak256(abi.encodePacked(agent));
        assertTrue(account.revokedSessions(oldSId));

        // Old agent attempting payment must revert
        vm.prank(newOwner);
        vm.expectRevert("No active agent session");
        account.executeAgentPayment(address(token), vendor, 10 * 1e6);
    }
}

