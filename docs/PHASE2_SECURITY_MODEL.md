# BASTION X v2.3 — Phase 2 Threat Model & Security Architecture

## 1. Core Threat Model: The Compromised AI Agent

In BASTION X Phase 2, we adopt an explicit zero-trust security assumption:

> **Adversarial Assumption:** The AI Purchasing Agent on Laptop A has been fully compromised. The attacker possesses the agent's real ECDSA session private key (`agentSessionKey`), controls the Python runtime, can bypass the FastAPI backend, and can submit arbitrary raw `UserOperation` payloads directly to the ERC-4337 bundler on Laptop B (`http://192.168.1.100:8545`).

### Attacker Capabilities
1. **Instruction Manipulation:** Prompt injection and jailbreaks.
2. **Process Control:** Tampering with FastAPI routes, memory, and database.
3. **Network Autonomy:** Crafting raw JSON-RPC requests directly to the Anvil node or bundler.
4. **Transaction Parameter Modification:** Falsifying recipient addresses, token amounts, call data, gas limits, and nonces.
5. **High-Frequency Spam:** Rapid bursts of transactions to race detection mechanisms.
6. **Gas Sponsorship Exhaustion:** Generating invalid or reverting operations to drain paymaster funds.

### Attacker Non-Capabilities
1. The attacker does **NOT** possess the Owner private key.
2. The attacker does **NOT** possess the ESP32 hardware supervisor key.
3. The attacker does **NOT** possess the 5 Guardian private keys.
4. The attacker cannot forge physical button presses (GPIO33/GPIO32) or RFID card reads (RC522 SPI) on Laptop B.
5. The attacker cannot alter immutable smart contract bytecode on the blockchain.

---

## 2. Security Boundaries & Enforcing Entities

| Component | Trust Level | Security Boundary Role |
| :--- | :--- | :--- |
| **`BastionAccount.sol`** | **Authoritative Root** | Final arbiter of financial execution. Enforces all 6 W3-02 policies, circuit breaker freezes, and ownership. |
| **`RiskCircuitBreaker.sol`** | **Authoritative Sub-Root** | Evaluates spending velocity ($\ge 3$ tx in 60s) and budget bursts ($\ge 70\%$ in 5m). Persists freeze state on-chain. |
| **`GuardianRecovery.sol`** | **Authoritative Governance** | Enforces 3-of-5 quorum, 48-hour delay starting at quorum, owner veto, and session key invalidation. |
| **`QuotaPaymaster.sol`** | **Authoritative Gas Boundary** | Enforces per-agent gas quotas backed by isolated EntryPoint deposits. Spam cannot drain unallocated funds. |
| **ESP32 Signer #1 (Laptop B)** | **Physical Security Anchor** | Autonomous hardware signer. Requires physical OLED review, RFID presentation, and sustained GPIO33 press. |
| **FastAPI Backend (Laptop A)** | **Untrusted Application Layer** | Orchestrates purchasing, relays requests, provides telemetry. Bypassing it cannot breach on-chain policy. |
| **React Frontend (Laptop A)** | **Untrusted Presentation Layer** | Visualizes state and submits user operations. Cannot authorize out-of-policy execution without owner co-signature. |

---

## 3. Circuit Breaker Freezing Architecture

### The Anti-Rollback Constraint
Standard Solidity fraud prevention using `require(condition, "Fraud")` or `revert()` rolls back all state changes, including any attempt to set `isFrozen = true`.

To solve this, BASTION X implements a **non-reverting state-preserving circuit breaker**:
```solidity
// In BastionAccount.sol
(bool anomalyDetected, string memory reason) = circuitBreaker.evaluateAndRecord(
    msg.sender,
    intent.tokenAddress,
    intent.amountBaseUnits
);

if (anomalyDetected) {
    emit AgentFrozenByCircuitBreaker(intent.actorSession, reason);
    // Persist freeze state and safely return without making the payment!
    return;
}
```
This guarantees:
1. The smart account permanently transitions to `FROZEN_AUTOMATIC`.
2. The transaction succeeds at the EntryPoint level without reverting, persisting the freeze.
3. Protected ERC-20 tokens are **NOT** transferred.

---

## 4. 3-of-5 Guardian Recovery Protocol

### Timelock Countdown Semantics
- **5 Independent Guardians:** Generated and configured during contract initialization.
- **Quorum Requirement:** Exactly 3 distinct registered guardian addresses.
- **Countdown Trigger:**
  $$\text{readyAt} = \text{quorumReachedAt} + 48\text{ hours}$$
  The 48-hour timelock countdown begins **strictly when the 3rd distinct vote is recorded**, NOT when the proposal is created.
- **Owner Veto:** The current owner can call `vetoRecovery(proposalId)` at any time before execution. A vetoed proposal cannot be replayed or resurrected.
- **Atomic Ownership Rotation:**
  1. `owner = proposal.proposedOwner;`
  2. `agentSessionKey = address(0);` (Old session keys immediately invalidated).
  3. All pending out-of-policy approvals invalidated.

---

## 5. Gas Sponsorship Isolation Model

### Quota Isolation Strategy
- A shared paymaster treasury introduces cross-agent denial-of-service risks: a compromised Agent A could spam high-gas transactions until the entire paymaster deposit is exhausted, rendering Agent B unable to operate.
- In BASTION X, `QuotaPaymaster.sol` enforces:
  1. Per-agent gas limits stored on-chain in `quotas[agentKey]`.
  2. Isolated backing deposits in the ERC-4337 EntryPoint.
  3. Real-time post-operation gas deduction in `postOp(PostOpMode mode, bytes calldata context, uint256 actualGasCost)`.
  4. If Agent A exhausts its allocation, only Agent A's operations are rejected; Agent B's sponsorship pool remains completely unaffected.

---

## 6. Known Security Trade-Offs & Limitations

1. **ESP32 Microcontroller Security:** ESP32 is a low-cost embedded prototyping device; it is not a CC EAL6+ certified hardware security module (HSM).
2. **RFID Card Emulation:** Standard 13.56 MHz Mifare Classic UIDs can be cloned. BASTION X mitigates this by requiring Dual Authorization (physical OLED review + physical GPIO33 press + cryptographic Owner co-signature).
3. **Owner Veto Griefing:** If an attacker completely compromises the Owner's private key, the attacker could repeatedly veto legitimate guardian recovery proposals. BASTION X relies on offline multi-sig or air-gapped cold storage for the Owner root key.
4. **Anvil Local Blockchain Timelocks:** In production, 48 hours is real wall-clock time. For testing and demonstration, local Anvil time-travel (`vm.warp` / `evm_increaseTime`) is utilized.
