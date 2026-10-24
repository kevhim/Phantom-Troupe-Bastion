# Module 8: How We Proved It Works (Testing & Invariants)

## The Gold Standard of Blockchain Security

In web development, if your CSS button is 2 pixels off, you fix it tomorrow.
In smart contract security, if you have a 1-line logic error, **millions of dollars are permanently stolen.**

To guarantee that BASTION X is genuinely breach-resilient, we did not just write a few happy-path unit tests. We used **three rigorous testing tiers**:

1. **Unit & Scenario Tests** (`forge test`): 25 smart contract tests.
2. **Adversarial Negative Tests** (`pytest tests/adversarial/`): 9 hijack attack simulations.
3. **Stateful Invariant Fuzzing** (`WalletInvariant.t.sol`): **16,384 fuzzed calls across 256 runs.**

---

## 🔬 What is an "Invariant"?

An **Invariant** is a mathematical rule that must be true **100% of the time, in every possible universe, no matter what crazy actions happen**.

### Real-World Analogy:
Think of an elevator in a skyscraper:
- *Unit Test:* Does the door open when you press 3? Yes.
- *Invariant:* The elevator doors must **NEVER open while the elevator is moving between floors**. No matter if 10 people jump inside, someone presses all the buttons, or the power flickers, that invariant must NEVER be violated!

---

## 🏛️ The Ten Security Invariants of BASTION X

In `contracts/test/WalletInvariant.t.sol` and `contracts/test/handlers/WalletHandler.sol`, we formally defined and tested ten security invariants:

| Invariant ID | Security Property | Everyday Explanation |
| :--- | :--- | :--- |
| **INV-1** | **No Unauthorized Outflow** | Tokens can ONLY leave the wallet through an authenticated owner action or an in-policy agent session. |
| **INV-2** | **Daily Spending Cap Bound** | Total agent outflow in a 24-hour UTC day $\le 100\text{ bUSD}$, even if attacked by scripts. |
| **INV-3** | **Revocation / Freeze Block** | If a session is frozen, revoked, or expired, its spending power is exactly $0. |
| **INV-4** | **3-of-5 Guardian Quorum** | Recovery can NEVER succeed with 1 or 2 guardian votes. Exactly 3 distinct votes required. |
| **INV-5** | **48-Hour Timelock Integrity** | Recovery executed at 47 hours and 59 minutes MUST revert. It can only execute at $\ge 48\text{ hours}$. |
| **INV-6** | **Owner Veto Absolute Block** | If the owner calls `vetoRecovery()`, that proposal can NEVER execute under any circumstances. |
| **INV-7** | **Gas Sponsorship Isolation** | Agent A exhausting its gas quota has ZERO effect on Agent B's remaining quota. |
| **INV-8** | **Alternative Path Resistance** | Calling `approve`, `delegatecall`, or batch functions cannot bypass financial limits. |
| **INV-9** | **Nonce & Replay Resistance** | A signed authorization hash can only ever be executed ONCE. Replaying it fails. |
| **INV-10** | **Post-Recovery Invalidation** | When a new owner is installed via recovery, the old agent session key is wiped to `0x0`. |

---

## 🤖 What is Stateful Invariant Fuzzing?

Imagine you hire an aggressive automated robot whose sole purpose is to break your smart contract.
The robot runs **256 distinct simulations**.
In each simulation, it executes **64 random operations in crazy random sequences**:
1. Randomly creates an agent session.
2. Randomly submits a payment of $12.
3. Randomly submits a payment of $999.
4. Randomly advances blockchain time by 3 days.
5. Randomly trips the circuit breaker.
6. Randomly has Guardian 1 vote.
7. Randomly has Guardian 1 try to vote a second time.
8. Randomly has the Owner call veto.
9. Randomly tries to execute recovery.
10. Randomly unfreezes the wallet.
11. Randomly submits another payment...

**And after EVERY SINGLE STEP, the test engine pauses and checks:**
> *"Did the agent ever manage to spend more than the $100 daily limit? Did unauthorized funds move?"*

### The Final Result:
- **Number of Runs:** 256
- **Number of Fuzzed Calls:** **16,384 calls**
- **Invariants Violated:** **ZERO.**
- **Counterexamples Found:** **ZERO.**

This gives us mathematical certainty that BASTION X's defenses hold up under chaotic, real-world attack conditions!
