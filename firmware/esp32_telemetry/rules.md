# Local rules — `firmware/esp32_telemetry` (BASTION X v2.2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Owned by: Laptop A (RTX 5060).
- Hardware: ESP32 #2 with OLED #2 (SDA GPIO21, SCL GPIO22).
- Purpose: Operator-side telemetry display only (spent funds, security state, agent task).
- Security rule: STRICTLY FORBIDDEN from generating or holding transaction signing keys. Never authorize or co-sign transactions.
