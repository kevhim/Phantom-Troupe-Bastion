"""
Bastion X v2.1 — Verifiable Security Flight Recorder & Forensic Audit Engine
Implements SHA-256 hash-chained immutable event logs, independent Laptop B checkpointing,
tamper detection, and incident report generation (JSON + PDF).
"""

import hashlib
import json
import time
import uuid
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional, Tuple
import os

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"


@dataclass
class ForensicEvent:
    event_id: str
    schema_version: int
    timestamp: float
    event_source: str      # "AI_AGENT", "PHYSICAL_AUTH", "WALLET", "INCIDENT_RESPONSE"
    correlation_id: str
    event_type: str
    sanitized_payload: Dict[str, Any]
    previous_event_hash: str
    current_event_hash: str

    def to_canonical_json(self) -> str:
        """Produces deterministic, canonical JSON representation of fields for hashing."""
        data = {
            "event_id": self.event_id,
            "schema_version": self.schema_version,
            "timestamp": self.timestamp,
            "event_source": self.event_source,
            "correlation_id": self.correlation_id,
            "event_type": self.event_type,
            "sanitized_payload": self.sanitized_payload,
            "previous_event_hash": self.previous_event_hash,
        }
        return json.dumps(data, sort_keys=True, separators=(",", ":"))


def compute_event_hash(previous_hash: str, canonical_json: str) -> str:
    """SHA-256(previous_hash + canonical_json)"""
    h = hashlib.sha256()
    h.update(previous_hash.encode("utf-8"))
    h.update(canonical_json.encode("utf-8"))
    return h.hexdigest()


class FlightRecorder:
    def __init__(self, node_id: str = "laptop-a-main", checkpoint_storage_dir: Optional[str] = None):
        self.node_id = node_id
        self.events: List[ForensicEvent] = []
        self.last_event_hash: str = GENESIS_HASH
        self.checkpoints: Dict[str, Dict[str, Any]] = {}
        self.checkpoint_storage_dir = checkpoint_storage_dir or os.path.join(os.getcwd(), "artifacts", "checkpoints")
        os.makedirs(self.checkpoint_storage_dir, exist_ok=True)

    def sanitize_payload(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitizes payload: removes private keys, credentials, raw camera frames,
        and replaces sensitive prompts with SHA-256 content digests.
        """
        clean = {}
        for k, v in raw_payload.items():
            k_lower = k.lower()
            if any(secret in k_lower for secret in ["private_key", "secret", "password", "mnemonic"]):
                clean[k] = "[REDACTED_SECRET]"
            elif k_lower in ["raw_frame", "biometric_template"]:
                clean[k] = "[REDACTED_BIOMETRIC_DATA]"
            elif k_lower in ["prompt_content", "user_prompt"]:
                # Preserve privacy by storing digest of prompt
                digest = hashlib.sha256(str(v).encode("utf-8")).hexdigest()
                clean["prompt_digest"] = f"sha256:{digest}"
            else:
                clean[k] = v
        return clean

    def record_event(
        self,
        event_source: str,
        correlation_id: str,
        event_type: str,
        payload: Dict[str, Any],
        timestamp: Optional[float] = None,
    ) -> ForensicEvent:
        """
        Appends an event to the cryptographically linked hash chain.
        """
        evt_id = str(uuid.uuid4())
        ts = timestamp if timestamp is not None else time.time()
        sanitized = self.sanitize_payload(payload)

        # Temporary event to compute canonical representation
        temp_event = ForensicEvent(
            event_id=evt_id,
            schema_version=2,
            timestamp=ts,
            event_source=event_source,
            correlation_id=correlation_id,
            event_type=event_type,
            sanitized_payload=sanitized,
            previous_event_hash=self.last_event_hash,
            current_event_hash="",
        )

        canonical_json = temp_event.to_canonical_json()
        current_hash = compute_event_hash(self.last_event_hash, canonical_json)
        temp_event.current_event_hash = current_hash

        self.events.append(temp_event)
        self.last_event_hash = current_hash
        return temp_event

    def create_checkpoint(self, checkpoint_id: str) -> Dict[str, Any]:
        """
        Generates an independent periodic checkpoint designed to be stored
        on Laptop B outside of the application's writable database.
        """
        checkpoint_data = {
            "checkpoint_id": checkpoint_id,
            "created_at_utc": time.time(),
            "event_count": len(self.events),
            "tip_event_hash": self.last_event_hash,
            "node_id": self.node_id,
        }
        self.checkpoints[checkpoint_id] = checkpoint_data

        # Persist checkpoint to disk
        file_path = os.path.join(self.checkpoint_storage_dir, f"{checkpoint_id}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(checkpoint_data, f, indent=2)

        return checkpoint_data

    @staticmethod
    def verify_event_chain(events: List[ForensicEvent]) -> Tuple[bool, str, Optional[int]]:
        """
        Verifies the cryptographic integrity of an entire event chain.
        Detects tampering, deletion, insertion, or reordering.
        """
        if not events:
            return True, "Chain is empty", None

        prev_hash = GENESIS_HASH
        for idx, evt in enumerate(events):
            # 1. Verify previous hash link
            if evt.previous_event_hash != prev_hash:
                return (
                    False,
                    f"Broken link at index {idx} (event {evt.event_id}): previous_hash {evt.previous_event_hash} does not match expected {prev_hash}",
                    idx,
                )

            # 2. Recompute canonical hash
            canonical_json = evt.to_canonical_json()
            expected_hash = compute_event_hash(prev_hash, canonical_json)
            if evt.current_event_hash != expected_hash:
                return (
                    False,
                    f"Tampered content at index {idx} (event {evt.event_id}): current_hash {evt.current_event_hash} does not match computed {expected_hash}",
                    idx,
                )

            prev_hash = evt.current_event_hash

        return True, "All events cryptographically verified", None

    def verify_against_checkpoint(self, checkpoint_data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Verifies that current flight recorder matches an independent checkpoint held on Laptop B.
        """
        expected_count = checkpoint_data["event_count"]
        expected_tip = checkpoint_data["tip_event_hash"]

        if len(self.events) < expected_count:
            return False, f"Missing events: flight recorder has {len(self.events)} events, checkpoint expects {expected_count}"

        # Verify up to the checkpoint count
        slice_events = self.events[:expected_count]
        valid, msg, idx = self.verify_event_chain(slice_events)
        if not valid:
            return False, f"Chain corrupted before checkpoint: {msg}"

        if slice_events[-1].current_event_hash != expected_tip:
            return False, f"Tip hash mismatch: slice tip is {slice_events[-1].current_event_hash}, checkpoint expects {expected_tip}"

        return True, f"Flight recorder strictly conforms to checkpoint {checkpoint_data['checkpoint_id']}"

    def export_incident_report_json(self, correlation_id: str) -> Dict[str, Any]:
        """
        Compiles all forensic evidence for a specific operation or incident into structured JSON.
        """
        matched_events = [asdict(e) for e in self.events if e.correlation_id == correlation_id or correlation_id == "*"]
        return {
            "report_version": "2.1",
            "generated_at_utc": time.time(),
            "correlation_id": correlation_id,
            "total_events": len(matched_events),
            "timeline": matched_events,
            "tip_event_hash": self.last_event_hash,
            "chain_integrity": self.verify_event_chain(self.events)[0],
        }

    def export_incident_report_pdf(self, correlation_id: str, output_path: str) -> str:
        """
        Exports a formatted PDF incident report using reportlab.
        """
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas

        report_data = self.export_incident_report_json(correlation_id)
        c = canvas.Canvas(output_path, pagesize=letter)
        width, height = letter

        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, height - 50, "BASTION X v2.1 — FORENSIC FLIGHT RECORDER INCIDENT REPORT")

        c.setFont("Helvetica", 10)
        c.drawString(50, height - 75, f"Correlation ID: {correlation_id}")
        c.drawString(50, height - 90, f"Generated UTC: {time.ctime(report_data['generated_at_utc'])}")
        c.drawString(50, height - 105, f"Chain Integrity: {'VERIFIED [OK]' if report_data['chain_integrity'] else 'CORRUPTED [FAIL]'}")
        c.drawString(50, height - 120, f"Tip Event Hash: {report_data['tip_event_hash'][:32]}...")

        c.setStrokeColorRGB(0.7, 0.7, 0.7)
        c.line(50, height - 130, width - 50, height - 130)

        y = height - 155
        c.setFont("Helvetica-Bold", 11)
        c.drawString(50, y, "Event Timeline Audit Trail:")
        y -= 20

        c.setFont("Helvetica", 8)
        for evt in report_data["timeline"]:
            if y < 60:
                c.showPage()
                y = height - 50
                c.setFont("Helvetica", 8)

            ts_str = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(evt["timestamp"]))
            src = evt["event_source"]
            etype = evt["event_type"]
            c.drawString(50, y, f"[{ts_str}] [{src}] {etype}")
            y -= 12
            c.drawString(70, y, f"Hash: {evt['current_event_hash'][:40]}... | Payload: {str(evt['sanitized_payload'])[:80]}")
            y -= 16

        c.save()
        return output_path
