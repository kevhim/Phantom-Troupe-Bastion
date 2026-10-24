# Physical Architecture & Pin Assignment — V2.3

## Authoritative Two-Machine Deployment Matrix
| Node | Location | Electrical / Physical Connections | Software & Security Responsibilities |
|---|---|---|---|
| **Laptop A**<br>(RTX 5060, 32GB RAM) | Main Application & Operator Host | • Built-in / Owned Webcam<br>• ESP32 #2 via USB (OLED #2 on GPIO21/22)<br>• Arduino Uno #2 via USB (Watchdog) | • React 18 Web Console (:5173)<br>• FastAPI Backend (:8000)<br>• AI Purchasing Agent<br>• OpenCV Vision Pipeline<br>• SQLite App DB & Mirage Sandbox<br>• **NO SIGNING KEYS STORED HERE** |
| **Laptop B**<br>(Intel Core Ultra 7 155H, 32GB RAM) | Trusted Authorization & Security Station | • ESP32 #1 Dedicated Signer via USB<br>  - RC522 RFID (SPI: 18/19/23/5/27)<br>  - OLED #1 Trusted Review (I2C: 21/22)<br>  - Approval Button (GPIO33, sustained)<br>  - Panic Button (GPIO32, interrupt)<br>• Arduino UNO Q 4GB via USB-C<br>• Arduino Uno #1 via USB<br>  - **5V Active Buzzer (Pin D8)**<br>  - 16x2 I2C LCD (A4/A5)<br>  - Opt. PIR D2, DHT11 D4, Servo D6 | • **Local Anvil Blockchain (:8545, Chain 31337)**<br>• Compatible ERC-4337 Bundler<br>• Supervisor Auth Service (:8010)<br>• Serial Hardware Gateway<br>• UNO Q Edge Coordinator<br>• Independent Audit Storage (`C:\bastion_audit_checkpoints`) |
| **Laptop C**<br>(RTX 4060) | Cold / Hot Standby Node | • Zero mandatory hardware connected | • Hot-standby Anvil RPC mirror<br>• Emergency compute or test runner |

**Security Architecture Rules:**
1. Dedicated physical transaction signing occurs **exclusively on ESP32 #1 attached to Laptop B**.
2. Laptop A's ESP32 #2 and Arduino Uno #2 are strictly unprivileged and CANNOT authorize transactions.
3. The local Anvil blockchain runs on Laptop B, ensuring emergency revocation broadcast directly succeeds even if Laptop A is powered down.
4. **v2.3 Buzzer Architecture:** The non-functional ESP8266 has been decommissioned. The 5V active buzzer is connected directly to **Arduino Uno #1 Digital Pin D8** on Laptop B. The alarm now depends on the Intel supervisor/Uno #1 local serial path and no longer provides independent wireless notification.

---

## ESP32 #1 Dedicated Signer (Laptop B)
| Peripheral | Pin (ESP32-WROOM-32) | Logic Level | Notes |
|---|---|---|---|
| **RC522 SCK** | **GPIO 18** | 3.3V SPI | Clock line |
| **RC522 MISO** | **GPIO 19** | 3.3V SPI | Master In Slave Out |
| **RC522 MOSI** | **GPIO 23** | 3.3V SPI | Master Out Slave In |
| **RC522 SS (SDA)** | **GPIO 5** | 3.3V SPI | Chip Select |
| **RC522 RST** | **GPIO 27** | 3.3V GPIO | Hardware Reset |
| **OLED #1 SDA** | **GPIO 21** | 3.3V I2C | SSD1306 Trusted Review Display (0x3C) |
| **OLED #1 SCL** | **GPIO 22** | 3.3V I2C | 4-Page Paginated Canonical Field Review |
| **Approve Button** | **GPIO 33** | 3.3V | Configured with `INPUT_PULLUP`, sustained press >= 1.5s |
| **Panic Button** | **GPIO 32** | 3.3V | Configured with `INPUT_PULLUP`, instant ISR interrupt |
| **Wi-Fi** | On-board Radio | 2.4 GHz | Direct RPC broadcast of `revokeSession` to Laptop B Anvil node |

---

## Arduino Uno #1 Status & 5V Active Buzzer Node (Laptop B)
| Peripheral | Pin | Logic Level | Purpose |
|---|---|---|---|
| **Active Buzzer** | **D8** | 5V Output | Physical audio alarm actuation (Active HIGH) driven by Laptop B Supervisor |
| **16x2 I2C LCD** | **A4 (SDA), A5 (SCL)** | 5V I2C | Local desk status (0x27 or 0x3F); secondary status only |
| **Optional PIR Sensor** | **D2** | 5V Input | Optical motion observation (auxiliary telemetry) |
| **Optional DHT11 Sensor** | **D4** | 5V Digital | Ambient temperature and humidity context |
| **Optional SG90 Servo** | **D6 (PWM)** | 5V PWM | Mechanical demonstration flag (if verified) |

---

## Arduino UNO Q 4GB (Laptop B)
- Connected to Laptop B via USB-C.
- Runs Linux edge coordinator service (`services/edge-q/src/edge_coordinator.py`).
- Collects and aggregates sensor telemetry, coordinates hardware gateway health, and forwards tamper alerts.

---

## ESP32 #2 Operator Telemetry (Laptop A)
- Connected to Laptop A via USB.
- Connected to **OLED #2** via I2C (SDA **GPIO 21**, SCL **GPIO 22**).
- Displays operator status, daily budget progress, and security health.
- **Holds NO signing keys and cannot sign transactions.**

---

## Arduino Uno #2 Auxiliary Watchdog (Laptop A)
- Connected to Laptop A via USB.
- Runs watchdog heartbeat and simulated fault injector (`firmware/uno_watchdog/uno_watchdog.ino`).
- **Strictly untrusted for financial approvals.**

---

## Decommissioned / Archived: ESP8266 NodeMCU
- The ESP8266 remote Wi-Fi buzzer has been **permanently decommissioned** from active deployment in v2.3 due to physical module unreliability.
- Active buzzer duties are consolidated on **Arduino Uno #1 (Pin D8)** on Laptop B.
- Firmware is preserved in `firmware/esp8266_alert/` for historical reference only.
- A missing ESP8266 **never** blocks application startup or security-state transitions.
