# Bootstrapping Laptop A, B and C — V2

## Prerequisites for both A and B
Clone same GitHub repo (each developer separate branch, pull before work), install Git, Node LTS, Python 3.11+/uv or venv. Pin repo-lock tool versions; avoid global conflicting packages. Set up trusted LAN with private IPs and host allowlists, synchronized UTC clocks. Keep `.env` machine-specific and Git-ignored. Do not download giant models on hardware-only B.

## A / RTX 5060
- Install Foundry/Anvil and a compatible ERC4337 EntryPoint + local bundler (lock versions), pnpm or npm for React, Python FastAPI stack, viem, SQLite. CUDA-appropriate PyTorch only if vision/LLM really needed.
- Run local chain, deploy mock token and BastionAccount; run 4337 policy tests and produce receipts.
- Run API/agent/indexer and web UI; attach laptop camera and ESP32 #2 with OLED #2 over USB; no signing secret.
- Permit inbound RPC from signed ESP32 device/Laptop B only if safe and explicitly configured; avoid exposing development Anvil publicly.
- Assign `PC_A_URL`, `CHAIN_RPC_URL`, `BUNDLER_URL`, `CHAIN_ID` and contract addresses in A `.env` without any owner key.

## B / Intel Ultra 7 155H
- Hardware labels: ESP32#1 signer via USB (flash/power), UNO Q USB-C, Uno#1 USB. ESP8266 uses Wi-Fi; USB for firmware/power. Uno#2 **optional** for watchdog.
- Use ESP-IDF and/or pinned Arduino core to program ESP32 #1; verify source library supports EIP712 Keccak + secp256k1 and recovery id, and flash signing-code constraints. Do **not** blindly enable irreversible eFuse secure boot/flash encryption in a time-limited event.
- Attach RC522 (SPI), OLED (I2C), two physical buttons directly on ESP32 as specified in HARDWARE_MAP. For first proof do fixed local test key and mock tokens only; no seed committed.
- On Uno#1 attach PIR, DHT11 and status LCD. UNO Q starts its Linux edge health service. ESP8266 runs buzzer alert firmware. Only B gateway opens relevant classic Uno COM port.
- If owner-admin wallet used for high tier, host separately from agent; NEVER import into A. `PC_B_URL`, `ESP32_SIGNER_ID`, permitted A chain RPC and B gateway address in local B config.

## C / RTX 4060 (only if needed)
Can independently host Anvil/RPC or a test chain for true `A down but revocation still reaches chain` demo, or receive moved Uno#2, or run independent QA/vision. Never attach same serial device to two active gateways. Document switch in `docs/HARDWARE_MAP.md` and `.env`.

## Smoke tests
1. A executes 20-unit allowed UserOp and 500-unit rejected operation via real EntryPoint.
2. B signer LCD/OLED displays identical decoded `PaymentIntent` values; button works by direct GPIO even with PC-B gateway stopped.
3. Device signature verifies from Solidity, mutated recipient fails.
4. Direct panic submits revocation without A API **when chain still reachable**; show failure honestly when RPC inaccessible.
5. UI reflects chain receipt statuses and device sources accurately.
