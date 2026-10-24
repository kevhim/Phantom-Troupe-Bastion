# Test Plan V2 — Evidence Before Features

## P0 wallet W3-02: must execute on real local ERC-4337
- Authorized 20 token transfer succeeds through bundler and EntryPoint; tx receipt/actual token balance changes verified.
- 500 over per-tx rejected; unknown target rejected; unknown function rejected; unknown recipient rejected; daily cap exceeded rejected; expired key rejected.
- Stolen agent key from independent client submits UserOperation bypassing Python; same policies hold.
- Same token to different recipient / wrong selector / ERC20 approve / batch / delegatecall cannot bypass.
- Nonce replay, chain ID mismatch, wrong EntryPoint/account binding and alternate signature cannot authorize.
- Two sequential/concurrent operations approaching daily cap cannot collectively exceed cap; failed tx does not cause unchecked arithmetic.
- Session revoke confirmed then repeated UserOp rejected. Preconfirmed interval documented.

## P1 signing-device crypto
- Byte-for-byte EIP712 reference digest vs device-generated digest; known signature recovered in Solidity.
- Swipe Card 1 + press direct approval -> low-tier hardware co-signature; **without independent owner signature, all out-of-policy payment attempts fail**, even below low cap. After independent owner one-off signature, low-tier exception passes within ceiling; large exception rejected on-chain.
- Card 2 + direct button + independent owner signature for high-tier request -> authorized exact payment succeeds within configured on-chain cap; missing owner signature rejected, even if direct physical button was pressed.
- Change 1 bit in token, recipient, amount, contract, function selector, chain, wallet, nonce, deadline or calldata -> approval fails.
- Untrusted fake `APPROVE` serial packet from B or A does **not** cause signer to sign. USB debugging cannot remotely trigger sign request. LCD misinformation on Uno1 cannot affect ESP32 OLED truth.
- Swap intent during physical review -> review invalidated; no signature on old or new payload without fresh full review.
- Signer reset/unplug -> no signature, no previously cached approval replay; annotate if firmware hardening unavailable.

## P2 direct emergency
- App A API service stopped; Anvil/RPC still reachable: ESP32 presses direct GPIO panic -> sends actual signed revocation without A API -> confirms on-chain; ESP8266 remote alert receives event if WiFi reachable.
- A RPC also stopped: show `REVOKE_UNAVAILABLE`; do not pretend it succeeded. Optional Laptop C host RPC test with A fully down.
- Separate timers for local hardware lock vs chain inclusion. Ensure revoke key cannot call transfer, raise limit, add recipient or approve spend.
- Competing pending agent payment may execute first; document onchain ordering and gas.

## P3 telemetry, data, UX
- PIR off cannot alone assert user absent. Camera second-face may false-negative outside field of view; classify advisory.
- UTF-8/long address correctly scrolls on OLED, all 40 hex address chars visible in review and checked.
- `Included` but `ExecutionReverted` not displayed as green paid.
- Hash-chain modified entry fails against independent checkpoint. Mirage only uses synthetic test data and displays test mode to judges.

## Acceptance evidence
Store sanitized test outputs (not keys) in `/tests/fixtures`, screenshot timestamps and on-chain tx/userop hashes in reproducible demo fixture manifest; mark anything simulator-produced as simulated.
