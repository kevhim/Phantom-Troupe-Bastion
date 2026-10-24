# Event, Signing and Verification Protocol V2

## Channels
A web -> A API: REST and WebSockets.  
A API -> local chain: viem JSON-RPC + ERC-4337 bundler.  
B gateway -> A API: authenticated mutually configured network identity, rate limit, event sequence; **telemetry only**.  
A or B -> ESP32: unsigned canonical typed `PaymentIntent` with schema version, authenticated request origin; ESP32 independently validates, displays and signs after direct physical input.  
ESP32 -> A/B: LIMITED signature + device signing metadata, not root key.  
ESP32 -> chain RPC: signed `revokeSession` transaction via network route independent of A application API.

## Signing payload
Refer to `docs/TRUSTED_SIGNER_DESIGN.md` and `schemas/contracts/payment-intent-v2.example.json`. The Solidity ABI, device serialization, and frontend preview must agree on field widths, array layout, token decimals and Keccak digest. Use `viem`/Foundry canonical hashes to cross-check MCU signature. No signing of unparsed, arbitrary `bytes32` from untrusted host.

## State transitions
Payment: `DRAFT -> PREFLIGHT -> USEROP_SIGNED -> SUBMITTED -> INCLUDED -> EXECUTED_SUCCESS/EXECUTED_REVERT/UNKNOWN`. A bundler refusal is `BUNDLER_REJECTED`, not an on-chain revert.  
Exception: `REQUESTED -> DISPLAYED_ON_DEVICE -> PHYSICAL_CONFIRMATION -> DEVICE_SIGNED -> OWNER_COSIGNED_IF_REQUIRED -> SUBMITTED -> CONFIRMED/FAILED/EXPIRED`.
Panic: `PANIC_LOCAL -> SIGNER_HALTED -> REVOKE_SIGNED -> REVOKE_SUBMITTED -> REVOKE_CONFIRMED/REVOKE_FAILED/REVOKE_UNAVAILABLE`.  
Mirage: `NORMAL_APPLICATION -> SYNTHETIC_LAB_SESSION` only within explicitly sandboxed scope, independent of wallet.

## Replay and anti-spoof
Device/host event sequence signed/verified where implemented. Normal telemetry reported as source observations, not identity proof. Every financial exception has on-chain nonce, policyVersion, chain ID, account address and exact EIP712 operation binding. Button handler cannot be remotely invoked. Device signs at most one live request per confirmation; a new candidate cancels previous displayed review and requires fresh physical action.

## Failure handling
Signer offline = no new hardware exceptions, but existing on-chain agent permissions remain unless revoked. RPC unavailable = show revocation attempt failure; cannot assert freeze. Vision offline = warning/step-up, not invented deepfake certainty. Backend offline = chain restrictions still apply but UI and off-chain coordination unavailable.
