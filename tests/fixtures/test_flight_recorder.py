"""
Test Suite: Verifiable Forensic Flight Recorder (Objective 4)
Validates SHA-256 hash chaining, tamper detection (edits, deletions, reordering),
independent checkpoint verification, privacy sanitization, and report generation.
"""

import os
import copy
import pytest
from services.api.src.evidence.flight_recorder import (
    FlightRecorder,
    GENESIS_HASH,
)


@pytest.fixture
def recorder():
    rec = FlightRecorder(node_id="laptop-a-main")
    # Record events across the 4 required categories
    # 1. AI Agent
    rec.record_event(
        event_source="AI_AGENT",
        correlation_id="corr-intent-101",
        event_type="agent.payment_requested",
        payload={
            "agent_request_id": "req-101",
            "prompt_content": "Please pay vendor 50 bUSD for server hosting",
            "proposed_amount": 50 * 10**6,
            "target": "0x00000000000000000000000000000000000000aa",
        },
    )

    # 2. Physical Authorization
    rec.record_event(
        event_source="PHYSICAL_AUTH",
        correlation_id="corr-intent-101",
        event_type="device.rfid_scanned",
        payload={
            "device_id": "esp32-signer-1",
            "rfid_tier": "JUNIOR_EXCEPTION",
            "button_event": "GPIO33_PRESSED",
        },
    )

    # 3. Wallet
    rec.record_event(
        event_source="WALLET",
        correlation_id="corr-intent-101",
        event_type="wallet.userop_executed",
        payload={
            "wallet_address": "0x00000000000000000000000000000000000000bb",
            "user_op_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            "tx_hash": "0xfeeeddccbbaa99887766554433221100feeeddccbbaa99887766554433221100",
            "execution_status": "SUCCESS",
        },
    )

    # 4. Incident Response
    rec.record_event(
        event_source="INCIDENT_RESPONSE",
        correlation_id="corr-incident-202",
        event_type="incident.panic_triggered",
        payload={
            "origin": "ESP32_GPIO32_PANIC",
            "local_state": "PANIC_LOCAL",
            "chain_state": "REVOKE_CONFIRMED",
        },
    )
    return rec


def test_original_flight_recorder_log_verifies_successfully(recorder):
    """Original untampered event log must pass cryptographic verification."""
    valid, msg, broken_idx = recorder.verify_event_chain(recorder.events)
    assert valid is True
    assert broken_idx is None
    assert "All events cryptographically verified" in msg
    assert len(recorder.events) == 4


def test_modified_log_entry_fails_verification(recorder):
    """Modifying a single field in an entry must break hash verification."""
    tampered_events = copy.deepcopy(recorder.events)
    # Attacker tries to alter proposed_amount in event 0
    tampered_events[0].sanitized_payload["proposed_amount"] = 500 * 10**6

    valid, msg, broken_idx = recorder.verify_event_chain(tampered_events)
    assert valid is False
    assert broken_idx == 0
    assert "Tampered content at index 0" in msg


def test_deleted_log_entry_is_detected(recorder):
    """Deleting an event in the chain breaks previous_hash linkage."""
    tampered_events = copy.deepcopy(recorder.events)
    # Delete event at index 1
    del tampered_events[1]

    valid, msg, broken_idx = recorder.verify_event_chain(tampered_events)
    assert valid is False
    assert broken_idx == 1
    assert "Broken link at index 1" in msg


def test_reordered_events_are_detected(recorder):
    """Swapping the order of two events breaks previous_hash linkage."""
    tampered_events = copy.deepcopy(recorder.events)
    # Swap event 1 and 2
    tampered_events[1], tampered_events[2] = tampered_events[2], tampered_events[1]

    valid, msg, broken_idx = recorder.verify_event_chain(tampered_events)
    assert valid is False
    assert broken_idx is not None


def test_independent_checkpoint_verification(recorder):
    """Saving an independent checkpoint on Laptop B and verifying against it."""
    # Checkpoint after 4 events
    cp = recorder.create_checkpoint("checkpoint-block-100")
    assert cp["event_count"] == 4

    # Verification passes
    valid, msg = recorder.verify_against_checkpoint(cp)
    assert valid is True

    # If log is truncated (missing events)
    truncated_rec = FlightRecorder()
    truncated_rec.events = recorder.events[:2]  # Only 2 events
    valid, msg = truncated_rec.verify_against_checkpoint(cp)
    assert valid is False
    assert "Missing events" in msg

    # Wrong checkpoint tip hash is rejected
    tampered_cp = copy.deepcopy(cp)
    tampered_cp["tip_event_hash"] = "0x" + "9" * 64
    valid, msg = recorder.verify_against_checkpoint(tampered_cp)
    assert valid is False
    assert "Tip hash mismatch" in msg


def test_privacy_sanitizer_redacts_secrets_and_hashes_prompts():
    """Privacy test: secrets are redacted, prompts replaced with sha256 digests, no raw keys stored."""
    rec = FlightRecorder()
    evt = rec.record_event(
        event_source="AI_AGENT",
        correlation_id="privacy-test",
        event_type="test.privacy",
        payload={
            "private_key": "0x12345678",
            "admin_secret": "my-secret-token",
            "prompt_content": "Secret user query about finances",
            "public_recipient": "0x00000000000000000000000000000000000000cc",
        },
    )

    payload = evt.sanitized_payload
    assert payload["private_key"] == "[REDACTED_SECRET]"
    assert payload["admin_secret"] == "[REDACTED_SECRET]"
    assert "prompt_content" not in payload
    assert "sha256:" in payload["prompt_digest"]
    assert payload["public_recipient"] == "0x00000000000000000000000000000000000000cc"


def test_export_incident_report_json_and_pdf(recorder, tmp_path):
    """Test exporting structured JSON report and PDF bundle."""
    # 1. JSON Report
    json_report = recorder.export_incident_report_json("corr-intent-101")
    assert json_report["correlation_id"] == "corr-intent-101"
    assert json_report["total_events"] == 3
    assert json_report["chain_integrity"] is True

    # 2. PDF Report
    pdf_path = os.path.join(str(tmp_path), "incident_report.pdf")
    res_path = recorder.export_incident_report_pdf("corr-intent-101", pdf_path)
    assert os.path.exists(res_path)
    assert os.path.getsize(res_path) > 1000
