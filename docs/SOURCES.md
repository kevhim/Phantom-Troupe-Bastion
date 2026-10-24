# Technical Standards / Documents for Implementation

Official W3-02 statement from user-provided organizer screenshot: actual ERC-4337 account wallet; allowed contracts/functions/recipients, per-tx/daily cap, expiry, owner exceptions, correct signatures/nonces/chain ID.

- ERC-4337: https://eips.ethereum.org/EIPS/eip-4337 — EntryPoint, UserOperation, signature hash including EntryPoint/chain ID, nonce behavior, account validation.
- EIP-712: https://eips.ethereum.org/EIPS/eip-712 — typed structured data domain/signature.
- OpenZeppelin 5.x account abstraction: https://docs.openzeppelin.com/contracts/5.x/account-abstraction — compatible smart-account foundation; choose and pin implementation.
- OpenZeppelin cryptography: https://docs.openzeppelin.com/contracts/5.x/api/utils/cryptography — EIP712/ECDSA helpers.
- Espressif ESP32 flash encryption: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/security/flash-encryption.html — protections/limitations and production-release warnings.
- Espressif ESP32 secure boot: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/security/secure-boot-v2.html — only for supported variants; review irreversible eFuse workflows.

All third-party sources must be checked against pinned versions at implementation time. These documents support design choices, NOT proof that chosen board supports hardware secp256k1 or that firmware was built.
