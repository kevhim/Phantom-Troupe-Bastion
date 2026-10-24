# Local rules — `firmware/uno_operator` (BASTION X v2.2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Owned by: Laptop B (Intel Ultra 7 155H).
- Hardware: Arduino Uno #1 with PIR (D2), DHT11 (D4), 16x2 I2C LCD (A4/A5), and optional SG90 servo (D6).
- Purpose: Non-critical environmental telemetry and status display for the supervisor desk.
- Security restriction: Strictly FORBIDDEN from generating or verifying transaction signatures. Must not be trusted by the ERC-4337 smart wallet.
