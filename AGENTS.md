# Agent Entry Point — Bastion X V2.3

Read `PROJECT_MASTER.md`, `rules.md`, the complete ancestor path of nested `rules.md`, and domain docs for the component you edit. Key domains: `docs/HARDWARE_MAP.md`, `docs/CONTRACT_DESIGN.md`, `docs/TRUSTED_SIGNER_DESIGN.md`, `docs/SECURITY_THREAT_MODEL.md`, `docs/setup/TWO_LAPTOP_INTEGRATION.md`, `docs/PHASE2_REQUIREMENTS.md`, `docs/PHASE2_SECURITY_MODEL.md`, `docs/PHASE2_TEST_REPORT.md`.

Never implement host-side ESP32 transaction signing. Real chain must enforce spending independently of agent/backend.
Two active computers:
- Laptop A (RTX 5060): Web console (:5173), FastAPI backend (:8000), AI purchasing agent, Adversarial Hijack Lab, OpenCV vision, SQLite DB, ESP32 #2 (OLED #2 telemetry), Uno #2 (watchdog).
- Laptop B (Intel Ultra 7 155H): **Local Anvil Blockchain (:8545, Chain 31337)**, ERC-4337 bundler, QuotaPaymaster, GuardianRecovery, RiskCircuitBreaker, ESP32 #1 (dedicated signer + OLED #1 + RC522 + buttons), Arduino UNO Q 4GB (edge node), Arduino Uno #1 (5V Active Buzzer Pin D8 + LCD status), supervisor service (:8010).
- Laptop C (RTX 4060): Standby node.
Never confuse RFID UID with cryptographic authentication.

BASTION X v2.3 implements:
1. `contracts/src/BastionAccount.sol`: ERC-4337 smart account with all 6 W3-02 spending policies, EIP-712 dual-authorization verification, and anti-rollback circuit breaker freezing.
2. `contracts/src/RiskCircuitBreaker.sol`: Real-time on-chain spending anomaly detection (velocity: 3 in 60s, burst: 70% in 5m) latching persistent `FROZEN_AUTOMATIC`.
3. `contracts/src/GuardianRecovery.sol`: 3-of-5 delayed guardian recovery with 48h countdown starting at quorum, owner veto, and session key invalidation.
4. `contracts/src/QuotaPaymaster.sol`: ERC-4337 IPaymaster with per-agent gas quota isolation preventing sponsorship pool exhaustion.
5. `contracts/test/WalletInvariant.t.sol`: Stateful Foundry invariant fuzzing with 16,384 calls across 256 runs verifying 10/10 security invariants.
6. `tests/adversarial/`: 8 scripted hijack attacks proving agent financial losses never exceed daily cap.
7. `apps/web/src/App.tsx`: 8-route React security console with interactive Hijack Lab, Guardian Recovery, QuotaPaymaster cards, and SOC.
8. `firmware/`: Dedicated firmware for ESP32 #1, ESP32 #2, Uno #1 (5V Active Buzzer D8), Uno #2, and archived ESP8266.
9. `docs/setup/`: Standalone per-laptop deployment runbooks (`LAPTOP_A_PHASE2.md`, `LAPTOP_B_PHASE2.md`, `PHASE2_INTEGRATION.md`).
10. `tests/`: 43 automated tests passing 100% (34 Phase 1 + 9 Phase 2 adversarial).
11. Architectural evolution: Decommissioned ESP8266; alarm now driven locally via Arduino Uno #1 Pin D8 on Laptop B.
