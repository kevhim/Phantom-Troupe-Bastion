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
