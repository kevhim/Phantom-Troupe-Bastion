# Physical Architecture & Pin Assignment — V2.2

## Authoritative Two-Machine Deployment Matrix
| Node | Location | Electrical / Physical Connections | Software & Security Responsibilities |
|---|---|---|---|
| **Laptop A**<br>(RTX 5060, 32GB RAM) | Main Application & Operator Host | • Built-in / Owned Webcam<br>• ESP32 #2 via USB (OLED #2 on GPIO21/22)<br>• Arduino Uno #2 via USB (Watchdog)<br>• ESP8266 NodeMCU via USB (5V power for Active Buzzer on D1/GPIO5, LED on D4/GPIO2) | • React 18 Web Console (:5173)<br>• FastAPI Backend (:8000)<br>• AI Purchasing Agent<br>• OpenCV Vision Pipeline<br>• SQLite App DB & Mirage Sandbox<br>• **NO SIGNING KEYS STORED HERE** |
| **Laptop B**<br>(Intel Core Ultra 7 155H, 32GB RAM) | Trusted Authorization & Security Station | • ESP32 #1 Dedicated Signer via USB<br>  - RC522 RFID (SPI: 18/19/23/5/27)<br>  - OLED #1 Trusted Review (I2C: 21/22)<br>  - Approval Button (GPIO33, sustained)<br>  - Panic Button (GPIO32, interrupt)<br>• Arduino UNO Q 4GB via USB-C<br>• Arduino Uno #1 via USB (PIR D2, DHT11 D4, LCD A4/A5, Servo D6) | • **Local Anvil Blockchain (:8545, Chain 31337)**<br>• Compatible ERC-4337 Bundler<br>• Supervisor Auth Service (:8010)<br>• Serial Hardware Gateway<br>• UNO Q Edge Coordinator<br>• Independent Audit Storage (`C:\bastion_audit_checkpoints`) |
| **Laptop C**<br>(RTX 4060) | Cold / Hot Standby Node | • Zero mandatory hardware connected | • Hot-standby Anvil RPC mirror<br>• Emergency compute or test runner |

**Security Architecture Rule:**
1. Dedicated physical transaction signing occurs **exclusively on ESP32 #1 attached to Laptop B**.
2. Laptop A's ESP32 #2 and Arduino Uno #2 are strictly unprivileged and CANNOT authorize transactions.
3. The local Anvil blockchain runs on Laptop B, ensuring emergency revocation broadcast directly succeeds even if Laptop A is powered down.
4. ESP8266 is powered from Laptop A for wiring convenience, but receives authenticated alert triggers directly from Laptop B over Wi-Fi.

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

## Arduino Uno #1 Environmental & Status Node (Laptop B)
| Peripheral | Pin | Logic Level | Purpose |
|---|---|---|---|
| **PIR Sensor** | **D2** | 5V Input | Optical motion observation (auxiliary telemetry) |
| **DHT11 Sensor** | **D4** | 5V Digital | Ambient temperature and humidity context |
| **16x2 I2C LCD** | **A4 (SDA), A5 (SCL)** | 5V I2C | Local desk status; NOT trusted payment confirmation |
| **Optional SG90 Servo** | **D6 (PWM)** | 5V PWM | Mechanical demonstration flag (if verified) |

## Arduino UNO Q 4GB (Laptop B)
- Connected to Laptop B via USB-C.
- Runs Linux edge coordinator service (`services/edge-q/src/edge_coordinator.py`).
- Collects and aggregates sensor telemetry, coordinates hardware gateway health, and forwards tamper alerts.

## ESP32 #2 Operator Telemetry (Laptop A)
- Connected to Laptop A via USB.
- Connected to **OLED #2** via I2C (SDA **GPIO 21**, SCL **GPIO 22**).
- Displays operator status, daily budget progress, and security health.
- **Holds NO signing keys and cannot sign transactions.**

## Arduino Uno #2 Auxiliary Watchdog (Laptop A)
- Connected to Laptop A via USB.
- Runs watchdog heartbeat and simulated fault injector (`firmware/uno_watchdog/uno_watchdog.ino`).
- **Strictly untrusted for financial approvals.**

## ESP8266 NodeMCU & Active Buzzer (Laptop A)
- Connected to Laptop A USB port for 5V power (VU rail).
- Active buzzer signal on **D1 (GPIO 5)**; status LED on **D4 (GPIO 2)**.
- Listens over Wi-Fi on port 80 for authenticated alarm messages (`X-Bastion-Alert-Secret`) sent from Laptop B.
- Completely independent of Laptop A's FastAPI backend.

## Connectivity & Emergency Revocation Boundaries
Because the local Anvil test blockchain is hosted on **Laptop B (:8545)**:
- Laptop A submits application-level UserOperations to Laptop B over LAN.
- When the physical panic button (GPIO32) is pressed on ESP32 #1, the device broadcasts `revokeSession` directly to `http://localhost:8545` on Laptop B.
- Revocation succeeds even if Laptop A crashes, loses network, or is compromised!

## Physical and electrical safety checklist
- Label all board USB connections, COM device IDs, cables; no guessed COM5.
- Verify actual ESP32 variant and GPIO availability/strapping constraints before final flashing.
- Power 3.3V components from a suitable 3.3V supply. Never use Arduino digital pins as a power rail.
- Avoid tying multiple laptop 5V USB power supplies together; isolated breadboard sections when necessary; ground only shared circuits explicitly.
- Check current draw of OLED, RC522 and ESP32 against regulator limits. Don't drive a 5V buzzer or servo from ESP32 GPIO.
- Configure GPIO pullups/debounce, have restart/watchdog behavior, and test what happens on power loss.
- Take clear photos of **as-built** wiring and amend this document; example pin map is a proposed reference, not verified hardware measurement.
