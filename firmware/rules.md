# Local rules — `firmware` (BASTION X v2.3)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Single physical ESP32 board in the entire system, located on Laptop B (Intel Ultra 7 155H), running `firmware/esp32_signer`. Drives OLED #1 (0x3C review), OLED #2 (0x3D security status), RC522 SPI, GPIO33, and GPIO32.
- Laptop A (RTX 5060) has zero ESP32 boards (only Arduino Uno #2 watchdog and webcam).
- Verify GPIO voltages/pin labels; no direct 5V Arduino output to ESP32 input; no MCU telemetry may impersonate financial approval.
- Arduino Uno #1 drives Pin D8 buzzer and environmental telemetry (PIR on D2, DHT11 on D4).
- 16x2 LCD and ESP8266 are decommissioned and must never be required.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
