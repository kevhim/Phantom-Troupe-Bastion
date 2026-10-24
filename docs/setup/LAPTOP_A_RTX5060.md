# Laptop A Deployment Guide — NVIDIA RTX 5060

**Role:** AI Application Host, Operator Telemetry, Computer Vision & Frontend Console  
**Host Specifications:** Windows 11, NVIDIA RTX 5060 GPU, 32 GB RAM  
**Security Boundary:** Untrusted/Application Domain (Must NEVER hold owner root keys or privileged ESP32 hardware signing keys)

---

## 1. Assigned Responsibilities & Software Services
Laptop A runs the user-facing and AI workload:
- **React 18 + TypeScript Web Console** (`apps/web` on port 5173)
- **FastAPI Core Backend** (`services/api` on port 8000)
- **AI Purchasing Agent** (`services/agent/src/purchasing_agent.py`)
- **OpenCV + MediaPipe Vision Pipeline** (`services/vision/src/camera_service.py`)
- **Mirage Deception Sandbox** (`services/mirage/mirage_engine.py`)
- **Application SQLite Database & Audit Flight Recorder Cache**
- **ERC-4337 UserOperation Client** (Submitting to Laptop B's Anvil node over LAN)

---

## 2. Connected Hardware & Pin Assignments
All devices connect directly to Laptop A USB ports:

| Peripheral | Controller / Pin | Function | Logic Level |
|---|---|---|---|
| **Webcam** | Direct USB (or built-in) | Face counting & challenge-response liveness | Optical only (Auxiliary) |
| **ESP32 #2** | USB to Laptop A | Operator telemetry controller (NO signing keys) | 3.3V USB |
| **OLED #2** | SDA: GPIO 21, SCL: GPIO 22 | Operator security & transaction display | 3.3V I2C (0x3C) |
| **Arduino Uno #2** | USB to Laptop A | Watchdog, diagnostic heartbeat & fault generator | 5V Serial (9600 baud) |

> [!NOTE]
> **v2.3 Architecture Notice:** The non-functional ESP8266 has been decommissioned. The 5V active buzzer is connected directly to **Arduino Uno #1 (Digital Pin D8)** on Laptop B. Laptop A has zero active alarm hardware dependencies.

---

## 3. Software Prerequisites
- Windows 11 (64-bit)
- Python 3.11, 3.12, or 3.13 (`python --version`)
- Node.js v18+ or v20+ (`node --version`) and npm (`npm --version`)
- Arduino CLI or Arduino IDE 2.x
- Git (`git --version`)
- Windows PowerShell 5.1 or PowerShell 7+

---

## 4. Repository Setup & Environment Configuration
```powershell
# Clone or navigate to the repository
cd d:\Desktop\Bastion

# Create Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install required Python dependencies
pip install --upgrade pip
pip install web3 eth-account fastapi uvicorn pydantic reportlab pytest requests

# Install web dependencies
cd apps\web
npm install
cd ..\..
```

Create environment file `.env.laptop_a`:
```ini
BASTION_LAPTOP_ROLE=A
ANVIL_RPC_URL=http://<LAPTOP_B_IP>:8545
SUPERVISOR_URL=http://<LAPTOP_B_IP>:8010
ALERT_SHARED_SECRET=BASTION_SECURE_LAN_ALERT_KEY_2026
PORT=8000
WEB_PORT=5173
```

---

## 5. Firmware Flashing Procedures (Laptop A Devices)

### A. ESP32 #2 (Operator Telemetry)
```powershell
# Compile & Upload via Arduino CLI
arduino-cli compile --fqbn esp32:esp32:esp32 firmware/esp32_telemetry/esp32_telemetry.ino
arduino-cli upload -p COM_ESP32_A --fqbn esp32:esp32:esp32 firmware/esp32_telemetry/esp32_telemetry.ino
```

### B. Arduino Uno #2 (Watchdog)
```powershell
arduino-cli compile --fqbn arduino:avr:uno firmware/uno_watchdog/uno_watchdog.ino
arduino-cli upload -p COM_UNO2_A --fqbn arduino:avr:uno firmware/uno_watchdog/uno_watchdog.ino
```

---

## 6. Service Startup Commands
Open three separate PowerShell terminal windows on Laptop A:

### Terminal 1: FastAPI Application Core
```powershell
cd d:\Desktop\Bastion
.\.venv\Scripts\Activate.ps1
$env:ANVIL_RPC_URL = "http://<LAPTOP_B_IP>:8545"
python -m uvicorn services.api.src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2: React 18 Web Console
```powershell
cd d:\Desktop\Bastion\apps\web
npm run dev -- --host 0.0.0.0 --port 5173
```
*Access Web Console:* `http://localhost:5173`

### Terminal 3: Automated Health & Diagnostics
```powershell
cd d:\Desktop\Bastion
.\scripts\check_laptop_a.ps1
```

---

## 7. Health Check & Validation
Verify that Laptop A is functioning correctly:
```powershell
# 1. Test FastAPI Overview Endpoint
curl http://localhost:8000/api/v2/overview

# Expected JSON snippet:
# {
#   "smart_account": { "address": "0x00...bb" },
#   "hosts": {
#     "laptop_a": { "status": "ONLINE", "role": "Application Host..." },
#     "laptop_b": { "blockchain": "Anvil RPC :8545..." }
#   }
# }

# 2. Run Python Automated Test Suite
python -m pytest tests/ -v
```

---

## 8. Safe Shutdown & Restart
- To stop: Press `Ctrl + C` in each running terminal.
- To restart: Re-run Terminal 1 and Terminal 2 commands.
