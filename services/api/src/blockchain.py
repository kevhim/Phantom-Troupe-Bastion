"""
Bastion X v2.3 — Blockchain & ERC-4337 Integration Client
Manages live Web3 connection to Anvil (Chain ID 31337) and the ERC-4337 Bundler.
Enforces that the smart contract on-chain remains the sole financial authority.
"""

import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import httpx
from eth_account import Account
from web3 import Web3

from services.bundler.user_op_client import (
    build_user_op,
    sign_user_op,
    send_user_op,
    wait_for_user_op_receipt,
    get_user_op_receipt,
)

logger = logging.getLogger("bastion.blockchain")

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DEPLOYMENTS_FILE = REPO_ROOT / "contracts" / "deployments.json"
SCHEMAS_CONTRACTS = REPO_ROOT / "schemas" / "contracts"



class BlockchainClient:
    def __init__(
        self,
        rpc_url: Optional[str] = None,
        bundler_url: Optional[str] = None,
        agent_private_key: Optional[str] = None,
    ):
        self.rpc_url = rpc_url or os.getenv("CHAIN_RPC_URL", "http://127.0.0.1:8545")
        self.bundler_url = bundler_url or os.getenv("BUNDLER_URL", "http://127.0.0.1:3000")
        self.agent_key = agent_private_key or os.getenv("AGENT_PRIVATE_KEY") or "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
        # Laptop A never loads owner or device keys.

        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 3}))
        self.deployments: Dict[str, Any] = {}
        self.abis: Dict[str, Any] = {}

        self.ep_contract = None
        self.bastion_contract = None
        self.token_contract = None
        self.circuit_breaker_contract = None

        self._load_deployments_and_abis()

    def _load_deployments_and_abis(self):
        # 1. Load Deployments
        if DEPLOYMENTS_FILE.exists():
            with open(DEPLOYMENTS_FILE, "r", encoding="utf-8") as f:
                self.deployments = json.load(f)
        else:
            # Fallback to schema if exists
            schema_dep = SCHEMAS_CONTRACTS / "deployed_addresses.json"
            if schema_dep.exists():
                with open(schema_dep, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.deployments = {
                        "chainId": data.get("chainId", 31337),
                        "entryPoint": data.get("contracts", {}).get("entryPoint"),
                        "bastionAccount": data.get("contracts", {}).get("bastionAccount"),
                        "mockToken": data.get("contracts", {}).get("mockToken"),
                        "mockVendor": data.get("contracts", {}).get("mockVendor"),
                        "circuitBreaker": data.get("contracts", {}).get("circuitBreaker"),
                        "allowedVendor": data.get("roles", {}).get("allowedVendor"),
                        "owner": data.get("roles", {}).get("owner"),
                        "agentSessionKey": data.get("roles", {}).get("agentSessionKey"),
                    }

        # 2. Load ABIs
        abi_map = {
            "EntryPoint": ["EntryPoint.abi.json", "EntryPoint.json"],
            "BastionAccount": ["BastionAccount.abi.json", "BastionAccount.json"],
            "MockToken": ["MockToken.abi.json", "MockToken.json"],
            "RiskCircuitBreaker": ["RiskCircuitBreaker.abi.json", "RiskCircuitBreaker.json"],
        }

        for name, filenames in abi_map.items():
            for fn in filenames:
                p1 = SCHEMAS_CONTRACTS / fn
                p2 = REPO_ROOT / "contracts" / "out" / f"{name}.sol" / f"{name}.json"
                if p1.exists():
                    with open(p1, "r", encoding="utf-8") as f:
                        self.abis[name] = json.load(f)
                    break
                elif p2.exists():
                    with open(p2, "r", encoding="utf-8") as f:
                        content = json.load(f)
                        self.abis[name] = content.get("abi", content)
                    break

        # 3. Instantiate Contracts if connected
        try:
            if "entryPoint" in self.deployments and "EntryPoint" in self.abis:
                self.ep_contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.deployments["entryPoint"]),
                    abi=self.abis["EntryPoint"],
                )
            if "bastionAccount" in self.deployments and "BastionAccount" in self.abis:
                self.bastion_contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.deployments["bastionAccount"]),
                    abi=self.abis["BastionAccount"],
                )
            if "mockToken" in self.deployments and "MockToken" in self.abis:
                self.token_contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.deployments["mockToken"]),
                    abi=self.abis["MockToken"],
                )
            if "circuitBreaker" in self.deployments and "RiskCircuitBreaker" in self.abis:
                self.circuit_breaker_contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.deployments["circuitBreaker"]),
                    abi=self.abis["RiskCircuitBreaker"],
                )
        except Exception as e:
            logger.warning(f"Could not instantiate all contract interfaces: {e}")

    def is_connected(self) -> bool:
        """Check live connectivity to Anvil RPC node."""
        try:
            return bool(self.w3.is_connected())
        except Exception:
            return False

    def is_bundler_reachable(self) -> bool:
        """Check live connectivity to ERC-4337 Bundler."""
        try:
            resp = httpx.post(
                self.bundler_url,
                json={"jsonrpc": "2.0", "id": 1, "method": "eth_supportedEntryPoints", "params": []},
                timeout=2.0,
            )
            return resp.status_code == 200 and "result" in resp.json()
        except Exception:
            return False

    def get_on_chain_policy(self) -> Dict[str, Any]:
        """Queries on-chain policy and session configuration from BastionAccount."""
        if not self.is_connected() or not self.bastion_contract:
            # Fallback to deployments config if chain is temporarily unreachable
            return {
                "connected": False,
                "wallet_address": self.deployments.get("bastionAccount", ""),
                "owner_address": self.deployments.get("owner", ""),
                "agent_session_key": self.deployments.get("agentSessionKey", ""),
                "allowed_target": self.deployments.get("mockToken", ""),
                "allowed_recipient": self.deployments.get("allowedVendor", ""),
                "max_per_tx": self.deployments.get("maxPerTxLimit", 50000000),
                "daily_allowance": self.deployments.get("dailySpendLimit", 100000000),
                "policy_version": 1,
                "account_nonce": 0,
                "session_expiry": 0,
            }

        try:
            owner = self.bastion_contract.functions.owner().call()
            agent = self.bastion_contract.functions.agentSessionKey().call()
            target = self.bastion_contract.functions.allowedTarget().call()
            recipient = self.bastion_contract.functions.allowedRecipient().call()
            max_per_tx = self.bastion_contract.functions.maxPerTxLimit().call()
            daily_limit = self.bastion_contract.functions.dailySpendLimit().call()
            expiry = self.bastion_contract.functions.sessionExpiry().call()
            version = self.bastion_contract.functions.policyVersion().call()
            nonce = self.bastion_contract.functions.accountNonce().call()

            token_bal = 0
            if self.token_contract:
                token_bal = self.token_contract.functions.balanceOf(self.bastion_contract.address).call()

            return {
                "connected": True,
                "wallet_address": self.bastion_contract.address,
                "owner_address": owner,
                "agent_session_key": agent,
                "allowed_target": target,
                "allowed_recipient": recipient,
                "max_per_tx": max_per_tx,
                "daily_allowance": daily_limit,
                "policy_version": version,
                "account_nonce": nonce,
                "session_expiry": expiry,
                "token_balance": token_bal,
            }
        except Exception as e:
            logger.error(f"Error reading on-chain policy: {e}")
            return {"connected": False, "error": str(e)}

    def get_agent_spending(self, agent_address: Optional[str] = None, day_index: Optional[int] = None) -> int:
        """Returns actual on-chain dailySpent for the agent session."""
        if not self.is_connected() or not self.bastion_contract:
            return 0

        try:
            agent = agent_address or self.deployments.get("agentSessionKey")
            if not agent:
                return 0

            if day_index is None:
                day_index = self.w3.eth.get_block("latest")["timestamp"] // 86400

            sid = Web3.solidity_keccak(["address"], [Web3.to_checksum_address(agent)])
            return self.bastion_contract.functions.dailySpent(sid, day_index).call()
        except Exception as e:
            logger.warning(f"Error querying on-chain dailySpent: {e}")
            return 0

    def check_agent_session_valid(self, agent_address: Optional[str] = None) -> Tuple[bool, str]:
        """Checks if agent session is active, not revoked, not paused, and unexpired on-chain."""
        if not self.is_connected() or not self.bastion_contract:
            return False, "Chain unreachable; session state is unknown"

        try:
            agent = agent_address or self.deployments.get("agentSessionKey")
            if not agent:
                return False, "No configured agent session key"

            sid = Web3.solidity_keccak(["address"], [Web3.to_checksum_address(agent)])
            is_revoked = self.bastion_contract.functions.revokedSessions(sid).call()
            if is_revoked:
                return False, "Session revoked on-chain"

            is_paused = self.bastion_contract.functions.pausedSessions(sid).call()
            if is_paused:
                return False, "Session paused on-chain"

            now = self.w3.eth.get_block("latest")["timestamp"]
            expiry = self.bastion_contract.functions.sessionExpiry().call()
            if now > expiry:
                return False, f"Session expired at {expiry} (current block time {now})"

            if self.circuit_breaker_contract:
                is_frozen = self.circuit_breaker_contract.functions.isFrozen(sid).call()
                if is_frozen:
                    return False, "Session frozen on-chain by RiskCircuitBreaker"

            return True, "Session active and valid on-chain"
        except Exception as e:
            return False, f"Error checking on-chain session: {e}"

    def submit_agent_payment_user_op(
        self,
        recipient: str,
        amount: int,
        order_id: str,
        prompt_context: Optional[str] = None,
        timeout: float = 12.0,
        exception_intent=None,
        device_signature: Optional[str] = None,
        owner_signature: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes genuine ERC-4337 UserOperation flow:
        DRAFT -> SIGNED -> SUBMITTED -> INCLUDED_SUCCESS / INCLUDED_REVERTED / BUNDLER_REJECTED / UNKNOWN.
        Never marks payment successful from an API acknowledgement alone.
        """
        result = {
            "order_id": order_id,
            "status": "DRAFT",
            "amount": amount,
            "recipient": recipient,
            "userop_hash": None,
            "tx_hash": None,
            "block_number": None,
            "actual_gas_used": None,
            "revert_reason": None,
            "error": None,
            "signed_op": None,
        }

        # Verify connectivity
        if not self.is_connected() or not self.bastion_contract or not self.ep_contract:
            result["status"] = "UNKNOWN"
            result["error"] = "Cannot execute UserOperation: Blockchain RPC node is offline"
            return result

        # 1. Advisory On-Chain Policy Verification
        token_addr = Web3.to_checksum_address(self.deployments["mockToken"])
        vendor_addr = Web3.to_checksum_address(recipient)
        account_addr = Web3.to_checksum_address(self.bastion_contract.address)
        ep_addr = Web3.to_checksum_address(self.ep_contract.address)

        # 2. Build UserOperation calldata: executeAgentPayment(token, recipient, amount)
        try:
            if self.w3.eth.chain_id != int(self.deployments["chainId"]) or self.w3.eth.chain_id != int(os.getenv("CHAIN_ID", "31337")):
                raise ValueError("RPC chain ID does not match deployment/configuration")
            for address in (account_addr, ep_addr, token_addr):
                if not self.w3.eth.get_code(address):
                    raise ValueError(f"No deployed bytecode at {address}")
            if exception_intent is None:
                call_data_bytes = self.bastion_contract.encode_abi(
                    "executeAgentPayment", args=[token_addr, vendor_addr, amount])
            else:
                values = exception_intent.to_dict()
                values["functionSelector"] = bytes.fromhex(values["functionSelector"][2:])
                values["calldataHash"] = bytes.fromhex(values["calldataHash"][2:])
                call_data_bytes = self.bastion_contract.encode_abi(
                    "executeAuthorizedException",
                    args=[tuple(values.values()), bytes.fromhex((device_signature or "").removeprefix("0x")),
                          bytes.fromhex((owner_signature or "").removeprefix("0x"))])
            if isinstance(call_data_bytes, str):
                call_data = bytes.fromhex(call_data_bytes[2:] if call_data_bytes.startswith("0x") else call_data_bytes)
            else:
                call_data = bytes(call_data_bytes)

            user_op = build_user_op(
                w3=self.w3,
                entry_point_contract=self.ep_contract,
                sender=account_addr,
                call_data=call_data,
                call_gas_limit=350000,
                verification_gas_limit=300000,
                pre_verification_gas=50000,
            )
        except Exception as e:
            result["status"] = "UNKNOWN"
            result["error"] = f"Failed to build UserOperation: {e}"
            return result

        # 3. Sign UserOperation using restricted agent session key
        try:
            agent_priv = self.agent_key or os.getenv("AGENT_PRIVATE_KEY", "")
            signed_op, user_op_hash = sign_user_op(
                entry_point_contract=self.ep_contract,
                user_op=user_op,
                signer_private_key=agent_priv,
            )
            user_op_hash_hex = "0x" + user_op_hash.hex()
            result["userop_hash"] = user_op_hash_hex
            result["signed_op"] = signed_op
            result["status"] = "SIGNED"
        except Exception as e:
            result["status"] = "UNKNOWN"
            result["error"] = f"Failed to sign UserOperation: {e}"
            return result

        # 4. Submit to Bundler (eth_sendUserOperation)
        try:
            returned_hash = send_user_op(
                bundler_url=self.bundler_url,
                user_op=signed_op,
                entry_point_address=ep_addr,
            )
            if returned_hash.lower() != user_op_hash_hex.lower():
                result["status"] = "UNKNOWN"
                result["error"] = "Bundler returned a different UserOperation hash"
                return result
            result["status"] = "SUBMITTED"
        except Exception as e:
            result["status"] = "BUNDLER_REJECTED"
            result["error"] = f"Bundler rejected UserOperation: {e}"
            result["revert_reason"] = str(e)
            return result

        # 5. Await On-Chain Mining via eth_getUserOperationReceipt
        try:
            receipt = wait_for_user_op_receipt(
                bundler_url=self.bundler_url,
                user_op_hash=returned_hash,
                timeout=timeout,
            )
        except TimeoutError:
            # Bundler accepted but receipt not available within timeout
            result["status"] = "UNKNOWN"
            result["error"] = f"UserOperation receipt polling timed out after {timeout}s"
            return result
        except Exception as e:
            result["status"] = "UNKNOWN"
            result["error"] = f"Error querying receipt from bundler: {e}"
            return result

        # 6. Parse Receipt & Verify Transaction On-Chain
        success = receipt.get("success", False)
        tx_hash = receipt.get("receipt", {}).get("transactionHash")
        blk_num = receipt.get("receipt", {}).get("blockNumber")
        actual_gas = receipt.get("actualGasUsed")

        result["tx_hash"] = tx_hash
        if blk_num:
            result["block_number"] = int(blk_num, 16) if isinstance(blk_num, str) and blk_num.startswith("0x") else int(blk_num)
        if actual_gas:
            result["actual_gas_used"] = int(actual_gas, 16) if isinstance(actual_gas, str) and actual_gas.startswith("0x") else int(actual_gas)

        if not success:
            result["status"] = "INCLUDED_REVERTED"
            result["revert_reason"] = receipt.get("revertReason", "UserOperation reverted on-chain")
            return result

        # Double check transaction receipt directly on Anvil
        try:
            if tx_hash:
                real_tx = self.w3.eth.get_transaction_receipt(tx_hash)
                if real_tx and real_tx.get("status") == 1:
                    result.update(self.verify_payment_receipt(
                        real_tx, user_op_hash_hex, vendor_addr, amount,
                        exception_intent is not None))
                else:
                    result["status"] = "INCLUDED_REVERTED"
                    result["revert_reason"] = "Anvil transaction receipt status is 0 (reverted)"
            else:
                result["status"] = "UNKNOWN"
                result["error"] = "Receipt missing transaction hash"
        except Exception as e:
            # RPC outage during receipt verification
            result["status"] = "UNKNOWN"
            result["error"] = f"RPC failure checking transaction receipt: {e}"

        return result

    def verify_payment_receipt(self, receipt, op_hash, recipient, amount, exception=False):
        """Bind the local UserOp to EntryPoint logs and an exact token transfer.

        EntryPoint success alone is insufficient: the circuit breaker can return
        successfully without paying. Restrict evidence to this operation's logs.
        """
        if receipt.get("status") != 1 or str(receipt.get("to", "")).lower() != self.ep_contract.address.lower():
            return {"status": "UNKNOWN", "error": "Receipt is not a successful EntryPoint transaction"}
        scope = []
        matched = None
        for log in receipt.get("logs", []):
            if log["address"].lower() == self.ep_contract.address.lower():
                try:
                    event = self.ep_contract.events.UserOperationEvent().process_log(log)["args"]
                except Exception:
                    pass
                else:
                    if Web3.to_hex(event["userOpHash"]).lower() == op_hash.lower():
                        matched = event
                        break
                    scope = []
                    continue
            scope.append(log)
        if matched is None or matched["sender"].lower() != self.bastion_contract.address.lower():
            return {"status": "UNKNOWN", "error": "No matching EntryPoint UserOperationEvent"}
        if not matched["success"]:
            return {"status": "INCLUDED_REVERTED", "revert_reason": "UserOperation reverted on-chain"}
        transfers = []
        for log in scope:
            if log["address"].lower() != self.token_contract.address.lower():
                continue
            try:
                transfers.append(self.token_contract.events.Transfer().process_log(log)["args"])
            except Exception:
                continue
        paid = any(e["from"].lower() == self.bastion_contract.address.lower()
                   and e["to"].lower() == recipient.lower() and int(e["value"]) == amount for e in transfers)
        if not paid:
            return {"status": "INCLUDED_NO_TRANSFER", "revert_reason": "No exact ERC-20 transfer; operation may have been halted by circuit breaker"}
        return {"status": "INCLUDED_SUCCESS"}

    def revoke_session_on_chain(self, agent_address=None, reason="EMERGENCY_PANIC"):
        return {"status": "REVOKE_UNAVAILABLE", "error": "Use the physical ESP32 panic button or independent owner wallet on Laptop B"}

    def unfreeze_session_on_chain(self, agent_address=None, reason="SOC cleared"):
        return {"status": "OWNER_AUTHORIZATION_REQUIRED", "error": "Use the independent owner wallet on Laptop B"}

    def freeze_session_on_chain(self, agent_address=None, reason="Manual SOC freeze"):
        return {"status": "OWNER_AUTHORIZATION_REQUIRED", "error": "Use the independent owner wallet on Laptop B"}


# Singleton blockchain client
blockchain_client = BlockchainClient()
