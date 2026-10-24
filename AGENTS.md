# Agent Entry Point — Bastion X V2.3

Read `PROJECT_MASTER.md`, `rules.md`, the complete ancestor path of nested `rules.md`, and domain docs for the component you edit. Key domains: `docs/HARDWARE_MAP.md`, `docs/CONTRACT_DESIGN.md`, `docs/TRUSTED_SIGNER_DESIGN.md`, `docs/SECURITY_THREAT_MODEL.md`, `docs/setup/TWO_LAPTOP_INTEGRATION.md`.

Never implement host-side ESP32 transaction signing. Real chain must enforce spending independently of agent/backend.
Two active computers:
- Laptop A (RTX 5060): Web console (:5173), FastAPI backend (:8000), AI purchasing agent, OpenCV vision, SQLite DB, ESP32 #2 (OLED #2 telemetry), Uno #2 (watchdog).
- Laptop B (Intel Ultra 7 155H): **Local Anvil Blockchain (:8545, Chain 31337)**, ERC-4337 bundler, ESP32 #1 (dedicated signer + OLED #1 + RC522 + buttons), Arduino UNO Q 4GB (edge node), Arduino Uno #1 (5V Active Buzzer Pin D8 + LCD status), supervisor service (:8010).
- Laptop C (RTX 4060): Standby node.
Never confuse RFID UID with cryptographic authentication.

BASTION X v2.3 implements:
1. `contracts/src/BastionAccount.sol`: ERC-4337 smart account with all 6 W3-02 spending policies and EIP-712 dual-authorization verification.
2. `services/device_crypto/crypto_engine.py`: Canonical EIP-712 typing, hashing, and verification.
3. `services/api/src/hardware/health_manager.py`: Fail-closed hardware states and direct emergency revocation.
4. `services/api/src/evidence/flight_recorder.py`: Verifiable SHA-256 hash-chained forensic audit trail with PDF exporter.
5. `services/mirage/mirage_engine.py`: Isolated synthetic honeypot deception layer.
6. `apps/web/src/App.tsx`: 8-route React security console with partitioned Two-Laptop Hardware & SOC matrices.
7. `firmware/`: Dedicated firmware for ESP32 #1, ESP32 #2, Uno #1 (5V Active Buzzer D8), Uno #2, and archived ESP8266.
8. `docs/setup/`: Standalone per-laptop deployment runbooks.
9. `tests/`: 34 automated tests passing 100%.
10. Architectural evolution: Decommissioned ESP8266; alarm now driven locally via Arduino Uno #1 Pin D8 on Laptop B.
