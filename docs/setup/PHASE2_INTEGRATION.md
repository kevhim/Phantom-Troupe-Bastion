# BASTION X v2.3 — Two-Laptop Phase 2 Integration Guide

## 1. Network Topology & Roles

```text
       ┌─────────────────────────────────────────────────────────────┐
       │                   LOCAL AREA NETWORK (LAN)                  │
       │                   Subnet: 192.168.1.0/24                    │
       └──────────────┬───────────────────────────────┬──────────────┘
                      │                               │
         HTTP :8545 / :3000 RPC              Wi-Fi Panic Alerts
                      │                               │
       ┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
       │    LAPTOP B (Intel Ultra 7) │ │     LAPTOP A (RTX 5060)     │
       │     IP: 192.168.1.100       │ │      IP: 192.168.1.101      │
       ├─────────────────────────────┤ ├─────────────────────────────┤
       │ • Anvil Blockchain (:8545)  │ │ • React Web UI (:5173)      │
       │ • ERC-4337 Bundler (:3000)  │ │ • FastAPI Backend (:8000)   │
       │ • Supervisor Svc (:8010)    │ │ • AI Purchasing Agent       │
       │ • QuotaPaymaster.sol        │ │ • Adversarial Hijack Lab    │
       │ • GuardianRecovery.sol      │ │ • OpenCV Vision & Liveness  │
       │ • RiskCircuitBreaker.sol    │ │ • Mirage Deception Engine   │
       │ • Single ESP32 Signer       │ │ • SQLite Forensic DB        │
       │   (Dual OLED #1 & #2)       │ │ • Arduino Uno #2 (Watchdog) │
       │ • UNO Q Edge Gateway        │ │ • Built-in / USB Webcam     │
       │ • Arduino Uno #1 (Buzzer D8)│ │ • (Zero ESP32s on Laptop A) │
       │ • RC522 RFID SPI Reader     │ │ • (ESP8266 Decommissioned)  │
       └─────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Port Allocation & Security Matrix

| Port | Service | Host | Binding | Access Policy |
| :--- | :--- | :--- | :--- | :--- |
| **8545** | Anvil Local JSON-RPC | Laptop B | `0.0.0.0` | Inbound allowed from Laptop A (`192.168.1.101`) only. |
| **3000** | ERC-4337 Bundler | Laptop B | `0.0.0.0` | Inbound allowed from Laptop A. |
| **8010** | Supervisor Service | Laptop B | `0.0.0.0` | Secure hardware signing endpoint. |
| **8000** | FastAPI Application API | Laptop A | `0.0.0.0` | Local operator & frontend client. |
| **5173** | Vite React Web Console | Laptop A | `0.0.0.0` | Operator workstation browser. |

---

## 3. Strict Startup Order

To prevent connection refused errors, start services in the following sequence:

### Step 1: Start Laptop B Infrastructure First
1. On Laptop B, launch Anvil:
   ```powershell
   anvil --host 0.0.0.0 --port 8545 --chain-id 31337
   ```
2. On Laptop B, deploy contracts:
   ```powershell
   cd contracts && forge test
   ```
3. On Laptop B, connect single ESP32 (dual OLEDs) and verify hardware serial gateway.

### Step 2: Start Laptop A Services
1. Configure `RPC_URL=http://192.168.1.100:8545` in Laptop A `.env`.
2. On Laptop A, launch FastAPI:
   ```powershell
   python -m uvicorn services.api.src.main:app --host 0.0.0.0 --port 8000
   ```
3. On Laptop A, launch Vite web console:
   ```powershell
   cd apps/web && npm run dev -- --host 0.0.0.0 --port 5173
   ```

---

## 4. Cross-Laptop Health Verification
Run this check on Laptop A to confirm connectivity to Laptop B:
```powershell
# Verify connection to Laptop B Anvil blockchain:
curl -H "Content-Type: application/json" -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://192.168.1.100:8545
```
*Expected Output:* `{"jsonrpc":"2.0","id":1,"result":"0x..."}`.
