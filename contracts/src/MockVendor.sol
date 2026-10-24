// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockToken.sol";

/**
 * @title MockVendor
 * @notice Authorized mock vendor for AI agent purchase flows.
 */
contract MockVendor {
    address public owner;
    MockToken public paymentToken;
    uint256 public totalReceived;

    event PaymentReceived(address indexed from, uint256 amount, string orderId);

    constructor(address _token) {
        owner = msg.sender;
        paymentToken = MockToken(_token);
    }

    function purchase(uint256 amount, string calldata orderId) external {
        require(amount > 0, "Amount must be positive");
        bool success = paymentToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Payment transfer failed");
        totalReceived += amount;
        emit PaymentReceived(msg.sender, amount, orderId);
    }
}
