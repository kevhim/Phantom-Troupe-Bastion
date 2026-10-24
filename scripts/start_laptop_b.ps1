# BASTION X v2.2 — Startup Script for Laptop B (Intel Ultra 7 155H)
# Starts Local Anvil Blockchain node and Supervisor Service

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  BASTION X v2.2 — Starting Laptop B Security Domain      " -ForegroundColor Cyan
Write-Host "  Role: Trusted Auth, Embedded Signer & Local Blockchain  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

# 1. Start Anvil Blockchain Node on port 8545
Write-Host "[1/5] Launching Local Anvil Blockchain Node (Chain ID: 31337)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "anvil --chain-id 31337 --port 8545 --host 0.0.0.0"

Start-Sleep -Seconds 2

# 2. Deploy Phase 1 Smart Contracts
Write-Host "[2/5] Deploying Canonical EntryPoint, MockToken & BastionAccount..." -ForegroundColor Green
python scripts/deploy_phase1.py

# 3. Launch ERC-4337 Bundler Service on port 3000
Write-Host "[3/5] Launching ERC-4337 Bundler RPC Service on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; python services/bundler/bundler_service.py"

# 4. Start Supervisor Service on port 8010
Write-Host "[4/5] Launching Supervisor Service on port 8010..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; python -m uvicorn services.supervisor.supervisor_service:app --host 0.0.0.0 --port 8010 --reload"

# 5. Start UNO Q Edge Coordinator
Write-Host "[5/5] Launching Arduino UNO Q Edge Coordinator..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; python services/edge-q/src/edge_coordinator.py"

Write-Host "`nAll Laptop B services launched!" -ForegroundColor Cyan
Write-Host "  - Anvil RPC:       http://localhost:8545" -ForegroundColor Gray
Write-Host "  - ERC-4337 Bundler: http://localhost:3000" -ForegroundColor Gray
Write-Host "  - Supervisor API:  http://localhost:8010" -ForegroundColor Gray
