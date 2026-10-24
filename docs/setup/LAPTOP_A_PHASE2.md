# Laptop A (RTX 5060) — Phase 2 Deployment & Operation Runbook

## 1. Machine Specifications & Role
- **Hardware:** Intel Core / AMD processor, NVIDIA RTX 5060 GPU, 32GB RAM, Windows 11.
- **Architectural Role:** Untrusted Application Host & Operator Station.
- **Running Services:**
  - React Web Console (`http://localhost:5173` or `http://0.0.0.0:5173`)
  - FastAPI Application Backend (`http://localhost:8000`)
  - AI Purchasing Agent Workbench (`services/agent/`)
  - Adversarial Hijack Attack Simulator (`tests/adversarial/`)
  - OpenCV Vision & Liveness Monitoring (`services/vision/`)
  - Mirage Honeypot Deception Engine (`services/mirage/`)
  - Forensic Flight Recorder Exporter (`services/api/src/evidence/`)
- **Connected Hardware Peripherals:**
  - Standard Webcam (Face Tracking & Optical Liveness)
  - Arduino Uno #2 (Hardware Watchdog & Fault Simulator)
  - *(Zero ESP32s on Laptop A; single ESP32 is on Laptop B; ESP8266 decommissioned)*
- **Security Boundary Constraint:** Laptop A **NEVER** stores the Owner private key, the ESP32 supervisor key, or guardian recovery keys.

---

## 2. Prerequisites & Environment Setup

### A. Python Environment
```powershell
# Open Windows PowerShell as Administrator
cd c:\Users\anshk\Projects\Hackathon\Bastion

# Verify Python 3.11+ is installed
python --version

# Install project dependencies
python -m pip install -r services/api/requirements.txt
python -m pip install reportlab pytest pytest-asyncio
```

### B. Node.js & Web UI Setup
```powershell
# Navigate to web application directory
cd c:\Users\anshk\Projects\Hackathon\Bastion\apps\web

# Install npm dependencies
npm install

# Build production bundle to verify types
npm run build
```

---

## 3. Starting Laptop A Services

### Service 1: Launch FastAPI Backend (Port 8000)
```powershell
cd c:\Users\anshk\Projects\Hackathon\Bastion
python -m uvicorn services.api.src.main:app --host 0.0.0.0 --port 8000 --reload
```
*Health Check:* Open `http://localhost:8000/api/v2/system/health` in your browser.

### Service 2: Launch Vite React Console (Port 5173)
```powershell
cd c:\Users\anshk\Projects\Hackathon\Bastion\apps\web
npm run dev -- --host 0.0.0.0 --port 5173
```
*Web Console:* Open `http://localhost:5173` in your browser.

---

## 4. Running Adversarial Hijack Tests on Laptop A

Run the comprehensive 9-scenario adversarial hijack containment test suite:
```powershell
cd c:\Users\anshk\Projects\Hackathon\Bastion
pytest tests/adversarial/test_hijack_containment.py -v -s
```
*Expected Output:* 9 passed in ~1.8 seconds. Generates `data/anomaly_evaluation_report.json`.

---

## 5. Laptop A Troubleshooting
- **Port 8000 in use:** `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force`
- **Port 5173 in use:** `Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force`
- **Cannot connect to Laptop B Blockchain (:8545):** Check Windows Defender Firewall on Laptop B; ensure Anvil was started with `--host 0.0.0.0`.
