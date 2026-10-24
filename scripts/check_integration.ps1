# BASTION X v2.2 — Cross-Laptop Network & Integration Diagnostic
param(
    [string]$LaptopAIp = "127.0.0.1",
    [string]$LaptopBIp = "127.0.0.1",
    [string]$Esp8266Ip = ""
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  BASTION X v2.2 — Cross-Laptop Integration Pre-Flight   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Test Laptop A API
Write-Host "`n[1/3] Testing Laptop A Application API ($LaptopAIp:8000)..." -ForegroundColor Yellow
try {
    $api = Invoke-RestMethod -Uri "http://${LaptopAIp}:8000/api/v2/overview" -TimeoutSec 3
    Write-Host "  [OK] Laptop A API is reachable. Total Events: $($api.total_forensic_events)" -ForegroundColor Green
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

# 3. Test ESP8266 Alert Node if IP supplied
if ($Esp8266Ip) {
    Write-Host "`n[3/3] Testing ESP8266 Alert Node ($Esp8266Ip:80)..." -ForegroundColor Yellow
    try {
        $alert = Invoke-RestMethod -Uri "http://${Esp8266Ip}:80/health" -TimeoutSec 3
        Write-Host "  [OK] ESP8266 Alert Node is reachable. Status: $($alert.status)" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] ESP8266 Alert Node not responding: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[3/3] ESP8266 IP not specified, skipping Wi-Fi buzzer ping." -ForegroundColor Gray
}

Write-Host "`nPre-flight diagnostics completed!" -ForegroundColor Cyan
