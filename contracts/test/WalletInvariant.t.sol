// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "./handlers/WalletHandler.sol";
import "../src/BastionAccount.sol";
import "../src/RiskCircuitBreaker.sol";
import "../src/MockToken.sol";
import "../src/entrypoint/EntryPoint.sol";

contract WalletInvariantTest is Test {
    BastionAccount public account;
    RiskCircuitBreaker public circuitBreaker;
    MockToken public token;
    EntryPoint public entryPoint;
    WalletHandler public handler;

    address public owner = address(0x1111);
    address public agent = address(0x2222);
    address public allowedVendor = address(0x3333);
    address public unapprovedRecipient = address(0x9999);

    uint256 public constant MAX_PER_TX = 50 * 1e6; // 50 bUSD
    uint256 public constant DAILY_LIMIT = 100 * 1e6; // 100 bUSD
    uint256 public constant INITIAL_MINT = 100000 * 1e6;

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
            address(0x4444),
            address(0x5555),
            address(0x6666),
            address(token),
            allowedVendor,
            MAX_PER_TX,
            DAILY_LIMIT,
            block.timestamp + 365 days
        );

        sId = keccak256(abi.encodePacked(agent));

        vm.prank(owner);
        account.setCircuitBreaker(address(circuitBreaker));

        vm.prank(owner);
        circuitBreaker.setAuthorizedAccount(address(account));

        // Fund wallet
        token.mint(address(account), INITIAL_MINT);

        // Instantiate handler
        handler = new WalletHandler(account, circuitBreaker, token, entryPoint);

        // Target handler for stateful fuzzing
        targetContract(address(handler));
    }

    // Invariant 1: Daily spending never exceeds daily limit for any UTC day
    function invariant_dailySpendNeverExceedsCap() public view {
        uint256 currentDay = block.timestamp / 86400;
        uint256 spentToday = account.dailySpent(sId, currentDay);
        assertLe(spentToday, DAILY_LIMIT, "INVARIANT VIOLATION: Daily spending exceeded cap!");
    }

    // Invariant 2: Total token supply integrity: Account balance + Vendor balance = INITIAL_MINT
    function invariant_tokenConservation() public view {
        uint256 total = token.balanceOf(address(account)) + token.balanceOf(allowedVendor);
        assertEq(total, INITIAL_MINT, "INVARIANT VIOLATION: Token conservation broken!");
    }

    // Invariant 3: Unauthorized recipient never receives tokens
    function invariant_unauthorizedRecipientZero() public view {
        assertEq(token.balanceOf(unapprovedRecipient), 0, "INVARIANT VIOLATION: Leak to unauthorized recipient!");
    }

    // Invariant 4: Vendor balance matches exact ghost outflow
    function invariant_ghostOutflowMatchesVendor() public view {
        assertEq(token.balanceOf(allowedVendor), handler.ghost_totalOutflow(), "INVARIANT VIOLATION: Ghost outflow mismatch!");
    }
}
