# Local rules — `services/api/src/policies` (BASTION X V2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:** Backend and gateways are untrusted for financial authority. Never forge GPIO approvals or sign with ESP32 key on host. SQLite is projection; actual state chain. Laptop B gateway only owns sensor USB ports.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
