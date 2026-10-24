# Two-Laptop Integration & Network Architecture Specification — v2.3

This document defines the complete distributed communication topology, network port ownership, security boundaries, and cross-machine verification procedures for BASTION X.

---

## 1. Network Topology & Port Ownership Table

| Host Node | Service Component | Network Port | Protocol | Owning Machine | Permitted Callers |
|---|---|---|---|---|---|
| **Laptop A** | React 18 Web Console | `5173` | HTTP / WS | Laptop A (RTX 5060) | Operator Browsers (LAN) |
| **Laptop A** | FastAPI Application API | `8000` | HTTP / REST | Laptop A (RTX 5060) | React Frontend, AI Agent |
| **Laptop B** | Local Anvil Blockchain | `8545` | JSON-RPC (HTTP) | Laptop B (Intel Ultra 7) | Laptop A API, ESP32 Signer, Bundler |
| **Laptop B** | ERC-4337 Bundler | `3000` | HTTP / RPC | Laptop B (Intel Ultra 7) | Laptop A API |
| **Laptop B** | Supervisor API | `8010` | HTTP / REST | Laptop B (Intel Ultra 7) | Laptop A API, UNO Q Edge Node |
| **Laptop B** | UNO Q Edge Coordinator | Internal | Socket / HTTP | Arduino UNO Q 4GB | Laptop B Supervisor |
| **Laptop C** | Standby Anvil Mirror | `8545` | JSON-RPC | Laptop C (RTX 4060) | Failover only |

> [!NOTE]
> **v2.3 Evolution:** Port 80 ESP8266 Alert Listener is DECOMMISSIONED. The 5V active buzzer is driven directly over USB serial by Arduino Uno #1 Pin D8 on Laptop B.

---

## 2. Distributed Lifecycle: End-to-End Payment Intent Flow

```mermaid
sequenceDiagram
    autonumber
    participant Agent as AI Purchasing Agent (Laptop A)
    participant API as FastAPI Backend (Laptop A)
    participant Signer as Single ESP32 Signer (Laptop B)
    participant Super as Supervisor Service (Laptop B)
    participant Chain as Anvil Blockchain (Laptop B)

    Agent->>API: 1. Request Payment (e.g. 250 bUSD out-of-policy)
    API->>API: 2. Validate against 6 W3-02 Policies -> Triggers Exception
    API->>Signer: 3. Submit Canonical EIP-712 PaymentIntent
    Signer->>Signer: 4. Reconstruct Hash & Render 4 OLED Pages
    Note over Signer: Operator scans RFID & presses GPIO33 (>= 1.5s)
    Signer->>Super: 5. Transmit Hardware Signature Proof
    Super->>Super: 6. Attach Owner EIP-712 Co-Signature (Dual Auth)
    Super->>Chain: 7. Submit Dual-Authorized UserOperation
    Chain->>Chain: 8. BastionAccount verifies Signatures & Enforces Limits
    Chain-->>API: 9. Execution Confirmed Receipt
    API->>API: 10. Flight Recorder links SHA-256 Event
    API->>Super: 11. Commit Audit Checkpoint to Laptop B Storage
```

---

## 3. Distributed Emergency Revocation Flow

```mermaid
sequenceDiagram
    autonumber
    participant Op as Physical Operator
    participant Signer as Single ESP32 Panic Button (Laptop B)
    participant Chain as Anvil Node (Laptop B)
    participant Super as Supervisor (Laptop B)
    participant Uno as Uno #1 Buzzer D8 (Laptop B)
    participant API as FastAPI Backend (Laptop A)

    Op->>Signer: 1. Press GPIO32 Panic Button
    Signer->>Signer: 2. Latch Local State: PANIC_LOCAL (Signing Locked)
    Signer->>Chain: 3. Direct Wi-Fi HTTP POST: revokeSession() via Revoker Role
    Signer->>Super: 4. Panic Alert Event (Serial/LAN)
    Super->>Uno: 5. Transmit ALARM:ON command (Serial USB)
    Uno->>Uno: 6. Digital Pin D8 triggers 5V Active Buzzer (Continuous Alarm)
    Chain->>Chain: 7. BastionAccount marks sessionRevoked[session] = true
    Super->>API: 8. Notify Application Domain of Confirmed Freeze
    API->>API: 9. Invalidate active requests & log INCIDENT_PANIC
```

> [!WARNING]
> **Security Implication:** The alarm now depends on the Intel supervisor/Uno #1 serial path and no longer provides independent wireless notification.

---

## 4. Cross-Laptop Network Pre-Flight Checklist
Run these checks before beginning the demonstration:
1. **Network Connectivity:**
   ```powershell
   # From Laptop A:
   ping <LAPTOP_B_IP>
   curl http://<LAPTOP_B_IP>:8545 # Should respond with Anvil JSON-RPC
   curl http://<LAPTOP_B_IP>:8010/supervisor/health
   ```
2. **Uno #1 Buzzer Test:**
   ```powershell
   # From Laptop B (Supervisor API):
   curl -X POST http://localhost:8010/supervisor/alarm -H "Content-Type: application/json" -d '{\"active\":true, \"reason\":\"TEST\"}'
   # Verify buzzer sounds on Uno #1 Pin D8!
   ```
3. **Run Integrated Cross-Check:**
   ```powershell
   .\scripts\check_integration.ps1 -LaptopBIp <LAPTOP_B_IP>
   ```
