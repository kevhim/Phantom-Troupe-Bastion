# V2 Threat Model — Attacker, Boundary and Limitations

## Actors and secrets
- Agent on RTX A: can be fully malicious; only owns delegated, policy-limited key. AI tools and UI are NEVER final permission source.
- Main API/DB on A: adversary may edit, request forged payments, disable service, mutate payload, censor telemetry, manipulate UI. Smart account still enforces agent spending bounds. Attack may also disrupt hosted blockchain RPC or bundler availability.
- ESP32 #1: independent local parser/display/button/RFID signer with **limited-tier** key(s) and revoke capability; may be physically stolen, reprogrammed, glitched or exploited. Not a certifiable HSM. A compromised ESP32 could spend to its *on-chain-authorized* limits.
- Intel B owner/supervisor workstation: better separated from A but itself software-hosted; root owner key must not live on A or ESP32. Compromised B may compromise owner signature; out of scope for guaranteed protection.
- Uno/ESP8266/UNO Q: telemetry and alarms can be spoofed or disconnected; shouldn't be granted financial signer authority.
- Blockchain: chain/RPC/bundler availability, gas and confirmation delays; on-chain verified state only after confirmation.

## Attack matrix and actual protection
| Attack | Controls | Limits |
|---|---|---|
| Agent session key stolen | Strict on-chain allowlists, limits, expiry, revoked session | Attacker may use remaining allowed budget before confirmed revoke |
| Malware alters payment UI | ESP32 OLED decodes canonical PaymentIntent before direct GPIO confirmation; contract ties hash to exact execution | Malicious signer firmware, phishing, human review errors still possible |
| Fake PC-B USB `APPROVED` message | Signing authority only sees direct GPIO + direct SPI RFID | Serial gateway cannot approve; ESP32 firmware must be locked down |
| RFID UID copied | Owner-signature for high tier, on-chain capped exception keys | Junior demo role selection can be cloned; not true strong MFA |
| Sensor disconnect | Local risk state, stop app, request on-chain revoke | On-chain controls still apply; network failure prevents new revoke |
| A computer loses network | ESP32 direct Wi-Fi bypasses A **application service** | Doesn't bypass A-hosted chain/RPC if it is also offline; move chain to C/testnet for genuine route independence |
| Operator under coercion | Panic GPIO local signer lockdown, remote alert, optional synthetic decoy interface | Not a personal-safety guarantee, audible alarm could worsen risk; use controlled demo only |
| Host edits forensic logs | Tamper-evident chain + independently saved checkpoint | Logs can be fabricated before anchoring; original sensor claims are not cryptographically true |
| Prompt injection | Restricted AI tools, on-chain permissions | LLM classifier not guaranteed; in-policy actions remain possible |

## False security claims banned
"Unhackable LCD", "steal-proof ESP32", "air-gapped Wi-Fi", "instant blockchain freeze", "camera proves payer intent", "PIR detects body at all times", "UID is cryptographic credential", "guaranteed hidden honeypot", "certified HSM", "bank-grade security", "all public test chains always available".

## Privacy
No actual Aadhaar/PAN/bank or real funds; consent for camera; use ephemeral aggregate vision features; no raw keystrokes/password capture; no raw images by default; keep simulated attack lab labeled. Forensic hashes stored separately; investigate canary hits only on synthetic data.

## Success criteria
Code, hardware and on-chain verified demonstration, with screenshots/recorded receipts and a clear status provenance: `simulated`, `observed_b`, `esp32_attested_by_signature`, `onchain_pending`, `onchain_confirmed`.
