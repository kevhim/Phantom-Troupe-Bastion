# Root repository rules — Bastion X V2

1. On every task read `PROJECT_MASTER.md`, `AGENTS.md`, and nearest directory `rules.md`.
2. This is an ARCHITECTURE SCAFFOLD. Code, firmware, service integrations and hardening features are TODO; do not claim implemented.
3. All six W3-02 spending policy restrictions **must** be enforced on chain; agent/backend/GUI may be fully compromised.
4. Financial exception signer private key stays **on ESP32 #1** and only holds on-chain-capped powers; independent root owner wallet on Laptop B, no owner key in ESP32/RTX A. Device signing requires directly wired RC522/OLED/GPIO buttons, not simulated UART events.
5. Direct panic revocation only works if signer has gas/network and reaches an actual RPC; confirmed chain state != local panic.
6. RC522 UID is weak/cloneable, PIR and finger counting only auxiliary signals, ESP32 not a certified HSM.
7. Repo must not contain secrets or real money. Demo receipts are on real local chain using test tokens.
8. Laptop A RTX5060 app/chain/AI; Laptop B Intel direct device signer/UNO Q/Uno sensors/alert; C standby.
9. Update master + docs/tests when changing contracts, EIP712 types, hardware pins, roles, schema or cross-device protocol.
10. New directories must have directory-local `rules.md`. Demonstration simulations must be clearly labeled, no fake cryptographic successes.
