# Local rules — `firmware/esp8266_alert` (BASTION X v2.2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Owned by: Powered via USB on Laptop A (RTX 5060), but belongs to the security alert broadcast domain controlled by Laptop B (Intel Ultra 7).
- Hardware: ESP8266 NodeMCU with active buzzer on D1 (GPIO 5) and status LED on D4 (GPIO 2).
- Purpose: Remote audio/visual alarm triggered directly over Wi-Fi when a physical panic or hardware tamper event occurs on Laptop B.
- Security restriction: Strictly FORBIDDEN from authorizing payments or issuing signatures. Never route alerts through Laptop A's application backend.
