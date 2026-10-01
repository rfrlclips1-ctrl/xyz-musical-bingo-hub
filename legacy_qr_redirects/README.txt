XYZ PRODUCTIONS — LEGACY QR REDIRECT PACKS
==========================================
Current website: https://xyandzpro.netlify.app/

These three folders are meant to be deployed to the EXISTING legacy Netlify sites so laminated/printed QR codes continue to work.

1) islandvibesmusicalbingo
   Deploy to: https://islandvibesmusicalbingo.netlify.app/
   Handles old ?round=... links and old path-style links, and sends them to the matching Island Vibes route on xyandzpro.netlify.app.

2) mangrovesandsmusicalbingo
   Deploy to: https://mangrovesandsmusicalbingo.netlify.app/
   Handles old ?round=... links and old path-style links, and sends them to the matching Mangrove Sands route on xyandzpro.netlify.app.

3) mellifluous-parfait-a01655
   Deploy to: https://mellifluous-parfait-a01655.netlify.app/
   Preserves the existing path/query and moves it to xyandzpro.netlify.app.

IMPORTANT
---------
Do not delete the old Netlify sites. The old QR code contains the old domain, so that domain/site must continue to exist in order to redirect the scan. These redirect stubs are intentionally tiny and do not need the old full applications.

DEPLOYMENT
----------
For each old Netlify site, deploy the CONTENTS of the matching folder as that site's new production deploy.

After deploying, test at least:
- Island Vibes old QR using ?round=northeaster
- Mangrove Sands old QR using ?round=diner-music
- One old mellifluous-parfait path QR

Expected destination host for every test: https://xyandzpro.netlify.app/
