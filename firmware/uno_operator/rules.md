# Local rules — `firmware/uno_operator` (BASTION X v2.3)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Owned by: Laptop B (Intel Ultra 7 155H).
- Hardware: Arduino Uno #1 with 5V Active Buzzer (Pin D8), and optional PIR (D2), DHT11 (D4), and SG90 servo (D6).
- 16x2 I2C LCD Status: **DECOMMISSIONED**. The 16x2 I2C LCD has been removed from all required hardware configurations. Environmental and status monitoring is streamed via serial to the React console.
- Purpose: Non-critical environmental telemetry, physical audio alarm actuation (Pin D8) driven by the Laptop B Supervisor Service, and presence sensing.
- Security restriction: Strictly FORBIDDEN from generating or verifying transaction signatures. Must not be trusted by the ERC-4337 smart wallet.
- v2.3 Evolution: Replaced decommissioned ESP8266 remote buzzer with direct local buzzer actuation on Pin D8. Removed 16x2 I2C LCD requirement.
