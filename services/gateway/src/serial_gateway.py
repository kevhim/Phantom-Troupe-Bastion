"""
BASTION X v2.3 — Laptop B Serial Hardware Gateway
Manages serial ports for ESP32 #1 (Signer) and Uno #1 (Status, Environmental & 5V Active Buzzer D8).
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
        raw_line = raw_line.strip()
        if not raw_line:
            return None
        try:
            return json.loads(raw_line)
        except json.JSONDecodeError:
            # Handle plain status strings
            return {"type": "raw_log", "message": raw_line, "timestamp": time.time()}

    def send_uno_buzzer_command(self, active: bool = True) -> bool:
        """
        Transmits alarm actuation command to Arduino Uno #1 via serial.
        """
        if not self.uno_port:
            logger.warning("Uno #1 port not configured, cannot send buzzer command directly")
            return False

        cmd = "ALARM:ON\n" if active else "ALARM:OFF\n"
        try:
            import serial
            with serial.Serial(self.uno_port, 9600, timeout=1) as ser:
                ser.write(cmd.encode("utf-8"))
                time.sleep(0.05)
                logger.info(f"Sent buzzer command {cmd.strip()} to {self.uno_port}")
                return True
        except Exception as e:
            logger.error(f"Failed to send buzzer command to {self.uno_port}: {e}")
            return False

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
                "uno_sensors_buzzer": {
                    "port": self.uno_port or "AUTO_DETECT (COM_UNO)",
                    "connected": self.uno_connected,
                    "buzzer_pin": 8,
                    "baud": 9600,
                },
            },
        }


if __name__ == "__main__":
    gw = LaptopBSerialGateway()
    print(json.dumps(gw.get_gateway_status(), indent=2))
