// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BastionAccount.sol";
import "../src/RiskCircuitBreaker.sol";
import "../src/MockToken.sol";
import "../src/entrypoint/EntryPoint.sol";

contract AgentHijackTest is Test {
    BastionAccount public account;
    RiskCircuitBreaker public circuitBreaker;
    MockToken public token;
    EntryPoint public entryPoint;

    address public owner = address(0x1111);
    address public agent = address(0x2222);
    address public allowedVendor = address(0x3333);
    address public attackerWallet = address(0x6666);
    address public junior = address(0x4444);
    address public senior = address(0x5555);
    address public revoker = address(0x7777);

    uint256 constant MAX_PER_TX = 50 * 1e6; // 50 tokens
    uint256 constant DAILY_LIMIT = 100 * 1e6; // 100 tokens

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

        // Mint 10,000 tokens to account
        token.mint(address(account), 10000 * 1e6);
    }

    // --- Attack 1: Oversized Payment (> 50 tokens) ---
    function testAttack1_OversizedPaymentBlocked() public {
        vm.prank(owner);
        vm.expectRevert("Policy violation: Amount exceeds maxPerTxLimit");
        account.executeAgentPayment(address(token), allowedVendor, 51 * 1e6);

        assertEq(token.balanceOf(allowedVendor), 0, "No tokens transferred");
    }

    // --- Attack 2: Microtransaction Exhaustion (> 100 tokens daily cap) ---
    function testAttack2_DailyAggregateCapEnforced() public {
        // Payment 1: 45 tokens (OK)
        vm.prank(owner);
        account.executeAgentPayment(address(token), allowedVendor, 45 * 1e6);

        // Advance past 5-minute burst window so normal daily cap accounting is tested
        vm.warp(block.timestamp + 305);

        // Payment 2: 45 tokens (OK, total 90 tokens)
        vm.prank(owner);
        account.executeAgentPayment(address(token), allowedVendor, 45 * 1e6);

        assertEq(token.balanceOf(allowedVendor), 90 * 1e6);

        // Advance past 5-minute burst window
        vm.warp(block.timestamp + 305);

        // Payment 3: 20 tokens -> Total 110 tokens > 100 tokens DAILY CAP -> MUST REVERT
        vm.prank(owner);
        vm.expectRevert("Policy violation: Daily spend cap exceeded");
        account.executeAgentPayment(address(token), allowedVendor, 20 * 1e6);

        // INVARIANT CHECK: Total transferred cannot exceed daily limit
        assertLe(token.balanceOf(allowedVendor), DAILY_LIMIT, "Financial invariant violated: daily cap breached!");
        assertEq(token.balanceOf(allowedVendor), 90 * 1e6);
    }

    // --- Attack 3: Unauthorized Recipient (Attacker's wallet) ---
    function testAttack3_UnauthorizedRecipientBlocked() public {
        vm.prank(owner);
        vm.expectRevert("Policy violation: Recipient not allowed");
        account.executeAgentPayment(address(token), attackerWallet, 10 * 1e6);

        assertEq(token.balanceOf(attackerWallet), 0);
    }

    // --- Attack 4: Unauthorized Contract / Target ---
    function testAttack4_UnauthorizedTargetBlocked() public {
        MockToken unapprovedToken = new MockToken(0);

        vm.prank(owner);
        vm.expectRevert("Policy violation: Target contract not allowed");
        account.executeAgentPayment(address(unapprovedToken), allowedVendor, 10 * 1e6);
    }

    // --- Attack 5: Expired Authorization ---
    function testAttack5_ExpiredAuthorizationBlocked() public {
        // Advance 31 days into future
        vm.warp(block.timestamp + 31 days);

        vm.prank(owner);
        vm.expectRevert("Session has expired");
        account.executeAgentPayment(address(token), allowedVendor, 10 * 1e6);
    }

    // --- Attack 6: Rapid Unusual Spending Burst -> Circuit Breaker Freeze ---
    function testAttack6_RapidSpendingBurstTriggersFreeze() public {
        // Payment 1
        vm.prank(owner);
        account.executeAgentPayment(address(token), allowedVendor, 10 * 1e6);

        // Payment 2 in 5s
        vm.warp(block.timestamp + 5);
        vm.prank(owner);
        account.executeAgentPayment(address(token), allowedVendor, 10 * 1e6);

        // Payment 3 in 5s (triggers circuit breaker, halted)
        vm.warp(block.timestamp + 5);
        vm.prank(owner);
        account.executeAgentPayment(address(token), allowedVendor, 10 * 1e6);

        // Circuit breaker is now frozen!
        assertTrue(circuitBreaker.isFrozen(sId));

        // Subsequent payment is immediately blocked
        vm.prank(owner);
        vm.expectRevert("Session is frozen by circuit breaker");
        account.executeAgentPayment(address(token), allowedVendor, 10 * 1e6);
    }

    // --- Attack 7: Post-Revocation Payment Blocked ---
    function testAttack7_RevokedSessionPaymentBlocked() public {
        vm.prank(revoker);
        account.revokeSession(sId, "Emergency physical panic triggered");

        vm.prank(owner);
        vm.expectRevert("Session is revoked on-chain");
        account.executeAgentPayment(address(token), allowedVendor, 10 * 1e6);
    }
}
