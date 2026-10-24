"""
BASTION X v2.2 — Arduino UNO Q 4GB Edge Security Service
Runs on the Linux userland of Arduino UNO Q 4GB, attached via USB-C to Laptop B.
Responsibilities:
- Edge telemetry collection and controller health monitoring.
- Gateway coordination with ESP32 #1 and Uno #1.
- Immediate incident event forwarding to Laptop B Supervisor.
"""

from typing import Dict, Any, Optional
import time
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("edge_q_service")


class EdgeSecurityCoordinator:
    def __init__(self, node_id: str = "uno-q-edge-01", supervisor_endpoint: str = "http://127.0.0.1:8010"):
        self.node_id = node_id
        self.supervisor_endpoint = supervisor_endpoint
        self.is_healthy = True
        self.telemetry_history = []
        self.last_heartbeat = time.time()

    def process_sensor_event(self, sensor_name: str, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses raw sensor readings, filters noise, and packages edge telemetry.
        """
        self.last_heartbeat = time.time()
        event = {
            "source": self.node_id,
            "sensor": sensor_name,
            "timestamp": time.time(),
            "data": raw_payload,
            "tamper_suspected": raw_payload.get("tamper", False),
        }
        self.telemetry_history.append(event)
        if len(self.telemetry_history) > 100:
            self.telemetry_history.pop(0)

        if event["tamper_suspected"]:
            self.is_healthy = False
            logger.warning(f"TAMPER DETECTED by Edge Coordinator on {sensor_name}")

        return event

    def get_health_status(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "platform": "Arduino UNO Q 4GB (Linux userland)",
            "status": "HEALTHY" if self.is_healthy else "TAMPER_SUSPECTED",
            "last_heartbeat": self.last_heartbeat,
            "total_events_processed": len(self.telemetry_history),
        }


if __name__ == "__main__":
    coordinator = EdgeSecurityCoordinator()
    logger.info("Starting UNO Q Edge Security Coordinator...")
    print(json.dumps(coordinator.get_health_status(), indent=2))
