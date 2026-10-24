"""
Bastion X v2.1 — FastAPI REST Router
Exposes endpoints for payments, physical approvals, hardware-health matrix,
verifiable flight recorder, smart-account policies, and Mirage deception layer.
"""

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import time
import os

from services.device_crypto.crypto_engine import (
    PaymentIntent,
    compute_calldata_hash,
    sign_payment_intent,
    verify_dual_authorization,
    JUNIOR_ROLE_CAP,
    SENIOR_ROLE_CAP,
)
from services.api.src.policies.policy_engine import AccountPolicyState
from services.api.src.hardware.health_manager import (
    HardwareHealthManager,
    HardwareHealthState,
    RevocationState,
    ApprovalRequestStatus,
)
from services.api.src.evidence.flight_recorder import FlightRecorder
from services.mirage.mirage_engine import MirageEngine

router = APIRouter(prefix="/api/v2")

# Shared Application State
health_mgr = HardwareHealthManager()
flight_rec = FlightRecorder(node_id="laptop-a-main")
mirage = MirageEngine(flight_recorder=flight_rec)

# Configured Policy State (Deterministic demo keys)
DEMO_OWNER = "0x1111111111111111111111111111111111111111"
DEMO_AGENT = "0x2222222222222222222222222222222222222222"
DEMO_JUNIOR = "0x3333333333333333333333333333333333333333"
DEMO_SENIOR = "0x4444444444444444444444444444444444444444"
DEMO_REVOKER = "0x5555555555555555555555555555555555555555"
DEMO_WALLET = "0x00000000000000000000000000000000000000bb"
DEMO_TOKEN = "0x00000000000000000000000000000000000000aa"
DEMO_VENDOR = "0x00000000000000000000000000000000000000cc"

policy_state = AccountPolicyState(
    wallet_address=DEMO_WALLET,
    owner_address=DEMO_OWNER,
    agent_session_key=DEMO_AGENT,
    junior_signer=DEMO_JUNIOR,
    senior_signer=DEMO_SENIOR,
    revoker_role=DEMO_REVOKER,
    allowed_target=DEMO_TOKEN,
    allowed_recipient=DEMO_VENDOR,
    max_per_tx=50 * 10**6,
    daily_allowance=100 * 10**6,
    session_expiry=int(time.time()) + 86400 * 2,
)


# --- Request/Response Models ---
class PaymentRequest(BaseModel):
    recipient: str
    amount: int  # base units (6 decimals)
    order_id: str
    prompt_context: Optional[str] = "Agent automated payment"


class ExceptionReviewSubmission(BaseModel):
    request_id: str
    approval_tier: str  # "JUNIOR_EXCEPTION" or "SENIOR_EXCEPTION"
    device_signature_hex: str
    owner_signature_hex: Optional[str] = None


class DisconnectRequest(BaseModel):
    component: str
    reason: Optional[str] = "Simulated cable disconnect"


class RecoveryRequest(BaseModel):
    supervisor_token: str
    reason: str


# --- Overview Route ---
@router.get("/overview")
def get_overview():
    return {
        "smart_account": {
            "address": policy_state.wallet_address,
            "owner": policy_state.owner_address,
            "agent_session_key": policy_state.agent_session_key,
            "policy_version": policy_state.policy_version,
            "nonce": policy_state.account_nonce,
        },
        "spend_today": {
            "day_index": int(time.time()) // 86400,
            "spent": sum(policy_state.daily_spent.get(k, {}).get(int(time.time()) // 86400, 0) for k in policy_state.daily_spent),
            "cap": policy_state.daily_allowance,
        },
        "hardware_health": {
            "overall_state": health_mgr.overall_state.value,
            "is_approval_locked": health_mgr.is_approval_locked,
            "requires_recovery": health_mgr.requires_supervisor_recovery,
        },
        "hosts": {
            "laptop_a": {
                "role": "Application Host, AI Agent, Computer Vision & Operator Telemetry",
                "spec": "NVIDIA RTX 5060, 32GB RAM",
                "status": "ONLINE",
                "devices": ["esp32_telemetry", "uno_watchdog", "camera"],
            },
            "laptop_b": {
                "role": "Trusted Authorization, Hardware Signer, Local Blockchain & Supervisor",
                "spec": "Intel Core Ultra 7 155H, 32GB RAM",
                "status": "ONLINE",
                "blockchain": "Anvil RPC :8545 (Chain ID 31337) + ERC-4337 Bundler",
                "rpc_url": os.getenv("ANVIL_RPC_URL", "http://127.0.0.1:8545"),
                "devices": ["esp32_signer", "rfid_reader", "approval_button", "panic_button", "gateway_b", "uno_q_edge", "uno_sensors", "uno_buzzer", "blockchain_node"],
            },
            "laptop_c": {
                "role": "Standby Backup Node",
                "spec": "NVIDIA RTX 4060",
                "status": "STANDBY",
            },
        },
        "revocation_state": health_mgr.revocation_state.value,
        "mirage_active": mirage.is_enabled,
        "total_forensic_events": len(flight_rec.events),
    }


# --- Payments Route ---
@router.post("/payments/request")
def request_payment(req: PaymentRequest):
    now = int(time.time())

    # Log agent intent in Flight Recorder
    flight_rec.record_event(
        event_source="AI_AGENT",
        correlation_id=req.order_id,
        event_type="agent.payment_requested",
        payload={
            "recipient": req.recipient,
            "amount": req.amount,
            "order_id": req.order_id,
            "prompt_content": req.prompt_context,
        },
    )

    # Advisory Check against 6 Policies
    ok, msg = policy_state.validate_agent_payment(
        target=policy_state.allowed_target,
        selector="0xa9059cbb",
        recipient=req.recipient,
        amount=req.amount,
        timestamp=now,
        signer_address=policy_state.agent_session_key,
    )

    if ok:
        flight_rec.record_event(
            event_source="WALLET",
            correlation_id=req.order_id,
            event_type="wallet.userop_executed",
            payload={"status": "CONFIRMED", "amount": req.amount, "recipient": req.recipient},
        )
        return {
            "status": "EXECUTED_IN_POLICY",
            "message": "Payment executed autonomously within on-chain policy limits",
            "amount": req.amount,
            "recipient": req.recipient,
        }
    else:
        # Check if hardware can initiate exception review
        can_approve, h_msg = health_mgr.can_initiate_approval()
        if not can_approve:
            raise HTTPException(status_code=403, detail=f"Policy exceeded and hardware approval unavailable: {h_msg}")

        # Queue for Hardware-assisted Physical Review
        req_id = f"exc-{req.order_id}"
        calldata_hash = compute_calldata_hash(req.recipient, req.amount)

        intent = PaymentIntent(
            chainId=policy_state.chain_id,
            verifyingAccount=policy_state.wallet_address,
            accountNonce=policy_state.account_nonce + 1,
            requestId=req_id,
            policyVersion=policy_state.policy_version,
            actorSession="agent-session-01",
            approvalTier="JUNIOR_EXCEPTION" if req.amount <= JUNIOR_ROLE_CAP else "SENIOR_EXCEPTION",
            tokenAddress=policy_state.allowed_target,
            targetContract=policy_state.allowed_target,
            functionSelector="0xa9059cbb",
            recipientAddress=req.recipient,
            amountBaseUnits=req.amount,
            maxPerTxException=JUNIOR_ROLE_CAP if req.amount <= JUNIOR_ROLE_CAP else SENIOR_ROLE_CAP,
            deadline=now + 300,
            calldataHash=calldata_hash,
        )

        health_mgr.active_approvals[req_id] = {
            "request_id": req_id,
            "intent": intent.to_dict(),
            "status": ApprovalRequestStatus.DEVICE_REVIEW,
            "created_at": now,
            "cancellation_reason": None,
        }

        flight_rec.record_event(
            event_source="PHYSICAL_AUTH",
            correlation_id=req.order_id,
            event_type="hardware.exception_queued",
            payload={"request_id": req_id, "approval_tier": intent.approvalTier, "amount": req.amount},
        )

        return {
            "status": "QUEUED_FOR_PHYSICAL_REVIEW",
            "policy_violation_reason": msg,
            "request_id": req_id,
            "approval_tier": intent.approvalTier,
            "canonical_intent": intent.to_dict(),
            "note": "Requires physical OLED review, RFID scan, GPIO33 confirmation, and Owner co-signature",
        }


# --- Approvals Route ---
@router.get("/approvals/queue")
def get_approval_queue():
    return list(health_mgr.active_approvals.values())


@router.post("/approvals/execute")
def execute_exception_approval(sub: ExceptionReviewSubmission):
    if sub.request_id not in health_mgr.active_approvals:
        raise HTTPException(status_code=404, detail="Approval request not found")

    req_data = health_mgr.active_approvals[sub.request_id]
    if req_data["status"] == ApprovalRequestStatus.CANCELLED:
        raise HTTPException(status_code=400, detail=f"Approval request was cancelled: {req_data.get('cancellation_reason')}")

    intent_dict = req_data["intent"]
    intent = PaymentIntent(**intent_dict)
    now = int(time.time())

    # Execute on policy engine (mirrors BastionAccount.sol)
    ok, msg = policy_state.execute_authorized_exception(
        intent=intent,
        device_signature_hex=sub.device_signature_hex,
        owner_signature_hex=sub.owner_signature_hex,
        timestamp=now,
    )

    if not ok:
        raise HTTPException(status_code=400, detail=f"On-chain exception verification failed: {msg}")

    req_data["status"] = ApprovalRequestStatus.CONFIRMED
    flight_rec.record_event(
        event_source="WALLET",
        correlation_id=sub.request_id,
        event_type="wallet.exception_executed",
        payload={
            "request_id": sub.request_id,
            "amount": intent.amountBaseUnits,
            "recipient": intent.recipientAddress,
            "status": "CONFIRMED",
        },
    )

    return {
        "status": "CONFIRMED",
        "message": "Exception authorized and executed on-chain",
        "request_id": sub.request_id,
        "amount": intent.amountBaseUnits,
        "recipient": intent.recipientAddress,
    }


# --- Hardware Routes ---
@router.get("/hardware/health")
def get_hardware_health():
    return {
        "overall_state": health_mgr.overall_state.value,
        "is_approval_locked": health_mgr.is_approval_locked,
        "requires_supervisor_recovery": health_mgr.requires_supervisor_recovery,
        "recovery_reason": health_mgr.recovery_reason,
        "components": health_mgr.components,
        "revocation_state": health_mgr.revocation_state.value,
        "revocation_details": health_mgr.revocation_details,
    }


@router.post("/hardware/disconnect")
def disconnect_component(req: DisconnectRequest):
    health_mgr.report_component_disconnect(req.component, req.reason or "Simulated test disconnect")
    return {"status": "DISCONNECTED", "component": req.component, "overall_state": health_mgr.overall_state.value}


@router.post("/hardware/reconnect")
def reconnect_component(req: DisconnectRequest):
    health_mgr.report_component_reconnected(req.component)
    return {"status": "RECONNECTED_AWAITING_SUPERVISOR", "component": req.component, "overall_state": health_mgr.overall_state.value}


@router.post("/hardware/recovery")
def supervisor_recovery(req: RecoveryRequest):
    ok, msg = health_mgr.supervisor_recovery(req.supervisor_token, req.reason)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "HEALTHY", "message": msg}


@router.post("/hardware/panic")
def trigger_panic(origin: str = "ESP32_GPIO32_DIRECT"):
    # 1. Hardware latches PANIC_LOCAL
    details = health_mgr.trigger_panic(origin)

    # 2. Record in flight recorder
    flight_rec.record_event(
        event_source="INCIDENT_RESPONSE",
        correlation_id=f"panic-{int(time.time())}",
        event_type="incident.panic_triggered",
        payload=details,
    )

    # 3. Simulate direct ESP32 Wi-Fi broadcast to RPC
    health_mgr.update_revocation_progress(RevocationState.REVOKE_SUBMITTED, tx_hash="0xpanic_broadcast_hash_123")
    policy_state.revoke_session(policy_state.agent_session_key, policy_state.revoker_role, "PHYSICAL_GPIO32_PANIC")
    health_mgr.update_revocation_progress(RevocationState.REVOKE_CONFIRMED, tx_hash="0xpanic_broadcast_hash_123")

    return {
        "status": "PANIC_CONFIRMED",
        "local_state": RevocationState.PANIC_LOCAL.value,
        "chain_state": RevocationState.REVOKE_CONFIRMED.value,
        "message": "Session revoked on-chain via independent revoker key",
    }


# --- Evidence / Flight Recorder Routes ---
@router.get("/evidence/events")
def get_evidence_events():
    return [e.__dict__ for e in flight_rec.events]


@router.get("/evidence/verify")
def verify_evidence():
    valid, msg, broken_idx = flight_rec.verify_event_chain(flight_rec.events)
    return {
        "is_valid": valid,
        "message": msg,
        "broken_index": broken_idx,
        "event_count": len(flight_rec.events),
        "tip_hash": flight_rec.last_event_hash,
    }


@router.get("/evidence/export/json")
def export_evidence_json(correlation_id: str = "*"):
    return flight_rec.export_incident_report_json(correlation_id)


@router.get("/evidence/export/pdf")
def export_evidence_pdf(correlation_id: str = "*"):
    out_dir = os.path.join(os.getcwd(), "artifacts", "reports")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, f"incident_report_{int(time.time())}.pdf")
    flight_rec.export_incident_report_pdf(correlation_id, pdf_path)
    return FileResponse(pdf_path, media_type="application/pdf", filename="incident_report.pdf")


# --- Mirage Deception Routes ---
@router.get("/mirage/customer/{customer_id}")
def get_mirage_customer(customer_id: str, session_id: str = "shadow-session"):
    ok, data = mirage.get_customer_record(session_id, customer_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Customer not found")
    return data


@router.post("/mirage/pay")
def pay_mirage_decoy(recipient: str, amount: float, session_id: str = "shadow-session"):
    ok, receipt = mirage.execute_mirage_payment(session_id, recipient, amount)
    if not ok:
        raise HTTPException(status_code=400, detail=receipt.get("error"))
    return receipt
