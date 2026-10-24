# Local rules — `services/device_crypto` (BASTION X V2.1)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:**
- Canonical EIP-712 typed data hashing and signature recovery for BASTION X v2.1.
- Implements `PaymentIntent` domain-separated struct hashing matching `contracts/src/BastionAccount.sol`.
- Implements dual-authorization verification (`verify_dual_authorization`): ESP32 physical review signer + Owner exception co-signature.
- Backend and host software MUST NEVER possess the physical ESP32 private key in production.
- Strictly adhere to low-s canonical ECDSA signature representation.

**Cross-directory contract:**
- Keep EIP-712 type hash, field order, and domain definitions byte-for-byte identical across Python, Solidity (`BastionAccount.sol`), and ESP32 C++ firmware (`esp32_signer.ino`).
