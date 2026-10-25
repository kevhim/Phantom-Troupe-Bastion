"""
BASTION X v2.3 — Supervisor Authorization & Independent Audit Service
Runs on Laptop B (Intel Core Ultra 7 155H).
Key Capabilities:
1. Coordinates physical single ESP32 signer workflow and Arduino UNO Q edge telemetry.
2. Manages independent audit checkpoint storage outside Laptop A's application database.
3. Broadcasts direct on-chain session revocation to local Anvil RPC (Chain ID 31337).
4. Direct hardware alarm trigger to Arduino Uno #1 5V Active Buzzer (Pin D8).
   NOTE: Decommissioned ESP8266 in v2.3; alarm is now strictly local to Laptop B / Uno #1.
"""

from typing import Dict, Any, List, Optional
import os
import json
import time
import logging
import re
import secrets
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("supervisor_b")

DEFAULT_CHECKPOINT_DIR = os.getenv("BASTION_CHECKPOINT_DIR", "C:\\bastion_audit_checkpoints" if os.name == "nt" else "/opt/bastion/audit_checkpoints")
ANVIL_RPC_URL = os.getenv("ANVIL_RPC_URL", "http://127.0.0.1:8545")
UNO_SERIAL_PORT = os.getenv("UNO_SENSOR_PORT", None)


class SupervisorService:
    def __init__(self, checkpoint_dir: str = DEFAULT_CHECKPOINT_DIR, uno_port: Optional[str] = UNO_SERIAL_PORT):
        self.checkpoint_dir = Path(checkpoint_dir)
        # Never silently substitute application-local storage for independent storage.
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        self.uno_port = uno_port
        self.checkpoints: List[Dict[str, Any]] = []
        self.signer_status = "UNVERIFIED"
        self.edge_q_status = "UNVERIFIED"
        self.uno_sensors_status = "UNVERIFIED"
        self.uno_buzzer_status = "IDLE"  # "IDLE" | "ALARM_ACTIVE"

    def record_independent_checkpoint(self, checkpoint_data: Dict[str, Any]) -> str:
        """
        Stores tamper-evident checkpoint file on Laptop B independent storage.
        """
        cp_id = checkpoint_data.get("checkpoint_id", "")
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,96}", cp_id):
            raise ValueError("Invalid checkpoint ID")
        if not re.fullmatch(r"[0-9a-f]{64}", checkpoint_data.get("tip_event_hash", "")):
            raise ValueError("Invalid checkpoint hash")
        if type(checkpoint_data.get("event_count")) is not int or checkpoint_data["event_count"] < 0:
            raise ValueError("Invalid event count")
        target_path = self.checkpoint_dir / f"{cp_id}.json"
        # Exclusive create prevents a compromised A from replacing an existing anchor.
        with open(target_path, "x", encoding="utf-8") as f:
            json.dump(checkpoint_data, f, indent=2)
            f.flush()
            os.fsync(f.fileno())
        self.checkpoints.append(checkpoint_data)
        return str(target_path)

    def trigger_alarm(self, active: bool = True, reason: str = "MANUAL") -> Dict[str, Any]:
        """
        Activates or silences the 5V active buzzer directly on Arduino Uno #1 Pin D8.
        Sends command over USB serial to Uno #1.
        """
        self.uno_buzzer_status = "UNVERIFIED"
        cmd = "ALARM:ON\n" if active else "ALARM:OFF\n"
        logger.warning(f"LOCAL BUZZER ALARM {'TRIGGERED' if active else 'SILENCED'} on Uno #1 (Pin D8): {reason}")

        serial_delivered = False
        if self.uno_port:
            try:
                import serial
                with serial.Serial(self.uno_port, 9600, timeout=1) as ser:
                    ser.write(cmd.encode("utf-8"))
                    time.sleep(0.1)
                    resp = ser.readline().decode("utf-8", errors="ignore").strip()
                    logger.info(f"Uno #1 buzzer response: {resp}")
                    serial_delivered = bool(resp) and ("ALARM" in resp)
                    self.uno_buzzer_status = "COMMAND_ACKNOWLEDGED" if serial_delivered else "UNVERIFIED"
            except Exception as e:
                logger.warning(f"Could not write directly to Uno #1 serial port ({self.uno_port}): {e}")

        return {
            "status": self.uno_buzzer_status,
            "target": "Arduino_Uno_1_Pin_D8",
            "host": "Laptop_B",
            "serial_delivered": serial_delivered,
            "reason": reason,
            "timestamp": time.time(),
        }

    def trigger_emergency_revocation(self, session_key: str, revoker_key: str, reason: str = "PANIC_BUTTON_PRESSED") -> Dict[str, Any]:
        """
        Broadcasts emergency revocation directly to the local Anvil node hosted on Laptop B.
        Also sounds the physical 5V active buzzer on Arduino Uno #1 Pin D8.
        Bypasses Laptop A completely.
        """
        logger.warning(f"EMERGENCY REVOCATION INITIATED on Laptop B for session {session_key}: {reason}")
        # Automatically trigger physical alarm on Uno #1
        alarm_res = self.trigger_alarm(active=True, reason=f"REVOCATION_{reason}")

        return {
            "status": "REVOKE_UNAVAILABLE",
            "message": "Physical ESP32 or independent owner wallet must sign and broadcast",
            "session_key": session_key,
            "origin": "Laptop_B_Supervisor",
            "rpc_target": ANVIL_RPC_URL,
            "buzzer_alert": alarm_res,
            "timestamp": time.time(),
        }

    def get_supervisor_status(self) -> Dict[str, Any]:
        return {
            "node": "Laptop_B_Supervisor",
            "host": "Intel Core Ultra 7 155H",
            "status": "ONLINE",
            "blockchain": {
                "rpc_url": ANVIL_RPC_URL,
                "chain_id": 31337,
                "bundler": "UNVERIFIED",
            },
            "peripherals": {
                "esp32_signer": self.signer_status,
                "uno_q_edge": self.edge_q_status,
                "uno_sensors": self.uno_sensors_status,
                "uno_buzzer": self.uno_buzzer_status,
            },
            "audit_checkpoints_preserved": len(self.checkpoints),
            "storage_path": str(self.checkpoint_dir),
        }


# FastAPI sub-app if mounted
try:
    from fastapi import FastAPI, HTTPException, Header, Depends
    app = FastAPI(title="Bastion X Laptop B Supervisor API", version="2.3.0")
    supervisor = SupervisorService()

    @app.get("/supervisor/health")
    def health():
        return supervisor.get_supervisor_status()

    def require_checkpoint_token(authorization: Optional[str] = Header(default=None)):
        token = os.getenv("CHECKPOINT_TOKEN", "")
        if not token or not secrets.compare_digest(authorization or "", f"Bearer {token}"):
            raise HTTPException(status_code=401, detail="Checkpoint authentication required")

    @app.post("/supervisor/audit/checkpoint", dependencies=[Depends(require_checkpoint_token)])
    def save_checkpoint(cp: Dict[str, Any]):
        try:
            path = supervisor.record_independent_checkpoint(cp)
        except FileExistsError as exc:
            raise HTTPException(status_code=409, detail="Checkpoint already exists; overwrites prohibited") from exc
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        return {"status": "PRESERVED", "checkpoint_id": cp["checkpoint_id"], "path": path}

    @app.get("/supervisor/audit/checkpoint/{checkpoint_id}", dependencies=[Depends(require_checkpoint_token)])
    def read_checkpoint(checkpoint_id: str):
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,96}", checkpoint_id):
            raise HTTPException(status_code=422, detail="Invalid checkpoint ID")
        path = supervisor.checkpoint_dir / f"{checkpoint_id}.json"
        if not path.exists():
            raise HTTPException(status_code=404, detail="Checkpoint not found")
        return json.loads(path.read_text(encoding="utf-8"))

    @app.post("/supervisor/alarm", dependencies=[Depends(require_checkpoint_token)])
    def set_alarm(payload: Dict[str, Any]):
        active = payload.get("active", True)
        reason = payload.get("reason", "SUPERVISOR_API")
        return supervisor.trigger_alarm(active=active, reason=reason)

    @app.post("/supervisor/revocation/direct", dependencies=[Depends(require_checkpoint_token)])
    def direct_revocation(payload: Dict[str, Any]):
        return supervisor.trigger_emergency_revocation(
            payload.get("session_key", ""),
            "",
            payload.get("reason", "SUPERVISOR_ACTION")
        )
except ImportError:
    app = None
