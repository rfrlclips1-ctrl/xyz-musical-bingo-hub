# Just XYZ Productions — Musical Bingo + Trivia Revival v22

Built from the recovered **v21 PRELAUNCH HARDENED** package and updated October 1, 2026.

## What changed in v22

### Trivia brought current
- Expanded the Island Vibes trivia archive from **28 to 35 played nights**.
- Added photo-backed results for:
  - July 30, 2026
  - August 6, 2026
  - August 13, 2026
  - August 20, 2026
  - August 27, 2026
  - September 3, 2026
  - September 24, 2026
- Added **September 10 and September 17** as no-game Thursdays.
- Added a **Latest Game Recap** feature to Trivia Headquarters.
- Added a **Photo Recaps & Scoreboards** section.
- Added recap text and scoreboard-photo display inside the full results archive.
- Scoreboard images open full-size when clicked.
- The four newly supplied scoreboard photos are bundled under `public/assets/trivia/`.
- July 30, August 6 and August 13 remain marked as photo-backed results, but the original image files from the earlier archived chat were not available as exportable bytes in this build. Their recovered scores and recaps are preserved.

### Team identities normalized
The standings and team profile engine now combines known aliases automatically:
- Big Champs / Champs / Champz / Victorz / Champs-Victorz -> **Big Champs**
- peyt / peyt n ty -> **peyt**
- Wise Ass Owls / Wise Ass Owl / owl ass -> **Wise Ass Owls**
- TMobile / TMobile Love / TMobile Love Empire / TMobile Love Collective -> **TMobile Love Empire**
- known Yetty spelling variants -> **yeetty tty**
- Seannah / The Immortal Seannah -> **Seannah**
- del / deltrice / kaitrice -> **deltrice**
- Califloridian / Califloridians -> **Califloridians**
- known yeehaw variants -> **yeehaw**

The original display name from a scoreboard is still retained in source data, while all statistics are credited to the canonical team.

### Current trivia snapshot after normalization
- 35 played nights in the archive
- **Seannah: 14 wins**
- **Wise Ass Owls: 12 wins**
- New all-time high score: **467 — Seannah, Aug. 27, 2026**
- Longest recorded winning streak remains **9 — Wise Ass Owls**
- Seannah's current late-summer streak: **7 consecutive played-night wins** from July 30 through September 24

### Musical Bingo routes restored/expanded
Added the later rounds created after v21:

**Island Vibes**
- Disco Fever
- Outlaw Country
- Soundtrack
- Cali Vibes
- Madden

**Mangrove Sands**
- Disco Fever
- Easy Livin'
- 1960s

Also updated the Then & Now playlist to the later playlist URL and regenerated `QR_ROUTES.csv` for the current 27 venue/round routes.

## Deploy to GitHub / Netlify
Use the contents of this folder as the repository root.

Netlify remains configured by `netlify.toml`:
- publish directory: `public`
- functions directory: `netlify/functions`

Do not upload only the `public` folder if you use the live host/backend functions — deploy the whole repository.

## Existing production environment variables
The recovered live-board system still expects the environment variables documented in the original README / launch checklist. This v22 package does not contain private keys or secrets.

## Host song picker note
The restored website routes and Spotify links for the new post-v21 rounds are active in `data.js`. The original v21 song-picker catalog predates several of those rounds. Those new rounds therefore show in the Host round selector, but their local song-picker catalog is marked pending unless songs are added through the Host editor or incorporated in a future catalog pass.

## v22.1 production URL correction
- Live site: https://xyandzpro.netlify.app
- Top-left header now displays **XYZ Productions**.
- Main website QR added at `public/assets/qr-xyandzpro-home.png`.
