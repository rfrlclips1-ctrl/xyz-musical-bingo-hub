$ErrorActionPreference = 'Stop'
$configPath = Join-Path $PSScriptRoot 'bridge-config.json'

Write-Host ''
Write-Host 'XY&Z HOST SETUP' -ForegroundColor Cyan
Write-Host 'You only need to do this once on this laptop.' -ForegroundColor DarkGray
Write-Host ''

$defaultSite = 'https://mellifluous-parfait-a01655.netlify.app'
$site = Read-Host "Website [$defaultSite]"
if ([string]::IsNullOrWhiteSpace($site)) { $site = $defaultSite }
$site = $site.TrimEnd('/')

$secure = Read-Host 'Paste your private HOST_BRIDGE_KEY' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $hostKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
if ([string]::IsNullOrWhiteSpace($hostKey)) { throw 'A host key is required.' }

$config = [ordered]@{
  siteUrl = $site
  hostKey = $hostKey.Trim()
  venueSlug = 'island-vibes'
  wnpBaseUrl = 'http://127.0.0.1:8899'
  pollSeconds = 1
  stabilitySeconds = 2
  heartbeatSeconds = 10
}
$config | ConvertTo-Json | Set-Content -Path $configPath -Encoding UTF8

Write-Host ''
Write-Host 'Setup saved.' -ForegroundColor Green
Write-Host 'From now on, double-click GO LIVE - ISLAND VIBES.bat.' -ForegroundColor Green
Write-Host 'Keep this folder on your host laptop.' -ForegroundColor DarkGray
Write-Host ''
Pause
