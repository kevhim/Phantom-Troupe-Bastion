import serial
import time
import json

try:
    s = serial.Serial('COM10', 115200, timeout=1)
    time.sleep(1)
    s.reset_input_buffer()
    
    # Query RFID status
    s.write(b'{"action":"GET_RFID_STATUS"}\n')
    time.sleep(0.3)
    resp = s.readline().decode('utf-8', errors='ignore').strip()
    print("RFID Hardware & Enrollment Status:")
    print(resp)
    print("\nListening for 8 seconds... Tap your NFC card / tag on the RC522 now!")
    
    t0 = time.time()
    card_seen = False
    while time.time() - t0 < 8:
        if s.in_waiting:
            line = s.readline().decode('utf-8', errors='ignore').strip()
            if line:
                print("ESP32 Event ->", line)
                if "RFID_CARD_DETECTED" in line:
                    card_seen = True
        time.sleep(0.05)
        
    s.close()
    if not card_seen:
        print("\nNote: No card tap was detected in the last 8 seconds.")
except Exception as e:
    print("Serial Error:", e)
