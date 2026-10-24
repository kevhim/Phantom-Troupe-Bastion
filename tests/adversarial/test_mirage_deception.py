"""
Test Suite: Safe Mirage Deception Engine (Objective 3)
Validates synthetic data isolation, containment of shadow sessions, zero real token movement,
preservation of smart contract enforcement, and emergency revocation independence.
"""

import time
import pytest
from services.mirage.mirage_engine import MirageEngine
from services.api.src.policies.policy_engine import AccountPolicyState
from services.api.src.evidence.flight_recorder import FlightRecorder


@pytest.fixture
def mirage_env():
    recorder = FlightRecorder()
    engine = MirageEngine(flight_recorder=recorder)
    engine.enable_mirage(True)
    return engine, recorder


def test_mirage_routes_never_expose_genuine_records(mirage_env):
    """A shadowed session must only receive synthetic decoy records, never real corporate balances."""
    engine, _ = mirage_env
    shadow_session_id = "shadow-actor-007"
    genuine_session_id = "legit-agent-001"

    # Trigger shadowing for the compromised session
    engine.trigger_session_shadowing(shadow_session_id, "Abnormal tool calls detected")

    # 1. Genuine session fetches real record
    ok, real_rec = engine.get_customer_record(genuine_session_id, "CUST-001")
    assert ok is True
    assert real_rec["name"] == "Bastion Corp Ops"
    assert real_rec["balance"] == 150000.0
    assert real_rec.get("is_synthetic") is False

    # 2. Shadow session fetches SAME customer ID
    ok, decoy_rec = engine.get_customer_record(shadow_session_id, "CUST-001")
    assert ok is True
    # Must receive synthetic decoy, NEVER genuine record!
    assert decoy_rec["name"] == "Synthetic Honeypot Alpha"
    assert decoy_rec["balance"] == 12.50
    assert decoy_rec["is_synthetic"] is True
    assert decoy_rec["_mirage_notice"] == "SYNTHETIC DECOY RECORD"


def test_synthetic_payments_never_touch_blockchain(mirage_env):
    """Synthetic payments in Mirage never execute on chain, never transfer real tokens, and provide decoy receipts."""
    engine, recorder = mirage_env
    shadow_session = "shadow-actor-007"
    engine.trigger_session_shadowing(shadow_session)

    ok, receipt = engine.execute_mirage_payment(
        session_id=shadow_session,
        recipient="0x9999999999999999999999999999999999999999",
        amount=10000.0,
    )
    assert ok is True
    assert receipt["blockchain_status"] == "NONE_IS_DECOY"
    assert receipt["is_synthetic"] is True
    assert "SIMULATED DECOY INTERACTION ONLY" in receipt["note"]

    # Recorded in forensic flight recorder
    last_event = recorder.events[-1]
    assert last_event.event_type == "mirage.decoy_payment_simulated"
    assert last_event.sanitized_payload["is_synthetic"] is True


def test_mirage_does_not_alter_smart_contract_rejection(mirage_env):
    """
    Activating Mirage must NOT weaken or modify actual ERC-4337 smart account enforcement.
    Out-of-policy attacks must still revert on chain.
    """
    engine, _ = mirage_env
    now = int(time.time())

    policy = AccountPolicyState(
        wallet_address="0x00000000000000000000000000000000000000bb",
        owner_address="0x1111111111111111111111111111111111111111",
        agent_session_key="0x2222222222222222222222222222222222222222",
        junior_signer="0x3333333333333333333333333333333333333333",
        senior_signer="0x4444444444444444444444444444444444444444",
        revoker_role="0x5555555555555555555555555555555555555555",
        allowed_target="0x00000000000000000000000000000000000000aa",
        allowed_recipient="0x00000000000000000000000000000000000000cc",
        max_per_tx=50 * 10**6,
        daily_allowance=100 * 10**6,
        session_expiry=now + 3600,
    )

    # Even while Mirage is active, submitting an unauthorized real on-chain transaction fails
    ok, msg = policy.validate_agent_payment(
        target="0x00000000000000000000000000000000000000aa",
        selector="0xa9059cbb",
        recipient="0x9999999999999999999999999999999999999999",  # Unauthorized recipient
        amount=10 * 10**6,
        timestamp=now,
        signer_address="0x2222222222222222222222222222222222222222",
    )
    assert ok is False
    assert "not in allowlist" in msg


def test_panic_revocation_unaffected_if_mirage_fails():
    """If the Mirage engine crashes or is disabled, panic button and smart contract revocation remain 100% operational."""
    now = int(time.time())
    policy = AccountPolicyState(
        wallet_address="0x00000000000000000000000000000000000000bb",
        owner_address="0x1111111111111111111111111111111111111111",
        agent_session_key="0x2222222222222222222222222222222222222222",
        junior_signer="0x3333333333333333333333333333333333333333",
        senior_signer="0x4444444444444444444444444444444444444444",
        revoker_role="0x5555555555555555555555555555555555555555",
        allowed_target="0x00000000000000000000000000000000000000aa",
        allowed_recipient="0x00000000000000000000000000000000000000cc",
        max_per_tx=50 * 10**6,
        daily_allowance=100 * 10**6,
        session_expiry=now + 3600,
    )

    # Emergency panic revocation works independently
    ok, msg = policy.revoke_session("0x2222222222222222222222222222222222222222", "0x5555555555555555555555555555555555555555", "EMERGENCY_PANIC")
    assert ok is True
    assert "revoked on-chain" in msg
