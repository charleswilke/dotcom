# Self-hosted fonts

The latin-subset woff2 files Google Fonts serves to modern browsers, fetched
2026-09-01 from fonts.gstatic.com and checked in so the site no longer waits
on a fonts.googleapis.com round trip before any text can use them. The Google
version is in each filename; a font update is a new file and a new name,
because `.woff2` is served `immutable` (vercel.json).

| file | family | weights | source |
|---|---|---|---|
| audiowide-v22.woff2 | Audiowide | 400 | https://fonts.google.com/specimen/Audiowide |
| exo-v25.woff2 | Exo (variable) | 400-700 | https://fonts.google.com/specimen/Exo |
| orbitron-v35.woff2 | Orbitron (variable) | 400-700 | https://fonts.google.com/specimen/Orbitron |
| space-mono-v17-400.woff2 | Space Mono | 400 | https://fonts.google.com/specimen/Space+Mono |
| space-mono-v17-700.woff2 | Space Mono | 700 | https://fonts.google.com/specimen/Space+Mono |
| rock-salt-v24-greeting.woff2 | Rock Salt | 400 | https://fonts.google.com/specimen/Rock+Salt |

All six are licensed under the SIL Open Font License 1.1
(https://openfontlicense.org). The full licence text ships with each family on
its Google Fonts page; the fonts are used here unmodified except for subsetting.

**Rock Salt contains “hey, I’m Charles” plus a period**, retained from the
initial greeting design.
It was produced by Google's subsetter via the `text=` parameter:

    https://fonts.googleapis.com/css2?family=Rock+Salt&text=hey%2C%20I%E2%80%99m%20Charles.&display=swap

Fetch that CSS with a Chrome user agent, take the `url(...)` it returns, and
save the woff2 file with a new filename for immutable caching. If the caption
changes, repeat with the new text and update the `unicode-range` in styles.css.
The original `rock-salt-v24-subset.woff2` contains the previous name caption.

`before-times.html` still loads Special Elite and Space Mono from Google; it
has its own stylesheet and was left alone.
