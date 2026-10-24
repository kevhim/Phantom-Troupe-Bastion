# Local rules — `schemas/signing` (BASTION X V2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:** Schema changes require Solidity+firmware+backend+frontend parity, especially typed EIP712 fields, domain, chain ID and hash. Example payloads are not secret credentials.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
