$ErrorActionPreference = 'Stop'
$configPath = Join-Path $PSScriptRoot 'bridge-config.json'
if (-not (Test-Path $configPath)) { Write-Host 'Host setup has not been completed.'; Pause; exit 1 }
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$endpoint = ($config.siteUrl.TrimEnd('/')) + '/.netlify/functions/host-session'
$payload = @{ action='end'; venueSlug='island-vibes'; roundSlug='vibes-bingo' } | ConvertTo-Json
try {
  Invoke-RestMethod -Method Post -Uri $endpoint -Headers @{ 'x-host-key'=$config.hostKey } -ContentType 'application/json' -Body $payload -TimeoutSec 15 | Out-Null
  Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*MusicalBingoBridge.ps1*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Write-Host 'Island Vibes live board ended.' -ForegroundColor Green
} catch { Write-Host ('Could not end the session: ' + $_.Exception.Message) -ForegroundColor Red }
Start-Sleep -Seconds 3
