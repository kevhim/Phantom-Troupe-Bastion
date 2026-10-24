"""
Bastion X v2.3 — SQLite Application Database & Projections
Models for attack runs, anomalies, recovery, paymaster, and invariants.
"""

import sys
from pathlib import Path
from datetime import datetime
import json

# Ensure project root is in sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    from services.api.src.config import DATABASE_URL
except ImportError:
    from config import DATABASE_URL

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
)
from sqlalchemy.orm import declarative_base, sessionmaker


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class AttackRun(Base):
    __tablename__ = "attack_runs"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, unique=True, index=True)
    total_scenarios = Column(Integer, default=8)
    contained_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    total_attempted_loss = Column(Float, default=0.0)
    actual_funds_lost = Column(Float, default=0.0)
    daily_limit_bound_satisfied = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AttackResult(Base):
    __tablename__ = "attack_results"
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String, index=True)
    attack_id = Column(String, index=True)
    name = Column(String)
    category = Column(String)
    attempted_amount = Column(Float)
    actual_loss = Column(Float)
    rejection_reason = Column(String, nullable=True)
    on_chain_result = Column(String)
    tx_hash = Column(String, nullable=True)
    status = Column(String)  # CONTAINED, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)


class RiskEvaluation(Base):
    __tablename__ = "risk_evaluations"
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(String, unique=True, index=True)
    total_sequences = Column(Integer, default=20)
    true_positives = Column(Integer, default=10)
    false_positives = Column(Integer, default=0)
    true_negatives = Column(Integer, default=10)
    false_negatives = Column(Integer, default=0)
    detection_rate = Column(Float, default=100.0)
    false_freeze_rate = Column(Float, default=0.0)
    precision = Column(Float, default=100.0)
    prevented_loss_busd = Column(Float, default=1945.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class FreezeEvent(Base):
    __tablename__ = "freeze_events"
    id = Column(Integer, primary_key=True, index=True)
    freeze_id = Column(String, unique=True, index=True)
    actor_session = Column(String)
    state = Column(String)  # ACTIVE, FROZEN_AUTOMATIC, FROZEN_MANUAL, RECOVERED
    trigger_rule = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class RecoveryProposal(Base):
    __tablename__ = "recovery_proposals"
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(String, unique=True, index=True)
    current_owner = Column(String)
    proposed_owner = Column(String)
    status = Column(String)  # NONE, COLLECTING_APPROVALS, TIMELOCKED, EXECUTED, VETOED
    votes_collected = Column(Integer, default=0)
    quorum_required = Column(Integer, default=3)
    quorum_reached_at = Column(DateTime, nullable=True)
    ready_at = Column(DateTime, nullable=True)
    executed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class GuardianVote(Base):
    __tablename__ = "guardian_votes"
    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(String, index=True)
    guardian_address = Column(String, index=True)
    voted_at = Column(DateTime, default=datetime.utcnow)


class SponsorshipUsage(Base):
    __tablename__ = "sponsorship_usage"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(String, index=True)
    gas_consumed = Column(Integer)
    remaining_quota = Column(Integer)
    operation_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class InvariantTestRun(Base):
    __tablename__ = "invariant_test_runs"
    id = Column(Integer, primary_key=True, index=True)
    suite_name = Column(String)
    runs = Column(Integer, default=256)
    calls = Column(Integer, default=16384)
    violations = Column(Integer, default=0)
    passed = Column(Boolean, default=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PaymentIntentRecord(Base):
    __tablename__ = "payment_intents"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True)
    created_utc = Column(DateTime, default=datetime.utcnow)
    actor_session = Column(String, index=True)
    status = Column(String, index=True, default="DRAFT")  # DRAFT, SIGNED, SUBMITTED, INCLUDED_SUCCESS, INCLUDED_REVERTED, BUNDLER_REJECTED, UNKNOWN, QUEUED_FOR_PHYSICAL_REVIEW
    chain_id = Column(Integer, default=31337)
    smart_account = Column(String)
    token_address = Column(String)
    target_contract = Column(String)
    function_selector = Column(String, default="0xa9059cbb")
    recipient_address = Column(String)
    amount_base_units = Column(Integer)
    max_per_tx_exception = Column(Integer, default=0)
    deadline = Column(Integer)
    calldata_hash = Column(String)
    policy_version = Column(Integer, default=1)
    request_hash = Column(String, nullable=True)
    prompt_digest = Column(String, nullable=True)  # Privacy: SHA256 of prompt, never raw prompt


class UserOperationRecord(Base):
    __tablename__ = "user_operations"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, index=True)
    userop_hash = Column(String, unique=True, index=True)
    sender = Column(String, index=True)
    nonce = Column(String)
    call_data = Column(Text)
    call_gas_limit = Column(String)
    verification_gas_limit = Column(String)
    pre_verification_gas = Column(String)
    max_fee_per_gas = Column(String)
    max_priority_fee_per_gas = Column(String)
    paymaster_and_data = Column(Text)
    signature = Column(Text)  # Cryptographic signature only, NEVER private keys
    bundler_status = Column(String, index=True)  # SUBMITTED, INCLUDED_SUCCESS, INCLUDED_REVERTED, BUNDLER_REJECTED, UNKNOWN
    tx_hash = Column(String, nullable=True, index=True)
    block_number = Column(Integer, nullable=True)
    execution_success = Column(Boolean, nullable=True)
    actual_gas_cost = Column(Integer, nullable=True)
    actual_gas_used = Column(Integer, nullable=True)
    revert_reason = Column(String, nullable=True)
    created_utc = Column(DateTime, default=datetime.utcnow)


class AgentSessionRecord(Base):
    __tablename__ = "agent_sessions"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    agent_address = Column(String, index=True)
    session_key_address = Column(String, index=True)
    created_utc = Column(DateTime, default=datetime.utcnow)
    expiry_utc = Column(DateTime)
    is_revoked = Column(Boolean, default=False)
    is_paused = Column(Boolean, default=False)
    revocation_reason = Column(String, nullable=True)
    revoked_at_utc = Column(DateTime, nullable=True)
    revocation_tx_hash = Column(String, nullable=True)
    revocation_block = Column(Integer, nullable=True)
    last_active_utc = Column(DateTime, default=datetime.utcnow)


class HardwareEventRecord(Base):
    __tablename__ = "hardware_events"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, index=True)
    node_id = Column(String, index=True)
    source_type = Column(String, index=True)
    source_counter = Column(Integer, default=0)
    event_type = Column(String, index=True)
    payload_redacted = Column(Text)  # JSON string
    digest = Column(String, unique=True, index=True)  # Enforces replay / duplicate prevention
    observed_utc = Column(DateTime, default=datetime.utcnow)


class ApprovalRequestRecord(Base):
    __tablename__ = "approval_requests"
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String, unique=True, index=True)
    order_id = Column(String, index=True)
    tier_required = Column(String)  # JUNIOR_EXCEPTION / SENIOR_EXCEPTION
    status = Column(String, index=True)  # DEVICE_REVIEW, CONFIRMED, REJECTED, CANCELLED, EXPIRED
    display_digest = Column(String)
    esp32_signer = Column(String, nullable=True)
    esp32_signature = Column(Text, nullable=True)
    owner_cosign = Column(Text, nullable=True)
    nonce = Column(Integer)
    deadline = Column(Integer)
    created_utc = Column(DateTime, default=datetime.utcnow)
    resolved_utc = Column(DateTime, nullable=True)


class IncidentRecord(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String, unique=True, index=True)
    trigger = Column(String, index=True)
    state = Column(String, index=True)  # ACTIVE, FROZEN_AUTOMATIC, FROZEN_MANUAL, REVOCATION_CONFIRMED, RESOLVED
    physical_panic_utc = Column(DateTime, nullable=True)
    revocation_tx = Column(String, nullable=True)
    revocation_confirmed_block = Column(Integer, nullable=True)
    details_json = Column(Text, nullable=True)
    created_utc = Column(DateTime, default=datetime.utcnow)
    closed_utc = Column(DateTime, nullable=True)


class AuditEntryRecord(Base):
    __tablename__ = "audit_entries"
    id = Column(Integer, primary_key=True, index=True)
    sequence = Column(Integer, unique=True, index=True)
    event_id = Column(String, unique=True, index=True)
    event_source = Column(String, index=True)
    correlation_id = Column(String, index=True)
    event_type = Column(String, index=True)
    sanitized_payload_json = Column(Text)
    prev_hash = Column(String)
    entry_hash = Column(String, unique=True, index=True)
    timestamp = Column(Float)
    created_utc = Column(DateTime, default=datetime.utcnow)


class IntegrityCheckpointRecord(Base):
    __tablename__ = "integrity_checkpoints"
    id = Column(Integer, primary_key=True, index=True)
    checkpoint_id = Column(String, unique=True, index=True)
    sequence_tip = Column(Integer)
    tip_event_hash = Column(String)
    event_count = Column(Integer)
    node_id = Column(String)
    export_path = Column(String, nullable=True)
    verified = Column(Boolean, default=True)
    created_utc = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    print("Database tables initialized successfully.")
