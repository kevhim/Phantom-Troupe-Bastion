# Start after the fresh deployment and independent key provisioning described in the runbook.
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/load_env.ps1"
Set-Location -LiteralPath $RepoRoot
foreach ($required in 'BUNDLER_PRIVATE_KEY','CHECKPOINT_TOKEN','BASTION_CHECKPOINT_DIR') {
    if (![Environment]::GetEnvironmentVariable($required)) { throw "Configure $required on Laptop B" }
}
$rpc = if ($env:ANVIL_INTERNAL_RPC_URL) { $env:ANVIL_INTERNAL_RPC_URL } else { 'http://127.0.0.1:18545' }
$chain = Invoke-RestMethod -Uri $rpc -Method Post -ContentType 'application/json' -Body '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' -TimeoutSec 3
if ($chain.result -ne '0x7a69') { throw 'Start the local Anvil chain 31337 first' }
if (!(Test-Path contracts/deployments.json)) { throw 'Deploy contracts first; startup never resets or redeploys the chain' }
$env:CHAIN_RPC_URL = $rpc
$python = if (Test-Path '.venv/Scripts/python.exe') { (Resolve-Path '.venv/Scripts/python.exe').Path } else { (Get-Command python).Source }
New-Item -ItemType Directory -Force -Path artifacts | Out-Null
foreach ($service in @(
    @{Name='rpc'; Module='services.bundler.rpc_gateway:app'; Port='8545'},
    @{Name='bundler'; Module='services.bundler.bundler_service:app'; Port='3000'},
    @{Name='supervisor'; Module='services.supervisor.supervisor_service:app'; Port='8010'}
)) {
    Start-Process -FilePath $python -ArgumentList '-m','uvicorn',$service.Module,'--host','0.0.0.0','--port',$service.Port,'--workers','1' -WorkingDirectory $RepoRoot -WindowStyle Hidden -RedirectStandardOutput "artifacts/$($service.Name).log" -RedirectStandardError "artifacts/$($service.Name).err.log"
}
Write-Host 'Launch requested: filtered RPC :8545, bundler :3000, supervisor :8010. Anvil admin RPC remains loopback :18545.'
Write-Host 'UNO Q must run on its own Linux node. Hardware readiness is not asserted by this script.'
