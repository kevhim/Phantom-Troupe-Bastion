# Local rules — `firmware/esp32_signer` (BASTION X V2)

Read `/PROJECT_MASTER.md`, `/AGENTS.md`, and ancestor `rules.md` files first. Read this directory's domain specification before implementing.

**Directory scope:** Device signer owns directly wired RC522 SPI, OLED I2C, panic GPIO32 and approval GPIO33. Sign only canonical EIP712 operations after local review, never export key. Direct revocation RPC must report confirmed vs unavailable.

**Cross-directory contract:** do not silently modify wallet permissions, EIP712 serialization, signer wiring, network dependencies, database role, UI truthfulness, or claimed implementation state. Update docs and tests in same pull request.
