"""
Bastion X v2.1 — Safe Mirage Deception Engine (Objective 3)
Provides an isolated synthetic sandbox to observe adversary behavior without
exposing authentic customer data or touching actual blockchain funds.
"""

from typing import Dict, List, Optional, Tuple, Set
import time
import uuid


class MirageEngine:
    def __init__(self, flight_recorder=None):
        self.is_enabled: bool = False
        self.flight_recorder = flight_recorder

        # Set of session tokens marked as compromised / shadow
        self.shadow_sessions: Set[str] = set()

        # Authentic data store (real records)
        self.genuine_customers: Dict[str, Dict] = {
            "CUST-001": {"name": "Bastion Corp Ops", "balance": 150000.0, "vendor_contract": "0x00000000000000000000000000000000000000cc", "is_synthetic": False},
            "CUST-002": {"name": "DeepMind Hackathon Treasury", "balance": 500000.0, "vendor_contract": "0x00000000000000000000000000000000000000cc", "is_synthetic": False},
        }

        # Synthetic Mirage data store (completely fake decoys)
        self.decoy_customers: Dict[str, Dict] = {
            "CUST-001": {"name": "Synthetic Honeypot Alpha", "balance": 12.50, "vendor_contract": "0x9999999999999999999999999999999999999999", "is_synthetic": True},
            "CUST-002": {"name": "Fictitious Vendor Beta", "balance": 45.00, "vendor_contract": "0x8888888888888888888888888888888888888888", "is_synthetic": True},
        }

        # Mirage fake ledger of decoy payments (NEVER touches blockchain)
        self.decoy_payment_log: List[Dict] = []

    def enable_mirage(self, enabled: bool = True):
        self.is_enabled = enabled

    def trigger_session_shadowing(self, session_id: str, trigger_reason: str = "Suspicious behavior / Panic trigger") -> Dict:
        """
        Transitions a session into Mirage shadow routing:
        1. Revokes genuine application data access.
        2. Routes session to synthetic fixture store.
        3. Logs security incident.
        """
        self.shadow_sessions.add(session_id)
        incident_info = {
            "session_id": session_id,
            "shadowed_at_utc": time.time(),
            "reason": trigger_reason,
            "status": "SHADOW_ROUTED_TO_MIRAGE",
            "real_data_access": "BLOCKED",
        }

        if self.flight_recorder:
            self.flight_recorder.record_event(
                event_source="INCIDENT_RESPONSE",
                correlation_id=session_id,
                event_type="mirage.session_shadowed",
                payload=incident_info,
            )
        return incident_info

    def get_customer_record(self, session_id: str, customer_id: str) -> Tuple[bool, Dict]:
        """
        Returns authentic record for genuine sessions, or SYNTHETIC decoy for shadow sessions.
        Shadow sessions NEVER see real records.
        """
        is_shadow = session_id in self.shadow_sessions

        if is_shadow:
            # Always return synthetic decoy
            if customer_id in self.decoy_customers:
                return True, copy_with_synthetic_marker(self.decoy_customers[customer_id])
            return False, {"error": "Decoy customer not found", "is_synthetic": True}

        # Genuine session
        if customer_id in self.genuine_customers:
            return True, self.genuine_customers[customer_id]
        return False, {"error": "Customer not found"}

    def execute_mirage_payment(self, session_id: str, recipient: str, amount: float) -> Tuple[bool, Dict]:
        """
        Simulates payment for a shadowed session:
        - NEVER calls blockchain or ERC-4337 EntryPoint.
        - NEVER transfers real tokens.
        - Clearly marked as SYNTHETIC / DECOY.
        """
        if session_id not in self.shadow_sessions:
            return False, {"error": "Session is not a shadowed session; use standard ERC-4337 pipeline"}

        decoy_receipt = {
            "synthetic_receipt_id": f"mirage-{uuid.uuid4()}",
            "timestamp": time.time(),
            "session_id": session_id,
            "recipient": recipient,
            "synthetic_amount": amount,
            "blockchain_status": "NONE_IS_DECOY",
            "is_synthetic": True,
            "note": "SIMULATED DECOY INTERACTION ONLY. No blockchain transactions were broadcast and no real funds moved.",
        }
        self.decoy_payment_log.append(decoy_receipt)

        if self.flight_recorder:
            self.flight_recorder.record_event(
                event_source="INCIDENT_RESPONSE",
                correlation_id=session_id,
                event_type="mirage.decoy_payment_simulated",
                payload=decoy_receipt,
            )

        return True, decoy_receipt


def copy_with_synthetic_marker(record: Dict) -> Dict:
    res = dict(record)
    res["_mirage_notice"] = "SYNTHETIC DECOY RECORD"
    return res
