#!/usr/bin/env python3
"""
BASTION X v2.3 — ERC-4337 Bundler Service
Listens on port 3000. Provides standard ERC-4337 JSON-RPC endpoints:
- eth_supportedEntryPoints
- eth_estimateUserOperationGas
- eth_sendUserOperation
- eth_getUserOperationReceipt
"""

import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
from web3 import Web3
from eth_account import Account

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [Bundler] %(message)s")
logger = logging.getLogger("bundler")

DEPLOYMENTS_FILE = REPO_ROOT / "contracts" / "deployments.json"
OUT_DIR = REPO_ROOT / "contracts" / "out"

ANVIL_RPC = "http://127.0.0.1:8545"
# Anvil account #5: Bundler Relayer & Beneficiary
BUNDLER_KEY = "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"

app = FastAPI(title="BastionX ERC-4337 Bundler", version="2.3.0")

# In-memory receipt cache: userOpHash (0x...) -> receipt dict
user_op_receipts: Dict[str, Dict[str, Any]] = {}

USER_OP_EVENT_TOPIC = "0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f"
USER_OP_REVERT_TOPIC = "0x1c4fada7374c0a9ee8841fc38afe82932dc0f8e69012e927f061a8bae611a201"


def get_web3() -> Web3:
    return Web3(Web3.HTTPProvider(ANVIL_RPC))


def load_entry_point():
    if not DEPLOYMENTS_FILE.exists():
        raise RuntimeError("deployments.json not found. Run scripts/deploy_phase1.py first.")
    with open(DEPLOYMENTS_FILE, "r", encoding="utf-8") as f:
        deployments = json.load(f)

    ep_addr = deployments["entryPoint"]
    ep_artifact = OUT_DIR / "EntryPoint.sol" / "EntryPoint.json"
    with open(ep_artifact, "r", encoding="utf-8") as f:
        ep_abi = json.load(f)["abi"]

    w3 = get_web3()
    contract = w3.eth.contract(address=ep_addr, abi=ep_abi)
    return contract, ep_addr, deployments


def parse_int(val: Union[int, str]) -> int:
    if isinstance(val, int):
        return val
    if isinstance(val, str):
        if val.startswith("0x") or val.startswith("0X"):
            return int(val, 16)
        return int(val)
    return int(val)


def parse_bytes(val: Union[bytes, str]) -> bytes:
    if isinstance(val, bytes):
        return val
    if isinstance(val, str):
        if val.startswith("0x") or val.startswith("0X"):
            return bytes.fromhex(val[2:]) if len(val) > 2 else b""
        return bytes.fromhex(val) if len(val) > 0 else b""
    return b""


def format_user_op_tuple(user_op: Dict[str, Any]) -> tuple:
    return (
        Web3.to_checksum_address(user_op["sender"]),
        parse_int(user_op.get("nonce", 0)),
        parse_bytes(user_op.get("initCode", b"")),
        parse_bytes(user_op.get("callData", b"")),
        parse_int(user_op.get("callGasLimit", 150000)),
        parse_int(user_op.get("verificationGasLimit", 200000)),
        parse_int(user_op.get("preVerificationGas", 50000)),
        parse_int(user_op.get("maxFeePerGas", 2000000000)),
        parse_int(user_op.get("maxPriorityFeePerGas", 1000000000)),
        parse_bytes(user_op.get("paymasterAndData", b"")),
        parse_bytes(user_op.get("signature", b"")),
    )


@app.get("/health")
def health():
    w3 = get_web3()
    connected = w3.is_connected()
    return {"status": "ok", "anvil_connected": connected, "cached_receipts": len(user_op_receipts)}


@app.get("/status")
def status():
    try:
        ep_contract, ep_addr, deployments = load_entry_point()
        return {
            "status": "online",
            "entryPoint": ep_addr,
            "bastionAccount": deployments.get("bastionAccount"),
            "mockToken": deployments.get("mockToken"),
            "cached_receipts_count": len(user_op_receipts),
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


@app.post("/")
async def rpc_endpoint(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}})

    req_id = payload.get("id")
    method = payload.get("method")
    params = payload.get("params", [])

    logger.info(f"Received RPC method: {method}")

    try:
        if method == "eth_supportedEntryPoints":
            _, ep_addr, _ = load_entry_point()
            return {"jsonrpc": "2.0", "id": req_id, "result": [ep_addr]}

        elif method == "eth_estimateUserOperationGas":
            # Return conservative gas limits
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "preVerificationGas": hex(50000),
                    "verificationGasLimit": hex(300000),
                    "callGasLimit": hex(350000),
                },
            }

        elif method == "eth_sendUserOperation":
            if len(params) < 2:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32602, "message": "Invalid params: expected [userOp, entryPoint]"},
                }

            user_op_dict = params[0]
            req_entry_point = params[1]

            ep_contract, ep_addr, deployments = load_entry_point()
            if Web3.to_checksum_address(req_entry_point) != Web3.to_checksum_address(ep_addr):
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32602, "message": f"EntryPoint {req_entry_point} not supported. Use {ep_addr}"},
                }

            user_op_tuple = format_user_op_tuple(user_op_dict)

            w3 = get_web3()
            bundler_account = Account.from_key(BUNDLER_KEY)
            beneficiary = deployments.get("bundlerBeneficiary", bundler_account.address)

            # Compute official UserOperation hash
            user_op_hash_bytes = ep_contract.functions.getUserOpHash(user_op_tuple).call()
            user_op_hash_hex = "0x" + user_op_hash_bytes.hex()
            logger.info(f"Processing UserOpHash: {user_op_hash_hex} for sender {user_op_tuple[0]}")

            # Submit handleOps transaction to EntryPoint on Anvil
            tx_data = ep_contract.functions.handleOps([user_op_tuple], beneficiary).build_transaction({
                "from": bundler_account.address,
                "nonce": w3.eth.get_transaction_count(bundler_account.address),
                "gas": 3000000,
                "gasPrice": w3.to_wei(2, "gwei"),
                "chainId": w3.eth.chain_id,
            })

            signed_tx = w3.eth.account.sign_transaction(tx_data, private_key=BUNDLER_KEY)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            logger.info(f"handleOps transaction submitted: {tx_hash.hex()}")

            # Wait for real Anvil transaction receipt
            tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            logger.info(f"Transaction mined in block {tx_receipt.blockNumber}, status={tx_receipt.status}")

            # Extract UserOperationEvent log
            success = False
            actual_gas_cost = 0
            actual_gas_used = 0
            revert_reason = ""

            for log in tx_receipt.logs:
                topic0 = log.topics[0].hex() if isinstance(log.topics[0], bytes) else log.topics[0]
                if not topic0.startswith("0x"):
                    topic0 = "0x" + topic0

                if topic0.lower() == USER_OP_EVENT_TOPIC.lower():
                    try:
                        parsed = ep_contract.events.UserOperationEvent().process_log(log)
                        op_hash_bytes = parsed["args"]["userOpHash"]
                        event_op_hash = "0x" + op_hash_bytes.hex() if isinstance(op_hash_bytes, bytes) else str(op_hash_bytes)
                        if event_op_hash.lower() == user_op_hash_hex.lower():
                            success = bool(parsed["args"]["success"])
                            actual_gas_cost = int(parsed["args"]["actualGasCost"])
                            actual_gas_used = int(parsed["args"]["actualGasUsed"])
                            logger.info(f"Found UserOperationEvent: success={success}, gasUsed={actual_gas_used}")
                            break
                    except Exception as err:
                        logger.warning(f"Error parsing UserOperationEvent: {err}")

                elif topic0.lower() == USER_OP_REVERT_TOPIC.lower():
                    revert_reason = "UserOperationRevertReason encountered"
                    logger.warning("UserOperationRevertReason emitted by EntryPoint")

            # Format ERC-4337 receipt
            formatted_receipt = {
                "userOpHash": user_op_hash_hex,
                "sender": user_op_tuple[0],
                "nonce": hex(user_op_tuple[1]),
                "actualGasCost": hex(actual_gas_cost),
                "actualGasUsed": hex(actual_gas_used),
                "success": success,
                "revertReason": revert_reason,
                "receipt": {
                    "transactionHash": tx_receipt.transactionHash.hex(),
                    "transactionIndex": hex(tx_receipt.transactionIndex),
                    "blockHash": tx_receipt.blockHash.hex(),
                    "blockNumber": hex(tx_receipt.blockNumber),
                    "from": tx_receipt["from"],
                    "to": tx_receipt["to"],
                    "cumulativeGasUsed": hex(tx_receipt.cumulativeGasUsed),
                    "gasUsed": hex(tx_receipt.gasUsed),
                    "contractAddress": tx_receipt.contractAddress,
                    "status": hex(tx_receipt.status),
                },
            }

            user_op_receipts[user_op_hash_hex.lower()] = formatted_receipt

            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": user_op_hash_hex,
            }

        elif method == "eth_getUserOperationReceipt":
            if len(params) < 1:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32602, "message": "Expected [userOpHash]"},
                }
            user_op_hash = params[0].lower()
            receipt = user_op_receipts.get(user_op_hash)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": receipt,
            }

        else:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Method {method} not supported"},
            }

    except Exception as e:
        logger.error(f"Error handling RPC method {method}: {e}", exc_info=True)
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32000, "message": str(e)},
        }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000, log_level="info")
