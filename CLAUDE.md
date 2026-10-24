# Claude / Coding Agent Context Entry — BASTION X v2.3

Read `PROJECT_MASTER.md` and `AGENTS.md`, then directory-local `rules.md` and relevant docs in `docs/`.
BASTION X v2.3 Two-Laptop Distributed Architecture:
- Laptop A (RTX 5060): React 18 Console (`apps/web` :5173), FastAPI (`services/api` :8000), AI Purchasing Agent (`services/agent`), OpenCV Vision (`services/vision`), ESP32 #2 OLED #2 telemetry, Uno #2 watchdog. (ESP8266 decommissioned).
- Laptop B (Intel Ultra 7 155H): Local Anvil Blockchain (`:8545`, Chain ID 31337), ERC-4337 Bundler, ESP32 #1 Dedicated Signer (`firmware/esp32_signer`), Arduino UNO Q 4GB Edge Coordinator (`services/edge-q`), Arduino Uno #1 with 5V Active Buzzer on Pin D8 (`firmware/uno_operator`), Supervisor Service (`services/supervisor` :8010), Independent Audit Storage (`C:\bastion_audit_checkpoints`).
- Laptop C (RTX 4060): Standby Node (Anvil mirror & compute backup).

Keep EIP-712 struct/ABI identical across ESP32, Solidity and UI. Anvil blockchain is hosted on Laptop B; emergency revocation broadcasts directly to Laptop B's Anvil RPC. Physical buzzer alarm is actuated locally by Arduino Uno #1 Pin D8 via Laptop B Supervisor.
