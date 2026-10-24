# Laptop C Deployment Guide — Standby Fallback (NVIDIA RTX 4060)

**Role:** Cold / Hot Standby Backup Node  
**Host Specifications:** Windows 11, NVIDIA RTX 4060 GPU, 16/32 GB RAM  
**Hardware Assignment:** ZERO mandatory physical hardware units assigned on Day 1.

---

## 1. Purpose & Strategy
Laptop C is kept in reserve to guarantee business continuity during hackathon demonstrations:
1. **Fallback Blockchain RPC:** If Laptop B experiences operating system or network issues, Laptop C can immediately launch Anvil and act as the cluster RPC.
2. **Fallback AI Inference:** If Laptop A encounters GPU memory saturation, Laptop C can execute local model inference.
3. **Emergency Development & Contract Testing:** Independent sandbox for running Foundry or Hardhat test suites without interfering with live physical devices.

---

## 2. Standby Prerequisites & Installation
```powershell
# Clone the repository
git clone git@github.com:kevhim/Phantom-Troupe-Bastion.git
cd Phantom-Troupe-Bastion

# Virtual environment setup
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install web3 eth-account fastapi uvicorn pytest requests
```

---

## 3. Failover Execution Commands

### Scenario A: Failover Blockchain RPC
If Laptop B's Anvil node becomes unreachable:
```powershell
# Start Standby Anvil Node on Laptop C
anvil --chain-id 31337 --port 8545 --host 0.0.0.0
```
Then update Laptop A's `.env.laptop_a`:
```ini
ANVIL_RPC_URL=http://<LAPTOP_C_IP>:8545
```

### Scenario B: Failover Web & API Host
If Laptop A suffers a system crash:
```powershell
# Terminal 1: Backend
python -m uvicorn services.api.src.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Web Console
cd apps\web
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
