// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAccount & UserOperation
 * @notice Standard ERC-4337 Account Abstraction interface for Bastion X v2.1
 */
struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

interface IAccount {
    /**
     * @notice Validate user's signature and nonce
     * @dev MUST return SIG_VALIDATION_FAILED (1) on failure, or 0 / valid-time-range on success.
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);
}

interface IEntryPoint {
    function handleOps(UserOperation[] calldata ops, address payable beneficiary) external;
    function getUserOpHash(UserOperation calldata userOp) external view returns (bytes32);
}
