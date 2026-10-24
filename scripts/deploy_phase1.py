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

ANVIL_RPC = "http://127.0.0.1:8545"

# Anvil prefunded account #0 (Supervisor / Owner)
OWNER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
# Anvil prefunded account #1 (Agent Session Key)
AGENT_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
# Anvil prefunded account #2 (Junior ESP32 Signer)
JUNIOR_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
# Anvil prefunded account #3 (Senior ESP32 Signer)
SENIOR_KEY = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
# Anvil prefunded account #4 (Emergency Revoker / Panic)
REVOKER_KEY = "0x47e17977797c48e9b1d0a232822a61349ab7fb41a14c12dd3434773740302309"
# Anvil prefunded account #5 (Bundler Relayer & Beneficiary)
BUNDLER_KEY = "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"


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

    deployer = Account.from_key(OWNER_KEY)
    agent = Account.from_key(AGENT_KEY)
    junior = Account.from_key(JUNIOR_KEY)
    senior = Account.from_key(SENIOR_KEY)
    revoker = Account.from_key(REVOKER_KEY)
    bundler = Account.from_key(BUNDLER_KEY)

    print(f"[*] Deployer (Owner): {deployer.address}")
    print(f"[*] Agent Session Key: {agent.address}")

    # 1. Deploy Canonical EntryPoint
    print("\n[1/5] Deploying Canonical EntryPoint (ERC-4337 v0.6)...")
    ep_abi, ep_bin = load_artifact("EntryPoint")
    ep_contract = w3.eth.contract(abi=ep_abi, bytecode=ep_bin)
    tx_hash = ep_contract.constructor().transact({"from": deployer.address, "gas": 6000000})
    ep_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    entry_point_addr = ep_receipt.contractAddress
    print(f"      EntryPoint deployed at: {entry_point_addr}")

    # 2. Deploy MockToken (bUSD)
    print("\n[2/5] Deploying MockToken (bUSD, 6 decimals)...")
    token_abi, token_bin = load_artifact("MockToken")
    token_contract = w3.eth.contract(abi=token_abi, bytecode=token_bin)
    tx_hash = token_contract.constructor(0).transact({"from": deployer.address, "gas": 2000000})
    token_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    token_addr = token_receipt.contractAddress
    print(f"      MockToken deployed at: {token_addr}")

    # 3. Deploy MockVendor
    print("\n[3/5] Deploying MockVendor...")
    vendor_abi, vendor_bin = load_artifact("MockVendor")
    vendor_contract = w3.eth.contract(abi=vendor_abi, bytecode=vendor_bin)
    tx_hash = vendor_contract.constructor(token_addr).transact({"from": deployer.address, "gas": 1000000})
    vendor_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    vendor_addr = vendor_receipt.contractAddress
    print(f"      MockVendor deployed at: {vendor_addr}")

    # 4. Deploy RiskCircuitBreaker
    print("\n[4/5] Deploying RiskCircuitBreaker...")
    cb_abi, cb_bin = load_artifact("RiskCircuitBreaker")
    cb_contract = w3.eth.contract(abi=cb_abi, bytecode=cb_bin)
    tx_hash = cb_contract.constructor(deployer.address).transact({"from": deployer.address, "gas": 3000000})
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
    tx_hash = bastion_contract.constructor(
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
    ).transact({"from": deployer.address, "gas": 5000000})
    bastion_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    bastion_addr = bastion_receipt.contractAddress
    print(f"      BastionAccount deployed at: {bastion_addr}")

    # Post-deployment wiring
    print("\n[*] Configuring Circuit Breaker & Authorizations...")
    cb_instance = w3.eth.contract(address=cb_addr, abi=cb_abi)
    tx = cb_instance.functions.setAuthorizedAccount(bastion_addr).transact({"from": deployer.address})
    w3.eth.wait_for_transaction_receipt(tx)

    bastion_instance = w3.eth.contract(address=bastion_addr, abi=bastion_abi)
    tx = bastion_instance.functions.setCircuitBreaker(cb_addr).transact({"from": deployer.address})
    w3.eth.wait_for_transaction_receipt(tx)

    # Fund BastionAccount with ETH
    print("[*] Funding BastionAccount with 5 ETH...")
    tx = w3.eth.send_transaction({
        "from": deployer.address,
        "to": bastion_addr,
        "value": w3.to_wei(5, "ether"),
    })
    w3.eth.wait_for_transaction_receipt(tx)

    # Deposit 2 ETH into EntryPoint for BastionAccount
    print("[*] Depositing 2 ETH into EntryPoint for BastionAccount...")
    ep_instance = w3.eth.contract(address=entry_point_addr, abi=ep_abi)
    tx = ep_instance.functions.depositTo(bastion_addr).transact({
        "from": deployer.address,
        "value": w3.to_wei(2, "ether"),
    })
    w3.eth.wait_for_transaction_receipt(tx)

    # Mint 1,000 bUSD to BastionAccount
    print("[*] Minting 1,000 bUSD to BastionAccount...")
    token_instance = w3.eth.contract(address=token_addr, abi=token_abi)
    tx = token_instance.functions.mint(bastion_addr, 1000 * 10**6).transact({"from": deployer.address})
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

    print(f"\n[+] Saved deployment records to {DEPLOYMENTS_FILE}")
    return deployments


if __name__ == "__main__":
    deploy()
