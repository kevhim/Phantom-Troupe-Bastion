# Local rules — `contracts/test` (BASTION X V2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:** On-chain authority: enforce all six W3-02 policies and typed device exception / independent owner cosign, nonce, and role-scoped revocation. No unlimited fallback execute/approve/batch.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
