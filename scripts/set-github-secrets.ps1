# Sets Didaxis repo secrets from .env (never commits .env). Requires: gh auth login
$ErrorActionPreference = 'Stop'

function Invoke-Gh {
  param([string[]]$GhArgs)
  & gh @GhArgs
  if ($LASTEXITCODE -ne 0) {
    throw "gh $($GhArgs -join ' ') failed (exit $LASTEXITCODE)"
  }
}

$repo = 'juliayeg/ai-assisted-qa-automation'
$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.env'

if (-not (Test-Path $envFile)) {
  throw "Missing .env at $envFile"
}

Invoke-Gh @('auth', 'status', '--hostname', 'github.com')

$secretNames = @('DIDAXIS_URL', 'DIDAXIS_EMAIL', 'DIDAXIS_PASSWORD')
$vars = @{}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $eq = $line.IndexOf('=')
  if ($eq -lt 1) { return }
  $name = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim()
  if ($secretNames -contains $name) {
    $vars[$name] = $value
  }
}

foreach ($name in $secretNames) {
  if (-not $vars.ContainsKey($name)) {
    throw "Missing $name in .env"
  }
  $vars[$name] | Invoke-Gh @('secret', 'set', $name, '--repo', $repo)
  Write-Host "Set secret $name on $repo"
}

$list = Invoke-Gh @('secret', 'list', '--repo', $repo) | Out-String
if ($list -match 'DIDAXIS_API_TOKEN') {
  Invoke-Gh @('secret', 'delete', 'DIDAXIS_API_TOKEN', '--repo', $repo)
  Write-Host 'Removed DIDAXIS_API_TOKEN (short-lived JWT; CI uses captured session token)'
}

Write-Host 'Done.'
