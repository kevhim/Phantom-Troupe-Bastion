# Local rules — `docs` (BASTION X V2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:** Keep docs consistent with root master; preserve distinction between intended architecture, existing previous Bastion features and working/tested V2 code.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
