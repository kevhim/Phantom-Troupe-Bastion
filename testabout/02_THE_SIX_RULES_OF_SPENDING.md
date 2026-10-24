# Module 2: The Six Rules of Spending (W3-02 Policy Engine)

In problem statement **W3-02 (Agent Wallet: Letting AI Agents Pay Safely)**, the official rules require the wallet to enforce six specific policy dimensions.

In BASTION X, all six rules are evaluated and enforced **directly inside the smart contract** (`contracts/src/BastionAccount.sol`). They are not just checked in Python or React; they are mathematically enforced by the Ethereum Virtual Machine (EVM).

---

## 🏛️ The Six On-Chain Rules

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                     AI PAYMENT REQUEST                      │
 │    Recipient: 0xVendor | Amount: $25 | Target: MockToken    │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │              BASTIONACCOUNT.SOL POLICY CHECKS               │
 │                                                             │
 │  [1] Target Contract == Allowed?         ──> (PASS: Token)  │
 │  [2] Function Selector == 0xa9059cbb?     ──> (PASS: Transf) │
 │  [3] Recipient Address == Whitelisted?   ──> (PASS: Vendor) │
 │  [4] Amount ($25) <= Max Per Tx ($50)?   ──> (PASS: <=$50)  │
 │  [5] Today ($25+$25) <= Daily Cap ($100)?──> (PASS: <=$100) │
 │  [6] Current Time < Session Expiry?      ──> (PASS: Active) │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                    ALL 6 CHECKS PASSED (✓)
                                │
                                ▼
                      TRANSFER TOKENS ON-CHAIN
```

---

### Rule 1: Allowed Target Contract ("The Store")
- **Everyday Analogy:** You give someone a gift card that only works at Starbucks. If they try to swipe it at an electronics store, the card reader immediately rejects it.
- **In BASTION X:** The agent is only permitted to interact with approved smart contracts (e.g. `MockToken.sol` or an approved vendor contract). If the agent tries to call an unapproved smart contract, the transaction reverts.

### Rule 2: Allowed Function Selector ("The Allowed Action")
- **Everyday Analogy:** You allow an employee to read inventory, but forbid them from signing contracts or deleting files.
- **In BASTION X:** In Ethereum, every function has a 4-byte identifier called a "selector". For ERC-20 token transfers, the selector is `0xa9059cbb` (`transfer(address,uint256)`).
  - The AI agent is ONLY allowed to execute `transfer`.
  - It is **strictly forbidden** from calling `approve(address,uint256)` (which could give a third party permission to drain funds), `delegatecall`, or batch execution methods.

### Rule 3: Allowed Recipient ("The Cashier")
- **Everyday Analogy:** You authorize bill payments, but the money can only go to the electric company or the internet provider. It cannot be sent to an unknown personal bank account.
- **In BASTION X:** The wallet maintains an allowlist of approved recipient addresses (e.g. `MockVendor: 0x00...00cc`). Even if the transfer amount is only $1, sending it to a hacker's address (`0x999...99`) is instantly blocked on-chain.

### Rule 4: Max Per-Transaction Limit ("The Swipe Cap")
- **Everyday Analogy:** Contactless bank cards often have a limit of $50 per tap. Anything larger requires entering a PIN or biometric authentication.
- **In BASTION X:** The agent has a hard per-transaction limit (default: **50 bUSD**).
  - A purchase of 25 bUSD succeeds autonomously.
  - A purchase of 51 bUSD is blocked on-chain with `PerTxLimitExceeded`.

### Rule 5: Daily UTC Spending Cap ("The Daily Budget")
- **Everyday Analogy:** Your ATM card lets you withdraw at most $500 per day. Even if someone steals your card and makes ten $50 withdrawals, on the 11th attempt, the machine stops them.
- **In BASTION X:** The wallet calculates the current day using `block.timestamp / 86400` (UTC calendar day).
  - Total spending by the AI agent across all transactions in that day cannot exceed the daily cap (default: **100 bUSD**).
  - If the agent spends 25 + 25 + 25 + 25 = 100 bUSD, any further spending is blocked until midnight UTC resets the budget counter.

### Rule 6: Session Expiry ("The Time Limit")
- **Everyday Analogy:** A visitor badge at a high-security office building is only valid for 24 hours. Tomorrow morning, the electronic door scanner will beep and lock you out.
- **In BASTION X:** When the owner authorizes an agent session key, they set a deadline timestamp (e.g., valid for 48 hours). Once `block.timestamp > sessionExpiry`, the smart account rejects all payments from that agent key.

---

## ❓ What Happens When the AI Needs to Buy Something Bigger?

Suppose our AI agent discovers a one-time server discount: a 1-year reserved cloud GPU cluster for **250 bUSD**.
- 250 bUSD is greater than the 50 bUSD per-transaction limit!
- It also exceeds the 100 bUSD daily limit!

In a naive wallet, either the transaction fails and the company loses the opportunity, or the owner disables security entirely (which is reckless).

### The BASTION X Exception Workflow: Dual Authorization
Instead of failing or disabling security, BASTION X pauses the transaction and routes it to the **Physical Hardware Review Console**:
1. The AI agent creates a formal EIP-712 `PaymentIntent` request for 250 bUSD.
2. The request is sent to **ESP32 #1** on Laptop B.
3. The human operator reads the exact recipient and amount on the physical OLED screen.
4. The human taps their Senior RFID card and presses the physical approval button.
5. The ESP32 signs a cryptographic exception approval.
6. The human owner co-signs the transaction.
7. The smart contract validates both signatures (`verify_dual_authorization`) and executes the 250 bUSD payment as an **Owner-Authorized Exception**!

This gives you the best of both worlds: **autonomous speed for routine small purchases, and physical human zero-trust verification for large overrides.**
