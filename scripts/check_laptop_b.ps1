# BASTION X v2.2 — Health Check Diagnostic for Laptop B (Intel Ultra 7 155H)

Write-Host "Checking Laptop B Services & Peripherals..." -ForegroundColor Cyan

# 1. Check Anvil RPC
try {
    $body = '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
    $rpcRes = Invoke-RestMethod -Uri "http://localhost:8545" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 3
    Write-Host "[OK] Local Anvil Blockchain is ONLINE on port 8545 (Block: $($rpcRes.result))" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Anvil Blockchain not responding on port 8545: $_" -ForegroundColor Red
}

# 2. Check Supervisor Service
try {
    $supRes = Invoke-RestMethod -Uri "http://localhost:8010/supervisor/health" -TimeoutSec 3
    Write-Host "[OK] Supervisor Service is ONLINE on port 8010" -ForegroundColor Green
    Write-Host "     Preserved Checkpoints: $($supRes.audit_checkpoints_preserved)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Supervisor Service not responding on port 8010: $_" -ForegroundColor Red
}
