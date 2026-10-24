# Laptop B Deployment Guide — Intel Core Ultra 7 155H

**Role:** Trusted Authorization, Physical Embedded Security, Local Blockchain & Supervisor Workstation  
**Host Specifications:** Windows 11, Intel Core Ultra 7 155H, 32 GB RAM, Integrated Intel Arc Graphics  
**Security Boundary:** Trusted Security Domain (Hosts dedicated hardware signer, independent audit checkpoints, and root blockchain RPC)

---

## 1. Assigned Responsibilities & Software Services
Laptop B is the security root of the two-machine deployment:
- **Local Anvil Blockchain Node** (`anvil --chain-id 31337 --port 8545 --host 0.0.0.0`)
- **Compatible ERC-4337 Bundler Service**
- **Supervisor Authorization & Audit Service** (`services/supervisor/supervisor_service.py` on port 8010)
- **Laptop B Hardware Serial Gateway** (`services/gateway/src/serial_gateway.py`)
- **Arduino UNO Q 4GB Edge Security Integration** (`services/edge-q/src/edge_coordinator.py`)
- **Independent Audit Checkpoint Storage** (`C:\bastion_audit_checkpoints` or `/opt/bastion/audit_checkpoints`)
- **Independent Emergency Revocation Endpoint** (Direct RPC caller using revoker role key)

---

## 2. Connected Hardware & Pin Assignments
All critical physical authorization controllers connect directly to Laptop B:

### A. ESP32 #1 Dedicated Transaction Signer
| Peripheral Component | ESP32 #1 Pin | Logic Level | Notes |
|---|---|---|---|
| **RC522 RFID SCK** | **GPIO 18** | 3.3V SPI | Standard SPI Clock |
| **RC522 RFID MISO** | **GPIO 19** | 3.3V SPI | Master In Slave Out |
| **RC522 RFID MOSI** | **GPIO 23** | 3.3V SPI | Master Out Slave In |
| **RC522 RFID SS (SDA)** | **GPIO 5** | 3.3V SPI | Chip Select |
| **RC522 RFID RST** | **GPIO 27** | 3.3V GPIO | Hardware Reset |
| **SSD1306 OLED #1 SDA** | **GPIO 21** | 3.3V I2C | Trusted Review Screen (0x3C) |
| **SSD1306 OLED #1 SCL** | **GPIO 22** | 3.3V I2C | 4-Page Paginated Review |
| **Approve Button** | **GPIO 33** | 3.3V (Pull-up) | `INPUT_PULLUP`, sustained press >= 1.5s |
| **Panic Button** | **GPIO 32** | 3.3V (Pull-up) | `INPUT_PULLUP`, instant ISR interrupt |
| **Wi-Fi Radio** | Internal Antenna | 2.4 GHz | Direct RPC broadcast to local Anvil node |

### B. Arduino UNO Q 4GB (Edge Security Node)
- Connects to Laptop B via **USB-C**.
- Runs Linux edge coordinator service monitoring gateway health and forwarding tamper alarms.

### C. Arduino Uno #1 (Environmental & Status Node)
| Peripheral Component | Arduino Uno #1 Pin | Purpose |
|---|---|---|
| **PIR Sensor** | **D2** | Optical motion detection (non-critical) |
| **DHT11 Sensor** | **D4** | Temperature / humidity telemetry |
| **16x2 I2C LCD** | **A4 (SDA), A5 (SCL)** | Local node status display (0x27) |
| **Optional SG90 Servo** | **D6 (PWM)** | Mechanical flag indicator |

---

## 3. Software Prerequisites
- Windows 11 (64-bit)
- Python 3.11+ (`python --version`)
- Foundry suite with `anvil` installed (`anvil --version`)
- Arduino CLI or Arduino IDE 2.x
- Git (`git --version`)
- Windows PowerShell 5.1 or PowerShell 7+

---

## 4. Repository Setup & Environment Configuration
```powershell
# Navigate to the repository
cd d:\Desktop\Bastion

# Virtual environment setup
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install Python requirements
pip install --upgrade pip
pip install web3 eth-account fastapi uvicorn pydantic pytest requests
```

Create environment file `.env.laptop_b`:
```ini
BASTION_LAPTOP_ROLE=B
ANVIL_PORT=8545
ANVIL_CHAIN_ID=31337
SUPERVISOR_PORT=8010
BASTION_CHECKPOINT_DIR=C:\bastion_audit_checkpoints
ALERT_SHARED_SECRET=BASTION_SECURE_LAN_ALERT_KEY_2026
ESP8266_ALERT_IP=http://<ESP8266_WIFI_IP>:80/alarm
```

---

## 5. Firmware Flashing Procedures (Laptop B Devices)

### A. ESP32 #1 (Dedicated Signer)
```powershell
arduino-cli compile --fqbn esp32:esp32:esp32 firmware/esp32_signer/esp32_signer.ino
arduino-cli upload -p COM_ESP32_B --fqbn esp32:esp32:esp32 firmware/esp32_signer/esp32_signer.ino
```

### B. Arduino Uno #1 (Sensors & LCD)
```powershell
arduino-cli compile --fqbn arduino:avr:uno firmware/uno_operator/uno_operator.ino
arduino-cli upload -p COM_UNO1_B --fqbn arduino:avr:uno firmware/uno_operator/uno_operator.ino
```

---

## 6. Service Startup Commands
Open three separate PowerShell terminal windows on Laptop B:

### Terminal 1: Local Anvil Blockchain Node
```powershell
anvil --chain-id 31337 --port 8545 --host 0.0.0.0
```
*Note:* Binding to `0.0.0.0` allows Laptop A and ESP32 #1 to access the RPC over the private hackathon LAN.

### Terminal 2: Supervisor Authorization Service
```powershell
cd d:\Desktop\Bastion
.\.venv\Scripts\Activate.ps1
python -m uvicorn services.supervisor.supervisor_service:app --host 0.0.0.0 --port 8010 --reload
```

### Terminal 3: Edge Security Coordinator (UNO Q)
```powershell
cd d:\Desktop\Bastion
.\.venv\Scripts\Activate.ps1
python services/edge-q/src/edge_coordinator.py
```

---

## 7. Health Check & Validation
```powershell
# 1. Check Anvil RPC block height
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H "Content-Type: application/json" http://localhost:8545

# 2. Check Supervisor Health Endpoint
curl http://localhost:8010/supervisor/health

# 3. Run Validation Diagnostics
.\scripts\check_laptop_b.ps1
```

---

## 8. Safe Shutdown & Emergency Revocation
- **Physical Panic Test:** Press GPIO32 on ESP32 #1. The signer displays `PANIC TRIGGERED`, broadcasts `revokeSession` directly to `http://localhost:8545`, and sounds the remote buzzer on Laptop A over Wi-Fi.
- **Stop Services:** Press `Ctrl + C` in Terminal 1, Terminal 2, and Terminal 3.
