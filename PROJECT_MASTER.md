# BASTION X — PROJECT MASTER (V2.3)

**Official category:** W3-02, Web3 & Blockchain — Agent Wallet: Letting AI Agents Pay Safely  
**Official deliverable:** An **actual ERC-4337 account-abstraction smart-contract wallet** assigning a limited delegated session key to an agent. It must enforce permitted contracts/functions/recipients, per-transaction and daily limits, expiry, cryptographically verified owner exceptions, automatic spending anomaly freezing, 3-of-5 delayed guardian recovery, and isolated gas sponsorship even when the agent and off-chain software are actively hijacked.  
**Development constraint:** Team of four; ~24–36 elapsed hackathon hours; only owned hardware and free-tier/local software; laptop A RTX 5060, laptop B Intel Ultra 7 155H, laptop C RTX 4060 standby. Arduino UNO Q 4GB is working. The SG90 servo is an optional demonstration peripheral.  
**Status:** **v2.3 Phase 2 Full Implementation**. Features:
1. **Scripted Hijack Containment:** 8 adversarial scenarios enforcing $\text{agent\_loss} \le \text{daily\_limit}$ ($100\text{ bUSD}$).
2. **On-Chain Risk Circuit Breaker:** Detects velocity ($\ge 3$ in 60s) and burst ($\ge 70\%$ in 5m) anomalies, latching `FROZEN_AUTOMATIC` without rolling back.
3. **3-of-5 Guardian Recovery:** 48-hour timelock countdown starting upon 3rd distinct vote, owner veto authority, and post-recovery session revocation.
4. **QuotaPaymaster Gas Sponsorship:** Enforces per-agent gas quotas backed by isolated EntryPoint deposits to prevent gas drain.
5. **Stateful Foundry Invariant Fuzzing:** 16,384 calls across 256 runs passing 10/10 security invariants with 0 counterexamples.
6. **Cyber-Physical Hardware:** Distributed across Laptop A (RTX 5060) and Laptop B (Intel Ultra 7 155H).

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
1. **On-device signing (ACCEPT with conditions).** Private exception signer is provisioned and used **on ESP32 #1**, not on laptop A or its backend. ESP32's ordinary flash is **not an audited secure element**. Determine variant and provisioning; secure boot/flash encryption optional later after recovery planning. Restrict on-chain authority of this signer so theft cannot grant unlimited spending. Owner/admin root signing remains on independently managed owner wallet, never on the AI host.
2. **Independent review (ACCEPT, rewire).** At least one 3.3V OLED connects **directly to ESP32 #1** and receives the same canonical operation used for signing. Show full address across pages, amount/token/contract/function/chain, operation fingerprint, expiration; never trust text supplied solely by laptop A. LCD on Uno#1 is status-only unless made an equally independent trusted device.
3. **Junior/Senior roles (ACCEPT as demonstration tiers).** Card 1 selects JUNIOR review and card 2 SENIOR review. RC522 UID is clonable and not strong user authentication. Contract must enforce cryptographic approval authority, low/high value caps, and independent owner signature for high-tier changes/payments. Never claim UID is a secure cryptographic factor.
4. **Panic channel (ACCEPT with independent RPC on Laptop B).** ESP32 #1 can sign/send `revokeSession` through independent direct JSON-RPC to the local Anvil node hosted on Laptop B using its **revocation-only** role/key with funded gas. This bypasses Laptop A application software and guarantees revocation even if Laptop A is powered off. Revocation effective only when on-chain confirmed.
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

## MACHINE ALLOCATION — FINAL V2.2
### LAPTOP A (RTX 5060, 32GB RAM) — APPLICATION & OPERATOR DOMAIN
- Role: Web UI (`apps/web` :5173), FastAPI Backend (`services/api` :8000), AI Purchasing Agent, Computer Vision (Webcam), SQLite App DB, Mirage Engine, SOC Dashboard.
- Hardware Attached:
  - Built-in / Owned Webcam (Optical Face Counting & Challenge-Response Liveness)
  - ESP32 #2 via USB + OLED #2 (I2C: SDA 21, SCL 22) — Operator Telemetry only (NO SIGNING KEYS)
  - Arduino Uno #2 via USB — Auxiliary Watchdog, Heartbeat & Fault Generator (strictly untrusted for transactions)
  - ESP8266 NodeMCU via USB — 5V Power for Active Buzzer on D1/GPIO5 and LED on D4/GPIO2 (receives authenticated Wi-Fi alerts from Laptop B)
- **Security Rule: NEVER store owner root signing keys or privileged ESP32 keys on Laptop A.**

### LAPTOP B (Intel Ultra 7 155H, 32GB RAM) — TRUSTED AUTHORIZATION & BLOCKCHAIN HOST
- Role: Physical Security Gateway, Supervisor Workstation, Local Blockchain & Bundler Host, Independent Audit Storage.
- Hardware Attached:
  - ESP32 #1 Dedicated Hardware Signer via USB:
    - RC522 RFID Reader (SPI: SCK 18, MISO 19, MOSI 23, SS 5, RST 27)
    - OLED #1 Trusted Review (I2C: SDA 21, SCL 22, 4-Page Paginated Review)
    - Physical Approval Button (GPIO 33, sustained press >= 1.5s)
    - Physical Panic Button (GPIO 32, instant ISR interrupt + direct Wi-Fi revocation)
  - Arduino UNO Q 4GB via USB-C (Linux edge coordinator service & gateway telemetry)
  - Arduino Uno #1 via USB (PIR D2, DHT11 D4, 16x2 LCD A4/A5, optional SG90 servo D6)
- Software Services:
  - **Local Anvil Blockchain Node (:8545, Chain ID 31337)**
  - Compatible ERC-4337 Bundler Service
  - Supervisor Service (:8010) & Serial Hardware Gateway
  - Independent Audit Storage (`C:\bastion_audit_checkpoints` or `/opt/bastion/audit_checkpoints`)

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
- `firmware/uno_operator`: PIR/DHT/LCD status and optional servo only.
- `firmware/uno_supervisor`: optional independent watchdog; no essential authorization pin ownership.
- `firmware/esp8266_alert`: independent remote alarm; no money keys.
- `contracts`: ERC-4337 account; policy, exception tiering, distinct roles, on-chain revocation, mock ERC-20/vendor, Foundry tests.
- `data`: SQLite on A; signing device maintains minimal volatile pending intent and monotonically increasing device event counter; authoritative spending state is on-chain.

## REQUIRED END-TO-END FLOWS
**Normal:** agent intent -> backend advisory -> restricted session-key UserOp -> 4337 bundler/EntryPoint -> contract checks -> test-token transfer -> real receipt.
**Exception:** agent requests exact operation -> backend queues -> B supervisor asks ESP32 to fetch/receive canonical unsigned intent -> ESP32 independently validates structure, shows exact data on OLED, checks directly wired RFID and physical approve button -> ESP32 signs limited-tier EIP-712 `PaymentIntent` -> **every out-of-policy request also requires independent owner-signed authorization in the default W3-02 build** (higher tier adds stricter bounds/review) -> EntryPoint/account verifies signatures and exact operation nonce/expiry -> receipt; do NOT claim RFID UID alone proves owner.
**Panic:** directly wired panic switch -> ESP32 local refusal to sign + send signed revocation tx to configured peer-accessible RPC; ESP8266 notified; app may start synthetic sandbox but **no real funds moved** -> dashboard distinguishes `PANIC_LOCAL`, `REVOKE_SUBMITTED`, `REVOKE_CONFIRMED` or `REVOKE_UNAVAILABLE`.
**Mirage:** visible only in optional demo/adversarial lab; synthetic API namespace and independent fixture store, no real wallet keys or actual chain signing; supervisor dashboard displays mode truthfully.

## BUILD ORDER (DO NOT CHANGE)
P0: local real 4337 UserOp + 6 tested permissions + session-key revocation + owner exception.  
P1: ESP32 OLED review and physical direct buttons/RFID, limited on-device signature, independent signature verification on chain.  
P2: ESP32 direct revocation broadcast, UART sensors, UNO Q & ESP8266 telemetry, polished dashboard.  
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
