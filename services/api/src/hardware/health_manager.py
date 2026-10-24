"""
Bastion X v2.1 — Hardware Health & Fail-Closed State Machine
Enforces fail-closed physical authorization, sensor fault latching,
explicit supervisor recovery, and emergency revocation tracking.
"""

from enum import Enum
from typing import Dict, List, Optional, Tuple, Set
import time
import uuid


class HardwareHealthState(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    DISCONNECTED = "DISCONNECTED"
    TAMPER_SUSPECTED = "TAMPER_SUSPECTED"
    APPROVAL_LOCKED = "APPROVAL_LOCKED"
    RECOVERY_REQUIRED = "RECOVERY_REQUIRED"


class RevocationState(str, Enum):
    IDLE = "IDLE"
    PANIC_LOCAL = "PANIC_LOCAL"
    REVOKE_PREPARING = "REVOKE_PREPARING"
    REVOKE_SUBMITTED = "REVOKE_SUBMITTED"
    REVOKE_CONFIRMED = "REVOKE_CONFIRMED"
    REVOKE_FAILED = "REVOKE_FAILED"
    REVOKE_UNAVAILABLE = "REVOKE_UNAVAILABLE"


class ApprovalRequestStatus(str, Enum):
    REQUESTED = "REQUESTED"
    DEVICE_REVIEW = "DEVICE_REVIEW"
    PHYSICAL_CONFIRMATION = "PHYSICAL_CONFIRMATION"
    DEVICE_SIGNED = "DEVICE_SIGNED"
    OWNER_AUTHORIZED = "OWNER_AUTHORIZED"
    SUBMITTED = "SUBMITTED"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


MANDATORY_APPROVAL_COMPONENTS = {
    "esp32_signer",
    "rfid_reader",
    "approval_button",
    "panic_button",
    "gateway_b",
    "uno_q_edge",
    "blockchain_node",
}

AUXILIARY_COMPONENTS = {
    "camera",
    "esp32_telemetry",
    "uno_watchdog",
    "uno_sensors",
    "uno_buzzer",
}


class HardwareHealthManager:
    def __init__(self):
        # Component statuses categorized across Laptop A and Laptop B
        self.components: Dict[str, Dict] = {
            # Laptop B — Trusted Security & Authorization Domain
            "esp32_signer": {"laptop": "B", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": True, "description": "ESP32 #1 Dedicated Signer (OLED #1)"},
            "rfid_reader": {"laptop": "B", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": True, "description": "RC522 SPI RFID Reader"},
            "approval_button": {"laptop": "B", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": True, "description": "GPIO33 Physical Approval Button"},
            "panic_button": {"laptop": "B", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": True, "description": "GPIO32 Physical Panic Button"},
            "gateway_b": {"laptop": "B", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": True, "description": "Laptop B Hardware Serial Gateway"},
            "uno_q_edge": {"laptop": "B", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": True, "description": "Arduino UNO Q 4GB Linux Edge Security Node"},
            "uno_sensors": {"laptop": "B", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": False, "description": "Arduino Uno #1 (Environmental Sensors & Buzzer D8)"},
            "uno_buzzer": {"laptop": "B", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": False, "description": "5V Active Buzzer on Arduino Uno #1 (Pin D8)"},
            "blockchain_node": {"laptop": "B", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": True, "description": "Local Anvil Blockchain & Bundler (Port 8545)"},

            # Laptop A — Application & Operator Domain
            "esp32_telemetry": {"laptop": "A", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": False, "description": "ESP32 #2 Operator Telemetry OLED #2"},
            "uno_watchdog": {"laptop": "A", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": False, "description": "Arduino Uno #2 Watchdog / Fault Generator"},
            "camera": {"laptop": "A", "state": HardwareHealthState.HEALTHY, "last_heartbeat": time.time(), "mandatory": False, "description": "Webcam Optical Face & Liveness Verification"},
        }

        self.overall_state: HardwareHealthState = HardwareHealthState.HEALTHY
        self.is_approval_locked: bool = False
        self.requires_supervisor_recovery: bool = False
        self.recovery_reason: str = ""

        # Pending approval requests
        self.active_approvals: Dict[str, Dict] = {}

        # Revocation state
        self.revocation_state: RevocationState = RevocationState.IDLE
        self.revocation_details: Dict[str, str] = {}

        # Logged security transitions
        self.event_log: List[Dict] = []

    def record_transition(self, event_type: str, details: Dict):
        entry = {
            "timestamp": time.time(),
            "event_type": event_type,
            "overall_state": self.overall_state.value,
            "details": details,
        }
        self.event_log.append(entry)

    def report_component_disconnect(self, component_name: str, reason: str = "Signal loss / unplugged"):
        """
        Reports disconnection or hardware fault. If component is mandatory for approval,
        IMMEDIATELY latches APPROVAL_LOCKED and invalidates outstanding requests.
        """
        if component_name not in self.components:
            return

        self.components[component_name]["state"] = HardwareHealthState.DISCONNECTED
        self.components[component_name]["last_heartbeat"] = time.time()

        if component_name in MANDATORY_APPROVAL_COMPONENTS:
            self.overall_state = HardwareHealthState.APPROVAL_LOCKED
            self.is_approval_locked = True
            self.requires_supervisor_recovery = True
            self.recovery_reason = f"Mandatory component {component_name} disconnected: {reason}"

            # 1. Invalidate all outstanding pending local approvals
            cancelled_count = 0
            for req_id, req in self.active_approvals.items():
                if req["status"] in [ApprovalRequestStatus.REQUESTED, ApprovalRequestStatus.DEVICE_REVIEW, ApprovalRequestStatus.PHYSICAL_CONFIRMATION]:
                    req["status"] = ApprovalRequestStatus.CANCELLED
                    req["cancellation_reason"] = f"Hardware disconnect: {component_name}"
                    cancelled_count += 1

            self.record_transition("MANDATORY_HARDWARE_DISCONNECTED", {
                "component": component_name,
                "reason": reason,
                "cancelled_approvals": cancelled_count,
            })
        elif component_name == "camera":
            # For camera failure, degrade optical verification WITHOUT locking signing or assuming attacker
            self.components["camera"]["state"] = HardwareHealthState.DEGRADED
            if self.overall_state == HardwareHealthState.HEALTHY:
                self.overall_state = HardwareHealthState.DEGRADED
            self.record_transition("CAMERA_DEGRADED", {
                "note": "Camera verification disabled; physical hardware buttons remain operational",
            })

    def report_component_reconnected(self, component_name: str):
        """
        When a cable is plugged back in, it does NOT automatically restore signing.
        It moves to RECOVERY_REQUIRED until explicit supervisor action.
        """
        if component_name not in self.components:
            return

        self.components[component_name]["state"] = HardwareHealthState.HEALTHY
        self.components[component_name]["last_heartbeat"] = time.time()

        if self.is_approval_locked:
            self.overall_state = HardwareHealthState.RECOVERY_REQUIRED
            self.record_transition("COMPONENT_RESTORED_AWAITING_SUPERVISOR", {
                "component": component_name,
                "note": "Restored cable does NOT automatically restore signing privileges. Supervisor recovery required.",
            })

    def supervisor_recovery(self, supervisor_token: str, reason: str) -> Tuple[bool, str]:
        """
        Explicit authorized supervisor recovery after verifying physical integrity.
        """
        if not supervisor_token or supervisor_token != "SUPERVISOR_AUTHORIZED_RECOVERY_KEY":
            return False, "Invalid supervisor recovery token"

        # Check if all mandatory components are currently reconnected
        for name, comp in self.components.items():
            if comp["mandatory"] and comp["state"] == HardwareHealthState.DISCONNECTED:
                return False, f"Cannot recover: Mandatory component {name} is still disconnected"

        self.overall_state = HardwareHealthState.HEALTHY
        self.is_approval_locked = False
        self.requires_supervisor_recovery = False
        self.recovery_reason = ""

        self.record_transition("SUPERVISOR_RECOVERY_COMPLETED", {
            "authorized_by": "supervisor",
            "reason": reason,
        })
        return True, "Hardware approval lock cleared. System returned to HEALTHY."

    def trigger_panic(self, origin: str = "ESP32_GPIO32_DIRECT") -> Dict:
        """
        Physical Panic Button pressed.
        1. Immediately locks local signing (PANIC_LOCAL).
        2. Cancels pending approvals.
        3. Prepares independent on-chain revocation transaction.
        """
        self.revocation_state = RevocationState.PANIC_LOCAL
        self.is_approval_locked = True
        self.overall_state = HardwareHealthState.APPROVAL_LOCKED
        self.requires_supervisor_recovery = True

        cancelled_count = 0
        for req_id, req in self.active_approvals.items():
            if req["status"] not in [ApprovalRequestStatus.CONFIRMED, ApprovalRequestStatus.CANCELLED]:
                req["status"] = ApprovalRequestStatus.CANCELLED
                req["cancellation_reason"] = f"Panic trigger: {origin}"
                cancelled_count += 1

        self.revocation_details = {
            "origin": origin,
            "triggered_at": time.time(),
            "local_state": RevocationState.PANIC_LOCAL.value,
            "chain_state": "NOT_YET_CONFIRMED",
        }

        self.record_transition("PANIC_LOCAL_LATCHED", {
            "origin": origin,
            "cancelled_requests": cancelled_count,
            "note": "Local signing latched shut. Awaiting direct RPC broadcast.",
        })
        return self.revocation_details

    def update_revocation_progress(self, new_state: RevocationState, tx_hash: Optional[str] = None, error: Optional[str] = None):
        """
        Updates the revocation progress from PANIC_LOCAL -> REVOKE_SUBMITTED -> REVOKE_CONFIRMED.
        """
        self.revocation_state = new_state
        self.revocation_details["chain_state"] = new_state.value
        if tx_hash:
            self.revocation_details["tx_hash"] = tx_hash
        if error:
            self.revocation_details["error"] = error

        self.record_transition(f"REVOCATION_{new_state.value}", self.revocation_details)

    def can_initiate_approval(self) -> Tuple[bool, str]:
        """
        Check if hardware permits a new approval workflow.
        Fail-closed: Returns False if locked or any mandatory component disconnected.
        """
        if self.is_approval_locked:
            return False, f"Hardware approval locked: {self.recovery_reason or 'Emergency lockdown'}"
        if self.overall_state != HardwareHealthState.HEALTHY:
            return False, f"Hardware health is {self.overall_state.value}, not HEALTHY"

        for name in MANDATORY_APPROVAL_COMPONENTS:
            if self.components[name]["state"] != HardwareHealthState.HEALTHY:
                return False, f"Mandatory component {name} is {self.components[name]['state'].value}"

        return True, "Hardware is healthy and ready for approval"
