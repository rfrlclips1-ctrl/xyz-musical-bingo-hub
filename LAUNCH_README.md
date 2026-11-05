# XY&Z Musical Bingo — Launch Guide

## Recommended production method

Use a GitHub repository connected to Netlify. Upload the CONTENTS of this folder so `netlify.toml`, `public`, `netlify`, `legacy`, and `supabase` are at the repository root.

## Netlify settings

- Base directory: leave blank
- Build command: leave blank
- Publish directory: `public`
- Functions directory: `netlify/functions`
- Production branch: `main`

The included `netlify.toml` already declares the publish directory, functions directory, `/host` redirect, and SPA fallback.

## Phase 1 — Launch the player app

1. Create a new GitHub repository.
2. Upload every file and folder from this package to the repository root.
3. In Netlify, choose **Add new project → Import an existing project → GitHub**.
4. Select the repository and deploy.
5. Confirm these routes:
   - `/`
   - `/playlists`
   - `/contact`
   - `/island-vibes`
   - `/mangrove-sands`
   - one round page for each venue
6. Enable Netlify form detection and redeploy.
7. Submit a contact-form test.

## Phase 2 — Final address and old QR cards

Before printing or redirecting cards, confirm the final site address. The current code assumes:

`https://mellifluous-parfait-a01655.netlify.app`

If the final address differs, replace it in:

- `public/data.js`
- `QR_ROUTES.csv`
- `legacy/island-vibes/index.html`
- `legacy/mangrove-sands/index.html`

Do not delete the old Island Vibes or Mangrove Sands Netlify sites. After the master site is verified, deploy the matching tiny folder inside `legacy/` to each old site so already-printed QR codes continue to work.

## Phase 3 — Optional Now Playing system

The playlist and QR app works without Supabase.

To activate the live host/Now Playing features:

1. Create a Supabase project.
2. Run `supabase/setup.sql`.
3. Add these Netlify environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `HOST_BRIDGE_KEY`
4. Redeploy.
5. Test `/host` and the Windows bridge.

## Important content check

The Diner Music Spotify URL is still blank in `public/data.js`. Add it before printing a new Diner Music card pack.


## v15 Live Board
- Guest routes: `/island-vibes/live` and `/mangrove-sands/live`
- Private host controls: `/host.html`
- Host dashboard includes manual one-song publishing and a three-song demo, so the live system can be tested before connecting djay Pro.
- Deploy the full project root to Netlify and configure Supabase plus the four required environment variables.
