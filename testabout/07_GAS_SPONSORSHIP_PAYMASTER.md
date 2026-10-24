# Module 7: Gas Sponsorship & The Quota Paymaster

## What is "Gas" in Crypto?

When you send a transaction on Ethereum, the computers processing the transaction (validators/bundlers) charge a fee called **gas**.
- If a human uses a crypto wallet, they must hold ETH in their wallet to pay for gas.
- But an AI agent **is just an automated script**.

If you force the AI agent to manage its own ETH balance just to pay for transaction fees, you create operational headaches:
- What if the agent runs out of ETH while trying to buy an urgent cloud compute credit?
- What if an attacker steals the agent's ETH balance?

---

## ⛽ The Solution: ERC-4337 Paymasters

In ERC-4337 Account Abstraction, transactions can be **sponsored** by a special contract called a **Paymaster** (`contracts/src/QuotaPaymaster.sol`).

### How Gas Sponsorship Works:
1. The company deposits 1.0 ETH into the Paymaster contract.
2. The AI agent submits a transaction to buy $25 worth of API credits.
3. The Paymaster says: *"I will pay the $0.05 gas fee for this agent!"*
4. The AI agent doesn't need to hold any ETH at all.

---

## 💣 The Naive Paymaster Vulnerability: Gas Pool Denial-of-Service

Most simple paymasters have a catastrophic security flaw: **A Shared Treasury.**

Imagine your company has two AI agents:
- **Agent A:** Buys OpenAI credits.
- **Agent B:** Buys flight tickets for executives.

Both agents share a company paymaster holding $1,000 in gas.

### The Attack:
A hacker compromises Agent A. The hacker realizes they cannot steal the tokens (because of the $50 cap and store restrictions).
So instead, the hacker writes a loop that fires **10,000 pointless or reverting transactions per minute**.
- Each spam transaction burns $0.10 in gas from the shared paymaster.
- Within 10 minutes, the entire $1,000 gas deposit is completely drained!
- **Consequence:** Agent B can no longer book executive flights! The company's entire automated infrastructure is brought to a dead halt!

---

## 🛡️ The BASTION X Solution: QuotaPaymaster Isolation

In BASTION X, `contracts/src/QuotaPaymaster.sol` implements **Financially Enforced Gas Quota Isolation**:

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                    QUOTAPAYMASTER.SOL                       │
 ├──────────────────────────────┬──────────────────────────────┤
 │   AGENT A QUOTA POOL         │    AGENT B QUOTA POOL        │
 │   Allocated: 1,000,000 gas   │    Allocated: 1,000,000 gas  │
 │   Consumed:  1,000,000 gas   │    Consumed:          0 gas  │
 │   Remaining:         0 gas   │    Remaining: 1,000,000 gas  │
 │   Status:    EXHAUSTED (❌)  │    Status:    ACTIVE (✅)    │
 └──────────────────────────────┴──────────────────────────────┘
```

### 1. Hard On-Chain Quotas
Each agent identity receives a strict gas limit (e.g., $1,000,000\text{ gas}$, which is roughly equivalent to 20-30 transactions).
- The smart contract tracks `remainingQuota = allocated - consumed`.
- Before accepting a transaction, the paymaster checks:
  ```solidity
  require(quotas[agent].remainingGas >= maxPossibleOpGas, "AgentGasQuotaExceeded");
  ```

### 2. Isolated Deposit Backing
Agent A's quota is strictly isolated from Agent B's quota.
- Even if Agent A is 100% hijacked and spams transactions until its quota drops to 0...
- **Agent B's quota is completely untouched.**
- Agent B continues to operate with 100% availability!

### 3. Exact Post-Op Gas Accounting
When an operation finishes executing, the ERC-4337 EntryPoint calls `postOp()` on the Paymaster:
- The Paymaster measures the exact gas used:
  $$\text{actualConsumed} = (\text{gasAtStart} - \text{gasleft}()) + \text{overhead}$$
- It deducts `actualConsumed` from Agent A's quota.
- If the operation reverted inside the wallet, the paymaster still accurately deducts the gas burned, ensuring no unmetered compute escapes accounting.
