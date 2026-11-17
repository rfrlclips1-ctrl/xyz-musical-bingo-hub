# XY&Z Productions — Tournament Tuesdays Integration

This patch ADDs the original Island Vibes Tournament Tuesdays experience to the EXISTING XY&Z Productions Netlify website. It does not replace the main website.

After publishing the existing project: https://xyandzpro.netlify.app/island-vibes/tournaments/

The current navigation gains: Island Vibes → Tournament Tuesdays.

## What is included

* Original Island Vibes tournament interface, its real logo, styles, and responsive layout
* Public player registration through the new Netlify route
* Shared Postgres-backed roster and player check-in
* Private rewards names and optional last four phone digits
* Five bracket formats, live scores, undo, pause, restart, regeneration, and history
* Netlify Functions, Netlify Database migrations with tables prefixed iv_tourney_
* Safe patch script that preserves all current source and Netlify functions

## Apply to your existing source project

1. Download this ZIP and extract it.
2. Find the real source project used to deploy xyandzpro.netlify.app. It should have index.html or public/index.html and your existing app.js, data.js, trivia data and Netlify functions.
3. In the extracted patch folder, run:

   node scripts/apply-to-xyz.mjs "C:\path\to\your\XYandZ-site"

4. Open the existing website source folder in PowerShell and run:

   npm install

5. In Netlify, for the EXISTING XY&Z site, add environment variable TOURNAMENT_HOST_CODE with value KavaHost1. Do not put this code into public JavaScript. Keep existing Supabase and bingo environment variables intact.
6. Deploy the updated EXISTING site through its normal Netlify/GitHub workflow.
7. Verify the backend at https://xyandzpro.netlify.app/.netlify/functions/iv-tournaments?health=1 . It should report ok: true and database: connected.
8. Verify https://xyandzpro.netlify.app/island-vibes/tournaments/?view=join on a guest phone. Confirm the player appears on a second device in the Players tab, then test host check-in and brackets before publishing a new QR.

Netlify Database requires a qualifying credit-based plan and consumes Free monthly credits while active. Free credit-based plans include 300 credits/month with a hard cap and no automatic paid recharge. Confirm the current plan and usage before switching it on.

## Privacy

Public event responses include gamer tags and check-in status, NOT rewards names or last four digits. Host rewards access requires the private TOURNAMENT_HOST_CODE. Separate database tables are prefixed iv_tourney_, and no existing bingo/trivia tables are modified. The old suspended Vercel database is untouched.

## Deployment access

This ZIP is a patch, NOT a complete replacement of the XY&Z website. You must merge it into your existing source repository to preserve current functions and all deployed data routes. Do not drag-and-drop this ZIP over your production site.

The new environment is tested against a local SQL database; a final real phone-to-roster test is needed after Netlify has provisioned its database. If your Netlify project isn't already on a credit-based plan with Database access, enable it via the site dashboard first.



Venue Wi-Fi sign-ups: up to 45 registrations per minute per shared IP and 150/day per event. The existing honeypot rejects simple bots.
