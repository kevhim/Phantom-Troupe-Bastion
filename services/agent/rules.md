# Local rules — `services/agent` (BASTION X v2.2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Owned by: Laptop A (RTX 5060).
- Purpose: AI Purchasing Agent (`purchasing_agent.py`) generating structured payment requests.
- Security boundary: Holds time-limited delegated agent session key ONLY. All intents are subject to on-chain policy enforcement on Laptop B's Anvil node. Agent key theft cannot exceed pre-configured contract ceilings.
