# XY&Z Live Board Setup and Test

## Guest pages
- Island Vibes: `/island-vibes/live`
- Mangrove Sands: `/mangrove-sands/live`
- Individual bingo round pages also show the live board for their active round.

## Host page
- `/host.html` or `/host`

## Required Netlify environment variables
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `HOST_BRIDGE_KEY`

## First-time setup
1. Create a Supabase project.
2. Run `supabase/setup.sql` in the Supabase SQL Editor.
3. Add the four environment variables in Netlify.
4. Redeploy the full project root.
5. Open `/host.html`, enter the host key, select a venue and round, and start a session.
6. Open the matching venue live board on a second device.
7. Use **Publish test song** or **Run 3-song demo** on the host page.
8. Confirm Now Playing and Played Tonight update automatically.

## djay Pro connection
After manual testing works, use the files in `bridge/` on the Windows laptop running djay Pro and What's Now Playing.

## Simplest host workflow (v16)

The `bridge` folder now contains three host shortcuts:

1. `SETUP HOST - RUN ONCE.bat` — saves the website and private host key on the host laptop.
2. `GO LIVE - ISLAND VIBES.bat` — asks for tonight's round, starts the website session, launches the bridge, and opens the host and guest pages.
3. `END NIGHT.bat` — ends the live session and closes the bridge.

After the one-time setup, the weekly workflow is: open djay Pro, double-click Go Live, choose the round, and play normally.
