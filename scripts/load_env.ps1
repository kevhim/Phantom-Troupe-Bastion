# Parse local configuration as data, never as PowerShell commands.
$RepoRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $RepoRoot '.env'
if (Test-Path -LiteralPath $EnvFile) {
    foreach ($line in Get-Content -LiteralPath $EnvFile) {
        $trimmed = $line.Trim()
        if (!$trimmed -or $trimmed.StartsWith('#')) { continue }
        $parts = $trimmed.Split('=', 2)
        if ($parts.Length -ne 2 -or $parts[0] -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') { throw 'Invalid .env entry' }
        [Environment]::SetEnvironmentVariable($parts[0], $parts[1].Trim().Trim('"').Trim("'"), 'Process')
    }
}
