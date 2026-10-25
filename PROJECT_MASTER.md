# BASTION X — PROJECT MASTER (V2.3)

**Official category:** W3-02, Web3 & Blockchain — Agent Wallet: Letting AI Agents Pay Safely  
**Official deliverable:** An **actual ERC-4337 account-abstraction smart-contract wallet** assigning a limited delegated session key to an agent. It must enforce permitted contracts/functions/recipients, per-transaction and daily limits, expiry, cryptographically verified owner exceptions, automatic spending anomaly freezing, 3-of-5 delayed guardian recovery, and isolated gas sponsorship even when the agent and off-chain software are actively hijacked.  
**Development constraint:** Team of four; ~24–36 elapsed hackathon hours; only owned hardware and free-tier/local software; laptop A RTX 5060, laptop B Intel Ultra 7 155H, laptop C RTX 4060 standby. Arduino UNO Q 4GB is working. The SG90 servo is an optional demonstration peripheral.  
**Status:** **v2.3 Phases 1 through 5 Complete & Fully Verified**. Features:
1. **Canonical ERC-4337 EntryPoint:** Integrated `@account-abstraction/contracts@0.6.0`, replacing local simplified mock EntryPoint.
2. **Dedicated Bundler Service:** Python-based JSON-RPC bundler on Laptop B port 3000 handling `eth_sendUserOperation`, `eth_getUserOperationReceipt`, `eth_estimateUserOperationGas`, `eth_supportedEntryPoints`.
3. **Verified In-Policy Payment:** Agent holding restricted session key successfully paid 20 bUSD to allowed vendor through `entryPoint.handleOps`, mined on Anvil Chain 31337 with valid UserOperation receipt.
4. **Scripted Hijack Containment:** 8 adversarial scenarios enforcing $\text{agent\_loss} \le \text{daily\_limit}$ ($100\text{ bUSD}$).
5. **On-Chain Risk Circuit Breaker:** Detects velocity ($\ge 3$ in 60s) and burst ($\ge 70\%$ in 5m) anomalies, latching `FROZEN_AUTOMATIC` without rolling back.
6. **3-of-5 Guardian Recovery:** 48-hour timelock countdown starting upon 3rd distinct vote, owner veto authority, and post-recovery session revocation.
7. **QuotaPaymaster Gas Sponsorship:** Enforces per-agent gas quotas backed by isolated EntryPoint deposits to prevent gas drain.
8. **Stateful Foundry Invariant Fuzzing:** 16,384 calls across 256 runs passing 10/10 security invariants with 0 counterexamples.
9. **Real Physical ESP32 Transaction Signing (Phases 4+5):** Micro-ecc secp256k1 + Keccak256 with bit-for-bit EIP-712 alignment matching `test_vectors.json`. Fail-closed 4-page OLED review, direct SPI RFID, sustained physical button confirmation (GPIO33), and genuine direct on-chain panic revocation (GPIO32) via Laptop B Anvil RPC. Full details in `docs/PHASE4_5_EMBEDDED_SECURITY_REPORT.md`.
10. **Cyber-Physical Hardware:** Distributed across Laptop A (RTX 5060) and Laptop B (Intel Ultra 7 155H).

## READ FIRST — ALL HUMANS AND CODING AGENTS
1. Read this file, root `AGENTS.md`, `rules.md`, and the closest nested `rules.md` **before** touching any module.
2. Consult `docs/HARDWARE_MAP.md`, `docs/SECURITY_THREAT_MODEL.md`, `docs/TRUSTED_SIGNER_DESIGN.md`, `docs/CONTRACT_DESIGN.md` and `docs/setup/TWO_LAPTOP_INTEGRATION.md` before touching signatures, money flows, or node messages.
3. Treat diagrams as **plans**, not verified functionality. Never label a mock RPC result or UI animation as a real signed operation.
4. Commit no real secrets, wallet mnemonics, private keys, customer records or recorded biometric images. Use fake money on a local chain.
5. Any change to a role, pin, public API, hardware owner, signer hash, or on-chain permission must update this master + the corresponding docs/tests.
6. New directories must contain their own `rules.md` pointing to their parent scope and indicating allowed changes.

## FINAL PRODUCT STATEMENT
**BASTION X — Breach-Resilient Agent Wallet with Hardware-Bound Transaction Approval.**
The agent can autonomously pay approved vendors using a restricted ERC-4337 session key, but an independent smart account enforces strict restrictions even if the agent computer is compromised. A separate ESP32 signing station reviews a canonical operation on a directly wired OLED and signs a narrowly scoped override *only following physical input*. The ESP32 can independently initiate limited-role revocation through RPC, while an UNO Q and other sensors provide correlated risk telemetry. An optional Mirage mode isolates a hostile app session from genuine wallet data and only displays explicitly synthetic fixtures.

## DECISIONS ABOUT FIVE PROPOSED UPGRADES
1. **On-device signing (ACCEPT with conditions).** Private exception signer is provisioned and used **on the single ESP32 on Laptop B**, not on laptop A or its backend. ESP32's ordinary flash is **not an audited secure element**. Determine variant and provisioning; secure boot/flash encryption optional later after recovery planning. Restrict on-chain authority of this signer so theft cannot grant unlimited spending. Owner/admin root signing remains on independently managed owner wallet, never on the AI host. Zero ESP32s exist on Laptop A.
2. **Independent review (ACCEPT, rewire).** Exactly ONE physical ESP32 development board is deployed (connected to Laptop B), driving dual SSD1306 OLED displays on a shared I2C bus (SDA GPIO 21, SCL GPIO 22). OLED #1 (`0x3C`) receives the canonical operation for signing, showing full address across pages, amount/token/contract/function/chain, fingerprint, and expiration (strictly fail-closed: signing is rejected if OLED #1 is unavailable or malfunctions). OLED #2 (`0x3D`) is reassigned as an auxiliary security/status display (non-blocking status; subject to address jumper 0x3D and electrical compatibility verification). The 16x2 I2C LCD on Uno #1 is decommissioned; environmental monitoring and presence telemetry are moved directly to the React dashboard pages.
3. **Junior/Senior roles (ACCEPT as demonstration tiers).** Card 1 selects JUNIOR review and card 2 SENIOR review. RC522 UID is clonable and not strong user authentication. Contract must enforce cryptographic approval authority, low/high value caps, and independent owner signature for high-tier changes/payments. Never claim UID is a secure cryptographic factor.
4. **Panic channel (ACCEPT with independent RPC on Laptop B).** ESP32 can sign/send `revokeSession` through independent direct JSON-RPC to the local Anvil node hosted on Laptop B using its **revocation-only** role/key with funded gas. This bypasses Laptop A application software and guarantees revocation even if Laptop A is powered off. Revocation effective only when on-chain confirmed.
5. **Mirage mode (STRETCH).** Synthetic isolated records and token fixtures only. Never redirect legitimate blockchain calls to a "fake chain" without a visible simulation label for judges; never claim this prevents violence or coercion. Quiet remote alert is possible; a buzzer is not secret when audible nearby. Trigger chain revocation separately.

## CORE SECURITY INVARIANTS
S1. Real ERC-4337 EntryPoint + bundler + smart-account permission checks, not a conventional EOA or UI allowance.
S2. On-chain enforcement of target, function selector, recipient, max per-tx, UTC calendar-day spending cap, permission expiry; no unchecked alternative execute, batch, delegatecall or ERC-20 approve.
S3. Test direct unauthorized UserOperations submitted outside Bastion API with a STOLEN **agent** session key; invalid transactions do not succeed.
S4. Same exact canonical `PaymentIntent` fields are independently decoded, OLED-reviewed, digested/signed, verified by account and used for execution; strict EIP-712 domain (name/version/chainId/verifying account), owner/role, token, recipient, amount, target, selector, nonce, policy version, deadline and request ID. No blind signing of arbitrary 32-byte hashes or opaque calldata.
S5. **Conservative W3-02 compliance mode (DEFAULT): every out-of-agent-policy payment requires an exact-operation signature from the independent owner key, plus an ESP32 hardware signature.** Junior and Senior RFID cards select additional review/limit tiers but never substitute for this required owner authorization. An optional later on-chain owner-predelegated junior exception budget may be demonstrated separately and only if judges accept explicit owner delegation as owner approval. Policy changes, recipient modifications, recovery and high-value payments always require owner/admin signature. Contract hard-caps signer permissions even if ESP32 is compromised.
S6. An approval may be *physically recorded* only when the ESP32 itself observes its directly connected RFID reader and approval button. PC-B USB serial event or PC-A WebSocket message cannot replace physical GPIO input.
S7. Neither camera/finger count nor RC522 UID proves legal identity. Optical challenge is optional context only, not required to conclude monetary transaction authorization.
S8. Local stop, hardware alarm, requested revocation and CONFIRMED on-chain revocation are separate observable statuses. No absolute instant blockchain freeze claim.
S9. Software integrity, hardware compromise, phishing of independent signer, stolen admin signing key and physical coercion are limitations. ESP32 is not an HSM, OLED is not unhackable.
S10. Logs are tamper-evident only with protected independent checkpoints. No raw wallet keys, full prompts, images or customer data on a public chain.
S11. No two laptop processes own the same serial device; avoid connecting unrelated 5V USB power rails. RC522 and ESP32 GPIO are 3.3V; never connect Arduino 5V TX to ESP32 input without a proper compatible interface.

## MACHINE ALLOCATION — FINAL V2.3
### LAPTOP A (RTX 5060, 32GB RAM) — APPLICATION & OPERATOR DOMAIN
- Role: Web UI (`apps/web` :5173), FastAPI Backend (`services/api` :8000), AI Purchasing Agent, Computer Vision (Webcam), SQLite App DB, Mirage Engine, SOC Dashboard.
- Hardware Attached:
  - Built-in / Owned Webcam (Optical Face Counting & Challenge-Response Liveness)
  - Arduino Uno #2 via USB — Auxiliary Watchdog, Heartbeat & Fault Generator (strictly untrusted for transactions)
- **Security Rule: NEVER store owner root signing keys or privileged ESP32 keys on Laptop A.**
- **v2.3 Note: Exactly ONE physical ESP32 development board exists in inventory, allocated exclusively to Laptop B. Zero ESP32s are connected to Laptop A. ESP8266 has been decommissioned.**

### LAPTOP B (Intel Ultra 7 155H, 32GB RAM) — TRUSTED AUTHORIZATION & BLOCKCHAIN HOST
- Role: Physical Security Gateway, Supervisor Workstation, Local Blockchain & Bundler Host, Independent Audit Storage.
- Hardware Attached:
  - Single ESP32 Dedicated Hardware Signer & Dual OLED Controller via USB:
    - RC522 RFID Reader (SPI: SCK 18, MISO 19, MOSI 23, SS 5, RST 27)
    - OLED #1 Trusted Review (I2C: SDA 21, SCL 22 @ 0x3C, 4-Page Paginated Review, Fail-Closed)
    - OLED #2 Security & Status Display (I2C: shared SDA 21, SCL 22 @ 0x3D, Non-Blocking Status; unverified bench wiring pending jumper modification)
    - Physical Approval Button (GPIO 33, sustained press >= 1.5s)
    - Physical Panic Button (GPIO 32, instant ISR interrupt + direct Wi-Fi revocation)
  - Arduino UNO Q 4GB via USB-C (Linux edge coordinator service & gateway telemetry)
  - Arduino Uno #1 via USB:
    - **5V Active Buzzer on Pin D8** (Signal / +), GND to common rail
    - Optional sensors: PIR (D2), DHT11 (D4), SG90 Servo (D6)
    - *(16x2 I2C LCD decommissioned in v2.3; environmental monitoring moved to React console)*
- Software Services:
  - **Local Anvil Blockchain Node (:8545, Chain ID 31337)**
  - Compatible ERC-4337 Bundler Service
  - Supervisor Service (:8010) & Serial Hardware Gateway
  - Independent Audit Storage (`C:\bastion_audit_checkpoints` or `/opt/bastion/audit_checkpoints`)
- **v2.3 Architectural Decision:** The 5V active buzzer is driven directly by Arduino Uno #1 on Pin D8 via the Laptop B Supervisor Service. The alarm now depends on the Intel supervisor/Uno #1 local serial path and no longer provides independent wireless notification.

### LAPTOP C (RTX 4060, 16/32GB RAM) — HOT-STANDBY BACKUP NODE
- Role: Cold/hot standby failover node.
- Hardware: Zero mandatory physical hardware units on Day 1.
- Fallback Tasks: Standby Anvil mirror, auxiliary CI/Foundry test runner, or compute failover.

## DATA / CONTROL PLANES
- `apps/web`: 8 operational pages, 72 conceptual UI components (66 page widgets + 6 shell widgets); full details in `docs/FRONTEND_SPEC.md`.
- `services/api`: payment intent coordination, projections, hardware status, exception queue, audit index, telemetry. Never signs in place of ESP32 or overrides chain policy.
- `services/agent`: limited key held by agent host, not owner/exception keys; scripted fallback guarantees hackathon demo works without LLM.
- `services/gateway`: B-only UART ownership for classic Uno; records observed telemetry; never creates `HARDWARE_APPROVED` events on behalf of ESP32.
- `services/edge-q`: UNO Q Linux telemetry/status and health; no ultimate financial authority.
- `firmware/esp32_signer`: directly connected signer input/display, signed typed message generation, revocation RPC, provisioned keys, audit receipts.
- `firmware/uno_operator`: 5V Active Buzzer (Pin D8), and optional PIR/DHT sensors (16x2 LCD decommissioned; telemetry streamed to React dashboard).
- `firmware/uno_supervisor`: optional independent watchdog; no essential authorization pin ownership.
- `firmware/esp8266_alert`: [ARCHIVED in v2.3] Replaced by Uno #1 Pin D8 buzzer on Laptop B.
- `contracts`: ERC-4337 account; policy, exception tiering, distinct roles, on-chain revocation, mock ERC-20/vendor, Foundry tests.
- `data`: SQLite on A; signing device maintains minimal volatile pending intent and monotonically increasing device event counter; authoritative spending state is on-chain.

## REQUIRED END-TO-END FLOWS
**Normal:** agent intent -> backend advisory -> restricted session-key UserOp -> 4337 bundler/EntryPoint -> contract checks -> test-token transfer -> real receipt.
**Exception:** agent requests exact operation -> backend queues -> B supervisor asks ESP32 to fetch/receive canonical unsigned intent -> ESP32 independently validates structure, shows exact data on OLED, checks directly wired RFID and physical approve button -> ESP32 signs limited-tier EIP-712 `PaymentIntent` -> **every out-of-policy request also requires independent owner-signed authorization in the default W3-02 build** (higher tier adds stricter bounds/review) -> EntryPoint/account verifies signatures and exact operation nonce/expiry -> receipt; do NOT claim RFID UID alone proves owner.
**Panic:** directly wired panic switch -> ESP32 local refusal to sign + send signed revocation tx to configured peer-accessible RPC; Uno #1 Pin D8 buzzer sounded via Supervisor; app may start synthetic sandbox but **no real funds moved** -> dashboard distinguishes `PANIC_LOCAL`, `REVOKE_SUBMITTED`, `REVOKE_CONFIRMED` or `REVOKE_UNAVAILABLE`.
**Mirage:** visible only in optional demo/adversarial lab; synthetic API namespace and independent fixture store, no real wallet keys or actual chain signing; supervisor dashboard displays mode truthfully.

## BUILD ORDER (DO NOT CHANGE)
P0: local real 4337 UserOp + 6 tested permissions + session-key revocation + owner exception.  
P1: ESP32 OLED review and physical direct buttons/RFID, limited on-device signature, independent signature verification on chain.  
P2: ESP32 direct revocation broadcast, UART sensors, UNO Q telemetry & Uno #1 buzzer, polished dashboard.  
P3: Mirage, vision gating, separate-Laptop-C RPC, on-chain log anchors, servo.  
**No feature moves earlier without a successful documented security test and team approval.**

## CORE DOCS INDEX
- Hardware: `docs/HARDWARE_MAP.md`, `docs/QUICKSTART_PER_PC.md`
- Security: `docs/SECURITY_THREAT_MODEL.md`, `docs/TRUSTED_SIGNER_DESIGN.md`, `docs/EMERGENCY_AND_MIRAGE.md`
- Chain: `docs/CONTRACT_DESIGN.md`, `docs/TEST_PLAN.md`
- App: `docs/FRONTEND_SPEC.md`, `docs/DATA_AND_APIS.md`, `docs/INTEGRATION_PROTOCOL.md`
- Delivery: `docs/BUILD_PLAN.md`, `docs/DEPLOYMENT.md`, `docs/GIT_WORKFLOW.md`, `docs/FEATURE_SCOPE.md`

## CLAIMS / DEMO DISCLOSURES
Report real on-chain tx, test results, firmware build, and hardware event evidence. Anything not coded/tested is planned only. No phrase "unhackable", "air-gapped ESP32 over Wi-Fi", "instant guaranteed blockchain freeze", "cryptographically secure RFID UID", "100% anti-deepfake" or "hidden live real-money payments". The demo uses synthetic assets and consented participants.
