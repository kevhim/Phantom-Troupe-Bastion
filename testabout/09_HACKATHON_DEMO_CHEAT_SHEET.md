# Module 9: Hackathon Demo Cheat Sheet & Judge Q&A Guide

## ⏱️ The 60-Second Elevator Pitch

> *"Judges, AI agents are already buying things for humans: cloud API credits, flights, groceries. But if you give an AI a traditional crypto private key, a single prompt injection or malware infection can drain your entire bank account in seconds.*
> 
> *We built **BASTION X** — a breach-resilient ERC-4337 AI Agent Wallet with cyber-physical zero-trust security.*
> 
> *Even if an attacker completely hijacks our AI agent and steals its real private key, our on-chain smart account guarantees that financial losses can **never exceed the owner's daily budget**. If an agent behaves abnormally, our on-chain circuit breaker **automatically freezes the wallet**. High-value exceptions require physical review on a dedicated **ESP32 hardware screen** and an **RFID card tap**. And if the master key is ever lost, our **3-of-5 guardian recovery with a 48-hour delay** lets you safely restore control."*

---

## 🎬 The 7-Scene Live Demonstration Script

### Scene 1: Autonomous In-Policy Payment (The Normal Case)
- **Where to click:** Navigate to `/agent` (Agent Workbench).
- **Action:** Select Vendor `0x00...cc`, enter `25 bUSD`, click **Send In-Policy (25 bUSD)**.
- **What to tell judges:** *"The AI agent uses its session key to purchase API credits autonomously. The smart contract validates all 6 W3-02 policies on-chain and confirms the transfer without human intervention."*

### Scene 2: The Hijacked Agent Attack Suite (Requirement 1)
- **Where to click:** On `/agent`, scroll to the **Adversarial Hijack Lab**.
- **Action:** Click **Run Full Attack Suite (8 Scenarios)**.
- **What to tell judges:** *"We simulate an attacker who has stolen the agent's real private key. The attacker tries oversized payments, microtransaction drains, bad recipients, approving token drains, replaying nonces, and bypassing the backend. Notice the result: Out of 1,945 bUSD attempted, exactly 100 bUSD was lost — strictly matching our daily budget cap!"*

### Scene 3: Automatic Spending Burst Freeze (Requirement 2)
- **Where to click:** On `/agent`, trigger `ATTACK-07` (Rapid Velocity Burst).
- **What to tell judges:** *"The hacker tries to fire 3 rapid payments in 20 seconds. Watch the top banner turn red! Our on-chain RiskCircuitBreaker detects the velocity anomaly and permanently latches into FROZEN_AUTOMATIC without rolling back. The payment is aborted and all subsequent transactions are blocked."*

### Scene 4: 3-of-5 Guardian Recovery & Owner Veto (Requirement 3)
- **Where to click:** Navigate to `/wallet` (Smart Account & Recovery).
- **Action:** Click **Cast Vote** on Guardian 1, 2, and 3. Show status change to `TIMELOCKED`.
  - Try to click **Execute Rotation** $\to$ Reverts with `TimelockNotExpired`!
  - Click **Simulate +48h Warp** (Anvil time-travel) $\to$ Click **Execute Rotation** $\to$ Success! Owner rotated, old agent key wiped to zero!
- **What to tell judges:** *"If the owner loses their key, 3 of 5 guardians can recover the wallet. But notice the crucial detail: The 48-hour countdown starts strictly on the 3rd vote. During those 48 hours, the real owner has absolute veto authority to cancel a hostile takeover."*

### Scene 5: Gas Sponsorship Isolation (Requirement 4)
- **Where to click:** On `/wallet`, look at the **QuotaPaymaster** cards.
- **Action:** Run `ATTACK-08` (Gas Spam).
- **What to tell judges:** *"Notice how Agent A's gas allocation drops to 0 gas and latches EXHAUSTED, but Agent B's gas pool remains at 100% (1,000,000 gas)! In BASTION X, an attacker spamming transactions can never drain sponsorship from other agents."*

### Scene 6: Formal Invariant Fuzzing (Requirement 5)
- **Where to click:** Navigate to `/settings` or show terminal `forge test`.
- **What to tell judges:** *"We didn't just write unit tests. We ran stateful invariant fuzzing with Foundry: 16,384 calls across 256 runs checking 10 formal security invariants. Zero violations."*

### Scene 7: Cyber-Physical Hardware
- **Action:** Submit a 250 bUSD exception $\to$ Show OLED #1 on ESP32 displaying the exact amount $\to$ Tap Senior RFID card $\to$ Press GPIO 33 button.
- **What to tell judges:** *"For purchases exceeding the agent's autonomous limits, the transaction must be reviewed on our independent ESP32 screen and physically confirmed. And if the operator presses the GPIO 32 panic button, the ESP32 broadcasts a revocation transaction directly over Wi-Fi, completely bypassing the computer!"*

---

## 🧠 Common Judge Questions & Winning Answers

### Q1: "Why did you use ERC-4337 instead of a normal Gnosis Safe?"
> **Answer:** *"ERC-4337 provides a standardized, native UserOperation lifecycle with Account Abstraction. It allows us to implement custom validation logic (`validateUserOp`), native Paymaster gas sponsorship (`validatePaymasterUserOp`), and session keys with granular limits, all without modifying the Ethereum consensus layer."*

### Q2: "Can an attacker bypass your React frontend or FastAPI backend?"
> **Answer:** *"Yes, and we specifically designed for that! In our threat model, Laptop A is untrusted. If an attacker writes a raw script and submits UserOperations directly to the Anvil node or bundler, the exact same 6 spending policies and circuit breaker rules are enforced on-chain by `BastionAccount.sol`. The smart contract is the final authority."*

### Q3: "Is an RFID card UID secure?"
> **Answer:** *"No, RFID UIDs can be cloned. We explicitly disclose this in our threat model. In BASTION X, the RFID card merely selects the intended review tier (Junior vs Senior). Financial execution strictly requires Dual Cryptographic Authorization: an ECDSA signature from the ESP32 hardware AND an ECDSA co-signature from the authentic Owner key."*

### Q4: "How do you freeze the wallet on-chain if EVM reverts undo state changes?"
> **Answer:** *"That is one of the most critical bugs in amateur smart contracts. If you revert, the state change setting `isFrozen = true` is rolled back! In `BastionAccount.sol`, when an anomaly is detected, we update the state to `FROZEN_AUTOMATIC`, emit an alert event, and safely `return` without making the token transfer. The freeze persists, and zero tokens are stolen."*

### Q5: "What stops 3 rogue guardians from stealing the wallet while I'm asleep?"
> **Answer:** *"The mandatory 48-hour timelock countdown. It only starts when the 3rd vote is cast, giving the authentic owner a full 48-hour window to review the alert and execute an `ownerVeto`, which permanently aborts the proposal."*
