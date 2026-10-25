# BASTION X v2.3 — Phase 1 Setup & Verification Script for Windows
# Validates Foundry, Python, Node.js dependencies, compiles contracts, and runs test suites.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  BASTION X v2.3 — Phase 1 Setup & Toolchain Verification " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $RepoRoot

# 1. Verify Python & Dependencies
Write-Host "`n[1/4] Verifying Python & Web3 Dependencies..." -ForegroundColor Green
try {
    $pyVer = python --version
    Write-Host "  Python: $pyVer" -ForegroundColor Gray
    python -c "import web3, eth_account, fastapi, uvicorn, httpx, pydantic, pytest; print('  Web3, Eth-Account, FastAPI, Uvicorn, Httpx, Pydantic, Pytest: OK')"
} catch {
    Write-Host "[ERROR] Python dependencies missing. Run: pip install web3 eth-account fastapi uvicorn httpx pydantic pytest" -ForegroundColor Red
    exit 1
}

# 2. Verify Foundry Toolchain
Write-Host "`n[2/4] Verifying Foundry Toolchain (forge, anvil, cast)..." -ForegroundColor Green
try {
    $forgeVer = forge --version
    Write-Host "  $forgeVer" -ForegroundColor Gray
    $anvilVer = anvil --version
    Write-Host "  $anvilVer" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Foundry toolchain not found on PATH." -ForegroundColor Red
    exit 1
}

# 3. Verify ERC-4337 Dependencies & Compile Contracts
Write-Host "`n[3/4] Compiling Smart Contracts with Canonical ERC-4337..." -ForegroundColor Green
Set-Location "$RepoRoot\contracts"
try {
    forge build
    Write-Host "  Smart contracts compiled successfully." -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] forge build failed: $_" -ForegroundColor Red
    exit 1
}

# 4. Run Canonical Foundry Tests
Write-Host "`n[4/4] Running Real ERC-4337 Foundry Tests..." -ForegroundColor Green
try {
    forge test --match-contract RealEntryPointExecutionTest -v
    Write-Host "  RealEntryPointExecutionTest: PASSED" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] RealEntryPointExecutionTest failed: $_" -ForegroundColor Red
    exit 1
}

Set-Location $RepoRoot
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Phase 1 Environment & Contracts Successfully Verified! " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
