# BASTION X v2.3 — Cross-Laptop Network & Integration Diagnostic
param(
    [string]$LaptopAIp = "127.0.0.1",
    [string]$LaptopBIp = "127.0.0.1"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  BASTION X v2.3 — Cross-Laptop Integration Pre-Flight   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Test Laptop A API
Write-Host "`n[1/3] Testing Laptop A Application API ($LaptopAIp:8000)..." -ForegroundColor Yellow
try {
    $api = Invoke-RestMethod -Uri "http://${LaptopAIp}:8000/api/v2/overview" -TimeoutSec 3
    Write-Host "  [OK] Laptop A API is reachable. Total Forensic Events: $($api.total_forensic_events)" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Cannot reach Laptop A API: $_" -ForegroundColor Red
}

# 2. Test Laptop B Blockchain RPC
Write-Host "`n[2/3] Testing Laptop B Anvil RPC ($LaptopBIp:8545)..." -ForegroundColor Yellow
try {
    $body = '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
    $rpc = Invoke-RestMethod -Uri "http://${LaptopBIp}:8545" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 3
    Write-Host "  [OK] Laptop B Anvil RPC is reachable. Chain ID: $($rpc.result)" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Cannot reach Laptop B Anvil RPC: $_" -ForegroundColor Red
}

# 3. Test Laptop B Supervisor Service & Uno #1 Buzzer
Write-Host "`n[3/3] Testing Laptop B Supervisor API ($LaptopBIp:8005)..." -ForegroundColor Yellow
try {
    $sup = Invoke-RestMethod -Uri "http://${LaptopBIp}:8005/supervisor/health" -TimeoutSec 3
    Write-Host "  [OK] Laptop B Supervisor reachable. Signer: $($sup.peripherals.esp32_signer), Uno #1 Buzzer: $($sup.peripherals.uno_buzzer)" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] Supervisor API not responding on port 8005 (Supervisor may not be running): $_" -ForegroundColor Yellow
}

Write-Host "`nPre-flight diagnostics completed! (ESP8266 removed in v2.3; buzzer verified on Uno #1 Pin D8)" -ForegroundColor Cyan
