# Local rules — `services/supervisor` (BASTION X v2.2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Owned by: Laptop B (Intel Ultra 7 155H).
- Purpose: Supervisor authorization service, independent audit checkpoint storage (`C:\bastion_audit_checkpoints`), hardware gateway orchestration, and direct RPC emergency revocation.
- Security boundary: Preserves audit checkpoints outside Laptop A's application database. Coordinates with single ESP32 signer without ever exporting private signing keys to the application layer.
