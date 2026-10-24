# BASTION X — Zero to 100 Complete Theory & Learning Guide
## Everything You Need to Know About the Project in Simple Everyday Terms

Welcome to the complete learning pack for **BASTION X**!

If you are a student, developer, team member, or preparing to present to hackathon judges, this guide will take you from **absolute zero** (knowing nothing about AI wallets or smart contracts) to **100** (understanding the entire cyber-physical architecture, threat model, math proofs, and hardware setup).

---

## 📚 Guide Directory

1. **[Module 1: What is BASTION X Explained Simply](01_WHAT_IS_BASTION_X_EXPLAINED_SIMPLY.md)**
   - The real-world problem: AI agents buying things on your behalf (groceries, cloud APIs, flight tickets).
   - Why traditional crypto wallets are dangerous for AI agents.
   - What is an ERC-4337 Smart Account wallet?
   - The BASTION X core philosophy: "Never trust the AI host with the keys to the kingdom."

2. **[Module 2: The Six Rules of Spending (W3-02 Policies)](02_THE_SIX_RULES_OF_SPENDING.md)**
   - Policy 1: Allowed Target Contract (The Store)
   - Policy 2: Allowed Function Selector (The Allowed Action)
   - Policy 3: Allowed Recipient (The Cashier)
   - Policy 4: Max Per-Transaction Limit (The Swipe Cap)
   - Policy 5: Daily Spending Cap (The Daily Budget)
   - Policy 6: Session Expiry (The Time Limit)
   - How smart contracts enforce these rules mathematically on-chain.

3. **[Module 3: Physical Zero-Trust Hardware & The Two-Laptop Setup](03_PHYSICAL_ZERO_TRUST_HARDWARE.md)**
   - Why software alone cannot stop an infected computer.
   - Laptop A (The Untrusted AI Host) vs Laptop B (The Trusted Security Root).
   - The ESP32 Dedicated Signer with OLED Screen ("What You See Is What You Sign").
   - The RFID Cards (Junior & Senior approval tiers).
   - The Physical Buttons (GPIO 33 Approval vs GPIO 32 Emergency Panic Revocation).
   - The ESP8266 remote Wi-Fi buzzer alarm.

4. **[Module 4: Phase 2 Hijack Containment (When the AI is Hacked)](04_PHASE_2_HIJACK_CONTAINMENT.md)**
   - The worst-case scenario: A hacker steals the AI agent's private key.
   - The 8 Scripted Hijack Attacks explained in plain English.
   - How BASTION X guarantees that even with the real private key, the hacker can NEVER steal more than the daily limit.

5. **[Module 5: Automatic Freezing & The Smart Circuit Breaker](05_AUTOMATIC_FREEZE_CIRCUIT_BREAKER.md)**
   - What is an on-chain circuit breaker? (Like the electrical fuse in your house).
   - Velocity Anomaly ($\ge 3$ transactions in 60 seconds).
   - Burst Anomaly ($\ge 70\%$ of budget spent in 5 minutes).
   - The clever Solidity trick: Why we don't `revert()`, but latch `FROZEN_AUTOMATIC` on-chain.

6. **[Module 6: 3-of-5 Guardian Recovery](06_THREE_OF_FIVE_GUARDIAN_RECOVERY.md)**
   - What if you lose your phone/key, or an attacker steals your admin key?
   - 5 independent blockchain guardians.
   - Why 3 out of 5 must agree.
   - The mandatory 48-hour delay (why the clock starts on the 3rd vote, not the 1st).
   - The Owner Veto: How you can cancel a malicious takeover attempt.

7. **[Module 7: Gas Sponsorship & The Quota Paymaster](07_GAS_SPONSORSHIP_PAYMASTER.md)**
   - What is transaction "Gas"?
   - Why companies want to sponsor gas for AI agents.
   - The danger of a shared gas pool (Gas Spam / Denial of Service).
   - How `QuotaPaymaster.sol` isolates Agent A from Agent B.

8. **[Module 8: How We Proved It Works (Testing & Invariants)](08_HOW_WE_PROVED_IT_WORKS.md)**
   - Unit tests vs Adversarial tests vs Stateful Fuzz testing.
   - What is an "Invariant"? (Rules that must NEVER be broken).
   - The 16,384 fuzzed calls in Foundry.
   - The 43 passing automated tests.

9. **[Module 9: Hackathon Judge Demo & Q&A Cheat Sheet](09_HACKATHON_DEMO_CHEAT_SHEET.md)**
   - The 7-Scene judge demo script.
   - Common questions judges will ask and the exact winning answers to give.
   - What to highlight and what traps to avoid.

---

## 🎯 Quick Vocabulary Primer

- **ERC-4337 (Account Abstraction):** Turning a crypto wallet from a simple key pair into a programmable smart contract with custom rules.
- **UserOperation (UserOp):** A pseudo-transaction request submitted to a bundler instead of directly to a miner.
- **Session Key:** A temporary, restricted private key given to an AI agent so it can make small payments without asking you for a password every single time.
- **EntryPoint:** The official, audited master smart contract that processes ERC-4337 UserOperations.
- **Paymaster:** A smart contract that pays for the gas fees of transactions on behalf of users or agents.
- **Zero-Trust:** A security principle where no device, software, or AI model is trusted implicitly; everything must be independently verified.
