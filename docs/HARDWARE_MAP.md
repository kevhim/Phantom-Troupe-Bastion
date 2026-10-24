# Physical Architecture & Pin Assignment — V2.3

## Authoritative Two-Machine Deployment Matrix
| Node | Location | Electrical / Physical Connections | Software & Security Responsibilities |
|---|---|---|---|
| **Laptop A**<br>(RTX 5060, 32GB RAM) | Main Application & Operator Host | • Built-in / Owned Webcam<br>• Arduino Uno #2 via USB (Watchdog)<br>• **Zero ESP32s on Laptop A** | • React 18 Web Console (:5173)<br>• FastAPI Backend (:8000)<br>• AI Purchasing Agent<br>• OpenCV Vision Pipeline<br>• SQLite App DB & Mirage Sandbox<br>• **NO SIGNING KEYS STORED HERE** |
| **Laptop B**<br>(Intel Core Ultra 7 155H, 32GB RAM) | Trusted Authorization & Security Station | • **Single ESP32 Dedicated Signer & Dual OLED Controller via USB**<br>  - RC522 RFID (SPI: 18/19/23/5/27)<br>  - OLED #1 Trusted Review (I2C: 21/22 @ 0x3C, fail-closed)<br>  - OLED #2 Security & Status (I2C: 21/22 @ 0x3D, non-blocking)<br>  - Approval Button (GPIO33, sustained >= 1.5s)<br>  - Panic Button (GPIO32, interrupt)<br>• Arduino UNO Q 4GB via USB-C<br>• Arduino Uno #1 via USB<br>  - **5V Active Buzzer (Pin D8)**<br>  - Opt. PIR D2, DHT11 D4, Servo D6 | • **Local Anvil Blockchain (:8545, Chain 31337)**<br>• Compatible ERC-4337 Bundler<br>• Supervisor Auth Service (:8010)<br>• Serial Hardware Gateway<br>• UNO Q Edge Coordinator<br>• Independent Audit Storage (`C:\bastion_audit_checkpoints`) |
| **Laptop C**<br>(RTX 4060) | Cold / Hot Standby Node | • Zero mandatory hardware connected | • Hot-standby Anvil RPC mirror<br>• Emergency compute or test runner |

**Security Architecture Rules:**
1. Dedicated physical transaction signing occurs **exclusively on the single ESP32 attached to Laptop B**.
2. Laptop A hosts zero ESP32s and zero signing keys. Arduino Uno #2 on Laptop A is strictly unprivileged and CANNOT authorize transactions.
3. The local Anvil blockchain runs on Laptop B, ensuring emergency revocation broadcast directly succeeds even if Laptop A is powered down.
4. **v2.3 Buzzer Architecture:** The non-functional ESP8266 has been decommissioned. The 5V active buzzer is connected directly to **Arduino Uno #1 Digital Pin D8** on Laptop B. The alarm now depends on the Intel supervisor/Uno #1 local serial path and no longer provides independent wireless notification.
5. **v2.3 Display Architecture (Single ESP32 Dual OLED):** The 16x2 I2C LCD has been decommissioned from all required hardware configurations. Environmental monitoring, physical presence, RFID status, and hardware health are streamed directly to the React security console. OLED #1 on the single ESP32 (`0x3C`) is the sole trusted physical review screen (strictly fail-closed: reject signing if OLED #1 is unavailable or malfunctions). OLED #2 (`0x3D`) is reassigned to the same ESP32 as an auxiliary status screen (non-blocking status; unverified bench wiring pending jumper modification).

---

## Single ESP32 Dedicated Signer & Dual OLED Controller (Laptop B)
| Peripheral | Pin (ESP32-WROOM-32) | Logic Level | Notes |
|---|---|---|---|
| **RC522 SCK** | **GPIO 18** | 3.3V SPI | Clock line |
| **RC522 MISO** | **GPIO 19** | 3.3V SPI | Master In Slave Out |
| **RC522 MOSI** | **GPIO 23** | 3.3V SPI | Master Out Slave In |
| **RC522 SS (SDA)** | **GPIO 5** | 3.3V SPI | Chip Select |
| **RC522 RST** | **GPIO 27** | 3.3V GPIO | Hardware Reset |
| **OLED #1 SDA** | **GPIO 21** | 3.3V I2C | SSD1306 Trusted Review Display (`0x3C`) |
| **OLED #1 SCL** | **GPIO 22** | 3.3V I2C | 4-Page Paginated Canonical Field Review (Fail-Closed) |
| **OLED #2 SDA** | **GPIO 21** | 3.3V I2C | Shared I2C bus — Security & Status Display (`0x3D`) |
| **OLED #2 SCL** | **GPIO 22** | 3.3V I2C | Shared I2C bus — Status Telemetry (Non-blocking) |
| **Approve Button** | **GPIO 33** | 3.3V | Configured with `INPUT_PULLUP`, sustained press >= 1.5s |
| **Panic Button** | **GPIO 32** | 3.3V | Configured with `INPUT_PULLUP`, instant ISR interrupt |
| **Wi-Fi** | On-board Radio | 2.4 GHz | Direct RPC broadcast of `revokeSession` to Laptop B Anvil node |

> [!WARNING]
> **UNVERIFIED PHYSICAL WIRING (OLED #2 @ 0x3D):** Standard 0.96" SSD1306 OLED displays are factory-configured to I2C address `0x3C` (address jumper on `0x78`). Operating two displays on the shared I2C bus (SDA 21, SCL 22) requires desoldering and re-soldering the SMD address resistor on the back of OLED #2 to `0x7A` (I2C address `0x3D`). The firmware is programmed to initialize OLED #1 at `0x3C` as strictly mandatory/fail-closed, while OLED #2 at `0x3D` is probed gracefully and non-blockingly so unverified hardware does not prevent transaction reviews.

---

## Arduino Uno #1 Environmental & 5V Active Buzzer Node (Laptop B)
| Peripheral | Pin | Logic Level | Purpose |
|---|---|---|---|
| **Active Buzzer** | **D8** | 5V Output | Physical audio alarm actuation (Active HIGH) driven by Laptop B Supervisor |
| **Optional PIR Sensor** | **D2** | 5V Input | Optical motion observation (auxiliary telemetry forwarded to React UI) |
| **Optional DHT11 Sensor** | **D4** | 5V Digital | Ambient temperature and humidity context (forwarded to React UI) |
| **Optional SG90 Servo** | **D6 (PWM)** | 5V PWM | Mechanical demonstration flag (if verified) |

> [!NOTE]
> **Decommissioned:** The 16x2 I2C LCD (previously on A4/A5) has been removed from all required hardware configurations. Environmental and status monitoring is displayed on the React security console.

---

## Arduino UNO Q 4GB (Laptop B)
- Connected to Laptop B via USB-C.
- Runs Linux edge coordinator service (`services/edge-q/src/edge_coordinator.py`).
- Collects and aggregates sensor telemetry, coordinates hardware gateway health, and forwards tamper alerts.

---

## Hardware Inventory Correction: Removal of Physical ESP32 #2
- The physical hardware inventory contains exactly **ONE ESP32 development board**.
- The second physical board (`ESP32 #2` / `esp32_telemetry` on Laptop A) has been **permanently eliminated**.
- Laptop A operates with zero ESP32s and holds zero signing keys.
- Auxiliary status display duties are consolidated onto the single ESP32 on Laptop B as OLED #2 (`0x3D`).

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
