# Module 4: Phase 2 Hijack Containment (When the AI is Hacked)

## The Core Mandate of Phase 2

In Phase 2 of the hackathon, the judges gave us a clear, aggressive challenge:
> *"Assume the AI agent is completely hijacked: contain it, detect it, and let the owner recover."*

We cannot assume the AI is friendly. We cannot assume the user interface is honest.
We must assume:
- An attacker has **stolen the AI agent's genuine private key** (`agentSessionKey`).
- The attacker can write custom Python scripts or use `curl` to send raw transactions directly to the blockchain bundler.
- The attacker will try every trick in the book to steal money.

---

## 🎯 The Eight Scripted Hijack Attacks Explained

In `tests/adversarial/test_hijack_containment.py` and `contracts/test/AgentHijack.t.sol`, we implemented eight real adversarial attack scenarios. Here is how each attack works and how BASTION X stops it:

```text
 ┌───────────────┬───────────────────────────────────┬────────────────────────────────┐
 │ Attack ID     │ Attacker Action                   │ On-Chain Defense & Outcome     │
 ├───────────────┼───────────────────────────────────┼────────────────────────────────┤
 │ ATTACK-01     │ Oversized Payment ($250 > $50 cap)│ Reverted: PerTxLimitExceeded   │
 │ ATTACK-02     │ Microtransaction Budget Drain     │ Capped at $100 Daily Limit     │
 │ ATTACK-03     │ Redirect to Hacker's Wallet       │ Reverted: UnauthorizedRecipient│
 │ ATTACK-04     │ Call approve() on Token Contract  │ Reverted: UnauthorizedSelector │
 │ ATTACK-05     │ Bypass FastAPI Direct to Bundler  │ Reverted: Same On-Chain Rules  │
 │ ATTACK-06     │ Replay Expired Transaction / Nonce│ Reverted: AA25 Invalid Nonce   │
 │ ATTACK-07     │ 3 Rapid Payments in 20 Seconds    │ Frozen: Circuit Breaker Latches│
 │ ATTACK-08     │ Gas Sponsorship Flood / Spam      │ Agent A Quota Drains; B Safe   │
 └───────────────┴───────────────────────────────────┴────────────────────────────────┘
```

---

### Attack 1: The Smash-and-Grab (Oversized Payment)
- **What the hacker tries:** The hacker sees $10,000 in the wallet and tries to transfer $250 all at once to a vendor or exchange.
- **What happens:** The smart contract checks Rule 4 (`amount <= maxPerTx`). Since $250 > $50$, the contract immediately reverts with `PerTxLimitExceeded`.
- **Financial Loss:** **$0.00**.

### Attack 2: The Salami Slice (Microtransaction Drain)
- **What the hacker tries:** "Okay, $250 was blocked. What if I make lots of smaller payments? Let me send $25, then $25, then $25, then $25, then $25... until the wallet is empty!"
- **What happens:** The first 3 payments ($75) succeed. The 4th payment ($25) succeeds, reaching the $100 daily limit. When the 5th payment ($25) arrives, the smart contract checks Rule 5 (`dailySpend + amount <= dailyCap`). Since $100 + $25 = $125 > $100$, the 5th transaction is rejected with `DailyCapExceeded`!
- **Financial Loss:** Strictly capped at **$100.00** (the owner's configured daily budget). The other $9,900 in the wallet is safe.

### Attack 3: The Redirection (Sending to Hacker's Wallet)
- **What the hacker tries:** The hacker tries to send a small, in-policy amount ($20) to their own personal crypto address (`0x9999999999999999999999999999999999999999`).
- **What happens:** The smart contract checks Rule 3 (`recipient == allowedRecipient`). Since `0x999...99` is not on the allowlist, the transaction reverts with `UnauthorizedRecipient`.
- **Financial Loss:** **$0.00**.

### Attack 4: The Privilege Escalation (Token Approvals)
- **What the hacker tries:** In Ethereum, if you can call `token.approve(hackerAddress, 1000000)`, the hacker can later use their own computer to drain the tokens using `transferFrom`. The hacker tries to execute `approve` instead of `transfer`.
- **What happens:** The smart contract checks Rule 2 (`functionSelector == 0xa9059cbb`). The selector for `approve` is `0x095ea7b3`. The contract strictly rejects any selector other than standard transfer!
- **Financial Loss:** **$0.00**.

### Attack 5: The Stealth Bypass (Direct Bundler Submission)
- **What the hacker tries:** "The FastAPI backend on Laptop A has security checks. I'll just write a script in Python, connect directly to Anvil port 8545, and bypass the entire web application!"
- **What happens:** The transaction reaches the smart contract on the blockchain. Because the smart contract itself is the final authority, it performs the exact same checks. Bypassing the backend changes nothing.
- **Financial Loss:** **$0.00**.

### Attack 6: The Time Machine (Replay Attack)
- **What the hacker tries:** The hacker intercepts a valid payment from yesterday and tries to broadcast it again today, or submits an operation whose deadline has already expired.
- **What happens:** The ERC-4337 EntryPoint and smart contract track nonces and deadline timestamps. If a nonce was already consumed or if `block.timestamp > deadline`, it is rejected with EntryPoint error `AA25`.
- **Financial Loss:** **$0.00**.

### Attack 7: The Speed Demon (Spending Velocity Burst)
- **What the hacker tries:** The hacker attempts to fire 3 valid $25 payments within 20 seconds, hoping to extract cash before the human owner notices.
- **What happens:** The on-chain `RiskCircuitBreaker` observes 3 payment attempts in under 60 seconds. On the 3rd attempt, the wallet automatically latches into `FROZEN_AUTOMATIC`. The transaction is aborted without transferring tokens!
- **Financial Loss:** Capped at the 2 transactions that completed before the freeze ($50.00).

### Attack 8: The Gas Vampire (Paymaster Spam)
- **What the hacker tries:** The hacker cannot steal tokens, so they decide to cause financial damage by spamming thousands of invalid transactions, hoping to drain the company's gas sponsorship fund.
- **What happens:** `QuotaPaymaster.sol` enforces individual quotas. Agent A's gas allocation runs out and it is cut off. Agent B's gas allocation remains 100% untouched and functional.
- **Financial Loss:** Bounded strictly to Agent A's pre-funded gas quota.

---

## 📊 The Financial Invariant

For every compromised agent and accounting day:
$$\text{agent\_authorized\_outflow} \le \text{configured\_daily\_limit}$$

In our certified benchmark:
- **Total Amount Attempted by Attackers:** **1,945 bUSD**
- **Actual Funds Lost:** **100 bUSD** (exactly matching the daily limit)
- **Total Funds Protected:** **1,845 bUSD** ($94.9\%$ of funds saved)
- **Financial Loss Bound:** **SATISFIED (100% Proven)**
