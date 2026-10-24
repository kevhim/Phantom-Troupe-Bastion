# Local rules — `services/edge-q` (BASTION X v2.2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Owned by: Laptop B (Intel Ultra 7 155H), running on the Linux userland of Arduino UNO Q 4GB via USB-C.
- Purpose: Edge security coordinator, hardware telemetry filtering, gateway health monitoring, and incident event forwarding.
- Security boundary: Possesses zero financial keys. Acts as an edge telemetry aggregator for Laptop B supervisor.
