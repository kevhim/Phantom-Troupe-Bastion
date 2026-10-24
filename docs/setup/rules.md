# Local rules — `docs/setup` (BASTION X v2.2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Official deployment, runbooks, and per-laptop configuration specifications.
- Authoritative for Laptop A (RTX 5060), Laptop B (Intel Ultra 7 155H), and Laptop C (RTX 4060).
- Must always reflect the distributed Two-Laptop topology: Laptop A runs UI/API/Agent/Vision; Laptop B runs Anvil Blockchain/Bundler/ESP32 Signer/Supervisor/UNO Q; Laptop C is Standby only.
- No secrets or real private keys may ever be added to setup guides.
