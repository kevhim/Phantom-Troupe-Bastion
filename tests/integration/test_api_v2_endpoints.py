"""
Integration Test Suite: FastAPI v2 Endpoints (P0/P1 Integration)
Validates end-to-end payment intent handling, hardware disconnects,
forensic audit chain verification, and Mirage synthetic data retrieval.
"""

import pytest
from starlette.testclient import TestClient
from services.api.src.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ONLINE"


def test_overview_endpoint():
    response = client.get("/api/v2/overview")
    assert response.status_code == 200
    data = response.json()
    assert "smart_account" in data
    assert "hardware_health" in data
    assert data["hardware_health"]["overall_state"] == "HEALTHY"


def test_in_policy_payment_execution():
    payload = {
        "recipient": "0x00000000000000000000000000000000000000cc",
        "amount": 25 * 10**6,  # 25 bUSD (<= 50 max_per_tx)
        "order_id": "ord-integration-01",
        "prompt_context": "Test automated payment",
    }
    response = client.post("/api/v2/payments/request", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "EXECUTED_IN_POLICY"


def test_out_of_policy_payment_queues_for_physical_review():
    payload = {
        "recipient": "0x00000000000000000000000000000000000000cc",
        "amount": 250 * 10**6,  # 250 bUSD (> 50 max_per_tx)
        "order_id": "ord-integration-02",
        "prompt_context": "Large purchase requiring physical review",
    }
    response = client.post("/api/v2/payments/request", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "QUEUED_FOR_PHYSICAL_REVIEW"
    assert "canonical_intent" in data
    assert data["approval_tier"] == "JUNIOR_EXCEPTION"


def test_hardware_health_disconnect_and_recovery():
    # 1. Disconnect ESP32 signer
    res = client.post("/api/v2/hardware/disconnect", json={"component": "esp32_signer", "reason": "Test disconnect"})
    assert res.status_code == 200
    assert res.json()["overall_state"] == "APPROVAL_LOCKED"

    # 2. Check health status reflects APPROVAL_LOCKED
    res = client.get("/api/v2/hardware/health")
    assert res.json()["is_approval_locked"] is True

    # 3. New payment requiring review must be rejected
    payload = {
        "recipient": "0x00000000000000000000000000000000000000cc",
        "amount": 300 * 10**6,
        "order_id": "ord-fail-closed",
    }
    res = client.post("/api/v2/payments/request", json=payload)
    assert res.status_code == 403
    assert "hardware approval unavailable" in res.json()["detail"].lower()

    # 4. Reconnect component (enters RECOVERY_REQUIRED)
    res = client.post("/api/v2/hardware/reconnect", json={"component": "esp32_signer"})
    assert res.status_code == 200

    # 5. Supervisor explicit recovery restores HEALTHY
    res = client.post(
        "/api/v2/hardware/recovery",
        json={"supervisor_token": "SUPERVISOR_AUTHORIZED_RECOVERY_KEY", "reason": "Test recovery completed"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"


def test_evidence_verification_and_export():
    res = client.get("/api/v2/evidence/verify")
    assert res.status_code == 200
    assert res.json()["is_valid"] is True

    res = client.get("/api/v2/evidence/export/json?correlation_id=*")
    assert res.status_code == 200
    assert res.json()["chain_integrity"] is True
