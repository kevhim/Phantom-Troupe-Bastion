# Local rules — `firmware/esp32_signer` (BASTION X v2.3)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Single physical ESP32 development board (located exclusively on Laptop B - Intel Ultra 7 155H).
- Hardware peripherals owned directly:
  - RC522 RFID reader over SPI (SCK 18, MISO 19, MOSI 23, SS 5, RST 27).
  - Dual OLED Displays over I2C (SDA GPIO21, SCL GPIO22):
    - OLED #1 (`0x3C`): Mandatory Trusted Transaction Review Display. If missing or malfunctioning, hardware signing is strictly rejected.
    - OLED #2 (`0x3D`): Security & Status Telemetry Display (Anvil block status, session active, budget stats). Requires I2C address jumper/resistor set to `0x3D`.
  - GPIO33 Physical Approve Button (sustained hold required).
  - GPIO32 Physical Panic Button (interrupt + direct Wi-Fi RPC revocation).
- Sign only canonical EIP-712 operations after local paginated review, never export private key.
- Direct revocation RPC must report confirmed vs unavailable.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
