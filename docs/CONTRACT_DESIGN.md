# ERC-4337 Smart Account Contract Design (W3-02)

## Repository contracts
contracts/src/BastionAccount.sol (Implemented: ERC-4337 smart account, 6 W3-02 policy dimensions, EIP-712 dual auth, emergency revoker role)
contracts/src/IEntryPoint.sol (Implemented: ERC-4337 IAccount and IEntryPoint interfaces)
contracts/src/MockToken.sol (Implemented: ERC-20 bUSD 6-decimal test token)
contracts/src/MockVendor.sol (Implemented: Authorized merchant contract)
```
Status: Implemented and validated in BASTION X v2.1.

## Mandatory compliance
- Genuine ERC-4337 `UserOperation` to an `EntryPoint`, submitted by compatible bundler, not only ordinary EOA calls.
- Policy dimensions enforced **on chain**: allowed targets, allowed function selectors, allowed recipients, max amount per payment, UTC daily aggregate and permission expiry.
- An owner-approved exception path for operations beyond the agent policy; **exact-operation owner EIP-712 signature REQUIRED for every out-of-policy payment in the default compliance build**, alongside limited ESP32 proof. No UI boolean.
- Verify correct session signer, chain, account, nonce, validity range and EIP-712 domain; compare actual call payload and signed `PaymentIntent`.

## Call surface — minimal by design
MVP supports **one ERC-20 transfer to one authorized recipient using explicitly permitted execution method**, plus dedicated `executeAuthorizedException` with typed intent proof and role logic. Reject arbitrary `execute`, multicall/batch, ERC-20 `approve`, delegatecall, arbitrary recipient/target/function, wallets as unlimited pass-through. `MockVendor` may implement a fixed allowed purchasing method, with payment verified separately; choose single attack surface for the MVP.

## Implementation subtleties
- Follow standard `validateUserOp` signature and `EntryPoint` checking using a pinned compatible OpenZeppelin version. ERC-4337 signature data depends on `userOpHash`, which includes EntryPoint and chain ID. Do not invent nonce validation replacing EntryPoint checks.
- Bundler simulation and validation **cannot be assumed to reserve spend allowance**. A second operation might be executed in same bundle. Re-check price/recipient/budget in authorized EXECUTION path and update `spent[session][day]` atomically before outward token call; revert on failure. The transaction gas funding is separate from token spending cap.
- Do not treat gas used or UserOperation hash as a successful transfer; require actual success receipt/event, including smart-account execution outcome.
- Tie exception proof to specific chain/account/token/target/function/recipient/amount/calldataHash/deadline/nonce/policyVersion/approvalTier; mark nonce used only when a valid execution occurs. When policy is changed, invalidate stale intents via `policyVersion`.
- Have distinct access roles: `OWNER_ADMIN` signs each out-of-policy exception in default W3-02 mode; `JUNIOR_EXCEPTION_SIGNER` adds review proof with small ceiling; `SENIOR_EXCEPTION_SIGNER` adds review proof with greater but finite ceiling; `REVOKER` can only reduce risk (pause/revoke) and cannot expand policy. Policy/recipient changes always require admin owner authorization.
- A low-privilege ESP32 signer cannot add recipients, arbitrarily raise caps, unpause a compromised session, or change owner.
- Owner EOA signature is independent from agent and ESP32; if its key is compromised, wallet cannot guarantee safety. Use no real-value funds.
- Define UTC `dayIndex=floor(block.timestamp/86400)` and spend in token's smallest units; UI converts using pinned token decimals. For demo assume one token; real multi-token equivalent-value budgets need oracle design beyond scope.
- `revokeSession(sessionId)` authorization via owner or limited revoker role. Once confirmed, all future UserOps signed by that key rejected. `pause` and `revoke` are different states, tested separately.
- Nonce/chain-ID replay must fail; owner EIP-712 signature verified via ECDSA (and optionally ERC-1271 if owner is smart account, stretch). No EOA-compatible unrestricted operation path.

## Critical adversarial Foundry matrix
1. Allowed agent 20 passes. 2. 500 exceeds tx cap. 3. UTC aggregate 80+30 exceeds 100. 4. Target wrong. 5. Function wrong. 6. Recipient wrong. 7. Expired key. 8. Stolen key through alternate bundler. 9. Malicious approve() or batch/delegatecall. 10. Same exception nonce replay. 11. Signed 250 altered to 500 or new recipient. 12. Chain/account/domain/signing key changed. 13. Card junior attempts senior cap. 14. Senior policy change without owner signature. 15. Revoker tries send transfer. 16. Session revoked and direct UserOp rejected. 17. Concurrent sequential UserOps at daily cap. 18. Failure/revert does not mislabel transfer successful.

## Developer milestone
First working evidence = a real EntryPoint UserOperation in local Anvil/bundler with 20 mock token transfer success and >50 direct attempt rejected under independent chain validation/execution. If this fails, do not add Mirage or advanced CV.

## References
- https://eips.ethereum.org/EIPS/eip-4337
- https://docs.openzeppelin.com/contracts/5.x/account-abstraction
- https://eips.ethereum.org/EIPS/eip-712
