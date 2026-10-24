# 36-hour Four-Person Build Plan (V2)

## Roles
**Engineer A (chain):** Contract and ERC4337 environment, on-chain policies, Foundry test suite, signer role registry.  
**Engineer B (embedded):** ESP32 physically wired RC522/OLED/buttons, on-device typed data signing, direct revoke; UNO Q/Uno#1/ESP8266 only after signing works.  
**Engineer C (backend/agent):** FastAPI, database, local bundler integration, scripted agent, RPC receipt indexing, host-to-host schemas.  
**Engineer D (frontend/QA):** UI shell, 8 pages prioritized, real state, test runner/demo, owner signing interface on Intel B.

| Elapsed hours | Contract | ESP32 / IoT | Backend | Frontend / QA |
|---|---|---|---|---|
| 0–4 | Starter 4337 UserOp succeeds | Verify exact ESP32 board GPIO; wire 1 OLED, 2 buttons, RFID | API + payment intent schema | UI skeleton, receipt/status model |
| 4–12 | All 6 policy dims + direct attack tests | Button and RFID local event + canonical review pages | scripted agent payments, status events | Agent/Wallet with real reads |
| 12–20 | Role-scoped ESP32 proof AND independent owner signature, signed payload verification | secp256k1 EIP712 sign reference matching | queue and ESP32 transport, SQLite | Approval reviewed-vs-signed stages |
| 20–26 | Owner co-sign/high cap & revoker role | ESP32 direct panic and limited on-chain revoke | gateway, UNO Q + ESP8266 after signer | Security, hardware, overview |
| 26–31 | fuzz/negative tests | Unplug/no-RPC failure drill | full error mapping, incidents | Evidence and E2E demonstration |
| 31–36 | Freeze version & fix failures | label wires, verify ESP32 reset | single-command launches, stable network | presentation, test screenshots, judge rehearsal |

## Hard go/no-go gates
M0 (4h): real 4337 submission succeeds.  
M1 (12h): stolen agent key cannot exceed configured contract policy.  
M2 (20h): real ESP32 signature verified on-chain against EXACT op, not simulated button.  
M3 (26h): junior tier/owner co-sign/confirmed revocation work or are clearly excluded from live claims.  
M4 (36h): replayable end-to-end demonstration; failures honest.

## Deadline triage
If on-device secp256k1 integration becomes blocked, fall back to previous v1 independent owner-wallet signature on Laptop B **and state that direct ESP32 cryptographic signing is not implemented**, while retaining physically assisted workflow. Never slip in main-computer private key or dummy signature. If ERC4337 P0 fails, stop all extra features and fix contracts; judges require it. Mirage and servo are deferred automatically.
