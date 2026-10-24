# BASTION X v2.2 — Two-Laptop Distributed Security Architecture & Implementation

**Breach-Resilient AI Agent Wallet with Physical Transaction Review and Verifiable Forensic Flight Recorder.**

Official challenge category: **W3-02 — Agent Wallet: Letting AI Agents Pay Safely**

This repository provides an implemented, security-hardened smart contract, firmware, backend, flight recorder, and frontend console designed for a 2-laptop hackathon deployment (Laptop A: RTX 5060, Laptop B: Intel Ultra 7, Laptop C: Standby).

---

## 🛡️ Four Core Hardened Objectives

### 1. Hardware-Assisted Owner Approval (Fixed Browser-Only Vulnerability)
- **Problem:** In-browser approval buttons are easily compromised by malicious automation or XSS.
- **Solution:** Out-of-policy payment requests submit canonical typed `PaymentIntent` to an independent ESP32 #1 signer on Laptop B.
- **Multi-page Trusted OLED:** Paginated inspection of amount, full recipient address, target contract, function selector, chain ID, and fingerprint.
- **Dual Verification:** Enforces both ESP32 hardware signature (Junior/Senior tier) AND independent Owner EIP-712 co-signature before on-chain execution.
- **Role Ceilings:** On-chain hard caps (Junior: 2,000 bUSD, Senior: 10,000 bUSD).

### 2. Sensor Disconnection & Fail-Closed Security (Fixed Fail-Open Vulnerability)
- **Explicit Health States:** `HEALTHY`, `DEGRADED`, `DISCONNECTED`, `TAMPER_SUSPECTED`, `APPROVAL_LOCKED`, `RECOVERY_REQUIRED`.
- **Fail-Closed Latch:** Disconnecting ESP32 signer, RC522 RFID reader, or approval buttons immediately cancels pending requests and latches approval locked. Reconnecting a cable does NOT automatically restore signing privileges (requires explicit supervisor recovery).
- **Direct Emergency Revocation:** Directly wired GPIO32 panic button triggers local shutdown (`PANIC_LOCAL`) and independently broadcasts `revokeSession` over Wi-Fi directly to Laptop B's Anvil node, bypassing Laptop A.

### 3. Safe Mirage Deception Sandbox
- **Synthetic Honeypot:** Suspected or coerced sessions are transparently routed to synthetic fixtures and decoy customer ledgers.
- **Strict Isolation:** Decoy payments NEVER touch the blockchain, NEVER transfer real tokens, and provide explicit synthetic markers. Real smart account restrictions remain strictly enforced on-chain.

### 4. Verifiable Forensic Flight Recorder
- **SHA-256 Hash Chaining:** Every security event across AI agent, hardware approval, wallet execution, and incident response is cryptographically linked: `SHA256(prev_hash + canonical_event)`.
- **Laptop B Checkpoints:** Periodic state commitments preserved on Laptop B independent storage outside the application database.
- **Tamper Detection:** Automated detection of modified, deleted, inserted, or reordered log entries.
- **Incident Reporting:** Structured JSON export and formal PDF incident report generation.

---

## 💻 Two-Laptop Hardware & Software Allocation (v2.3)

| Node | Responsibilities | Hardware Attached | Software Components |
|---|---|---|---|
| **Laptop A** (RTX 5060, 32GB RAM) | Application Host, AI Agent, Computer Vision, DB & UI | Built-in / Owned Webcam, Arduino Uno #2 (Watchdog) [Zero ESP32s on Laptop A] | React 18 Web Console (:5173), FastAPI Backend (:8000), AI Purchasing Agent, OpenCV Vision, Mirage Engine, SQLite DB |
| **Laptop B** (Intel Ultra 7 155H, 32GB RAM) | Trusted Authorization, Hardware Signer & Blockchain Host | Single ESP32 Dedicated Signer (Dual OLED: OLED #1 Review @ 0x3C, OLED #2 Status @ 0x3D, RC522 RFID, GPIO33 Approve, GPIO32 Panic), Arduino UNO Q 4GB (USB-C), Arduino Uno #1 (**5V Active Buzzer Pin D8**, opt. PIR/DHT/Servo; 16x2 LCD decommissioned) | **Local Anvil Blockchain (:8545, 31337)**, ERC-4337 Bundler, Supervisor Service (:8010), Hardware Gateway, Independent Audit Storage |
| **Laptop C** (RTX 4060, Standby) | Cold / Hot Standby Backup Node | None (Day 1) | Standby Anvil RPC Mirror, Auxiliary Compute & Failover |

---

## 🧪 Automated Test Suite (34 Tests Passing 100%)

Run the complete test matrix with:
```bash
python -m pytest tests/ -v
```

- `tests/contracts/test_policy_and_signatures.py`: 11 tests validating all 6 W3-02 policies, EIP-712 typing, dual authorization, role caps, replay protection, and expiry.
- `tests/firmware/test_hardware_fail_closed.py`: 6 tests validating cable disconnect latching, supervisor recovery gates, and panic lifecycle.
- `tests/fixtures/test_flight_recorder.py`: 7 tests validating SHA-256 chain integrity, tamper detection, Laptop B checkpoints, privacy redaction, and PDF generation.
- `tests/adversarial/test_mirage_deception.py`: 4 tests validating synthetic honeypot isolation and zero real fund movement.
- `tests/integration/test_api_v2_endpoints.py`: 6 integration tests validating FastAPI v2 endpoints.

---

## 📚 Per-Laptop Deployment Guides

- [Laptop A Setup Guide (RTX 5060)](file:///d:/Desktop/Bastion/docs/setup/LAPTOP_A_RTX5060.md)
- [Laptop B Setup Guide (Intel Ultra 7)](file:///d:/Desktop/Bastion/docs/setup/LAPTOP_B_INTEL_ULTRA7.md)
- [Laptop C Setup Guide (Standby)](file:///d:/Desktop/Bastion/docs/setup/LAPTOP_C_BACKUP.md)
- [Two-Laptop Integration Protocol](file:///d:/Desktop/Bastion/docs/setup/TWO_LAPTOP_INTEGRATION.md)
- [Authoritative Hardware Map & Pinouts](file:///d:/Desktop/Bastion/docs/HARDWARE_MAP.md)
