$ErrorActionPreference = 'Stop'
$configPath = Join-Path $PSScriptRoot 'bridge-config.json'
if (-not (Test-Path $configPath)) {
  Write-Host 'Run SETUP HOST - RUN ONCE.bat first.' -ForegroundColor Yellow
  Pause
  exit 1
}
$config = Get-Content $configPath -Raw | ConvertFrom-Json

$rounds = @(
  @{ slug='vibes-bingo'; title='Vibes Bingo' },
  @{ slug='beach-bingo'; title='Beach Bingo' },
  @{ slug='emo-bingo'; title='Emo Bingo' },
  @{ slug='edm-bingo'; title='EDM Bingo' },
  @{ slug='turn-that-down'; title='Turn That Down' },
  @{ slug='70s-summer'; title='70s Summer' },
  @{ slug='then-and-now'; title='Then & Now' },
  @{ slug='80s-night'; title='80s Night' },
  @{ slug='the-download-years'; title='The Download Years' },
  @{ slug='yallternative'; title='Yallternative' },
  @{ slug='northeaster'; title='Northeaster' }
)

Clear-Host
Write-Host 'XY&Z PRODUCTIONS' -ForegroundColor Cyan
Write-Host 'ISLAND VIBES LIVE BOARD' -ForegroundColor Magenta
Write-Host ''
Write-Host 'Choose tonight''s round:' -ForegroundColor White
for ($i=0; $i -lt $rounds.Count; $i++) { Write-Host ("  {0}. {1}" -f ($i+1), $rounds[$i].title) }
Write-Host ''
$choice = Read-Host 'Round number'
$number = 0
if (-not [int]::TryParse($choice, [ref]$number) -or $number -lt 1 -or $number -gt $rounds.Count) {
  Write-Host 'That was not a valid round number.' -ForegroundColor Red
  Pause
  exit 1
}
$round = $rounds[$number-1]

function Start-WNPIfFound {
  if (Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match 'nowplaying|whatsnowplaying' }) { return $true }
  $candidates = @(
    "$env:LOCALAPPDATA\Programs\NowPlaying\NowPlaying.exe",
    "$env:LOCALAPPDATA\Programs\WhatNowPlaying\WhatNowPlaying.exe",
    "$env:ProgramFiles\What\'s Now Playing\NowPlaying.exe",
    "$env:ProgramFiles\WhatNowPlaying\NowPlaying.exe"
  )
  foreach ($path in $candidates) {
    if (Test-Path $path) { Start-Process $path; Start-Sleep -Seconds 3; return $true }
  }
  return $false
}

Write-Host ''
Write-Host 'Starting your live session...' -ForegroundColor Yellow
$endpoint = ($config.siteUrl.TrimEnd('/')) + '/.netlify/functions/host-session'
$payload = @{ action='start'; venueSlug='island-vibes'; roundSlug=$round.slug } | ConvertTo-Json
try {
  $result = Invoke-RestMethod -Method Post -Uri $endpoint -Headers @{ 'x-host-key'=$config.hostKey } -ContentType 'application/json' -Body $payload -TimeoutSec 15
} catch {
  Write-Host ('Could not start the website session: ' + $_.Exception.Message) -ForegroundColor Red
  Pause
  exit 1
}

$wnpStarted = Start-WNPIfFound
if (-not $wnpStarted) {
  Write-Host 'Open What''s Now Playing manually if it is not already running.' -ForegroundColor Yellow
}

# Stop an old bridge window, then launch a fresh minimized bridge.
Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like '*MusicalBingoBridge.ps1*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

$bridgeScript = Join-Path $PSScriptRoot 'MusicalBingoBridge.ps1'
Start-Process powershell.exe -WindowStyle Minimized -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$bridgeScript+'"'))

$guestUrl = ($config.siteUrl.TrimEnd('/')) + '/island-vibes/live'
$hostUrl = ($config.siteUrl.TrimEnd('/')) + '/host.html?venue=island-vibes&round=' + $round.slug
Start-Process $guestUrl
Start-Process $hostUrl

Write-Host ''
Write-Host ('LIVE: Island Vibes — ' + $round.title) -ForegroundColor Green
Write-Host 'Now play music normally in djay Pro.' -ForegroundColor Green
Write-Host 'The bridge is running in a minimized window.' -ForegroundColor DarkGray
Write-Host ''
Write-Host 'You may close this window.' -ForegroundColor DarkGray
Start-Sleep -Seconds 5
