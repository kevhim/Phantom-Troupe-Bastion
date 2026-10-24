// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BastionAccount.sol";
import "../src/MockToken.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";
import "@account-abstraction/contracts/interfaces/UserOperation.sol";

contract RealEntryPointExecutionTest is Test {
    EntryPoint public entryPoint;
    BastionAccount public account;
    MockToken public token;

    uint256 public ownerPrivateKey = 0xA11CE;
    address public owner;

    uint256 public agentPrivateKey = 0xB0B;
    address public agent;

    address public allowedVendor = address(0x3333);
    address public beneficiary = address(0x9999);
    address public junior = address(0x4444);
    address public senior = address(0x5555);
    address public revoker = address(0x7777);

    uint256 constant MAX_PER_TX = 50 * 1e6;
    uint256 constant DAILY_LIMIT = 100 * 1e6;

    function setUp() public {
        owner = vm.addr(ownerPrivateKey);
        agent = vm.addr(agentPrivateKey);

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
            allowedVendor,
            MAX_PER_TX,
            DAILY_LIMIT,
            block.timestamp + 30 days
        );

        // Fund account with ETH for EntryPoint prefund and deposit
        vm.deal(address(account), 10 ether);
        entryPoint.depositTo{value: 2 ether}(address(account));

        // Mint 1000 tokens (bUSD, 6 decimals) to account
        token.mint(address(account), 1000 * 1e6);
    }

    function test_AgentPays20TokensViaRealEntryPoint() public {
        uint256 paymentAmount = 20 * 1e6; // 20 tokens

        bytes memory callData = abi.encodeWithSelector(
            BastionAccount.executeAgentPayment.selector,
            address(token),
            allowedVendor,
            paymentAmount
        );

        uint256 nonce = entryPoint.getNonce(address(account), 0);

        UserOperation memory userOp = UserOperation({
            sender: address(account),
            nonce: nonce,
            initCode: "",
            callData: callData,
            callGasLimit: 150000,
            verificationGasLimit: 200000,
            preVerificationGas: 50000,
            maxFeePerGas: 2 gwei,
            maxPriorityFeePerGas: 1 gwei,
            paymasterAndData: "",
            signature: ""
        });

        // Compute UserOperation hash via canonical EntryPoint
        bytes32 userOpHash = entryPoint.getUserOpHash(userOp);

        // Sign with agent session key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(agentPrivateKey, userOpHash);
        userOp.signature = abi.encodePacked(r, s, v);

        // Execute via real EntryPoint handleOps
        UserOperation[] memory ops = new UserOperation[](1);
        ops[0] = userOp;

        vm.recordLogs();
        entryPoint.handleOps(ops, payable(beneficiary));

        // Verify token balances
        assertEq(token.balanceOf(allowedVendor), paymentAmount, "Vendor must receive 20 tokens");
        assertEq(token.balanceOf(address(account)), (1000 * 1e6) - paymentAmount, "Account balance must decrease by 20 tokens");
        assertEq(account.dailySpent(keccak256(abi.encodePacked(agent)), block.timestamp / 86400), paymentAmount, "Daily spent must be recorded");

        // Verify EntryPoint emitted UserOperationEvent with success == true
        Vm.Log[] memory entries = vm.getRecordedLogs();
        bool userOpEventFound = false;
        bytes32 userOpEventSignature = keccak256("UserOperationEvent(bytes32,address,address,uint256,bool,uint256,uint256)");

        for (uint256 i = 0; i < entries.length; i++) {
            if (entries[i].topics[0] == userOpEventSignature) {
                userOpEventFound = true;
                bytes32 loggedHash = entries[i].topics[1];
                address loggedSender = address(uint160(uint256(entries[i].topics[2])));
                assertEq(loggedHash, userOpHash, "UserOpHash in event must match");
                assertEq(loggedSender, address(account), "Sender in event must match account");

                // Unpack non-indexed data: (nonce, success, actualGasCost, actualGasUsed)
                (, bool success, , ) = abi.decode(entries[i].data, (uint256, bool, uint256, uint256));
                assertTrue(success, "UserOperation execution must succeed");
            }
        }
        assertTrue(userOpEventFound, "UserOperationEvent must be emitted");
    }
}
