# XY&Z Musical Bingo + Trivia Revival v22.2

This build updates the v22 revival through the Island Vibes trivia game played October 8, 2026.

## What changed
- Added October 1 and October 8 trivia results and scoreboard photos.
- Corrected `owl ass` to the canonical team `1998 Chicago Bulls` / Ty on both known appearances.
- Removed `owl ass` from the Wise Ass Owls alias group.
- Updated the trivia league story and streak display so it is calculated from current data instead of hard-coded to September 24.
- Handles the 9-game longest-streak tie between Wise Ass Owls and Seannah.
- Production base URL is `https://xyandzpro.netlify.app`.
- Visible top-left header now says `XYZ Productions`.
- Regenerated the two QR examples used on the Business Inquiries page for the current domain.
- Removed the incorrect January 8 and May 14 no-trivia markers; September 10 and September 17 remain marked as no-game Thursdays.

## GitHub
If your repository is already running v22.1, use the smaller `TRIVIA_UPDATE_DROP_IN` package and copy its contents over the repository root.

For a clean full replacement, use the complete v22.2 package and place its contents at the repository root. Netlify should continue to publish `public` and use `netlify/functions`.
