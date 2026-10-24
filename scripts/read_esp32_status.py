import serial
import json
import time

s = serial.Serial('COM10', 115200, timeout=1)
time.sleep(1.5)
s.reset_input_buffer()
s.write(b'{"action":"HEARTBEAT"}\n')
time.sleep(0.5)
lines = s.read_all().decode('utf-8', errors='ignore')
print("Lines from ESP32:\n", lines)
s.close()
