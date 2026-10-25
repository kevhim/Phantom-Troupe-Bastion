# ESP32 Transaction Signer: Trust Protocol, Signing and UX

## Purpose
Reduce reliance on Laptop A by storing and using a limited **exception signer** on the single ESP32 on Laptop B. This is **not** a certified HSM, not fully air-gapped (it has Wi-Fi), not immune to physical access or malicious firmware. Owner/treasury root admin private key remains independent on supervisor wallet, never stored on the agent host. Zero ESP32s exist on Laptop A.

## Signing permissions on chain (least privilege)
- Session agent key: ordinary allowed payments only.
- `juniorExceptionSigner`: limited second-signature for tiny exception ceiling (illustratively 2,000 mock units), selected by Card 1 for review. **Strict W3-02 mode requires an independent owner EIP-712 one-operation signature as well** for anything outside the agent policy. UID can be cloned, so the device card is only a weak role indicator.
- `supervisorExceptionSigner`: separate device key with larger **but finite** cap (example: 10,000 mock units); Card 2 selects review. **All out-of-policy payments in the default build require independent owner one-operation EIP-712 co-signature**. New recipient, policy modification, recovery and transfers beyond hard cap additionally require higher admin validation, and remain unavailable without explicit trusted owner action.
- `revocationSigner` (ideally distinct key) can only **disable / revoke** a delegated agent session. No power to transfer, extend expiry, whitelist recipients or change policy.
- If ESP32 is compromised, loss is bounded by caps/roles enforced by smart contract, but NOT zero. A cloned RFID may trigger a role if no additional factor.

## One exact typed operation (not free-form text)
Suggested EIP-712 `PaymentIntent` fields (versions pinned by both ends):
```
chainId, verifyingAccount, accountNonce, requestId,
policyVersion, actorSession, approvalTier,
tokenAddress, targetContract, functionSelector,
recipientAddress, amountBaseUnits, maxPerTxException,
deadline, calldataHash
```
Domain: name=`BastionX`, version=`2`, chainId, verifyingContract=account. Contract must reconstruct and compare exact payment fields to supported execution calldata. Display must render *those parsed fields*, never unverified text fields supplied with the request. EIP-712 signatures must be canonical and low-s (use audited crypto library). Use 32-byte digest of EIP-712 payload; ESP32 software needs Keccak-256 + secp256k1 signing where verified for the exact board; do not assert hardware ECDSA acceleration is available for an unspecified ESP32 variant.

## Safeguarded request lifecycle
1. Agent/backend creates unsigned **canonical** intent and operation. API cannot sign exceptions itself.
2. Signer independently receives intent via authenticated transport, validates type, address formatting, token decimals from pinned registry, wallet, chain ID, policy version and whitelist of supported function signatures. Device may confirm chain state over a trusted RPC but cannot intrinsically know real-world vendor identity.
3. OLED pages display total amount/token, target/function, full recipient address (in sequential frames), chain ID, wallet/account, expiration and short intent fingerprint. Display no opaque `"PAY ₹500"` string from laptop A.
4. Physical RFID scan is captured **directly by ESP32 SPI**. Show selected demo role (JUNIOR/SENIOR) and role ceiling. UID itself is not strong authentication.
5. Operator presses physical approval button *on ESP32 GPIO* during a short human-confirm window; require a sustained press and fresh nonce, check same intent still displayed (no last-second swap). Panic button at any time rejects/signing aborts.
6. ESP32 signs exact typed operation with role-scoped key and emits signed approval proof; no private key ever sent over Wi-Fi/USB. Host must not be able to make ESP32 sign by serial command or arbitrary URL.
7. In **STRICT_OWNER_EXCEPTION_MODE** smart account verifies BOTH device review signer signature AND independent owner signature for each out-of-policy operation, plus tier, nonce/expiry and strict operation equality on-chain. One-use nonce consumed atomically by successful execution; replay attempts fail. An owner-predelegated exception tier without per-operation owner signature is a separately labeled optional variant, not the default challenge compliance path.
8. Local receipt/audit links intent hash, full reviewed data, device key ID/role and userOp/tx hash. No raw secrets logged.

## Trusted-path caveat
The ESP32 receives unsigned requests from an untrusted computer. It doesn't need to trust them **if** it independently parses, displays and signs exactly the canonical on-chain operation, and an attentive authorized person checks the address/amount. However malware can still cause denial-of-service, distract the operator, tamper with device firmware if flashing is unprotected, or exploit bugs in the signing parser. Never claim it prevents every host compromise.

## Security hardening gates
1. Identify exact devboard/ESP32 variant; check secure boot, flash/NVS encryption, eFuse status and recovery tradeoffs against official Espressif docs. DO NOT blindly burn irreversible fuses during the hackathon.
2. Generate keys within device where possible; prefer no recoverable plaintext file, no secrets in source/logs and authenticated firmware images.
3. Confirm firmware signing test against Solidity ECDSA.recover and `viem` signed typed data; cover chain/account/domain/policy/nonce/calldata mutation.
4. Replay, swapped recipient after review, different token decimals, malformed calldata, UINT overflow, stale firmware, USB unplug, offline RPC and rapid double approval must all reject or clearly fail.
5. Use short, reliable review countdown (10-30 sec user interaction); on-chain approval lifetime longer to handle block inclusion (e.g. 120 sec). Once transmitted, expiration and one-use nonce remain enforced on chain.
6. **Approval button** never directly authorizes a transaction without the proper signature. **Panic button** always wins over pending signing.

## Implementation Status in v2.3 (Phases 4 + 5 Verified)
- **Firmware Implementation:** `firmware/esp32_signer/esp32_signer.ino`, `crypto_utils.cpp`, `keccak256.cpp`
- **On-Device Cryptographic Engine:**
  - Micro-ecc secp256k1 ECDSA signing with canonical low-s (`s <= 0x7FFFFFFF...`).
  - RFC 6979 deterministic k derivation to prevent k-reuse private key leakage.
  - Canonical Keccak-256 implementation matching Ethereum EVM.
  - EIP-712 Domain Typehash: `keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")` (`0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f`).
  - Bit-for-bit test vector alignment: digest `0xdbd5bdf697c35a20b39c8b2eaadd3fd8dacd3221094d71378836798cfa8f3625` matching `schemas/signing/test_vectors.json`, recovering exactly to Junior Signer `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`.
- **4-Page OLED Trusted Review (Fail-Closed):**
  - Primary SSD1306 OLED #1 at `0x3C` mandatory; missing or disconnected display locks device and aborts signing.
  - Page 0: Request ID, Tier (JUNIOR/SENIOR), Chain ID, Nonce.
  - Page 1: Target Contract and Function Selector.
  - Page 2: Recipient Address (paginated high/low 20-byte chunks) and Amount in bUSD.
  - Page 3: Calldata Fingerprint (8-byte hex), Expiry Deadline, Action Status.
  - Auxiliary SSD1306 OLED #2 at `0x3D` provides status telemetry (block height, session status, budget stats) non-blockingly.
- **Physical Pin Mapping & Hardware Controls:**
  - SPI RC522 RFID: SCK=GPIO18, MISO=GPIO19, MOSI=GPIO23, SS=GPIO5, RST=GPIO27.
  - Shared I2C: SDA=GPIO21, SCL=GPIO22 (OLED #1 @ 0x3C fail-closed review, OLED #2 @ 0x3D status).
  - Physical Approve Button: GPIO33 (INPUT_PULLUP, sustained press >= 1.5s; serial commands cannot spoof physical input).
  - Physical Panic Button: GPIO32 (INPUT_PULLUP, instant ISR interrupt, aborts signing and triggers direct RPC revocation).
- **Independent Panic Revocation Lifecycle:**
  - State Progression: `PANIC_LOCAL` -> `REVOKE_SIGNED` -> `REVOKE_SUBMITTED` -> `REVOKE_CONFIRMED` / `REVOKE_FAILED` / `REVOKE_UNAVAILABLE`.
  - Dedicated Revoker Signer: Anvil Account #4 (`0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`), authorized in `BastionAccount.revokerRole`.
  - Direct Wi-Fi RPC: Bypasses Laptop A application host; communicates directly with Laptop B Anvil node (`:8545`).
  - Verifies mined receipt (`status == 1`) and on-chain state (`revokedSessions(sId) == True`) before asserting `REVOKE_CONFIRMED`.
  - If Wi-Fi or RPC is offline, reports `REVOKE_UNAVAILABLE` truthfully.
- **Hardware Security Test Suite:**
  - Verified by `tests/firmware/test_esp32_hardware_security.py` (11 of 11 passing on physical hardware COM10):
    1. Valid device signature matches `schemas/signing/test_vectors.json`.
    2. Modified recipient or amount rejected.
    3. Wrong chain ID rejected.
    4. Replayed approval rejected (`REPLAYED_NONCE`).
    5. Unknown RFID UID rejected (`UNKNOWN_RFID`).
    6. Physical button spoofing rejected without low pin.
    7. Device disconnection fails closed.
    8. ESP32 reboot recovery verified.
    9. Emergency panic lifecycle verified.
    10. Blockchain RPC failure reported truthfully (`REVOKE_UNAVAILABLE`).
    11. Confirmed revocation verified on chain.

## Chain/UI claims
Card UID = demo role selection / weak credential. OLED = more independent review but not 'unhackable'. ESP32 = isolated application signer, not production hardware-backed key vault. A stronger biometric anti-deepfake system would need independent trusted camera input and genuine identity verification; current finger gestures do not provide those assurances.
