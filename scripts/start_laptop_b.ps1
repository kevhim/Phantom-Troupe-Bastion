# BASTION X v2.2 — Startup Script for Laptop B (Intel Ultra 7 155H)
# Starts Local Anvil Blockchain node and Supervisor Service

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  BASTION X v2.2 — Starting Laptop B Security Domain      " -ForegroundColor Cyan
Write-Host "  Role: Trusted Auth, Embedded Signer & Local Blockchain  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

# 1. Start Anvil Blockchain Node on port 8545
Write-Host "[1/3] Launching Local Anvil Blockchain Node (Chain ID: 31337)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "anvil --chain-id 31337 --port 8545 --host 0.0.0.0"

# 2. Start Supervisor Service on port 8010
Write-Host "[2/3] Launching Supervisor Service on port 8010..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; python -m uvicorn services.supervisor.supervisor_service:app --host 0.0.0.0 --port 8010 --reload"

# 3. Start UNO Q Edge Coordinator
Write-Host "[3/3] Launching Arduino UNO Q Edge Coordinator..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; python services/edge-q/src/edge_coordinator.py"

Write-Host "`nAll Laptop B services launched! Anvil running at: http://localhost:8545" -ForegroundColor Cyan
