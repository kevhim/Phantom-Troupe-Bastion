# Local rules — `services/mirage` (BASTION X V2.1)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:** Mirage deception engine is an isolated, optional P2 demonstration layer.
- Never route real funds through the deception system.
- Never forge real blockchain receipts or claim fake operations are on-chain.
- Never modify the actual ERC-4337 validation result to make an unauthorized transaction succeed.
- Clearly label all synthetic outputs with simulation markers.
- Mirage must never delay genuine financial containment or emergency revocation.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
