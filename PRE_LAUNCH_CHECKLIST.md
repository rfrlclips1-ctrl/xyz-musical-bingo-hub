# XY&Z Live Board — Pre-Launch Checklist

## Build fixes included in v21
- Song-picker clicks now split title and artist before publishing.
- Undo deletes the last public track and immediately restores the prior song.
- End Session, Clear History, and Reset Song List require confirmation.
- Song-list edits clearly state that they are stored on the current browser/device.
- Manual title/artist entry remains available as a backup.

## Information still needed from the owner
- Current Spotify links for any rounds whose links are missing or changed.
- Current playlist exports for catalogs that have changed.
- A scan or destination URL from each older printed QR family.
- Confirmation of final venue and social links.

## Dress rehearsal
1. Deploy the full package to the combined Netlify project.
2. Confirm the four Netlify environment variables remain configured.
3. Start a test session.
4. Open the guest live board on a phone using cellular data.
5. Select 10 songs from the picker.
6. Confirm titles and artists appear separately and correctly.
7. Click one wrong song, then use Undo; confirm the public board returns to the prior song.
8. Add and remove a temporary song; refresh and confirm the device-local edits remain.
9. Test manual backup entry.
10. End the session and confirm the guest board returns to its inactive message.
