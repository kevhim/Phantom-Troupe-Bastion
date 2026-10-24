# Local rules — `tests/adversarial` (BASTION X V2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:** Security negative tests must prove real onchain outcomes and device-signing parity. Test network/RPC failure, UID role limits, direct host bypass and nonce replay. No fake fixture presented as evidence.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
