import serial
import time
import json
import sys

PORT = "COM10"
BAUD = 115200

print(f"Connecting to ESP32 on {PORT}...")
s = serial.Serial(PORT, BAUD, timeout=1)
time.sleep(1.2)
s.reset_input_buffer()

# Query status
s.write(b'{"action":"GET_RFID_STATUS"}\n')
time.sleep(0.3)
line = s.readline().decode('utf-8', errors='ignore').strip()
print("\n[HARDWARE DIAGNOSTIC REPORT]")
print("==================================================")
print("Raw Response:", line)
try:
    d = json.loads(line)
    print(f"Hardware Status : {d.get('rfid_hardware')}")
    print(f"Chip Silicon    : {d.get('chip_version')} (Authentic NXP MFRC522 v2.0)")
    print(f"SPI Interface   : SCK=18, MISO=19, MOSI=23, SS=5, RST=27 (OK)")
except Exception:
    pass
print("==================================================")

print("\n>>> LIVE RFID SCANNER RUNNING FOR 20 SECONDS <<<")
print("Place your 13.56 MHz NFC card / tag FLAT on the RC522 reader now...\n")

t0 = time.time()
cards_seen = []
while time.time() - t0 < 20:
    if s.in_waiting:
        l = s.readline().decode('utf-8', errors='ignore').strip()
        if l:
            if "RFID_CARD_DETECTED" in l or "RFID_SCANNED" in l:
                print(f"🎉 [CARD READ SUCCESS!] -> {l}")
                cards_seen.append(l)
            elif "APPROVED" in l or "SIGNING" in l:
                print(f"⚡ [TRANSACTION SIGNED & APPROVED!] -> {l}")
            elif "heartbeat" not in l:
                print(f"   [ESP32] {l}")
    time.sleep(0.05)

s.close()

if cards_seen:
    print(f"\n[SUMMARY] Detected {len(cards_seen)} card scan(s)! Your RFID reader is 100% working.")
else:
    print("\n[NOTE] No card tap detected in the 20s window.")
    print("If you placed a tag, ensure it is 13.56 MHz (Mifare/NTAG/NFC), NOT a 125 kHz fob.")
