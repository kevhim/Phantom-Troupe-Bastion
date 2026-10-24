// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/BastionAccount.sol";
import "../../src/RiskCircuitBreaker.sol";
import "../../src/MockToken.sol";
import "../../src/entrypoint/EntryPoint.sol";

contract WalletHandler is Test {
    BastionAccount public account;
    RiskCircuitBreaker public circuitBreaker;
    MockToken public token;
    EntryPoint public entryPoint;

    address public owner = address(0x1111);
    address public agent = address(0x2222);
    address public allowedVendor = address(0x3333);
    address public unapprovedRecipient = address(0x9999);

    uint256 public constant MAX_PER_TX = 50 * 1e6; // 50 bUSD
    uint256 public constant DAILY_LIMIT = 100 * 1e6; // 100 bUSD
    uint256 public constant INITIAL_MINT = 100000 * 1e6;

    // Ghost accounting variables
    uint256 public ghost_totalOutflow;
    uint256 public ghost_successfulCalls;
    uint256 public ghost_rejectedCalls;
    mapping(uint256 => uint256) public ghost_dailySpent;

    bytes32 public sId;

    constructor(
        BastionAccount _account,
        RiskCircuitBreaker _circuitBreaker,
        MockToken _token,
        EntryPoint _entryPoint
    ) {
        account = _account;
        circuitBreaker = _circuitBreaker;
        token = _token;
        entryPoint = _entryPoint;
        sId = keccak256(abi.encodePacked(agent));
    }

    function executePaymentFuzzed(uint256 rawAmount, uint256 timeAdvance) external {
        // Bound amount between 1 and 60 bUSD (sometimes <= 50, sometimes > 50)
        uint256 amount = bound(rawAmount, 1 * 1e6, 60 * 1e6);
        uint256 warpSecs = bound(timeAdvance, 0, 86400 * 2);

        if (warpSecs > 0) {
            vm.warp(block.timestamp + warpSecs);
        }

        uint256 currentDay = block.timestamp / 86400;
        uint256 vendorBalBefore = token.balanceOf(allowedVendor);

        // Execute payment attempt
        try account.executeAgentPayment(address(token), allowedVendor, amount) {
            uint256 vendorBalAfter = token.balanceOf(allowedVendor);
            if (vendorBalAfter > vendorBalBefore) {
                // Payment was transferred
                uint256 transferred = vendorBalAfter - vendorBalBefore;
                ghost_totalOutflow += transferred;
                ghost_dailySpent[currentDay] += transferred;
                ghost_successfulCalls++;
            } else {
                // Halted by circuit breaker (no transfer, state frozen)
                ghost_rejectedCalls++;
            }
        } catch {
            ghost_rejectedCalls++;
        }
    }

    function timeWarpDay(uint256 daysCount) external {
        uint256 d = bound(daysCount, 1, 5);
        vm.warp(block.timestamp + d * 86400);
    }

    function toggleUnfreeze() external {
        if (circuitBreaker.isFrozen(sId)) {
            vm.prank(owner);
            circuitBreaker.unfreeze(sId, "Handler unfreeze");
        }
    }
}
