"""LAN-facing local-chain RPC filter. Anvil itself binds loopback:18545.

For this demo only: rejects unlocked-account transactions and Anvil admin/time/
impersonation methods. It is not a production RPC security appliance.
"""
import os
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(title="Bastion read and signed-broadcast RPC")
UPSTREAM = os.getenv("ANVIL_INTERNAL_RPC_URL", "http://127.0.0.1:18545")
ALLOWED = frozenset({"eth_chainId", "eth_blockNumber", "eth_getBlockByNumber", "eth_getBlockByHash",
    "eth_getCode", "eth_call", "eth_getBalance", "eth_getTransactionCount", "eth_gasPrice",
    "eth_maxPriorityFeePerGas", "eth_feeHistory", "eth_estimateGas", "eth_sendRawTransaction",
    "eth_getTransactionReceipt", "eth_getTransactionByHash", "eth_getLogs", "net_version", "web3_clientVersion"})


def validate(payload):
    if not isinstance(payload, dict) or payload.get("jsonrpc") != "2.0":
        return {"jsonrpc": "2.0", "id": None, "error": {"code": -32600, "message": "Single JSON-RPC 2.0 request required"}}
    if payload.get("method") not in ALLOWED:
        return {"jsonrpc": "2.0", "id": payload.get("id"), "error": {"code": -32601, "message": "Method disabled at LAN boundary"}}
    if not isinstance(payload.get("params", []), list):
        return {"jsonrpc": "2.0", "id": payload.get("id"), "error": {"code": -32602, "message": "Positional params required"}}
    return None


@app.post("/")
async def rpc(request: Request):
    raw = await request.body()
    if len(raw) > 131072:
        return JSONResponse(status_code=413, content={"error": "Request too large"})
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})
    error = validate(payload)
    if error:
        return error
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(UPSTREAM, json=payload)
            response.raise_for_status()
            return response.json()
    except Exception:
        return {"jsonrpc": "2.0", "id": payload.get("id"), "error": {"code": -32000, "message": "Chain upstream unavailable"}}
