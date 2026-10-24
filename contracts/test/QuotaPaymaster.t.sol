// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/QuotaPaymaster.sol";
import "../src/entrypoint/EntryPoint.sol";

contract QuotaPaymasterTest is Test {
    QuotaPaymaster public paymaster;
    EntryPoint public entryPoint;

    address public owner = address(0x1111);
    address public agentA = address(0x2222);
    address public agentB = address(0x3333);

    function setUp() public {
        vm.warp(1000000);

        entryPoint = new EntryPoint();
        paymaster = new QuotaPaymaster(address(entryPoint), owner);

        // Fund EntryPoint deposit for paymaster
        vm.deal(address(paymaster), 10 ether);
        paymaster.deposit{value: 5 ether}();

        // Configure Agent A: 0.1 ETH quota, 0.01 ETH max per op, 7 days expiry
        vm.prank(owner);
        paymaster.setQuota(agentA, 0.1 ether, 0.01 ether, block.timestamp + 7 days);

        // Configure Agent B: 0.5 ETH quota, 0.02 ETH max per op, 7 days expiry
        vm.prank(owner);
        paymaster.setQuota(agentB, 0.5 ether, 0.02 ether, block.timestamp + 7 days);
    }

    function _createUserOp(address sender) internal pure returns (UserOperation memory) {
        return UserOperation({
            sender: sender,
            nonce: 0,
            initCode: "",
            callData: "",
            callGasLimit: 100000,
            verificationGasLimit: 100000,
            preVerificationGas: 21000,
            maxFeePerGas: 1 gwei,
            maxPriorityFeePerGas: 1 gwei,
            paymasterAndData: "",
            signature: ""
        });
    }

    function testAgentAReceivesAllowedSponsorship() public {
        UserOperation memory opA = _createUserOp(agentA);
        bytes32 opHash = bytes32(uint256(1));

        vm.prank(address(entryPoint));
        (bytes memory context, uint256 validationData) = paymaster.validatePaymasterUserOp(opA, opHash, 0.005 ether);

        assertEq(validationData, 0, "Validation should succeed");
        (address decodedAgent, ) = abi.decode(context, (address, uint256));
        assertEq(decodedAgent, agentA);
    }

    function testAgentACannotDrainAgentBQuota() public {
        UserOperation memory opA = _createUserOp(agentA);
        bytes32 opHash = bytes32(uint256(1));

        // Simulate 10 successful operations for Agent A, exhausting 0.1 ETH allocation
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(address(entryPoint));
            (bytes memory ctx, uint256 val) = paymaster.validatePaymasterUserOp(opA, opHash, 0.01 ether);
            assertEq(val, 0);

            vm.prank(address(entryPoint));
            paymaster.postOp(PostOpMode.opSucceeded, ctx, 0.01 ether);
        }

        // Agent A's quota is now fully exhausted (0.1 ETH spent)
        (uint256 remainingA, ) = paymaster.getRemainingQuota(agentA);
        assertEq(remainingA, 0);

        // Agent A attempts 11th operation: MUST BE REJECTED
        vm.prank(address(entryPoint));
        (, uint256 valExhausted) = paymaster.validatePaymasterUserOp(opA, opHash, 0.005 ether);
        assertEq(valExhausted, 1, "Exhausted Agent A must be rejected");

        // CRITICAL ISOLATION CHECK: Agent B must still have full 0.5 ETH quota intact!
        (uint256 remainingB, ) = paymaster.getRemainingQuota(agentB);
        assertEq(remainingB, 0.5 ether, "Agent B quota must be completely untouched");

        // Agent B can still execute sponsored operation
        UserOperation memory opB = _createUserOp(agentB);
        vm.prank(address(entryPoint));
        (, uint256 valB) = paymaster.validatePaymasterUserOp(opB, opHash, 0.02 ether);
        assertEq(valB, 0, "Agent B should still be sponsored");
    }

    function testExpiredSponsorshipRejected() public {
        // Warp past 7 days expiry
        vm.warp(block.timestamp + 8 days);

        UserOperation memory opA = _createUserOp(agentA);
        vm.prank(address(entryPoint));
        (, uint256 val) = paymaster.validatePaymasterUserOp(opA, bytes32(0), 0.005 ether);

        assertEq(val, 1, "Expired quota must be rejected");
    }

    function testExceedingMaxCostPerOpRejected() public {
        UserOperation memory opA = _createUserOp(agentA);

        // Agent A's maxCostPerOp is 0.01 ether. Asking for 0.02 ether must fail
        vm.prank(address(entryPoint));
        (, uint256 val) = paymaster.validatePaymasterUserOp(opA, bytes32(0), 0.02 ether);

        assertEq(val, 1, "Exceeding maxCostPerOp must be rejected");
    }
}
