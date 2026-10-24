# Root repository rules — Bastion X V2.3

1. On every task read `PROJECT_MASTER.md`, `AGENTS.md`, and nearest directory `rules.md`.
2. BASTION X v2.3 Phase 1 and Phase 2 are **fully implemented and verified**. All 25 Foundry tests, 16,384 fuzzed invariant calls, 9 adversarial attacks, 34 e2e tests, and frontend build pass 100%. Do not mark tests passed unless executed.
3. All six W3-02 spending policy restrictions **must** be enforced on chain; agent/backend/GUI may be fully compromised.
4. Financial exception signer private key stays **on ESP32 #1** and only holds on-chain-capped powers; independent root owner wallet on Laptop B, no owner key in ESP32/RTX A. Device signing requires directly wired RC522/OLED/GPIO buttons, not simulated UART events.
5. Direct panic revocation only works if signer has gas/network and reaches an actual RPC; confirmed chain state != local panic.
6. RC522 UID is weak/cloneable, PIR and finger counting only auxiliary signals, ESP32 not a certified HSM.
7. Repo must not contain secrets or real money. Demo receipts are on real local chain using test tokens.
8. Two active laptops: Laptop A (RTX 5060) application host; Laptop B (Intel Ultra 7 155H) trusted blockchain host & dedicated hardware signer; Laptop C standby.
9. All 5 Phase 2 requirements are mandatory: 8 hijack attacks, anti-rollback circuit breaker freezing, 3-of-5 delayed guardian recovery, per-agent QuotaPaymaster gas sponsorship, and stateful Foundry authorization invariants.
10. New directories must have directory-local `rules.md`. Demonstration simulations must be clearly labeled, no fake cryptographic successes.
