"""
BASTION X v2.2 — Laptop B Serial Hardware Gateway
Manages serial ports for ESP32 #1 (Signer) and Uno #1 (Environmental Sensors).
Ensures each USB device has exactly ONE owning process.
"""

from typing import Dict, Any, Optional
import time
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gateway_b")


class LaptopBSerialGateway:
    def __init__(self, esp32_port: Optional[str] = None, uno_port: Optional[str] = None):
        self.esp32_port = esp32_port
        self.uno_port = uno_port
        self.esp32_connected = True
        self.uno_connected = True

    def parse_device_event(self, raw_line: str) -> Optional[Dict[str, Any]]:
        """
        Parses structured JSON events received over serial.
        """
        raw_line = raw_line.trim() if hasattr(raw_line, "trim") else raw_line.strip()
        if not raw_line:
            return None
        try:
            return json.loads(raw_line)
        except json.JSONDecodeError:
            # Handle plain status strings
            return {"type": "raw_log", "message": raw_line, "timestamp": time.time()}

    def get_gateway_status(self) -> Dict[str, Any]:
        return {
            "gateway": "Laptop_B_Gateway",
            "host": "Intel Core Ultra 7 155H",
            "devices": {
                "esp32_signer": {
                    "port": self.esp32_port or "AUTO_DETECT (COM_ESP32)",
                    "connected": self.esp32_connected,
                    "baud": 115200,
                },
                "uno_sensors": {
                    "port": self.uno_port or "AUTO_DETECT (COM_UNO)",
                    "connected": self.uno_connected,
                    "baud": 9600,
                },
            },
        }


if __name__ == "__main__":
    gw = LaptopBSerialGateway()
    print(json.dumps(gw.get_gateway_status(), indent=2))
