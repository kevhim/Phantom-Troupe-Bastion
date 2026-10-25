# Laptop A: application services only. No privileged signing keys.
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/load_env.ps1"
Set-Location -LiteralPath $RepoRoot
foreach ($required in 'CHAIN_RPC_URL','BUNDLER_URL','SUPERVISOR_URL','AGENT_PRIVATE_KEY','CHECKPOINT_TOKEN') {
    if (![Environment]::GetEnvironmentVariable($required)) { throw "Configure $required in Laptop A .env" }
}
foreach ($forbidden in 'OWNER_PRIVATE_KEY','REVOKER_PRIVATE_KEY','JUNIOR_PRIVATE_KEY','SENIOR_PRIVATE_KEY') {
    if ([Environment]::GetEnvironmentVariable($forbidden)) { throw "Remove $forbidden from Laptop A" }
}
$python = if (Test-Path '.venv/Scripts/python.exe') { (Resolve-Path '.venv/Scripts/python.exe').Path } else { (Get-Command python).Source }
New-Item -ItemType Directory -Force -Path artifacts | Out-Null
Start-Process -FilePath $python -ArgumentList '-m','uvicorn','services.api.src.main:app','--host','0.0.0.0','--port','8000','--workers','1' -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput artifacts/api.log -RedirectStandardError artifacts/api.err.log
Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','--','--host','0.0.0.0','--port','5173' -WorkingDirectory "$RepoRoot/apps/web" -WindowStyle Hidden -RedirectStandardOutput "$RepoRoot/artifacts/web.log" -RedirectStandardError "$RepoRoot/artifacts/web.err.log"
Write-Host 'Launch requested. Verify /health and http://localhost:5173; inspect artifacts/*.log for startup errors.'
Write-Host 'Agent purchase requests use the live console. Camera/watchdog are separate optional services, not verified here.'
