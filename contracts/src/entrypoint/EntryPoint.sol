// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../IEntryPoint.sol";

contract EntryPoint is IEntryPoint {
    mapping(address => uint256) private _deposits;
    mapping(address => uint256) public nonces;

    receive() external payable {
        _deposits[msg.sender] += msg.value;
    }

    function depositTo(address account) external payable override {
        _deposits[account] += msg.value;
    }

    function getDepositInfo(address account) external view override returns (uint256 deposit) {
        return _deposits[account];
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _deposits[account];
    }

    function getUserOpHash(UserOperation calldata userOp) public view override returns (bytes32) {
        bytes32 opHash = keccak256(
            abi.encode(
                userOp.sender,
                userOp.nonce,
                keccak256(userOp.initCode),
                keccak256(userOp.callData),
                userOp.callGasLimit,
                userOp.verificationGasLimit,
                userOp.preVerificationGas,
                userOp.maxFeePerGas,
                userOp.maxPriorityFeePerGas,
                keccak256(userOp.paymasterAndData)
            )
        );
        return keccak256(abi.encode(opHash, address(this), block.chainid));
    }

    function handleOps(UserOperation[] calldata ops, address payable beneficiary) external override {
        uint256 opslen = ops.length;
        for (uint256 i = 0; i < opslen; i++) {
            _handleOp(ops[i], beneficiary);
        }
    }

    function _handleOp(UserOperation calldata userOp, address payable beneficiary) internal {
        bytes32 userOpHash = getUserOpHash(userOp);
        address sender = userOp.sender;

        // Check and increment nonce
        require(userOp.nonce == nonces[sender], "EntryPoint: invalid nonce");
        nonces[sender]++;

        // If initCode present, could deploy account (for pre-deployed accounts, initCode is empty)
        if (userOp.initCode.length > 0 && sender.code.length == 0) {
            address factory = address(bytes20(userOp.initCode[0:20]));
            bytes memory initData = userOp.initCode[20:];
            (bool deploySuccess, ) = factory.call(initData);
            require(deploySuccess, "EntryPoint: initCode failed");
            emit AccountDeployed(userOpHash, sender, factory, address(0));
        }

        // Validate UserOp on the account
        uint256 validationData = IAccount(sender).validateUserOp(userOp, userOpHash, 0);
        require(validationData == 0, "EntryPoint: account validation failed");

        // Execute callData on the sender
        bool success = false;
        if (userOp.callData.length > 0) {
            (success, ) = sender.call{gas: userOp.callGasLimit > 0 ? userOp.callGasLimit : gasleft()}(userOp.callData);
        }

        // Emit standard ERC-4337 event
        emit UserOperationEvent(
            userOpHash,
            sender,
            address(0),
            userOp.nonce,
            success,
            0,
            0
        );

        if (beneficiary != address(0) && msg.value > 0) {
            beneficiary.transfer(msg.value);
        }
    }
}
