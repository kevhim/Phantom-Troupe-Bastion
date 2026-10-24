# Laptop B (Intel Ultra 7 155H) — Phase 2 Deployment & Operation Runbook

## 1. Machine Specifications & Role
- **Hardware:** Intel Core Ultra 7 155H, Integrated Intel Arc Graphics, 32GB RAM, Windows 11 / WSL2.
- **Architectural Role:** Trusted Blockchain Infrastructure, Hardware Security Root & Governance.
- **Running Services:**
  - Local Anvil Blockchain Node (`http://0.0.0.0:8545`, Chain ID 31337)
  - Compatible ERC-4337 Bundler (`http://0.0.0.0:3000`)
  - Smart Contract Suite (`BastionAccount.sol`, `RiskCircuitBreaker.sol`, `GuardianRecovery.sol`, `QuotaPaymaster.sol`)
  - Foundry Fuzz & Stateful Invariant Engine (`forge test`)
  - Hardware Serial Gateway to ESP32 #1 Signer (`services/gateway/`)
  - Supervisor Service (`http://0.0.0.0:8010`)
  - Forensic Flight Recorder Checkpoint Anchor
- **Connected Hardware Peripherals:**
  - Single ESP32 Dedicated Signer & Dual OLED Controller (OLED #1 Review @ 0x3C, OLED #2 Status @ 0x3D on GPIO 21/22, RC522 SPI RFID Reader, GPIO 33 Approve Button, GPIO 32 Panic Button)
  - Junior RFID Card (`EE44651D`) & Senior RFID Card (`331C4950`)
  - Arduino UNO Q 4GB (Edge Security Node & Deterministic Heartbeat)
  - Arduino Uno #1 (5V Active Buzzer on Pin D8, PIR Sensor on D2, DHT11 on D4, SG90 Servo on D6; 16x2 LCD decommissioned)

---

## 2. Prerequisites & Environment Setup

### A. Foundry Setup
```powershell
# Install Foundry if not present
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify forge and anvil versions
forge --version
anvil --version
```

---

## 3. Starting Laptop B Blockchain & Contracts

### Service 1: Launch Anvil Blockchain Node (Port 8545)
```powershell
anvil --host 0.0.0.0 --port 8545 --chain-id 31337
```
*Note:* Binding to `0.0.0.0` allows Laptop A to connect across the local subnet.

### Service 2: Compile & Test Smart Contracts
```powershell
cd contracts
forge build
forge test
```
*Expected Result:* All 25 unit and integration tests pass.

### Service 3: Run Stateful Invariant Fuzzing
```powershell
cd contracts
forge test --match-contract WalletInvariantTest -vvv
```
*Expected Result:* 256 runs, 16,384 fuzzed calls pass with 0 counterexamples across all 10 invariants.

---

## 4. Demonstrating 48-Hour Recovery Time-Travel

To simulate the 48-hour recovery timelock without waiting two calendar days:
```powershell
# Cast 3rd guardian vote to begin 48h countdown
# Then advance Anvil EVM timestamp by 48 hours (172,800 seconds):
curl -H "Content-Type: application/json" -X POST --data '{"jsonrpc":"2.0","method":"evm_increaseTime","params":[172800],"id":1}' http://127.0.0.1:8545

# Mine a block to latch the new timestamp:
curl -H "Content-Type: application/json" -X POST --data '{"jsonrpc":"2.0","method":"evm_mine","params":[],"id":2}' http://127.0.0.1:8545
```
Once advanced, execute `executeRecovery(...)` to complete ownership rotation.

---

## 5. Laptop B Troubleshooting
- **Firewall blocking Laptop A:** In Windows Defender Firewall, allow inbound TCP on port 8545 and port 3000 for Private Networks.
- **ESP32 COM port disconnected:** Check Device Manager for Silicon Labs / CH340 COM port and update `SERIAL_PORT` in `services/gateway/src/serial_gateway.py`.
