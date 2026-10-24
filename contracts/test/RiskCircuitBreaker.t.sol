// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/RiskCircuitBreaker.sol";
import "../src/BastionAccount.sol";
import "../src/MockToken.sol";
import "../src/entrypoint/EntryPoint.sol";

contract RiskCircuitBreakerTest is Test {
    RiskCircuitBreaker public circuitBreaker;
    BastionAccount public account;
    MockToken public token;
    EntryPoint public entryPoint;

    address public owner = address(0x1111);
    address public agent = address(0x2222);
    address public vendor = address(0x3333);
    address public junior = address(0x4444);
    address public senior = address(0x5555);
    address public revoker = address(0x6666);

    bytes32 public sId;

    function setUp() public {
        vm.warp(1000000);

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
            vendor,
            50 * 1e6,  // 50 maxPerTx
            100 * 1e6, // 100 daily limit
            block.timestamp + 30 days
        );

        sId = keccak256(abi.encodePacked(agent));

        vm.prank(owner);
        account.setCircuitBreaker(address(circuitBreaker));

        vm.prank(owner);
        circuitBreaker.setAuthorizedAccount(address(account));

        // Fund account with 1,000 tokens
        token.mint(address(account), 1000 * 1e6);
    }

    function testInitialStateActive() public view {
        (RiskCircuitBreaker.FreezeState state, ) = circuitBreaker.getFreezeState(sId);
        assertEq(uint256(state), uint256(RiskCircuitBreaker.FreezeState.ACTIVE));
        assertFalse(circuitBreaker.isFrozen(sId));
    }

    function testSingleValidPaymentSucceeds() public {
        vm.prank(owner);
        account.executeAgentPayment(address(token), vendor, 20 * 1e6);

        assertEq(token.balanceOf(vendor), 20 * 1e6);
        assertFalse(circuitBreaker.isFrozen(sId));
    }

    function testHighVelocityTriggersAutomaticFreezeAndHaltsTransfer() public {
        // Payment 1: txCount = 1
        vm.prank(owner);
        account.executeAgentPayment(address(token), vendor, 10 * 1e6);
        assertEq(token.balanceOf(vendor), 10 * 1e6);

        // Payment 2: txCount = 2 (within 60s)
        vm.warp(block.timestamp + 5);
        vm.prank(owner);
        account.executeAgentPayment(address(token), vendor, 10 * 1e6);
        assertEq(token.balanceOf(vendor), 20 * 1e6);

        // Payment 3: txCount = 3 (within 60s) -> TRIGGERS CIRCUIT BREAKER
        vm.warp(block.timestamp + 5);
        vm.prank(owner);
        account.executeAgentPayment(address(token), vendor, 10 * 1e6);

        // CRITICAL: Token transfer halted! Balance must still be 20 tokens!
        assertEq(token.balanceOf(vendor), 20 * 1e6, "3rd payment must not transfer tokens");

        // CRITICAL: Freeze state MUST persist on-chain!
        (RiskCircuitBreaker.FreezeState state, string memory reason) = circuitBreaker.getFreezeState(sId);
        assertEq(uint256(state), uint256(RiskCircuitBreaker.FreezeState.FROZEN_AUTOMATIC));
        assertTrue(circuitBreaker.isFrozen(sId));
        assertEq(reason, "VELOCITY_BURST: >=3 tx within 60s");
    }

    function testSubsequentPaymentRevertsWhenFrozen() public {
        // Trigger freeze
        vm.prank(owner);
        circuitBreaker.manualFreeze(sId, "Manual lock");

        assertTrue(circuitBreaker.isFrozen(sId));

        vm.prank(owner);
        vm.expectRevert("Session is frozen by circuit breaker");
        account.executeAgentPayment(address(token), vendor, 10 * 1e6);
    }

    function testOwnerCanUnfreeze() public {
        vm.prank(owner);
        circuitBreaker.manualFreeze(sId, "Operator review");

        assertTrue(circuitBreaker.isFrozen(sId));

        vm.prank(owner);
        circuitBreaker.unfreeze(sId, "Resolved by SOC");

        assertFalse(circuitBreaker.isFrozen(sId));

        // Payment works again
        vm.prank(owner);
        account.executeAgentPayment(address(token), vendor, 15 * 1e6);
        assertEq(token.balanceOf(vendor), 15 * 1e6);
    }

    function testSpendingBurstTriggersAutomaticFreeze() public {
        // In 5 minutes, attempt to spend 75 tokens out of 100 token daily budget (75% >= 70%)
        // Payment 1: 40 tokens
        vm.prank(owner);
        account.executeAgentPayment(address(token), vendor, 40 * 1e6);
        assertEq(token.balanceOf(vendor), 40 * 1e6);

        // Advance 2 minutes (within 5m burst window, but past 60s velocity window)
        vm.warp(block.timestamp + 120);

        // Payment 2: 35 tokens -> total 75 tokens in <5m (75% of 100 token daily cap)
        vm.prank(owner);
        account.executeAgentPayment(address(token), vendor, 35 * 1e6);

        // Halted: balance stays 40 tokens
        assertEq(token.balanceOf(vendor), 40 * 1e6);
        assertTrue(circuitBreaker.isFrozen(sId));
    }
}
