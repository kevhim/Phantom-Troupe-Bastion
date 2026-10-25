param(
    [Parameter(Mandatory=$true)][string]$LaptopAIp,
    [Parameter(Mandatory=$true)][string]$LaptopBIp
)
$ErrorActionPreference = 'Stop'
$failed = $false
$root = Split-Path -Parent $PSScriptRoot
$manifest = Get-Content "$root/contracts/deployments.json" -Raw | ConvertFrom-Json
function Rpc($url, $method, $params) {
    $body = @{jsonrpc='2.0'; id=1; method=$method; params=@($params)} | ConvertTo-Json -Depth 8 -Compress
    $response = Invoke-RestMethod -Uri $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 4
    if ($response.error) { throw ($response.error | ConvertTo-Json -Compress) }
    return $response.result
}
try {
    $policy = Invoke-RestMethod -Uri "http://${LaptopAIp}:8000/api/v2/integration/status" -TimeoutSec 8
    if (!$policy.policy.connected) { throw 'A cannot read live chain policy' }
    Write-Host '[OK] A API can read chain policy'
} catch { $failed=$true; Write-Host "[FAIL] A API: $_" }
try {
    $chain = Rpc "http://${LaptopBIp}:8545" 'eth_chainId' @()
    if ([Convert]::ToInt64($chain,16) -ne 31337) { throw "Wrong chain: $chain" }
    foreach ($name in 'entryPoint','bastionAccount','mockToken','circuitBreaker') {
        $code = Rpc "http://${LaptopBIp}:8545" 'eth_getCode' @($manifest.$name,'latest')
        if (!$code -or $code -eq '0x') { throw "No bytecode for $name" }
    }
    $supported = Rpc "http://${LaptopBIp}:3000" 'eth_supportedEntryPoints' @()
    if ($manifest.entryPoint -notin $supported) { throw 'Bundler EntryPoint mismatch' }
    Write-Host '[OK] Chain ID, bytecode presence and bundler EntryPoint match local manifest'
} catch { $failed=$true; Write-Host "[FAIL] B chain/bundler: $_" }
try {
    $sup = Invoke-RestMethod -Uri "http://${LaptopBIp}:8010/supervisor/health" -TimeoutSec 4
    Write-Host "[OBSERVED] Supervisor reachable; signer=$($sup.peripherals.esp32_signer); buzzer=$($sup.peripherals.uno_buzzer)"
} catch { $failed=$true; Write-Host "[FAIL] B supervisor: $_" }
Write-Host 'Network checks do not verify serial ownership, wiring, physical review or audible buzzer operation.'
if ($failed) { exit 1 }
exit 0
