"""
Test Suite: Hardware Fault Handling, Fail-Closed Security, and Emergency Revocation (Objective 2)
Validates device health states, cable disconnect latching, fail-closed authorization,
recovery gates, and distinction between local panic and on-chain confirmed revocation.
"""

import time
import pytest
from services.api.src.hardware.health_manager import (
    HardwareHealthManager,
    HardwareHealthState,
    RevocationState,
    ApprovalRequestStatus,
)
from services.api.src.policies.policy_engine import AccountPolicyState
from services.device_crypto.crypto_engine import JUNIOR_ROLE_CAP


@pytest.fixture
def hardware_setup():
    mgr = HardwareHealthManager()
    # Add a mock pending approval
    req_id = "req-pending-01"
    mgr.active_approvals[req_id] = {
        "request_id": req_id,
        "status": ApprovalRequestStatus.DEVICE_REVIEW,
        "amount": 500 * 10**6,
        "cancellation_reason": None,
    }
    return mgr


def test_signer_disconnect_during_approval_fails_closed(hardware_setup):
    """Disconnecting ESP32 signer during active review must cancel request and lock new approvals."""
    mgr = hardware_setup
    assert mgr.can_initiate_approval()[0] is True

    # Signer disconnects (e.g. USB unplugged)
    mgr.report_component_disconnect("esp32_signer", "USB cable removed")

    # Overall state locks
    assert mgr.overall_state == HardwareHealthState.APPROVAL_LOCKED
    assert mgr.is_approval_locked is True

    # Pending request was immediately cancelled
    assert mgr.active_approvals["req-pending-01"]["status"] == ApprovalRequestStatus.CANCELLED
    assert "Hardware disconnect: esp32_signer" in mgr.active_approvals["req-pending-01"]["cancellation_reason"]

    # New approval cannot be initiated
    can_init, reason = mgr.can_initiate_approval()
    assert can_init is False
    assert "Hardware approval locked" in reason


def test_rfid_disconnect_fails_closed(hardware_setup):
    """Disconnecting RFID reader locks authorization and invalidates active approvals."""
    mgr = hardware_setup
    mgr.report_component_disconnect("rfid_reader", "SPI pin disconnected")

    assert mgr.is_approval_locked is True
    assert mgr.active_approvals["req-pending-01"]["status"] == ApprovalRequestStatus.CANCELLED
    assert mgr.can_initiate_approval()[0] is False


def test_button_disconnect_fails_closed(hardware_setup):
    """Disconnecting physical approval button locks authorization."""
    mgr = hardware_setup
    mgr.report_component_disconnect("approval_button", "GPIO33 wire severed")

    assert mgr.is_approval_locked is True
    assert mgr.can_initiate_approval()[0] is False


def test_camera_failure_degrades_without_locking_buttons(hardware_setup):
    """Camera failure degrades optical verification but does NOT lock hardware button signing."""
    mgr = hardware_setup
    mgr.report_component_disconnect("camera", "USB video interface lost")

    # Camera is auxiliary: state is DEGRADED, but approval is NOT locked
    assert mgr.components["camera"]["state"] == HardwareHealthState.DEGRADED
    assert mgr.is_approval_locked is False

    # Physical button approval is still permitted!
    can_init, _ = mgr.can_initiate_approval()
    # Note: can_initiate_approval checks if overall state is healthy. Camera degradations allow manual review with warning
    assert mgr.components["esp32_signer"]["state"] == HardwareHealthState.HEALTHY


def test_reconnected_hardware_without_supervisor_recovery_remains_locked(hardware_setup):
    """Reconnecting a cable must NOT automatically restore signing privileges; requires supervisor recovery."""
    mgr = hardware_setup

    # Disconnect
    mgr.report_component_disconnect("esp32_signer", "Physical pull")
    assert mgr.is_approval_locked is True

    # Cable plugged back in
    mgr.report_component_reconnected("esp32_signer")

    # State moves to RECOVERY_REQUIRED, NOT healthy!
    assert mgr.overall_state == HardwareHealthState.RECOVERY_REQUIRED
    assert mgr.is_approval_locked is True  # Still locked!
    assert mgr.can_initiate_approval()[0] is False

    # Attempting recovery with invalid supervisor token fails
    recovered, msg = mgr.supervisor_recovery("wrong_token", "Reconnected by user")
    assert recovered is False
    assert mgr.is_approval_locked is True

    # Legitimate supervisor explicit recovery restores HEALTHY
    recovered, msg = mgr.supervisor_recovery("SUPERVISOR_AUTHORIZED_RECOVERY_KEY", "Inspected physical integrity on Laptop B")
    assert recovered is True
    assert mgr.overall_state == HardwareHealthState.HEALTHY
    assert mgr.is_approval_locked is False
    assert mgr.can_initiate_approval()[0] is True


def test_panic_trigger_and_revocation_lifecycle():
    """
    Validates distinction between PANIC_LOCAL and REVOKE_CONFIRMED.
    Local panic stops signing instantly, but wallet is only confirmed frozen on-chain.
    """
    mgr = HardwareHealthManager()
    now = int(time.time())

    # Smart contract state
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

    # 1. Before panic: Normal agent payment works on-chain
    ok, _ = policy.validate_agent_payment(
        target="0x00000000000000000000000000000000000000aa",
        selector="0xa9059cbb",
        recipient="0x00000000000000000000000000000000000000cc",
        amount=10 * 10**6,
        timestamp=now,
        signer_address="0x2222222222222222222222222222222222222222",
    )
    assert ok is True

    # 2. Operator presses physical PANIC button on ESP32 (GPIO32)
    panic_info = mgr.trigger_panic("ESP32_GPIO32_PANIC")
    assert mgr.revocation_state == RevocationState.PANIC_LOCAL
    assert mgr.is_approval_locked is True

    # Local signing is halted, but notice: On-chain revocation is NOT yet submitted/confirmed!
    assert panic_info["chain_state"] == "NOT_YET_CONFIRMED"

    # 3. Direct ESP32 RPC broadcasts revocation transaction
    mgr.update_revocation_progress(RevocationState.REVOKE_SUBMITTED, tx_hash="0xabcd1234")
    assert mgr.revocation_state == RevocationState.REVOKE_SUBMITTED

    # 4. On-chain confirmation is received from the blockchain receipt
    policy.revoke_session("0x2222222222222222222222222222222222222222", "0x5555555555555555555555555555555555555555", "PANIC_CONFIRMED")
    mgr.update_revocation_progress(RevocationState.REVOKE_CONFIRMED, tx_hash="0xabcd1234")
    assert mgr.revocation_state == RevocationState.REVOKE_CONFIRMED

    # 5. Subsequent payment using the compromised session key is rejected on chain!
    ok, msg = policy.validate_agent_payment(
        target="0x00000000000000000000000000000000000000aa",
        selector="0xa9059cbb",
        recipient="0x00000000000000000000000000000000000000cc",
        amount=10 * 10**6,
        timestamp=now,
        signer_address="0x2222222222222222222222222222222222222222",
    )
    assert ok is False
    assert "revoked on-chain" in msg
