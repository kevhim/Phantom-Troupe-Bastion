# Local rules — `apps/web/src/features/audit` (BASTION X V2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:** Frontend: honor 8-page/72-block spec, never store owner/device keys, distinguish onchain confirmed from local promise and show full recipient/amount. Mirage must be flagged synthetic.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
