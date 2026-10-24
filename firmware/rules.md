# Local rules — `firmware` (BASTION X v2.3)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:** Firmware: verify GPIO voltages/pin labels, no direct 5V Arduino output to ESP32 input, no MCU telemetry may impersonate financial approval. ESP32_signer is sole device-side signature root; Uno#1 sensors/telemetry and Pin D8 buzzer are noncritical (16x2 LCD is decommissioned).

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
