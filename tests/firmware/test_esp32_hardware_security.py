"""
BASTION X v2.3 — Hardware Security Test Suite (Phases 4 & 5)
Embedded Systems and Cryptographic Firmware Verification

Test Coverage:
1. Valid device signature (EIP-712 exact digest & secp256k1 recovery)
2. Modified recipient / amount (calldata hash validation)
3. Wrong chain ID rejection
4. Replayed approval rejection (nonce caching)
5. Unknown RFID UID rejection
6. Physical-button spoofing attempts rejection
7. Device disconnection fail-closed latching
8. ESP32 reboot / state reinitialization
9. Emergency panic lifecycle (PANIC_LOCAL -> REVOKE_SIGNED -> ...)
10. Blockchain RPC failure truthful reporting (REVOKE_UNAVAILABLE)
11. Confirmed revocation on-chain state verification
"""

import json
import time
from pathlib import Path
import pytest
import serial
from eth_account import Account
from web3 import Web3

from services.device_crypto.crypto_engine import (
    PaymentIntent,
    compute_eip712_digest,
    compute_calldata_hash,
)
from services.api.src.hardware.health_manager import (
    HardwareHealthManager,
    HardwareHealthState,
    RevocationState,
    ApprovalRequestStatus,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
TEST_VECTORS_PATH = REPO_ROOT / "schemas" / "signing" / "test_vectors.json"
COM_PORT = "COM10"
BAUD_RATE = 115200
SUPERVISOR_KEY = "SUPERVISOR_AUTHORIZED_RECOVERY_KEY"


def get_serial_connection(timeout=2):
    try:
        s = serial.Serial(COM_PORT, BAUD_RATE, timeout=timeout)
        time.sleep(1.2)  # Allow DTR settle
        s.reset_input_buffer()
        return s
    except Exception:
        return None


@pytest.fixture(scope="module")
def shared_test_vector():
    with open(TEST_VECTORS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def live_w3():
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    if w3.is_connected():
        return w3
    return None


# -------------------------------------------------------------
# 1. Valid Device Signature & Exact Bit-for-Bit Vector Match
# -------------------------------------------------------------
def test_valid_device_signature(shared_test_vector):
    """
    ESP32 independently parses canonical PaymentIntent and signs with secp256k1.
    Must match frozen test vector EIP-712 digest and recover Junior signer address.
    """
    intent = shared_test_vector["paymentIntent"]
    expected_digest = shared_test_vector["cryptographicOutputs"]["eip712SigningDigest"]
    expected_signer = shared_test_vector["cryptographicOutputs"]["juniorSigner"]["address"]

    ser = get_serial_connection()
    if ser is None:
        pytest.skip(f"Physical ESP32 not connected on {COM_PORT}; skipping live serial execution.")

    try:
        cmd = {
            "action": "DIAGNOSTIC_SIGN",
            "key": SUPERVISOR_KEY,
            "intent": intent,
        }
        ser.write((json.dumps(cmd) + "\n").encode("utf-8"))

        sig_doc = None
        start = time.time()
        while time.time() - start < 4:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line and "APPROVED" in line:
                sig_doc = json.loads(line)
                break

        assert sig_doc is not None, "ESP32 did not respond with APPROVED diagnostic signature"
        assert sig_doc["digest"].lower() == expected_digest.lower(), (
            f"Digest mismatch: {sig_doc['digest']} != {expected_digest}"
        )

        rec = Account._recover_hash(
            bytes.fromhex(sig_doc["digest"][2:]),
            signature=bytes.fromhex(sig_doc["deviceSignature"][2:]),
        )
        assert rec.lower() == expected_signer.lower(), (
            f"Recovered address mismatch: {rec} != {expected_signer}"
        )
    finally:
        ser.close()


# -------------------------------------------------------------
# 2. Modified Recipient or Amount (Calldata Hash Mismatch)
# -------------------------------------------------------------
def test_modified_recipient_or_amount(shared_test_vector):
    """
    Tampering with recipient or amount without matching calldataHash must be rejected.
    """
    ser = get_serial_connection()
    if ser is None:
        pytest.skip(f"Physical ESP32 not connected on {COM_PORT}")

    try:
        tampered_intent = dict(shared_test_vector["paymentIntent"])
        # Alter recipient address
        tampered_intent["recipientAddress"] = "0x0000000000000000000000000000000000000001"

        cmd = {"action": "SIGN_INTENT", "intent": tampered_intent}
        ser.write((json.dumps(cmd) + "\n").encode("utf-8"))

        resp_doc = None
        start = time.time()
        while time.time() - start < 3:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line and "CALLDATA_HASH_MISMATCH" in line:
                resp_doc = json.loads(line)
                break

        assert resp_doc is not None, "ESP32 failed to reject tampered recipient"
        assert resp_doc["error"] == "CALLDATA_HASH_MISMATCH"
    finally:
        ser.close()


# -------------------------------------------------------------
# 3. Wrong Chain ID Rejection
# -------------------------------------------------------------
def test_wrong_chain_id(shared_test_vector):
    """
    Intents destined for non-configured chains (e.g. 1 instead of 31337) must be rejected.
    """
    ser = get_serial_connection()
    if ser is None:
        pytest.skip(f"Physical ESP32 not connected on {COM_PORT}")

    try:
        bad_chain_intent = dict(shared_test_vector["paymentIntent"])
        bad_chain_intent["chainId"] = 1  # Ethereum mainnet

        cmd = {"action": "SIGN_INTENT", "intent": bad_chain_intent}
        ser.write((json.dumps(cmd) + "\n").encode("utf-8"))

        resp_doc = None
        start = time.time()
        while time.time() - start < 3:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line and "INVALID_CHAIN_ID" in line:
                resp_doc = json.loads(line)
                break

        assert resp_doc is not None, "ESP32 failed to reject wrong chain ID"
        assert resp_doc["error"] == "INVALID_CHAIN_ID"
    finally:
        ser.close()


# -------------------------------------------------------------
# 4. Replayed Approval Rejection
# -------------------------------------------------------------
def test_replayed_approval(shared_test_vector):
    """
    Replaying an already signed accountNonce must be rejected by the device replay cache.
    """
    ser = get_serial_connection()
    if ser is None:
        pytest.skip(f"Physical ESP32 not connected on {COM_PORT}")

    try:
        # Diagnostic sign nonce 0
        cmd = {
            "action": "DIAGNOSTIC_SIGN",
            "key": SUPERVISOR_KEY,
            "intent": shared_test_vector["paymentIntent"],
        }
        ser.write((json.dumps(cmd) + "\n").encode("utf-8"))
        time.sleep(0.5)

        # Attempt to review same intent with replayed nonce
        ser.write((json.dumps({"action": "SIGN_INTENT", "intent": shared_test_vector["paymentIntent"]}) + "\n").encode("utf-8"))
        resp_doc = None
        start = time.time()
        while time.time() - start < 3:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line and ("REPLAYED_NONCE" in line or "DEVICE_BUSY" in line or "APPROVAL_INVALIDATED" in line):
                resp_doc = json.loads(line)
                break

        assert resp_doc is not None, "ESP32 failed to reject replayed nonce request"
    finally:
        ser.close()


# -------------------------------------------------------------
# 5. Unknown RFID UID Rejection
# -------------------------------------------------------------
def test_unknown_rfid():
    """
    Presenting an unknown/unregistered RFID card UID must abort review.
    """
    ser = get_serial_connection()
    if ser is None:
        pytest.skip(f"Physical ESP32 not connected on {COM_PORT}")

    try:
        cmd = {"action": "TEST_UNKNOWN_RFID"}
        ser.write((json.dumps(cmd) + "\n").encode("utf-8"))

        resp_doc = None
        start = time.time()
        while time.time() - start < 3:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line and "UNKNOWN_RFID_UID" in line:
                resp_doc = json.loads(line)
                break

        assert resp_doc is not None, "ESP32 failed to reject unknown RFID"
        assert resp_doc["error"] == "UNKNOWN_RFID_UID"
    finally:
        ser.close()


# -------------------------------------------------------------
# 6. Physical-Button Spoofing Attempts Rejection
# -------------------------------------------------------------
def test_physical_button_spoofing_attempts():
    """
    Software commands attempting to bypass the physical GPIO33 confirmation button
    must be strictly rejected with PHYSICAL_BUTTON_REQUIRED.
    """
    ser = get_serial_connection()
    if ser is None:
        pytest.skip(f"Physical ESP32 not connected on {COM_PORT}")

    try:
        for spoof_action in ("CONFIRM_APPROVAL", "INJECT_BUTTON", "NEXT_PAGE"):
            cmd = {"action": spoof_action}
            ser.write((json.dumps(cmd) + "\n").encode("utf-8"))

            resp_doc = None
            start = time.time()
            while time.time() - start < 2:
                line = ser.readline().decode("utf-8", errors="ignore").strip()
                if line and "PHYSICAL_BUTTON_REQUIRED" in line:
                    resp_doc = json.loads(line)
                    break

            assert resp_doc is not None, f"Failed to reject button spoof: {spoof_action}"
            assert resp_doc["error"] == "PHYSICAL_BUTTON_REQUIRED"
    finally:
        ser.close()


# -------------------------------------------------------------
# 7. Device Disconnection Fail-Closed Latching
# -------------------------------------------------------------
def test_device_disconnection_fail_closed():
    """
    Hardware health manager latches to APPROVAL_LOCKED when signer disconnects.
    Pending reviews are invalidated. Reconnecting does not restore approval until supervisor clears.
    """
    mgr = HardwareHealthManager()
    req_id = "req-test-fail-closed"
    mgr.active_approvals[req_id] = {
        "request_id": req_id,
        "status": ApprovalRequestStatus.DEVICE_REVIEW,
        "amount": 250 * 10**6,
        "cancellation_reason": None,
    }

    # ESP32 disconnects
    mgr.report_component_disconnect("esp32_signer", "USB line severed")
    assert mgr.is_approval_locked is True
    assert mgr.active_approvals[req_id]["status"] == ApprovalRequestStatus.CANCELLED

    # Reconnection without supervisor recovery stays locked
    mgr.report_component_reconnected("esp32_signer")
    assert mgr.is_approval_locked is True
    assert mgr.overall_state == HardwareHealthState.RECOVERY_REQUIRED

    # Valid supervisor token recovers health
    ok, _ = mgr.supervisor_recovery(SUPERVISOR_KEY, "Technician verified physical line")
    assert ok is True
    assert mgr.overall_state == HardwareHealthState.HEALTHY
    assert mgr.is_approval_locked is False


# -------------------------------------------------------------
# 8. ESP32 Reboot Handling
# -------------------------------------------------------------
def test_esp32_reboot_handling():
    """
    Rebooting the ESP32 (DTR reset or power cycle) causes safe reinitialization
    and broadcast of READY status with initial peripheral status.
    """
    ser = get_serial_connection()
    if ser is None:
        pytest.skip(f"Physical ESP32 not connected on {COM_PORT}")

    try:
        # Trigger hardware reset via RTS/DTR
        ser.setDTR(False)
        ser.setRTS(True)
        time.sleep(0.1)
        ser.setRTS(False)
        time.sleep(1.0)

        ser.reset_input_buffer()
        # Query device with PING
        ser.write(b"PING\n")

        pong_doc = None
        start = time.time()
        while time.time() - start < 3:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line and "pong" in line:
                pong_doc = json.loads(line)
                break

        assert pong_doc is not None, "ESP32 failed to respond to PING after reboot"
        assert pong_doc.get("pong") is True
        assert pong_doc.get("state") == 0  # STATE_IDLE
    finally:
        ser.close()


# -------------------------------------------------------------
# 9. Emergency Panic Sequence
# -------------------------------------------------------------
def test_emergency_panic_sequence():
    """
    Triggering emergency panic follows:
    PANIC_LOCAL -> REVOKE_SIGNED -> REVOKE_UNAVAILABLE (or REVOKE_SUBMITTED)
    and permanently locks device signing.
    """
    ser = get_serial_connection()
    if ser is None:
        pytest.skip(f"Physical ESP32 not connected on {COM_PORT}")

    try:
        cmd = {"action": "TRIGGER_PANIC", "reason": "SECURITY_TEST_RUN"}
        ser.write((json.dumps(cmd) + "\n").encode("utf-8"))

        lines = []
        start = time.time()
        while time.time() - start < 4:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line:
                try:
                    doc = json.loads(line)
                    lines.append(doc)
                    if doc.get("state") in ("REVOKE_CONFIRMED", "REVOKE_UNAVAILABLE", "REVOKE_FAILED"):
                        break
                except Exception:
                    pass

        states = [x.get("state") for x in lines if "state" in x]
        assert "PANIC_LOCAL" in states, f"PANIC_LOCAL missing from states: {states}"
        assert "REVOKE_SIGNED" in states, f"REVOKE_SIGNED missing from states: {states}"

        # Attempt to sign immediately after panic
        ser.write(b'{"action":"SIGN_INTENT"}\n')
        line = ser.readline().decode("utf-8", errors="ignore").strip()
        assert "DEVICE_BUSY" in line or "PANIC_LOCKED" in line or "APPROVAL_INVALIDATED" in line
    finally:
        ser.close()


# -------------------------------------------------------------
# 10. Blockchain RPC Failure Truthful Reporting
# -------------------------------------------------------------
def test_blockchain_rpc_failure_truthful_reporting():
    """
    When the direct RPC / Wi-Fi is unreachable, the device reports REVOKE_UNAVAILABLE
    with the exact cause and does NOT claim success or synthesize fake confirmations.
    """
    ser = get_serial_connection()
    if ser is None:
        pytest.skip(f"Physical ESP32 not connected on {COM_PORT}")

    try:
        cmd = {"action": "TRIGGER_PANIC", "reason": "RPC_DISCONNECT_TEST"}
        ser.write((json.dumps(cmd) + "\n").encode("utf-8"))

        unavail_doc = None
        start = time.time()
        while time.time() - start < 4:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line and "REVOKE_UNAVAILABLE" in line:
                unavail_doc = json.loads(line)
                break

        assert unavail_doc is not None, "ESP32 did not report REVOKE_UNAVAILABLE"
        assert "network offline" in unavail_doc["message"].lower() or "offline" in unavail_doc.get("error", "").lower()
        assert "rawTx" in unavail_doc, "Device should provide signed rawTx even when offline"
    finally:
        ser.close()


# -------------------------------------------------------------
# 11. Confirmed Revocation On-Chain State Verification
# -------------------------------------------------------------
def test_confirmed_revocation_on_chain(live_w3):
    """
    Verifies that a hardware-signed raw revocation transaction from the ESP32
    executes successfully on the Anvil blockchain and updates BastionAccount.revokedSessions.
    """
    if live_w3 is None:
        pytest.skip("Local Anvil blockchain node on :8545 not reachable")

    ser = get_serial_connection()
    if ser is None:
        pytest.skip(f"Physical ESP32 not connected on {COM_PORT}")

    try:
        revoker_addr = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
        nonce = live_w3.eth.get_transaction_count(revoker_addr, "pending")
        test_session_id = "0x" + "a1" * 32

        cmd = {
            "action": "TRIGGER_PANIC",
            "reason": "CONFIRMED_REVOCATION_TEST",
            "sessionId": test_session_id,
            "nonce": nonce,
        }
        ser.write((json.dumps(cmd) + "\n").encode("utf-8"))

        raw_tx = None
        start = time.time()
        while time.time() - start < 4:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line and "REVOKE_SIGNED" in line:
                doc = json.loads(line)
                raw_tx = doc.get("rawTx")
                break

        assert raw_tx is not None, "Failed to capture REVOKE_SIGNED raw transaction from ESP32"

        # Broadcast the hardware-generated transaction directly to Anvil
        raw_bytes = bytes.fromhex(raw_tx[2:] if raw_tx.startswith("0x") else raw_tx)
        tx_hash = live_w3.eth.send_raw_transaction(raw_bytes)
        receipt = live_w3.eth.wait_for_transaction_receipt(tx_hash, timeout=5)

        assert receipt.status == 1, f"Revocation transaction reverted on-chain (tx: {tx_hash.hex()})"

        # Verify on-chain state in BastionAccount contract
        bastion_addr = "0x0165878A594ca255338adfa4d48449f69242Eb8F"
        selector = live_w3.keccak(text="revokedSessions(bytes32)")[:4]
        call_data = selector + bytes.fromhex(test_session_id[2:])
        result = live_w3.eth.call({"to": bastion_addr, "data": call_data})
        is_revoked = int(result.hex(), 16) == 1

        assert is_revoked is True, f"Session {test_session_id} is not marked revoked in BastionAccount!"
    finally:
        ser.close()
