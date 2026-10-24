#!/usr/bin/env python3
"""
BASTION X v2.3 — Phase 1 Deployment Script
Deploys Canonical ERC-4337 EntryPoint, MockToken (bUSD), MockVendor,
RiskCircuitBreaker, and BastionAccount on Anvil (Chain ID 31337).
Configures deposits, limits, permissions, and initial token balances.
"""

import json
import os
import sys
import time
from pathlib import Path
from web3 import Web3
from eth_account import Account

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "contracts" / "out"
DEPLOYMENTS_FILE = REPO_ROOT / "contracts" / "deployments.json"

ANVIL_RPC = os.getenv("ANVIL_INTERNAL_RPC_URL", "http://127.0.0.1:18545")

# Device keys stay on device. Run privileged deployment only on Laptop B.


def load_artifact(contract_name: str, file_name: str = None):
    if file_name is None:
        file_name = f"{contract_name}.sol"
    artifact_path = OUT_DIR / file_name / f"{contract_name}.json"
    if not artifact_path.exists():
        raise FileNotFoundError(f"Artifact not found: {artifact_path}. Run 'forge build' first.")
    with open(artifact_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["abi"], data["bytecode"]["object"]


def deploy():
    w3 = Web3(Web3.HTTPProvider(ANVIL_RPC))
    if not w3.is_connected():
        print(f"[ERROR] Cannot connect to Anvil at {ANVIL_RPC}. Start Anvil first.")
        sys.exit(1)

    chain_id = w3.eth.chain_id
    print(f"[*] Connected to Anvil: Chain ID {chain_id}, Block {w3.eth.block_number}")

    if chain_id != 31337:
        raise RuntimeError("Deployment is restricted to local chain 31337")
    from getpass import getpass
    from types import SimpleNamespace
    owner_key = os.getenv("OWNER_PRIVATE_KEY") or getpass("Independent Laptop B owner private key (hidden): ")
    deployer = Account.from_key(owner_key)
    roles = {}
    for role in ("AGENT_SESSION_ADDRESS", "JUNIOR_SIGNER_ADDRESS", "SENIOR_SIGNER_ADDRESS", "REVOKER_ADDRESS", "BUNDLER_ADDRESS"):
        value = os.environ.get(role)
        if not value or not Web3.is_address(value):
            raise RuntimeError(f"Missing valid {role}; provision device keys independently")
        roles[role] = SimpleNamespace(address=Web3.to_checksum_address(value))
    agent, junior, senior, revoker, bundler = [roles[k] for k in roles]
    if len({deployer.address, agent.address, junior.address, senior.address, revoker.address, bundler.address}) != 6:
        raise RuntimeError("Owner, agent, junior, senior, revoker and bundler must be distinct")
    for address in (deployer.address, revoker.address, bundler.address):
        response = w3.provider.make_request("anvil_setBalance", [address, hex(w3.to_wei(100, "ether"))])
        if "error" in response:
            raise RuntimeError("Local Anvil funding failed")

    def send_tx(tx):
        tx.update({"nonce": w3.eth.get_transaction_count(deployer.address, "pending"), "chainId": chain_id})
        if "gasPrice" not in tx and "maxFeePerGas" not in tx:
            tx["gasPrice"] = w3.eth.gas_price
        if "gas" not in tx:
            tx["gas"] = w3.eth.estimate_gas(tx)
        signed = Account.sign_transaction(tx, owner_key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt.status != 1:
            raise RuntimeError(f"Deployment/configuration transaction reverted: {Web3.to_hex(tx_hash)}")
        return tx_hash

    print(f"[*] Deployer (Owner): {deployer.address}")
    print(f"[*] Agent Session Key: {agent.address}")

    # 1. Deploy Canonical EntryPoint
    print("\n[1/5] Deploying Canonical EntryPoint (ERC-4337 v0.6)...")
    ep_abi, ep_bin = load_artifact("EntryPoint")
    ep_contract = w3.eth.contract(abi=ep_abi, bytecode=ep_bin)
    tx_hash = send_tx(ep_contract.constructor().build_transaction({"from": deployer.address, "gas": 6000000}))
    ep_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    entry_point_addr = ep_receipt.contractAddress
    print(f"      EntryPoint deployed at: {entry_point_addr}")

    # 2. Deploy MockToken (bUSD)
    print("\n[2/5] Deploying MockToken (bUSD, 6 decimals)...")
    token_abi, token_bin = load_artifact("MockToken")
    token_contract = w3.eth.contract(abi=token_abi, bytecode=token_bin)
    tx_hash = send_tx(token_contract.constructor(0).build_transaction({"from": deployer.address, "gas": 2000000}))
    token_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    token_addr = token_receipt.contractAddress
    print(f"      MockToken deployed at: {token_addr}")

    # 3. Deploy MockVendor
    print("\n[3/5] Deploying MockVendor...")
    vendor_abi, vendor_bin = load_artifact("MockVendor")
    vendor_contract = w3.eth.contract(abi=vendor_abi, bytecode=vendor_bin)
    tx_hash = send_tx(vendor_contract.constructor(token_addr).build_transaction({"from": deployer.address, "gas": 1000000}))
    vendor_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    vendor_addr = vendor_receipt.contractAddress
    print(f"      MockVendor deployed at: {vendor_addr}")

    # 4. Deploy RiskCircuitBreaker
    print("\n[4/5] Deploying RiskCircuitBreaker...")
    cb_abi, cb_bin = load_artifact("RiskCircuitBreaker")
    cb_contract = w3.eth.contract(abi=cb_abi, bytecode=cb_bin)
    tx_hash = send_tx(cb_contract.constructor(deployer.address).build_transaction({"from": deployer.address, "gas": 3000000}))
    cb_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    cb_addr = cb_receipt.contractAddress
    print(f"      RiskCircuitBreaker deployed at: {cb_addr}")

    # 5. Deploy BastionAccount
    print("\n[5/5] Deploying BastionAccount...")
    max_per_tx = 50 * 10**6      # 50 bUSD
    daily_limit = 100 * 10**6    # 100 bUSD
    session_expiry = int(time.time()) + 30 * 86400  # 30 days

    bastion_abi, bastion_bin = load_artifact("BastionAccount")
    bastion_contract = w3.eth.contract(abi=bastion_abi, bytecode=bastion_bin)
    tx_hash = send_tx(bastion_contract.constructor(
        entry_point_addr,
        deployer.address,
        agent.address,
        junior.address,
        senior.address,
        revoker.address,
        token_addr,
        vendor_addr,
        max_per_tx,
        daily_limit,
        session_expiry,
    ).build_transaction({"from": deployer.address, "gas": 5000000}))
    bastion_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    bastion_addr = bastion_receipt.contractAddress
    print(f"      BastionAccount deployed at: {bastion_addr}")

    # Post-deployment wiring
    print("\n[*] Configuring Circuit Breaker & Authorizations...")
    cb_instance = w3.eth.contract(address=cb_addr, abi=cb_abi)
    tx = send_tx(cb_instance.functions.setAuthorizedAccount(bastion_addr).build_transaction({"from": deployer.address}))
    w3.eth.wait_for_transaction_receipt(tx)

    bastion_instance = w3.eth.contract(address=bastion_addr, abi=bastion_abi)
    tx = send_tx(bastion_instance.functions.setCircuitBreaker(cb_addr).build_transaction({"from": deployer.address}))
    w3.eth.wait_for_transaction_receipt(tx)

    # Fund BastionAccount with ETH
    print("[*] Funding BastionAccount with 5 ETH...")
    tx = send_tx({
        "from": deployer.address,
        "to": bastion_addr,
        "value": w3.to_wei(5, "ether"),
    })
    w3.eth.wait_for_transaction_receipt(tx)

    # Deposit 2 ETH into EntryPoint for BastionAccount
    print("[*] Depositing 2 ETH into EntryPoint for BastionAccount...")
    ep_instance = w3.eth.contract(address=entry_point_addr, abi=ep_abi)
    tx = send_tx(ep_instance.functions.depositTo(bastion_addr).build_transaction({
        "from": deployer.address,
        "value": w3.to_wei(2, "ether"),
    }))
    w3.eth.wait_for_transaction_receipt(tx)

    # Mint 1,000 bUSD to BastionAccount
    print("[*] Minting 1,000 bUSD to BastionAccount...")
    token_instance = w3.eth.contract(address=token_addr, abi=token_abi)
    tx = send_tx(token_instance.functions.mint(bastion_addr, 1000 * 10**6).build_transaction({"from": deployer.address}))
    w3.eth.wait_for_transaction_receipt(tx)

    # Verify state
    balance_eth = w3.eth.get_balance(bastion_addr)
    deposit_ep = ep_instance.functions.balanceOf(bastion_addr).call()
    balance_busd = token_instance.functions.balanceOf(bastion_addr).call()

    print(f"\n[+] Deployment State Verified:")
    print(f"    - BastionAccount ETH Balance: {w3.from_wei(balance_eth, 'ether')} ETH")
    print(f"    - EntryPoint Deposit:        {w3.from_wei(deposit_ep, 'ether')} ETH")
    print(f"    - MockToken (bUSD) Balance:   {balance_busd / 1e6} bUSD")

    deployments = {
        "chainId": chain_id,
        "entryPoint": entry_point_addr,
        "mockToken": token_addr,
        "mockVendor": vendor_addr,
        "circuitBreaker": cb_addr,
        "bastionAccount": bastion_addr,
        "owner": deployer.address,
        "agentSessionKey": agent.address,
        "juniorSigner": junior.address,
        "seniorSigner": senior.address,
        "revoker": revoker.address,
        "bundlerBeneficiary": bundler.address,
        "allowedVendor": vendor_addr,
        "maxPerTxLimit": max_per_tx,
        "dailySpendLimit": daily_limit,
        "deployedAt": int(time.time()),
    }

    with open(DEPLOYMENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(deployments, f, indent=2)

    schema_dir = REPO_ROOT / "schemas" / "contracts"
    schema = {"chainId": chain_id,
        "contracts": {k: deployments[k] for k in ("entryPoint", "bastionAccount", "mockToken", "mockVendor", "circuitBreaker")},
        "roles": {k: deployments[k] for k in ("owner", "agentSessionKey", "juniorSigner", "seniorSigner", "revoker", "bundlerBeneficiary", "allowedVendor")},
        "policy": {"maxPerTxLimit": max_per_tx, "dailySpendLimit": daily_limit}}
    (schema_dir / "deployed_addresses.json").write_text(json.dumps(schema, indent=2), encoding="utf-8")
    for name in ("EntryPoint", "BastionAccount", "MockToken", "RiskCircuitBreaker"):
        abi, _ = load_artifact(name)
        (schema_dir / f"{name}.abi.json").write_text(json.dumps(abi, indent=2), encoding="utf-8")
    print(f"\n[+] Saved deployment records to {DEPLOYMENTS_FILE}")
    return deployments


if __name__ == "__main__":
    deploy()
