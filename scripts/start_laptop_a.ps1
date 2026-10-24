# BASTION X v2.2 — Startup Script for Laptop A (RTX 5060)
# Starts FastAPI backend and React Web Console

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  BASTION X v2.2 — Starting Laptop A Application Domain   " -ForegroundColor Cyan
Write-Host "  Role: AI Application Host, Agent, Vision & Web Console  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

# 1. Activate Python virtual environment if present
if (Test-Path "$RepoRoot\.venv\Scripts\Activate.ps1") {
    Write-Host "[1/3] Activating Python virtual environment..." -ForegroundColor Green
    & "$RepoRoot\.venv\Scripts\Activate.ps1"
} else {
    Write-Host "[1/3] Running with global Python..." -ForegroundColor Yellow
}

# 2. Start FastAPI Backend in background job or prompt
Write-Host "[2/3] Launching FastAPI Backend on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; python -m uvicorn services.api.src.main:app --host 0.0.0.0 --port 8000 --reload"

# 3. Start Vite Web Console
Write-Host "[3/3] Launching Vite Web Console on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot\apps\web'; npm run dev -- --host 0.0.0.0 --port 5173"

Write-Host "`nAll Laptop A services launched! Console available at: http://localhost:5173" -ForegroundColor Cyan
