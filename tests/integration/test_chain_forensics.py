"""
BASTION X v2.3 — Fast Track Phases 3 + 7 Integration & Failure Test Suite
Comprehensive verification of genuine blockchain execution, database persistence,
and Security Flight Recorder forensics.

Covers all 10 mandatory failure, outage, and cryptographic integrity tests:
1. Authorized payment receipt (INCLUDED_SUCCESS)
2. Rejected UserOperation (BUNDLER_REJECTED)
3. Bundler outage (graceful failure, status UNKNOWN/BUNDLER_REJECTED)
4. RPC outage (graceful failure, status UNKNOWN)
5. Missing receipt (timeout handling, status UNKNOWN)
6. Transaction revert (INCLUDED_REVERTED)
7. Duplicate hardware event (replay protection, HTTP 409)
8. Corrupted audit entry (cryptographic chain failure)
9. Deleted/reordered log events (broken linkage detection)
10. Incorrect integrity checkpoint (tip hash mismatch rejection)
"""

import copy
import json
import os
import time
import uuid
from pathlib import Path
from unittest.mock import patch

import pytest
from eth_account import Account
from starlette.testclient import TestClient
from web3 import Web3

from services.api.src.blockchain import BlockchainClient, blockchain_client
from services.api.src.database import (
    SessionLocal,
    PaymentIntentRecord,
    UserOperationRecord,
    HardwareEventRecord,
    AuditEntryRecord,
    IntegrityCheckpointRecord,
    init_db,
)
from services.api.src.evidence.flight_recorder import FlightRecorder, GENESIS_HASH, compute_event_hash
from services.api.src.main import app

client = TestClient(app)
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DEPLOYMENTS_FILE = REPO_ROOT / "contracts" / "deployments.json"

with open(DEPLOYMENTS_FILE) as f:
    deployments = json.load(f)

ALLOWED_VENDOR = deployments["allowedVendor"]
MOCK_TOKEN = deployments["mockToken"]
BASTION_ACCOUNT = deployments["bastionAccount"]
ENTRY_POINT = deployments["entryPoint"]


@pytest.fixture(autouse=True)
def ensure_database():
    init_db()


def ensure_anvil_daily_quota(required_busd: float = 20.0):
    """Ensures Anvil's block time has sufficient remaining daily spending quota and active state."""
    if blockchain_client.is_connected():
        w3 = blockchain_client.w3
        w3.provider.make_request("evm_increaseTime", [86400])
        w3.provider.make_request("evm_mine", [])
        blockchain_client.unfreeze_session_on_chain()


# -------------------------------------------------------------
# Test 1: Authorized payment receipt (INCLUDED_SUCCESS)
# -------------------------------------------------------------
def test_1_authorized_payment_receipt():
    """Agent submits valid payment; verifies genuine on-chain mining and INCLUDED_SUCCESS."""
    ensure_anvil_daily_quota(15.0)

    order_id = f"ORD-AUTH-{int(time.time())}-{uuid.uuid4().hex[:4].upper()}"
    amount_base_units = 15 * 10**6  # 15 bUSD

    payload = {
        "recipient": ALLOWED_VENDOR,
        "amount": amount_base_units,
        "order_id": order_id,
        "prompt_context": "Authorized procurement of cloud GPU credits",
    }

    resp = client.post("/api/v2/payments/request", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "INCLUDED_SUCCESS"
    assert data["order_id"] == order_id
    assert data["tx_hash"] is not None
    assert data["userop_hash"] is not None
    assert data["block_number"] is not None

    # Verify transaction on live Anvil blockchain
    w3 = blockchain_client.w3
    tx_receipt = w3.eth.get_transaction_receipt(data["tx_hash"])
    assert tx_receipt is not None
    assert tx_receipt.status == 1

    # Verify Database persistence
    db = SessionLocal()
    try:
        p_intent = db.query(PaymentIntentRecord).filter_by(order_id=order_id).first()
        assert p_intent is not None
        assert p_intent.status == "INCLUDED_SUCCESS"
        assert p_intent.recipient_address.lower() == ALLOWED_VENDOR.lower()
        assert p_intent.amount_base_units == amount_base_units

        uop_record = db.query(UserOperationRecord).filter_by(order_id=order_id).first()
        assert uop_record is not None
        assert uop_record.bundler_status == "INCLUDED_SUCCESS"
        assert uop_record.tx_hash == data["tx_hash"]
        assert uop_record.execution_success is True
    finally:
        db.close()


# -------------------------------------------------------------
# Test 2: Rejected UserOperation
# -------------------------------------------------------------
def test_2_rejected_user_operation():
    """Simulates bundler rejection of invalid UserOperation (e.g. signature error)."""
    order_id = f"ORD-REJECT-{int(time.time())}"

    # Mock bundler send_user_op to return a JSON-RPC bundler rejection
    with patch("services.api.src.blockchain.send_user_op") as mock_send:
        mock_send.side_effect = RuntimeError("AA24 signature error: invalid signature length")

        res = blockchain_client.submit_agent_payment_user_op(
            recipient=ALLOWED_VENDOR,
            amount=10 * 10**6,
            order_id=order_id,
        )

        assert res["status"] == "BUNDLER_REJECTED"
        assert "AA24 signature error" in res["revert_reason"]
        assert res["tx_hash"] is None


# -------------------------------------------------------------
# Test 3: Bundler outage
# -------------------------------------------------------------
def test_3_bundler_outage():
    """Simulates bundler network outage; verifies payment is never marked successful."""
    order_id = f"ORD-OUTAGE-BUNDLER-{int(time.time())}"

    # Point to an unreachable bundler port
    outage_client = BlockchainClient(bundler_url="http://127.0.0.1:9999")
    res = outage_client.submit_agent_payment_user_op(
        recipient=ALLOWED_VENDOR,
        amount=10 * 10**6,
        order_id=order_id,
    )

    assert res["status"] == "BUNDLER_REJECTED"
    assert res["tx_hash"] is None
    assert "rejected" in res["error"].lower() or "connect" in res["error"].lower()


# -------------------------------------------------------------
# Test 4: RPC outage
# -------------------------------------------------------------
def test_4_rpc_outage():
    """Simulates chain RPC disconnect; verifies graceful handling and status UNKNOWN."""
    order_id = f"ORD-OUTAGE-RPC-{int(time.time())}"

    # Point to unreachable RPC port
    offline_client = BlockchainClient(rpc_url="http://127.0.0.1:9998")
    assert offline_client.is_connected() is False

    res = offline_client.submit_agent_payment_user_op(
        recipient=ALLOWED_VENDOR,
        amount=10 * 10**6,
        order_id=order_id,
    )

    assert res["status"] == "UNKNOWN"
    assert "offline" in res["error"].lower()
    assert res["tx_hash"] is None


# -------------------------------------------------------------
# Test 5: Missing receipt (timeout)
# -------------------------------------------------------------
def test_5_missing_receipt_timeout():
    """UserOp submitted but receipt times out; verifies state is UNKNOWN and never successful."""
    order_id = f"ORD-TIMEOUT-{int(time.time())}"

    with patch("services.api.src.blockchain.wait_for_user_op_receipt") as mock_wait:
        mock_wait.side_effect = TimeoutError("UserOperation was not mined within timeout")

        res = blockchain_client.submit_agent_payment_user_op(
            recipient=ALLOWED_VENDOR,
            amount=5 * 10**6,
            order_id=order_id,
            timeout=1.0,
        )

        assert res["status"] == "UNKNOWN"
        assert "timed out" in res["error"]
        assert res["tx_hash"] is None


# -------------------------------------------------------------
# Test 6: Transaction revert
# -------------------------------------------------------------
def test_6_transaction_revert():
    """UserOp mined on-chain but inner execution reverted; verifies INCLUDED_REVERTED."""
    order_id = f"ORD-REVERT-{int(time.time())}"

    # Mock receipt retrieval returning success=False
    mock_reverted_receipt = {
        "success": False,
        "userOpHash": "0xreverted_op_hash_123",
        "revertReason": "Policy violation: Daily spend cap exceeded",
        "actualGasUsed": "0x1a2b3",
        "receipt": {
            "transactionHash": "0xreverted_tx_hash_456",
            "blockNumber": "0x12",
        },
    }

    with patch("services.api.src.blockchain.wait_for_user_op_receipt", return_value=mock_reverted_receipt):
        with patch("services.api.src.blockchain.send_user_op", return_value="0xreverted_op_hash_123"):
            res = blockchain_client.submit_agent_payment_user_op(
                recipient=ALLOWED_VENDOR,
                amount=50 * 10**6,
                order_id=order_id,
            )

            assert res["status"] == "INCLUDED_REVERTED"
            assert res["revert_reason"] == "Policy violation: Daily spend cap exceeded"
            assert res["tx_hash"] == "0xreverted_tx_hash_456"


# -------------------------------------------------------------
# Test 7: Duplicate hardware event
# -------------------------------------------------------------
def test_7_duplicate_hardware_event():
    """Hardware event replay protection; duplicate counter or digest returns HTTP 409."""
    unique_counter = int(time.time()) % 1000000
    event_payload = {
        "node_id": "esp32_signer",
        "source_type": "BUTTON",
        "source_counter": unique_counter,
        "event_type": "PHYSICAL_CONFIRMATION",
        "payload": {"button": "GPIO33_GREEN", "rfid_tier": "JUNIOR"},
    }

    # First submission: Accepted
    resp1 = client.post("/api/v2/hardware/event", json=event_payload)
    assert resp1.status_code == 200
    assert resp1.json()["status"] == "ACCEPTED"

    # Replay identical event: Rejected with 409 Conflict
    resp2 = client.post("/api/v2/hardware/event", json=event_payload)
    assert resp2.status_code == 409
    assert "duplicate hardware event" in resp2.json()["detail"].lower()


# -------------------------------------------------------------
# Test 8: Corrupted audit entry
# -------------------------------------------------------------
def test_8_corrupted_audit_entry():
    """Tampering with an audit entry payload or hash is immediately detected."""
    rec = FlightRecorder(node_id="test-laptop-a", auto_persist_db=False)
    rec.record_event("AI_AGENT", "corr-1", "agent.payment_requested", {"amount": 100})
    rec.record_event("PHYSICAL_AUTH", "corr-1", "device.approved", {"tier": "JUNIOR"})
    rec.record_event("WALLET", "corr-1", "wallet.executed", {"tx": "0x123"})

    # Legitimate chain passes
    valid, msg, broken_idx = rec.verify_event_chain(rec.events)
    assert valid is True

    # Tamper with event 1 payload
    tampered = copy.deepcopy(rec.events)
    tampered[1].sanitized_payload["tier"] = "SENIOR_UNAUTHORIZED"

    valid, msg, broken_idx = rec.verify_event_chain(tampered)
    assert valid is False
    assert broken_idx == 1
    assert "Tampered content at index 1" in msg


# -------------------------------------------------------------
# Test 9: Deleted or reordered log events
# -------------------------------------------------------------
def test_9_deleted_and_reordered_log_events():
    """Deleting or swapping events breaks SHA-256 hash chaining."""
    rec = FlightRecorder(node_id="test-laptop-a", auto_persist_db=False)
    rec.record_event("AI_AGENT", "corr-a", "event.1", {"step": 1})
    rec.record_event("PHYSICAL_AUTH", "corr-a", "event.2", {"step": 2})
    rec.record_event("WALLET", "corr-a", "event.3", {"step": 3})
    rec.record_event("INCIDENT", "corr-a", "event.4", {"step": 4})

    # A. Test Deletion
    deleted_events = copy.deepcopy(rec.events)
    del deleted_events[2]  # Delete event at index 2

    valid, msg, broken_idx = rec.verify_event_chain(deleted_events)
    assert valid is False
    assert broken_idx == 2
    assert "Broken link at index 2" in msg

    # B. Test Reordering (Swap index 1 and 2)
    reordered_events = copy.deepcopy(rec.events)
    reordered_events[1], reordered_events[2] = reordered_events[2], reordered_events[1]

    valid, msg, broken_idx = rec.verify_event_chain(reordered_events)
    assert valid is False
    assert broken_idx is not None


# -------------------------------------------------------------
# Test 10: Incorrect integrity checkpoint
# -------------------------------------------------------------
def test_10_incorrect_integrity_checkpoint():
    """An adversary presenting a corrupted or mismatched checkpoint is rejected."""
    rec = FlightRecorder(node_id="test-laptop-a", auto_persist_db=False)
    rec.record_event("AI_AGENT", "corr-10", "intent.init", {"amt": 50})
    rec.record_event("WALLET", "corr-10", "wallet.mined", {"tx": "0xabc"})

    cp = rec.create_checkpoint("cp-valid-10", export_laptop_b=False)
    assert rec.verify_against_checkpoint(cp)[0] is True

    # 1. Tamper with tip hash
    bad_hash_cp = copy.deepcopy(cp)
    bad_hash_cp["tip_event_hash"] = "0x" + "f" * 64
    valid, msg = rec.verify_against_checkpoint(bad_hash_cp)
    assert valid is False
    assert "Tip hash mismatch" in msg

    # 2. Tamper with event count (claiming more events than exist)
    bad_count_cp = copy.deepcopy(cp)
    bad_count_cp["event_count"] = 999
    valid, msg = rec.verify_against_checkpoint(bad_count_cp)
    assert valid is False
    assert "Missing events" in msg
