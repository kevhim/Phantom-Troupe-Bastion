import serial
import time
import json
import sys

PORT = "COM10"
BAUD = 115200

print(f"Connecting to ESP32 on {PORT} at {BAUD} baud...")
try:
    s = serial.Serial(PORT, BAUD, timeout=1.5)
    time.sleep(1.2)  # Settle DTR/RTS
    s.reset_input_buffer()
except Exception as e:
    print(f"[ERROR] Could not open {PORT}: {e}")
    sys.exit(1)

# Step 1: Query RFID hardware status
print("\n[Step 1] Querying RC522 hardware status over SPI...")
s.write(b'{"action":"GET_RFID_STATUS"}\n')

hw_status = None
t_start = time.time()
while time.time() - t_start < 3:
    if s.in_waiting:
        line = s.readline().decode('utf-8', errors='ignore').strip()
        if line and "rfid_hardware" in line:
            try:
                hw_status = json.loads(line)
                break
            except Exception:
                pass
    time.sleep(0.05)

if hw_status:
    print(f" -> Hardware Status: {hw_status.get('rfid_hardware')}")
    print(f" -> Enrolled Junior: {hw_status.get('enrolled_junior')}")
    print(f" -> Enrolled Senior: {hw_status.get('enrolled_senior')}")
    if hw_status.get("rfid_hardware") == "SPI_OK":
        print(" [OK] RC522 SPI bus communication is fully functional!")
    else:
        print(" [FAIL] RC522 not detected on SPI bus. Check wiring pins (18, 19, 23, 5, 27).")
else:
    print(" [WARN] No response to GET_RFID_STATUS. ESP32 may be busy or rebooting.")

# Step 2: Live Tap Test
print("\n[Step 2] LIVE CARD DETECTION WINDOW (12 seconds)")
print(">>> TAP YOUR NFC CARD / TAG ONTO THE RC522 SENSOR NOW <<<")
print("-------------------------------------------------------")

tap_detected = False
t_listen = time.time()
while time.time() - t_listen < 12:
    if s.in_waiting:
        raw = s.readline().decode('utf-8', errors='ignore').strip()
        if raw:
            # Check for card tap events
            if "RFID_CARD_DETECTED" in raw or "RFID_SCANNED" in raw:
                tap_detected = True
                print(f"\n[CARD TAP DETECTED!] => {raw}")
            elif "heartbeat" in raw:
                try:
                    hb = json.loads(raw)
                    print(f" [Heartbeat] ESP32 State: {hb.get('state')} | OLED1: {hb.get('oled_1')} | RFID: {hb.get('rfid')}")
                except Exception:
                    pass
            else:
                print(f" [ESP32 Log] {raw}")
    time.sleep(0.05)

s.close()
print("\n-------------------------------------------------------")
if tap_detected:
    print("[SUCCESS] Physical card tap was detected and read successfully!")
else:
    print("[INFO] No card was tapped during the 12-second test window.")
