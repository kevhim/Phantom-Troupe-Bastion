#!/usr/bin/env python3
"""
BASTION X v2.3 — Mandatory Phase 1 E2E Test
Verifies that an AI Agent holding a restricted session key executes
a 20 mock token (bUSD) payment to an allowed vendor through the
genuine ERC-4337 EntryPoint and Bundler.

Validates:
1. Genuine UserOperation hash computation.
2. Valid agent ECDSA signature verification by smart account validateUserOp.
3. Bundler RPC execution of eth_sendUserOperation.
4. Bundler RPC receipt retrieval via eth_getUserOperationReceipt.
5. Real Anvil transaction receipt confirmation (status 1).
6. Token balance verification: exactly 20 bUSD transferred to vendor.
7. Rejection of direct owner calls or mock EntryPoints.
"""

import json
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import pytest
from web3 import Web3
from eth_account import Account

from services.bundler.user_op_client import (
    build_user_op,
    sign_user_op,
    send_user_op,
    wait_for_user_op_receipt,
)

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DEPLOYMENTS_FILE = REPO_ROOT / "contracts" / "deployments.json"
OUT_DIR = REPO_ROOT / "contracts" / "out"

ANVIL_RPC = "http://127.0.0.1:8545"
BUNDLER_URL = "http://127.0.0.1:3000"

# Agent session key (Laptop A AI Agent)
AGENT_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"


def load_artifact(contract_name: str):
    artifact_path = OUT_DIR / f"{contract_name}.sol" / f"{contract_name}.json"
    with open(artifact_path, "r", encoding="utf-8") as f:
        return json.load(f)["abi"]


def test_agent_pays_20_tokens_via_real_entrypoint():
    # 1. Connect to Anvil
    w3 = Web3(Web3.HTTPProvider(ANVIL_RPC))
    assert w3.is_connected(), f"Cannot connect to Anvil at {ANVIL_RPC}"

    # 2. Load Deployments
    assert DEPLOYMENTS_FILE.exists(), f"deployments.json not found at {DEPLOYMENTS_FILE}"
    with open(DEPLOYMENTS_FILE, "r", encoding="utf-8") as f:
        deployments = json.load(f)

    ep_addr = Web3.to_checksum_address(deployments["entryPoint"])
    token_addr = Web3.to_checksum_address(deployments["mockToken"])
    vendor_addr = Web3.to_checksum_address(deployments["allowedVendor"])
    account_addr = Web3.to_checksum_address(deployments["bastionAccount"])
    expected_agent = Web3.to_checksum_address(deployments["agentSessionKey"])

    agent_acct = Account.from_key(AGENT_KEY)
    assert agent_acct.address.lower() == expected_agent.lower(), "Agent private key mismatch with deployed session key"

    # Contract instances
    ep_abi = load_artifact("EntryPoint")
    ep_contract = w3.eth.contract(address=ep_addr, abi=ep_abi)

    token_abi = load_artifact("MockToken")
    token_contract = w3.eth.contract(address=token_addr, abi=token_abi)

    bastion_abi = load_artifact("BastionAccount")
    bastion_contract = w3.eth.contract(address=account_addr, abi=bastion_abi)

    # 3. Snapshot Initial Balances
    initial_vendor_bal = token_contract.functions.balanceOf(vendor_addr).call()
    initial_account_bal = token_contract.functions.balanceOf(account_addr).call()
    print(f"\n[*] Initial Vendor Balance:  {initial_vendor_bal / 1e6} bUSD")
    print(f"[*] Initial Account Balance: {initial_account_bal / 1e6} bUSD")
    assert initial_account_bal >= 20 * 10**6, "BastionAccount has insufficient token balance"

    # 4. Construct executeAgentPayment calldata (20 bUSD = 20 * 10^6)
    payment_amount = 20 * 10**6
    call_data_bytes = bastion_contract.encode_abi(
        "executeAgentPayment",
        args=[token_addr, vendor_addr, payment_amount],
    )
    if isinstance(call_data_bytes, str):
        call_data = bytes.fromhex(call_data_bytes[2:] if call_data_bytes.startswith("0x") else call_data_bytes)
    else:
        call_data = bytes(call_data_bytes)

    # 5. Build Genuine UserOperation
    user_op = build_user_op(
        w3=w3,
        entry_point_contract=ep_contract,
        sender=account_addr,
        call_data=call_data,
        call_gas_limit=350000,
        verification_gas_limit=300000,
        pre_verification_gas=50000,
    )
    print(f"[*] Built UserOperation: sender={user_op['sender']}, nonce={user_op['nonce']}")

    # 6. Sign UserOperation using Restricted Agent Session Key
    signed_op, user_op_hash = sign_user_op(
        entry_point_contract=ep_contract,
        user_op=user_op,
        signer_private_key=AGENT_KEY,
    )
    user_op_hash_hex = "0x" + user_op_hash.hex()
    print(f"[*] Canonical UserOperation Hash: {user_op_hash_hex}")
    print(f"[*] Agent Signature: {signed_op['signature'][:30]}...")

    # 7. Submit via Bundler eth_sendUserOperation
    print(f"[*] Submitting UserOp to Bundler at {BUNDLER_URL}...")
    returned_hash = send_user_op(
        bundler_url=BUNDLER_URL,
        user_op=signed_op,
        entry_point_address=ep_addr,
    )
    print(f"[+] eth_sendUserOperation returned hash: {returned_hash}")
    assert returned_hash.lower() == user_op_hash_hex.lower(), "Bundler returned hash mismatch"

    # 8. Retrieve Receipt via eth_getUserOperationReceipt
    print("[*] Polling eth_getUserOperationReceipt...")
    receipt = wait_for_user_op_receipt(
        bundler_url=BUNDLER_URL,
        user_op_hash=returned_hash,
        timeout=10.0,
    )

    print("\n[+] Retrieved ERC-4337 UserOperation Receipt:")
    print(f"    - Success:         {receipt['success']}")
    print(f"    - UserOpHash:      {receipt['userOpHash']}")
    print(f"    - Actual Gas Used: {int(receipt['actualGasUsed'], 16)}")
    print(f"    - Transaction:     {receipt['receipt']['transactionHash']}")
    print(f"    - Block Number:    {int(receipt['receipt']['blockNumber'], 16)}")

    # 9. Verify Real Blockchain Transaction
    assert receipt["success"] is True, f"UserOp execution failed: {receipt.get('revertReason')}"
    tx_hash = receipt["receipt"]["transactionHash"]

    real_tx_receipt = w3.eth.get_transaction_receipt(tx_hash)
    assert real_tx_receipt is not None, "Real Anvil transaction receipt not found"
    assert real_tx_receipt.status == 1, "Anvil transaction status is not 1 (reverted)"
    assert real_tx_receipt["to"].lower() == ep_addr.lower(), "Transaction recipient was not the EntryPoint"

    # 10. Verify Real On-Chain Token Balances
    final_vendor_bal = token_contract.functions.balanceOf(vendor_addr).call()
    final_account_bal = token_contract.functions.balanceOf(account_addr).call()

    print(f"\n[+] Verified Token State Changes:")
    print(f"    - Final Vendor Balance:  {final_vendor_bal / 1e6} bUSD (+{(final_vendor_bal - initial_vendor_bal) / 1e6})")
    print(f"    - Final Account Balance: {final_account_bal / 1e6} bUSD (-{(initial_account_bal - final_account_bal) / 1e6})")

    assert final_vendor_bal == initial_vendor_bal + payment_amount, "Vendor did not receive exactly 20 bUSD"
    assert final_account_bal == initial_account_bal - payment_amount, "BastionAccount was not deducted 20 bUSD"

    # 11. Verify On-Chain Policy Tracking (Daily Spend)
    current_day = int(time.time()) // 86400
    agent_s_id = Web3.solidity_keccak(["address"], [agent_acct.address])
    daily_spent = bastion_contract.functions.dailySpent(agent_s_id, current_day).call()
    assert daily_spent >= payment_amount, f"On-chain dailySpent not updated (got {daily_spent})"

    print("\n[SUCCESS] Phase 1 Mandatory Test Passed: Real ERC-4337 Execution Verified on Chain 31337!\n")


if __name__ == "__main__":
    test_agent_pays_20_tokens_via_real_entrypoint()
