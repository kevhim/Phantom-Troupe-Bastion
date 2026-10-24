# BASTION X v2 — W3-02 Architecture Scaffold

**Breach-Resilient AI Agent Wallet with Physical Transaction Review**. This repository currently provides a comprehensive, GitHub-ready architecture/documentation scaffold **not yet working wallet/firmware application code**.

## Open first
1. `PROJECT_MASTER.md` — binding architecture, scope, two-laptop allocations and five upgrade decisions.
2. `docs/TRUSTED_SIGNER_DESIGN.md` — ESP32 signing, physical direct inputs and EIP712 review.
3. `docs/HARDWARE_MAP.md` — exact laptop allocation and safe proposed ESP32/Arduino pin maps.
4. `docs/CONTRACT_DESIGN.md` — actual 4337 authorization and secure exception roles.
5. `docs/FRONTEND_SPEC.md` — 8 routes, 66 page widgets + 6 shared shell items.
6. `docs/BUILD_PLAN.md` / `docs/QUICKSTART_PER_PC.md` — four-person implementation and Windows setup.
7. `docs/SECURITY_THREAT_MODEL.md` — what protections do/do not guarantee.

## Critical product decisions
- Laptop A RTX 5060 = UI/API/agent/Anvil/bundler, camera and ESP32#2 + OLED#2 operator telemetry.
- Laptop B Intel = **ESP32 #1 transaction reviewer with direct RC522/OLED/two buttons**, UNO Q, Uno#1 sensor + status LCD, ESP8266 buzzer, optional Uno#2.
- Laptop C RTX 4060 = backup; optionally host separate chain/RPC to survive full A outage.
- Smart contract enforces all six W3-02 policy dimensions. ESP32 device has only narrowly restricted exception/revocation keys; owner root key is separate.
- Mirage synthetic wallet demonstration is stretch, not required.

## Coding agent protocol
All directories include `rules.md`. Before creating code read root and closest rules. Root `AGENTS.md` and `CLAUDE.md` point to the master. Do not claim unfinished modules are implemented.
