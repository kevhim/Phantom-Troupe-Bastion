# GitHub Collaboration / Coding Agent Protocol V2

Four contributors share one repo, separate branches and ownership paths. Root `PROJECT_MASTER.md` = single source of architectural truth. Root `AGENTS.md` and `CLAUDE.md` plus **EVERY DIRECTORY's `rules.md`** guide agents. At task start coding agent must read master, nearest rules, relevant protocol/security document. Never silently invent interface values or claim tests pass.

Branch convention: `feat/contracts-4337`, `feat/esp32-signer`, `feat/api-agent`, `feat/frontend-soc`; submit PRs to `develop`, tag known working demo release. Cross-cutting schema changes need explicit review from contract+firmware owners. Changes to shared EIP712 fields require coordinated firmware, Solidity, frontend, schemas, Foundry test vectors and master file update in same PR. Each PR includes tests, screenshots, as-built wiring updates if relevant, and explicit what is simulated.

Use `.env.example` with fake addresses only, real `.env` gitignored. Never commit wallet key, hardware signer seed, phone/address data, user photos, binary model files or generated build artifacts. Git LFS only if approved; prefer instructions and hashed reproducible downloads. One physical board has one gateway owner; do not push USB binary blobs into repo when reproducible firmware source exists.

## Agent start prompt
"Read PROJECT_MASTER.md and AGENTS.md first, then every rules.md from root to your assigned directory. Read TRUSTED_SIGNER_DESIGN.md, CONTRACT_DESIGN.md, and SECURITY_THREAT_MODEL.md for any money/hardware change. Implement only your assigned module against schemas; do not touch other folders without coordination. Add negative tests, run them, and report actual output without pretending TODOs are complete."
