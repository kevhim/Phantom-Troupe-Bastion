# BASTION X v2.2 — Health Check Diagnostic for Laptop A (RTX 5060)

Write-Host "Checking Laptop A Services & Peripherals..." -ForegroundColor Cyan

# 1. Check FastAPI Backend
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8000/api/v2/overview" -TimeoutSec 3
    Write-Host "[OK] FastAPI Backend is ONLINE on port 8000" -ForegroundColor Green
    Write-Host "     Account: $($res.smart_account.address)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] FastAPI Backend not responding on port 8000: $_" -ForegroundColor Red
}

# 2. Check React Web Console
try {
    $webRes = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 3 -UseBasicParsing
    Write-Host "[OK] React Web Console is ONLINE on port 5173" -ForegroundColor Green
} catch {
    Write-Host "[WARN] React Web Console not responding on port 5173 (run 'npm run dev')" -ForegroundColor Yellow
}

# 3. Check Python Tests
Write-Host "Running automated test matrix..." -ForegroundColor Cyan
python -m pytest tests/ -q
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] All automated tests passed 100%!" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Some tests failed" -ForegroundColor Red
}
