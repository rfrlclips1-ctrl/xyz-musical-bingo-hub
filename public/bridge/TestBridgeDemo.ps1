$ErrorActionPreference = "Stop"
$configPath = Join-Path $PSScriptRoot "bridge-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "Run Start Bridge.bat once to create bridge-config.json." -ForegroundColor Red
    exit 1
}
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$endpoint = ($config.siteUrl.TrimEnd('/')) + "/.netlify/functions/bridge-track"
$tracks = @(
    @{ title = "September"; artist = "Earth, Wind & Fire"; album = "The Best of Earth, Wind & Fire" },
    @{ title = "Mr. Brightside"; artist = "The Killers"; album = "Hot Fuss" },
    @{ title = "Dancing in the Moonlight"; artist = "King Harvest"; album = "Dancing in the Moonlight" },
    @{ title = "Take Me Home, Country Roads"; artist = "John Denver"; album = "Poems, Prayers & Promises" }
)
foreach ($track in $tracks) {
    $payload = [ordered]@{
        venueSlug = $config.venueSlug
        title = $track.title
        artist = $track.artist
        album = $track.album
        artworkUrl = ""
        detectedAt = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json
    $result = Invoke-RestMethod -Method Post -Uri $endpoint -Headers @{ "x-host-key" = $config.hostKey } -ContentType "application/json" -Body $payload
    Write-Host ("Sent: {0} - {1} | published={2}" -f $track.artist, $track.title, $result.published)
    Start-Sleep -Seconds 4
}
