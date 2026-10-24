# Local rules — `infra/signing-device` (BASTION X V2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:** Run real ERC4337 EntryPoint/bundler, restrict Anvil access, ensure ESP32 independent RPC is reachable or show fallback unavailable. Laptop C only if needed.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
