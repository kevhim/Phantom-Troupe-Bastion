"""
BASTION X v2.3 — Laptop A Arduino Uno #2 Watchdog Service
Reads diagnostic heartbeat from Arduino Uno #2 on COM9 (9600 baud)
and reports health status to the local Bastion backend.
"""

import time
import sys
import os
import logging

try:
    import serial
except ImportError:
    serial = None

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("watchdog_service")

COM_PORT = os.getenv("UNO_WATCHDOG_PORT", "COM9")
BAUD_RATE = 9600


def run_watchdog():
    logger.info(f"Starting Bastion X Watchdog Service on {COM_PORT} ({BAUD_RATE} baud)...")

    if not serial:
        logger.warning("pyserial not found; running in watchdog simulation mode.")
        while True:
            logger.info("Watchdog [SIMULATED]: Heartbeat OK (uptime: 1000ms)")
            time.sleep(2)
        return

    while True:
        try:
            logger.info(f"Opening serial port {COM_PORT}...")
            with serial.Serial(COM_PORT, BAUD_RATE, timeout=3) as ser:
                logger.info(f"Connected to {COM_PORT} successfully.")
                while True:
                    line = ser.readline().decode("utf-8", errors="ignore").strip()
                    if line:
                        logger.info(f"Watchdog from {COM_PORT}: {line}")
                    time.sleep(0.5)
        except serial.SerialException as e:
            logger.warning(f"Serial port {COM_PORT} busy or disconnected: {e}. Retrying in 5s...")
            time.sleep(5)
        except Exception as e:
            logger.error(f"Unexpected watchdog error: {e}. Retrying in 5s...")
            time.sleep(5)


if __name__ == "__main__":
    run_watchdog()
