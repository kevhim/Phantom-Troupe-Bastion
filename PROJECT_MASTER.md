# BASTION X — PROJECT MASTER (V2.0)

**Official category:** W3-02, Web3 & Blockchain — Agent Wallet: Letting AI Agents Pay Safely  
**Official deliverable:** An **actual ERC-4337 account-abstraction smart-contract wallet** assigning a limited delegated session key to an agent. It must enforce permitted contracts/functions/recipients, per-transaction and daily limits, expiry, and cryptographically verified owner exceptions even when the agent and off-chain software misbehave.  
**Development constraint:** Team of four; ~24–36 elapsed hackathon hours; only owned hardware and free-tier/local software; laptop A RTX 5060, laptop B Intel Ultra 7 155H, laptop C RTX 4060 standby. Arduino UNO Q 4GB is working. The SG90 servo was previously reported unresponsive; treat optional unless tested.  
**Status:** This is a **v2 architecture scaffold**. It contains design documentation, rules and sample schemas, not an implemented or audited wallet.

## READ FIRST — ALL HUMANS AND CODING AGENTS
1. Read this file, root `AGENTS.md`, `rules.md`, and the closest nested `rules.md` **before** touching any module.
2. Consult `docs/SECURITY_THREAT_MODEL.md`, `docs/TRUSTED_SIGNER_DESIGN.md`, `docs/CONTRACT_DESIGN.md` and `docs/INTEGRATION_PROTOCOL.md` before touching signatures, money flows, or node messages.
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
4. **Panic channel (ACCEPT with limitations).** ESP32 #1 can sign/send `revokeSession` through independent direct JSON-RPC (not through app API) using its **revocation-only** role/key with funded gas. This bypasses **application software** but still needs working Wi-Fi/router, RPC and chain. The local Anvil chain on laptop A is NOT available if host A or its network is fully offline. For stronger fault demo, move a real chain/RPC to laptop C, or use a reachable public test chain if available. Revocation effective only when on-chain confirmed.
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

## MACHINE ALLOCATION — FINAL V2
### LAPTOP A (RTX 5060, 32GB RAM) — UNTRUSTED APPLICATION/CHAIN LAB
- Frontend (`apps/web`); main API (`services/api`); AI agent (`services/agent`); vision (`services/vision`, built-in/owned camera); SQLite; Anvil + proper ERC-4337 bundler; contract deployment/indexer.
- USB **ESP32 #2 and OLED #2** as the untrusted operator-side display/telemetry station on A; **never any signing key on A**. This gives both primary laptops real IoT connections. Host chain exposed to peer LAN only as required for tests, not indiscriminately to Internet.
### LAPTOP B (Intel Ultra 7 155H, 32GB RAM) — PHYSICAL SECURITY STATION
- ESP32 #1 is **physically wired** to RC522 RFID, **OLED #1 trusted review**, panic Button #1 and approval Button #2. OLED #2 goes on ESP32 #2 on laptop A for auxiliary visualization; ESP32 #1 alone signs. It signs **on device** and may directly broadcast revocation; connected to B by USB for flashing/power only, with serial signing/debug commands disabled in deployed firmware.
- Arduino UNO Q 4GB connects to B for management and runs edge telemetry + local security status, **not wallet owner key**.
- Classic Uno #1 on B: PIR, DHT11, 16x2 LCD, optional SG90 servo; peripheral telemetry only.
- ESP8266 buzzer/LED communicates over LAN; Wi-Fi power from B USB as needed. Sound at security/supervisor location, not a guaranteed covert alarm.
- Classic Uno #2 stays **reserved** for independent watchdog/diagnostics if useful; don't create fake critical security role just to use every board.
- Independent supervisor browser/user may use a separate owner/admin wallet/key stored only on B; for high-value approvals it signs an additional bound EIP-712 authorization. For strong host-A-compromise demo, isolate B signing secrets from A.
### LAPTOP C (RTX 4060 16GB RAM) — OPTIONAL BACKUP
- No hardware on day one. Can host chain/RPC to preserve blockchain reachability when laptop A backend is killed, contract/CI work, or own moved devices if ports are insufficient.

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
