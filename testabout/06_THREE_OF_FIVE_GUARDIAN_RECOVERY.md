# Module 6: 3-of-5 Guardian Recovery with 48h Delay & Owner Veto

## The Nightmare Scenario: You Lost Your Keys

In traditional crypto wallets (like Bitcoin or MetaMask):
- If you lose your seed phrase, **your money is lost forever.** No customer support can help you.
- If a hacker steals your master private key, **they own your money.** You can never get it back.

In **BASTION X**, because your wallet is a smart contract (`contracts/src/GuardianRecovery.sol`), we implement **Social Recovery** enhanced with cyber-security safeguards: **3-of-5 Guardian Recovery with a 48-Hour Delay and Owner Veto.**

---

## 👥 Who Are the 5 Guardians?

When you set up your wallet, you register **five trusted Ethereum addresses** (they could be trusted colleagues, different hardware wallets you own, a legal custodian, or a cold storage device):

```text
  Guardian 1: Security Lead      (0x7099...79C8)
  Guardian 2: Hardware Root      (0x3C44...93BC)
  Guardian 3: Backup Sentinel    (0x90F7...b906)
  Guardian 4: Legal Custodian    (0x15d3...6A65)
  Guardian 5: DevOps Enclave     (0x9965...A4dc)
```

### Why 3 out of 5?
- **Fault Tolerance:** If 1 or 2 of your guardians lose their keys or go on vacation, you can still recover your wallet with the remaining 3.
- **Collusion Resistance:** If 1 or 2 guardians turn evil, they do NOT have enough votes to steal your wallet. They must convince a 3rd distinct guardian.

---

## ⏳ The Critical 48-Hour Timelock

Suppose an attacker manages to bribe or compromise 3 of your guardians. Could they instantly steal your wallet?

**NO! Because of the 48-Hour Timelock.**

```text
 [Guardian 1 Votes] ──> Status: COLLECTING_APPROVALS (1/3)
 [Guardian 2 Votes] ──> Status: COLLECTING_APPROVALS (2/3)
 [Guardian 3 Votes] ──> Status: TIMELOCKED (3/3)
                            │
                            ▼
           48-HOUR COUNTDOWN BEGINS RIGHT HERE!
          (readyAt = quorumReachedAt + 48 hours)
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
  [Owner Clicks VETO]               [48 Hours Elapsed Cleanly]
  Proposal Cancelled!               New Owner Rotated!
  Status: VETOED                    Old Keys Wiped Out!
```

### 🚨 Strict Rule: When Does the 48-Hour Clock Start?
- **WRONG DESIGN:** Some amateur projects start the 48-hour timer the moment the *first* guardian creates a proposal. That's a huge security hole because an attacker could submit a proposal in secret on Monday, wait until Wednesday, and then collect 3 votes and execute instantly!
- **BASTION X DESIGN:** In `GuardianRecovery.sol`, the 48-hour countdown begins **strictly when the THIRD distinct guardian casts their vote (`quorumReachedAt`)**!
  - 1 vote: Waiting for quorum.
  - 2 votes: Waiting for quorum.
  - 3 votes: Quorum reached! `readyAt = block.timestamp + 48 hours`.

---

## 🛑 The Owner Veto Authority

What if an attacker compromised 3 guardians and initiated a hostile takeover while the real owner is still alive and well?

During the entire 48-hour waiting period:
- The wallet displays an urgent amber alert on the dashboard.
- The authentic owner can simply call `vetoRecovery(proposalId)` from their master key.
- The proposal status is instantly changed to `VETOED`.
- The hostile takeover is permanently aborted!
- The attackers cannot resurrect that proposal; they would have to start from scratch with a brand-new proposal ID.

---

## 🧹 Post-Recovery Clean Slate (Session Invalidation)

When the 48 hours have passed and `executeRecovery()` is called:
1. **Ownership is Rotated:** The proposed new address becomes the official owner.
2. **Old Agent Sessions are Wiped:** The contract executes `agentSessionKey = address(0)`.
   - Any session key held by an AI agent (or stolen by a hacker) is **immediately revoked**.
   - The compromised agent cannot spend a single cent under the new regime.
3. **Old Exceptions are Cancelled:** Any pending out-of-policy approval requests are permanently cleared.

To resume AI purchasing, the newly installed owner must explicitly configure and authorize a fresh agent session key.
