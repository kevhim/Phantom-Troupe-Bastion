# BASTION X v2.3 — Judge Demonstration Runbook (7 Scenes)

This runbook specifies the step-by-step live demonstration for hackathon judges, covering all Phase 1 and Phase 2 capabilities across our Two-Laptop Cyber-Physical setup.

---

## Pre-Flight Checklist
- [x] **Laptop B (Intel Ultra 7 155H):**
  - Anvil Blockchain running on `:8545` (Chain ID 31337)
  - Contracts compiled and deployed: `BastionAccount`, `RiskCircuitBreaker`, `GuardianRecovery`, `QuotaPaymaster`, `MockToken`, `MockVendor`
  - ESP32 #1 Signer connected via USB COM port (115200 baud) with OLED #1 and RC522 active
- [x] **Laptop A (RTX 5060):**
  - FastAPI backend running on `:8000`
  - React Web UI running on `:5173`
  - ESP32 #2 OLED telemetry and ESP8266 buzzer online

---

## Scene 1 — Normal In-Policy Payment (Phase 1 Baseline)
1. **Action:** Navigate to **Agent Workbench & Hijack Lab** (`/agent`).
2. **Input:** Select Target Vendor `0x00...cc`, enter payment amount `25 bUSD`. Click **Send In-Policy (25 bUSD)**.
3. **Execution:**
   - AI Agent signs using its delegated session key.
   - UserOperation submitted to Anvil bundler.
   - Smart contract verifies all 6 W3-02 policy dimensions (target, selector, recipient, per-tx cap, daily cap, expiry).
4. **Observable Proof:**
   - Transaction receipt confirmed in Anvil block explorer.
   - Vendor balance increases by 25 bUSD; wallet balance decreases by 25 bUSD.
   - Command Overview shows UTC Day Spend: `25 / 100 bUSD`.

---

## Scene 2 — Adversarial Hijack Simulation (Requirement 1)
1. **Action:** On the **Agent & Hijack Lab** page, open the **Adversarial Test Matrix**.
2. **Explanation to Judges:** "We assume the AI agent has been completely hijacked by malware. The attacker possesses the agent's real ECDSA private key and submits transactions directly to the blockchain bundler."
3. **Demo Actions:**
   - Click **Run Full Attack Suite (8 Scenarios)**.
   - Watch the live on-chain containment across all 8 attack scenarios:
     - `ATTACK-01` (250 bUSD payment): Rejected on-chain with `PerTxLimitExceeded`. Loss: 0 bUSD.
     - `ATTACK-02` (5x 25 bUSD payments): Strictly capped at 100 bUSD daily limit. 5th payment rejected.
     - `ATTACK-03` (Bad recipient): Rejected with `UnauthorizedRecipient`. Loss: 0 bUSD.
     - `ATTACK-04` (Token approve): Rejected with `UnauthorizedTargetOrSelector`. Approvals blocked.
     - `ATTACK-05` (Direct bundler bypass): Bypassing FastAPI backend produces identical on-chain revert.
     - `ATTACK-06` (Replay attack): Old signature rejected by EntryPoint nonce check.
4. **Observable Proof:**
   - Financial Loss Banner updates: Total Attempted: `1,945 bUSD` | Actual Lost: `100 bUSD` | Prevented: `1,845 bUSD`.
   - Invariant verified: $\text{agent\_loss} \le \text{daily\_limit}$.

---

## Scene 3 — Spending Velocity Burst & Automatic Freezing (Requirement 2)
1. **Action:** Trigger `ATTACK-07` (Rapid Unusual Spending Burst: 3 transactions in 20 seconds).
2. **Execution:**
   - `BastionAccount.sol` evaluates `circuitBreaker.evaluateAndRecord(...)`.
   - On the 3rd rapid payment attempt, the circuit breaker detects high velocity ($\ge 3$ tx in 60s).
   - **Crucial Technical Demonstration:** Smart contract transitions state to `FROZEN_AUTOMATIC` **without reverting**, persisting the freeze on-chain while halting token execution!
3. **Observable Proof:**
   - Top banner lights up red: `SECURITY CONTAINMENT ACTIVE: Circuit Breaker Tripped!`.
   - Security SOC shows Circuit Breaker State: `FROZEN_AUTOMATIC`.
   - Metrics display certified benchmark: **100% Detection Rate, 0.0% False Freeze Rate**.
   - Subsequent agent payment requests are rejected immediately at the contract entry point.

---

## Scene 4 — 3-of-5 Guardian Recovery with 48h Timelock & Owner Veto (Requirement 3)
1. **Action:** Navigate to **Smart Account & Recovery** (`/wallet`).
2. **Explanation to Judges:** "Assume the wallet owner lost their key or was compromised. 3 of 5 independent guardians must approve recovery, but funds are protected by a mandatory 48-hour timelock."
3. **Demo Actions:**
   - Click **Cast Vote** on Guardian 1: Status becomes `COLLECTING_APPROVALS (1/3)`.
   - Click **Cast Vote** on Guardian 2: Status is `COLLECTING_APPROVALS (2/3)`.
   - Click **Cast Vote** on Guardian 3: Quorum reached! Status immediately transitions to `TIMELOCKED`.
   - Click **Execute Rotation**: Contract strictly reverts with `TimelockNotExpired`! (Countdown has 48 hours remaining).
   - Click **Simulate +48h Warp** (Anvil `evm_increaseTime 172800`): Timelock is now expired.
   - Click **Execute Rotation**: Transaction succeeds!
4. **Observable Proof:**
   - New Owner is installed on-chain.
   - Old agent session key is permanently cleared to `0x000...000`.
   - Demonstrating Owner Veto: Reset proposal, cast 3 votes, and click **Owner Veto**. Status permanently transitions to `VETOED`.

---

## Scene 5 — Gas Sponsorship Isolation (Requirement 4)
1. **Action:** View the **ERC-4337 QuotaPaymaster** panel on the `/wallet` route.
2. **Explanation to Judges:** "To prevent a compromised agent from draining corporate gas reserves, each agent has an isolated quota backed by independent EntryPoint deposits."
3. **Demo Actions:**
   - Click `ATTACK-08` (Gas Sponsorship Abuse).
   - Agent A floods the network with gas-draining operations.
4. **Observable Proof:**
   - Agent A's quota drops to `0 / 1,000,000 gas` and latches `EXHAUSTED`.
   - Agent B's quota remains at `1,000,000 / 1,000,000 gas` (`ACTIVE`).
   - Agent A cannot consume another unit of gas, while Agent B continues transacting smoothly.

---

## Scene 6 — Formal Invariant Verification (Requirement 5)
1. **Action:** Navigate to **Settings & Invariants** (`/settings`) or open terminal.
2. **Run Invariants:** Run `forge test --match-contract WalletInvariantTest -vvv`.
3. **Observable Proof:**
   - 256 runs, 16,384 fuzzed calls pass with 0 counterexamples.
   - All 10 security invariants verified:
     - `INV-1`: No Unauthorized Outflow
     - `INV-2`: Daily Spending Cap
     - `INV-3`: Expired Session Block
     - `INV-4`: 3-of-5 Guardian Quorum
     - `INV-5`: 48h Timelock Integrity
     - `INV-6`: Owner Veto Absolute Block
     - `INV-7`: Paymaster Isolation
     - `INV-8`: Alternative Path Resistance
     - `INV-9`: Nonce Replay Resistance
     - `INV-10`: Post-Recovery Session Revocation

---

## Scene 7 — Cyber-Physical Hardware Integration
1. **Action:** Submit an out-of-policy transaction of 250 bUSD ($>50$ cap) requiring owner exception.
2. **Observable Proof on Hardware:**
   - **ESP32 #1 OLED (Laptop B):** Shows token `bUSD`, amount `250.00`, recipient prefix, and finger challenge.
   - **RC522 RFID Reader:** Tap Senior RFID card (`331C4950`).
   - **Physical Buttons:** Press GPIO33 to generate hardware signature.
   - **Emergency Revocation:** Press GPIO32 panic button on ESP32 to demonstrate independent hardware Wi-Fi revocation directly to the local chain, triggering ESP8266 buzzer!
