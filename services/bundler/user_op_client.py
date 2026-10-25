#!/usr/bin/env python3
"""
BASTION X v2.3 — ERC-4337 UserOperation Client
Provides helpers to construct, sign, submit, and await UserOperations.
"""

import time
from typing import Any, Dict, Optional, Tuple
import httpx
from web3 import Web3
from eth_account import Account


def build_user_op(
    w3: Web3,
    entry_point_contract,
    sender: str,
    call_data: bytes,
    call_gas_limit: int = 350000,
    verification_gas_limit: int = 300000,
    pre_verification_gas: int = 50000,
    max_fee_per_gas: int = 2000000000,
    max_priority_fee_per_gas: int = 1000000000,
    paymaster_and_data: bytes = b"",
    init_code: bytes = b"",
) -> Dict[str, Any]:
    """Construct an unsigned UserOperation dictionary with fresh nonce."""
    sender_addr = Web3.to_checksum_address(sender)
    nonce = entry_point_contract.functions.getNonce(sender_addr, 0).call()

    return {
        "sender": sender_addr,
        "nonce": hex(nonce),
        "initCode": "0x" + init_code.hex(),
        "callData": "0x" + call_data.hex(),
        "callGasLimit": hex(call_gas_limit),
        "verificationGasLimit": hex(verification_gas_limit),
        "preVerificationGas": hex(pre_verification_gas),
        "maxFeePerGas": hex(max_fee_per_gas),
        "maxPriorityFeePerGas": hex(max_priority_fee_per_gas),
        "paymasterAndData": "0x" + paymaster_and_data.hex(),
        "signature": "0x",
    }


def user_op_to_tuple(user_op: Dict[str, Any]) -> tuple:
    """Format UserOperation dict into the ABI tuple required by EntryPoint."""
    def _to_int(val):
        if isinstance(val, int):
            return val
        return int(val, 16) if val.startswith("0x") else int(val)

    def _to_bytes(val):
        if isinstance(val, bytes):
            return val
        if val.startswith("0x"):
            return bytes.fromhex(val[2:]) if len(val) > 2 else b""
        return bytes.fromhex(val) if len(val) > 0 else b""

    return (
        Web3.to_checksum_address(user_op["sender"]),
        _to_int(user_op["nonce"]),
        _to_bytes(user_op["initCode"]),
        _to_bytes(user_op["callData"]),
        _to_int(user_op["callGasLimit"]),
        _to_int(user_op["verificationGasLimit"]),
        _to_int(user_op["preVerificationGas"]),
        _to_int(user_op["maxFeePerGas"]),
        _to_int(user_op["maxPriorityFeePerGas"]),
        _to_bytes(user_op["paymasterAndData"]),
        _to_bytes(user_op["signature"]),
    )


def sign_user_op(
    entry_point_contract,
    user_op: Dict[str, Any],
    signer_private_key: str,
) -> Tuple[Dict[str, Any], bytes]:
    """Calculate canonical UserOp hash from EntryPoint and sign with ECDSA private key."""
    # Temporarily set empty signature to hash
    user_op_copy = dict(user_op)
    user_op_copy["signature"] = "0x"
    op_tuple = user_op_to_tuple(user_op_copy)

    user_op_hash = entry_point_contract.functions.getUserOpHash(op_tuple).call()

    # Sign raw 32-byte hash directly
    sig = Account._sign_hash(user_op_hash, signer_private_key)
    user_op_copy["signature"] = "0x" + sig.signature.hex()

    return user_op_copy, user_op_hash


def send_user_op(
    bundler_url: str,
    user_op: Dict[str, Any],
    entry_point_address: str,
) -> str:
    """Submit UserOperation via eth_sendUserOperation to bundler."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_sendUserOperation",
        "params": [user_op, entry_point_address],
    }
    resp = httpx.post(bundler_url, json=payload, timeout=30.0)
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"Bundler error: {data['error']}")
    return data["result"]


def get_user_op_receipt(
    bundler_url: str,
    user_op_hash: str,
) -> Optional[Dict[str, Any]]:
    """Query eth_getUserOperationReceipt from bundler."""
    payload = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "eth_getUserOperationReceipt",
        "params": [user_op_hash],
    }
    resp = httpx.post(bundler_url, json=payload, timeout=10.0)
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"Bundler error: {data['error']}")
    return data.get("result")


def wait_for_user_op_receipt(
    bundler_url: str,
    user_op_hash: str,
    timeout: float = 10.0,
    poll_interval: float = 0.5,
) -> Dict[str, Any]:
    """Poll eth_getUserOperationReceipt until mined or timeout."""
    start = time.time()
    while time.time() - start < timeout:
        receipt = get_user_op_receipt(bundler_url, user_op_hash)
        if receipt is not None:
            return receipt
        time.sleep(poll_interval)
    raise TimeoutError(f"UserOperation {user_op_hash} was not mined within {timeout}s")
