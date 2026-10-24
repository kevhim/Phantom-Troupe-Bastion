# Architectural Overview — v2 Trust Zones

## Trust-zone diagram (logical, not an assertion that code exists)
```
              LAPTOP A — RTX 5060 (ASSUME COMPROMISABLE)
 React UI + Uno #2 watchdog -> FastAPI API -> scripted/LLM agent (limited session key)
       |          |      \ -> UserOp -> 4337 Bundler -> EntryPoint
       |          |                                    |
       |          +-> SQLite projections             v
       |                      Account.sol (ACTUAL FINANCIAL POLICY)
       |                                           ^     ^
       +-----unsigned canonical PaymentIntent------+     |
                                                      signed role exception
             LAN, signed canonical payload (untrusted request)  |
                                 v                             |
      LAPTOP B — PHYSICAL / SUPERVISOR DOMAIN       ESP32 signed EIP-712
   [ Single ESP32: RC522 SPI + Dual OLED (#1 review @ 0x3C, #2 status @ 0x3D) + Panic GPIO + Approve GPIO ]
           | Device-only secp256k1 exception key | revocation-only key
           | directly sends revocation to reachable chain RPC
   [ UNO Q telemetry ]  [ Uno#1 PIR/DHT (LCD removed) + Pin D8 Buzzer ]
           | gateway observations via Intel laptop B
         Additional owner/admin signer on B for high tier

      LAPTOP C — Optional chain/RPC independent of laptop A failure
```

## Why this layout is different from v1
v1 trusted Intel B host events and independent owner wallet for exceptions. v2 introduces true **ESP32 device-side LIMITED exception signing with directly wired review inputs**. This is significant firmware / contract work; does not magically add HSM protections. UI and backend remain untrusted; policy enforcement stays inside smart account. Other sensor nodes are not signature sources.

## Data planes
- Financial authorization plane: ERC4337 smart account / EntryPoint, session keys, tiered signatures, on-chain spend counters and revocation.
- Hardware trust plane: ESP32 real physical GPIO/SPI/OLED, signer firmware local secret, direct limited revocation RPC.
- Monitoring/telemetry: FastAPI, UNO Q, Uno sensors & Pin D8 buzzer (16x2 LCD decommissioned), vision and risk state; advisory only and never final money permissions.
- UX: React with distinct operator/supervisor/dev lab routes, honest onchain/pending/error states.
- Persistence: local SQLite event log and projections; chain contract storage = financial truth. ESP32 stores no general ledger.

## Host A crash limitations
If A hosts both app and chain, separate ESP32 cannot independently freeze the chain when A itself is down. For real test of computer-failure independence move chain/RPC to Laptop C, otherwise explicitly describe only application-layer independence.

## Versioning
Pin Solidity compiler, OpenZeppelin, EntryPoint, bundler version, web3 SDK, board core, crypto signer library and typed-data EIP-712 schema hash. Reject unknown schema/chain at ESP32 and account. Keep `PROJECT_MASTER.md` as single top-level handoff index.
