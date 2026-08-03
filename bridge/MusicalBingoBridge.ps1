$ErrorActionPreference = "Stop"
$configPath = Join-Path $PSScriptRoot "bridge-config.json"

function Write-BridgeConfig {
    $defaultConfig = [ordered]@{
        siteUrl = "https://xyandzmusicalbingo.netlify.app"
        hostKey = "YOUR_PRIVATE_HOST_KEY"
        venueSlug = "mangrove-sands"
        wnpBaseUrl = "http://127.0.0.1:8899"
        pollSeconds = 1
        stabilitySeconds = 2
        heartbeatSeconds = 10
    }
    $defaultConfig | ConvertTo-Json | Set-Content -Path $configPath -Encoding UTF8
}

if (-not (Test-Path $configPath)) {
    Write-BridgeConfig
    Write-Host "Created bridge-config.json." -ForegroundColor Yellow
    Write-Host "Add your site URL, private host key, and venue slug, then run Start Bridge.bat again."
    exit 0
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
if (-not $config.siteUrl -or -not $config.hostKey -or $config.hostKey -eq "YOUR_PRIVATE_HOST_KEY") {
    Write-Host "bridge-config.json still needs a valid siteUrl and hostKey." -ForegroundColor Red
    exit 1
}
if (-not $config.venueSlug) {
    Write-Host "bridge-config.json needs venueSlug: island-vibes or mangrove-sands." -ForegroundColor Red
    exit 1
}

function Get-FirstValue {
    param($Object, [string[]]$Paths)
    foreach ($path in $Paths) {
        $value = $Object
        $ok = $true
        foreach ($segment in $path.Split('.')) {
            if ($null -eq $value) { $ok = $false; break }
            $property = $value.PSObject.Properties[$segment]
            if ($null -eq $property) { $ok = $false; break }
            $value = $property.Value
        }
        if ($ok -and $null -ne $value -and ("$value").Trim().Length -gt 0) {
            return ("$value").Trim()
        }
    }
    return ""
}

function Read-CurrentTrack {
    $url = ($config.wnpBaseUrl.TrimEnd('/')) + "/v1/last"
    $data = Invoke-RestMethod -Method Get -Uri $url -TimeoutSec 5
    $title = Get-FirstValue $data @("title", "track.title", "song.title", "metadata.title")
    $artist = Get-FirstValue $data @("artist", "track.artist", "song.artist", "metadata.artist")
    $album = Get-FirstValue $data @("album", "track.album", "song.album", "metadata.album")
    $artwork = Get-FirstValue $data @("artwork_url", "artworkUrl", "cover_url", "track.artwork_url", "metadata.artwork_url")
    if (-not $title) { return $null }
    return [ordered]@{
        title = $title
        artist = $artist
        album = $album
        artworkUrl = $artwork
    }
}

function Publish-Track {
    param($Track)
    $endpoint = ($config.siteUrl.TrimEnd('/')) + "/.netlify/functions/bridge-track"
    $payload = [ordered]@{
        venueSlug = $config.venueSlug
        title = $Track.title
        artist = $Track.artist
        album = $Track.album
        artworkUrl = $Track.artworkUrl
        detectedAt = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json
    return Invoke-RestMethod -Method Post -Uri $endpoint -Headers @{ "x-host-key" = $config.hostKey } -ContentType "application/json" -Body $payload -TimeoutSec 10
}

$pollSeconds = [Math]::Max(1, [int]$config.pollSeconds)
$stabilitySeconds = [Math]::Max(1, [int]$config.stabilitySeconds)
$heartbeatSeconds = [Math]::Max(5, [int]$config.heartbeatSeconds)
$candidateKey = ""
$candidateSince = Get-Date
$publishedKey = ""
$lastHeartbeat = Get-Date "2000-01-01"
$connected = $false

Write-Host "XY&Z Musical Bingo Bridge" -ForegroundColor Cyan
Write-Host "Venue: $($config.venueSlug)"
Write-Host "Source: $($config.wnpBaseUrl)/v1/last"
Write-Host "Destination: $($config.siteUrl)"
Write-Host "Press Ctrl+C to stop.`n"

while ($true) {
    try {
        $track = Read-CurrentTrack
        if (-not $connected) {
            Write-Host "What's Now Playing connected." -ForegroundColor Green
            $connected = $true
        }
        if ($null -eq $track) {
            Start-Sleep -Seconds $pollSeconds
            continue
        }

        $key = (($track.artist + "|" + $track.title).ToLowerInvariant()).Trim()
        if ($key -ne $candidateKey) {
            $candidateKey = $key
            $candidateSince = Get-Date
            Write-Host ("Detected: {0} - {1}" -f $track.artist, $track.title) -ForegroundColor DarkCyan
        }

        $stableFor = ((Get-Date) - $candidateSince).TotalSeconds
        $heartbeatDue = ((Get-Date) - $lastHeartbeat).TotalSeconds -ge $heartbeatSeconds
        if ($stableFor -ge $stabilitySeconds -and $key -ne $publishedKey) {
            $result = Publish-Track $track
            $lastHeartbeat = Get-Date
            if ($result.published) {
                $publishedKey = $key
                Write-Host ("Published song #{0}: {1} - {2}" -f $result.position, $track.artist, $track.title) -ForegroundColor Green
            } elseif ($result.waiting) {
                Write-Host "Waiting for an active host session..." -ForegroundColor Yellow
            } elseif ($result.duplicate) {
                $publishedKey = $key
                Write-Host "Track already published." -ForegroundColor DarkGray
            }
        } elseif ($heartbeatDue) {
            $lastHeartbeat = Get-Date
        }
    }
    catch {
        $connected = $false
        Write-Host ("Bridge error: " + $_.Exception.Message) -ForegroundColor Red
    }
    Start-Sleep -Seconds $pollSeconds
}
