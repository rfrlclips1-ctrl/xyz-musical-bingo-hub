XY&Z MUSICAL BINGO WINDOWS BRIDGE

1. Install and enable What's Now Playing on the djay Pro laptop.
2. Confirm http://127.0.0.1:8899/v1/last returns the current song.
3. Double-click Start Bridge.bat once. It creates bridge-config.json.
4. Edit bridge-config.json:
   - siteUrl: your new combined Netlify site
   - hostKey: same value as Netlify HOST_BRIDGE_KEY
   - venueSlug: island-vibes OR mangrove-sands
5. Double-click Start Bridge.bat again.
6. Open /host.html, select the same venue and tonight's round, and start a session.

Only one venue is normally active on a laptop at a time. Change venueSlug when moving the bridge to the other venue.
