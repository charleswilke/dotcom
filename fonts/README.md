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
| rock-salt-v24-subset.woff2 | Rock Salt | 400 | https://fonts.google.com/specimen/Rock+Salt |

All six are licensed under the SIL Open Font License 1.1
(https://openfontlicense.org). The full licence text ships with each family on
its Google Fonts page; the fonts are used here unmodified except for subsetting.

**Rock Salt is a subset of exactly the twelve glyphs in "Charles Wilke"**
(the About card's signature), 4K instead of 50K. It was produced by Google's
own subsetter via the `text=` parameter:

    https://fonts.googleapis.com/css2?family=Rock+Salt&text=Charles%20Wilke&display=swap

Fetch that CSS with a Chrome user agent, take the `url(...)` it returns, and
save the file. If the name on the About card ever changes, do it again with
the new text and update the `unicode-range` on the `@font-face` in styles.css,
or the new letters fall back to Caveat/cursive.

`before-times.html` still loads Special Elite and Space Mono from Google; it
has its own stylesheet and was left alone.
