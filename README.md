# XY&Z Combined Musical Bingo Hub

One deployable app with separate Island Vibes and Mangrove Sands experiences.

## What is included

- Shared XY&Z homepage with two venue entrances
- Contact and business-inquiry page with Netlify Forms
- XY&Z Productions business branding and Instagram link
- Visually distinct venue pages
- Venue-exclusive and shared playlist support
- Full playlist library with search and venue filters
- Direct venue/round QR routes
- Legacy redirect pages for already-printed cards
- Private multi-venue host dashboard
- Optional live **Now Playing** and **Played Tonight** board
- Windows djay Pro metadata bridge
- Supabase schema and protected Netlify Functions

## Main routes

```text
/
/playlists
/contact
/island-vibes
/island-vibes/80s-night
/island-vibes/yallternative
/island-vibes/northeaster
/mangrove-sands
/mangrove-sands/beach-bingo
/mangrove-sands/turn-that-down
/mangrove-sands/70s-summer
/mangrove-sands/then-and-now
/mangrove-sands/diner-music
/mangrove-sands/outlaw-country
/mangrove-sands/northeaster
/host.html
```

Netlify's catch-all redirect serves `index.html`, and the browser router renders the requested venue or round.

## Quick deploy

1. Confirm the desired Netlify URL.
2. Replace `https://xyandzmusicalbingo.netlify.app` if your final site name differs.
3. Deploy the full folder to Netlify. `netlify.toml` already points to `public` and `netlify/functions`.
4. The venue, playlist, Spotify, filtering, and QR-route features work immediately.

## Adding or changing playlists

Edit only `public/data.js`.

A round contains:

```js
{
  slug: "round-name",
  title: "Round Name",
  subtitle: "Short description",
  categories: ["Category"],
  spotifyUrl: "https://open.spotify.com/playlist/...",
  venues: ["island-vibes", "mangrove-sands"],
  accent: "storm"
}
```

Then include the round slug in each venue's `rounds` array. A shared round can use one Spotify playlist while still rendering separately under both venue routes.

## Live board setup

The playlist hub does not require Supabase. Live song display is optional.

To enable it:

1. Create a Supabase project.
2. Run `supabase/setup.sql`.
3. In Netlify, set:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
HOST_BRIDGE_KEY
```

4. Redeploy.
5. Open `/host.html`, choose a venue and round, and start a session.
6. Configure the Windows bridge in `bridge/README.txt`.

Guest phones poll Supabase directly every four seconds only while a round page is open. Protected writes go through Netlify Functions using the server-side secret key.

## Preserving old printed cards

Already-printed QR codes still point to the two old Netlify sites. The `legacy` folder contains tiny redirect builds:

- Deploy `legacy/island-vibes` to the existing Island Vibes site.
- Deploy `legacy/mangrove-sands` to the existing Mangrove Sands site.

Each redirect keeps the old `?round=...` value and sends the player to the correct venue route in the new app.

## Branding assets

The app now uses the supplied production branding files:

- `public/assets/island-vibes-logo.png` — Island Vibes venue identity.
- `public/assets/mangrove-sands-primary.png` — primary transparent Mangrove Sands Golf Club & Restaurant logo.
- `public/assets/xyz-productions-logo.png` — supplied XY&Z Productions business logo.
- `public/assets/mangrove-sands-alternate.jpg` — alternate Mangrove Sands Golf Club logo for light presentation.
- `public/assets/mangrove-sands-mascot.png` — Mangrove Sands mascot used only inside the Mangrove Sands venue experience.

Each venue has its own header treatment, background graphics, accent colors, buttons, playlist cards, footer treatment, and mobile round-page branding.

To replace an asset later, keep the same filename and overwrite it. No code changes are required unless the new image has a very different aspect ratio.

## Important open item

The Spotify URL for **Diner Music** is intentionally blank because the earlier production notes listed it as missing. Add it in `public/data.js` before creating a new Diner Music QR code.


## v5 branding and playlist update

- Mangrove Sands now uses only the supplied Mangrove Sands assets: the transparent club logo, alternate white-background logo, and venue mascot.
- Island Vibes lists 11 venue routes.
- Mangrove Sands lists 8 venue routes.
- The Mangrove Sands mascot is restricted to the Mangrove Sands experience and is not used on the XY&Z contact page.
- The XY&Z contact page uses only XY&Z Productions branding.
- Shared rounds keep one playlist source but have separate venue-branded pages and QR destinations.
- Rounds whose direct Spotify URL is not yet stored open their existing venue app route so the cards remain usable.


## Contact and business inquiries

The `/contact` page includes:

- XY&Z Productions branding and services
- Instagram link to `@XYandZproductions`
- Vero Beach, Florida service area
- Current venue partner links
- Netlify business-inquiry form

The hidden static form in `public/index.html` allows Netlify to detect the form even though the visible page is rendered by JavaScript. Form submissions appear in the Netlify dashboard under **Forms**.

A public phone number, business email, Facebook, TikTok, or other social links have not been invented. Add them to `public/data.js` and the contact template after the official details are supplied.
