# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Also read [FABLE.md](FABLE.md)** — working-style notes from Claude Fable 5, extracted from this repo's history. It covers how commits, verification, docs, and creative feedback should be done here.

## Development

**Local server:** `node .claude/static-server.js` — serves the site at http://localhost:8080 (this is what .claude/launch.json launches)

Use that one, not `python3 -m http.server`, when touching **audio**: python's server ignores `Range` requests, so the browser reports every mp3 as unseekable (`audio.seekable` stays `[0,0]`) and clamps all seeks to zero. The album players' time vial then looks broken locally while working fine on Vercel, which serves `206`. `.claude/static-server.js` answers ranges, so scrubbing is testable locally. This burned us once already.

**TootsJam leaderboard server** (optional): `cd games/TootsJam && npm start`

**Audio transcription tools** (require Python env with faster-whisper):
```
cd tools && pip install -r requirements.txt
python3 transcribe.py <audio-file>
python3 verify-lyrics.py
```

No build step — all files are served directly.

**npm security:** Global `~/.npmrc` has `ignore-scripts=true` and `min-release-age=7` (supply chain protection). If `npm install` fails because a package needs lifecycle scripts, use `npm install --ignore-scripts=false` for that one install.

## Deployment

**Vercel:** All three properties (main site, TootsJam, SpaceToots) auto-deploy from `main`. Serverless functions live in `/api/`. Max duration: 15s. Routing is defined in `vercel.json` — clean URLs like `/mixtape` and `/gwor` are rewritten there.

`.htaccess` exists but is no longer active (legacy DreamHost config).

## Cache busting for in-place asset replacements

Everything under `/audio/`, `/images/`, `/games/` and any `.webp/.png/.jpg/.jpeg/.gif/.ico/.mp3/.mp4/.mov` is served with `Cache-Control: public, max-age=31536000, immutable` (see [vercel.json](vercel.json)). This is intentional for performance, but it means **if an asset is replaced in place with the same filename, browsers and CDNs will serve the old version for up to a year.**

When the user updates an asset — cover art, song title art, an mp3, etc. — run [bump-cover.sh](bump-cover.sh) to append a fresh `?v=YYYYMMDDHHMM` query string to every reference across `*.html`, `*.js`, and `*.css` (img tags, og:image, twitter:image, JSON-LD image, song subpages, and JS playlist data like `main.js`'s JC track list):

```
./bump-cover.sh junkyard-cabaret-cover.webp
./bump-cover.sh the-new-survivalism.mp3
```

Defaults to a minute-precision timestamp (`YYYYMMDDHHMM`) so same-day re-stamps always produce a new value; pass a second arg to override. It replaces any existing `?v=…` in place rather than appending twice. After running it, commit and push — Vercel auto-deploys from `main`.

Cues to run this: "I updated the cover for X", "just replaced the album art", "swapped the cover", "updated the mp3", or any time the user mentions editing a cached asset in place.

## Architecture

**No frameworks.** Vanilla HTML/CSS/JS throughout.

### Routing pattern
Clean URLs are rewritten to `.html` files on the server side (both `.htaccess` and `vercel.json`). Some pages (e.g. `/mixtape`) have their own `.html` entry for OG meta tags, but then redirect the browser to `/#mixtape` to open a lightbox on the main portfolio page.

### Main site (`index.html` + `main.js`)
Hash-based navigation (`#portfolio`, `#writing`, `#projections`, `#about`). `main.js` (~4,600 lines) orchestrates:
- Fetching the Substack RSS feed via `/api/substack-feed.js` (Vercel)
- Rendering the article grid (spotlight card + 18 regular cards)
- The "Time Dial" — a vintage radio UI for browsing recap audio
- Lazy initialization via `createLazyInitializer()` and `requestIdleCallback`
- Audio player mutual exclusion (only one player active at a time)

### CSS design system (`styles.css`, ~14,400 lines)
Key CSS variables: `--primary: #1a1550`, `--neon: #00f7c2`, `--secondary: #ff5a36`. Responsive grid: 4 → 3 → 2 → 1 columns across breakpoints.

`styles.css` is loaded **only by index.html**. The subpages (faq, alice-in-wonderland, jersey-boys, before-times) load `subpages.css`, a generated ~15% subset of styles.css. If you change a rule in styles.css that those pages also use (nav, header, footer, FAQ, production pages, before-times), mirror the change in subpages.css.

### Foil (Balatro-style holofoil)
Two places carry it: the About card portrait (`.foil`) and the four "Recently" cards (`.showcase-foil`). Both use the same stack — a pointer-driven hue field, a hairline etch, a specular glare — clipped by an alpha mask generated from the artwork itself, never hand-drawn:

```
node tools/make-foil-mask.js            # about-card portrait
node tools/make-card-foil-masks.js      # all four Recently cards
node tools/make-card-foil-masks.js jc   # just one
```

Recipes (key color, thresholds, blur) live at the top of the card tool, one per card, with the reasoning for each. Re-run it if any of those four source images is replaced — the masks are keyed off specific pixel values and will silently drift otherwise.

Two things bite when editing this area:
- **The Recently cards float.** Their transform composes `--tile-rot`/`--tile-y`/`--tile-scale` (keyframes) with `--tile-tilt-x`/`--tile-tilt-y` (pointer). JC overrides that whole declaration twice, so the shared parts are held in `--tile-persp`/`--tile-tilt` — write transform functions literally and they stop applying to JC only.
- **Hairline textures need counter-rotation.** The etch, like the scanline layers, rotates against `--tile-rot` or it moirés against the pixel grid under the float.

`.showcase-item:hover img` scales 1.03, and `.showcase-foil` must scale with it or the sheen slides off its own shapes on hover.

**On touch, the gyroscope drives it instead** (`initFoilMotion` in main.js) — **the about portrait only**. The four Recently cards drop their foil entirely on coarse pointers (see the `@media (hover: none)` block after the `display: block` opt-in). Driving all five was the first cut and it was too much: four holofoils answering every wrist movement, and the about card lost its status as the one object that does this. Same vars as the pointer path, so the CSS is shared; the only additions are that hide rule and `.foil-motion .foil { animation: none }`, which retires the canned drift once real readings arrive. Worth knowing:

- The two paths are mutually exclusive, gated on `(hover: hover) and (pointer: fine)`. Never let both bind.
- iOS needs `DeviceOrientationEvent.requestPermission()` from a user gesture, so activation rides the about card's existing tap. Grants are remembered in `localStorage` and retried gesture-free on the next visit.
- The model is a plate held level by gravity: the card rotates *against* the phone, and the glare slides toward whichever edge you tip down (the near one). Both axes follow that rule — if you change one sign, change both or they'll disagree.
- **Swing is per axis** (`SWING_X` 22deg, `SWING_Y` 12deg) and should stay that way. Rolling a wrist 22deg is free; pitching a phone that far angles the screen out of view, so a shared range makes pitch read as dead. The 112deg hue gradient compounds it — its direction vector is (0.93, 0.37), so `--foil-py` sweeps the bands only ~40% as far as `--foil-px`.
- `beta`/`gamma` are fixed to the hardware and swap in landscape, so the delta gets rotated by `screen.orientation.angle` before it means anything.
- Add `?foildebug` to the URL for a `window.__foilMotion` handle: live state plus `peakPitch`/`peakRoll` against their swings, which is how you tell a dead axis from one you aren't moving far enough. No desktop browser can produce a real reading, so tuning has to happen on a phone.

### Content organization
- `songs/{album}/{song-name}/` — metadata per song
- `audio/` — MP3s organized by project
- `lyrics/` — lyric files, parallel structure to `songs/`
- `images/` — organized by project (aiw, gpts, jb)

### Games
**TootsJam** (`games/TootsJam/`): Multi-file arcade game. `game.js` (3,405 lines) handles the full game loop, physics, collision, scoring, and audio. Leaderboard via optional `server.js` or Cloudflare Workers (`cloudflare-api/`). Read `SESSION_HANDOFF.md` before making changes — it documents gameplay mechanics, level thresholds, and audio rules in detail. `REGRESSION_CHECKLIST.md` covers what to test.

**SpaceToots** (`games/SpaceToots/`): Single-file Canvas game (all code inline in `index.html`). Read `SPACE_TOOTS_SPEC.md` for the full design doc before modifying.

**Toots Quest** (`games/TootsQuest/`): Top-down Zelda-style adventure, in development (M0 renderer proof complete). Canvas 2D, ES modules, **zero image assets** — everything procedurally drawn ("Living Ink" style). Read `TOOTS_QUEST_PRD.md` (design) and `SESSION_HANDOFF.md` (current state, gotchas, debug handle) before making changes. Must be served over HTTP — ES modules fail silently on file://. Not yet routed in vercel.json or linked from the portfolio.

### API
`/api/substack-feed.js` — Vercel serverless function that fetches the Substack RSS feed and returns JSON. Response is cached; `cache_substack_feed.json` holds a local copy.

## Key docs to read before working on a feature area
- **Time Dial audio system:** `AUDIO_RECAP_GUIDE.md`
- **TootsJam game:** `games/TootsJam/SESSION_HANDOFF.md`, `REGRESSION_CHECKLIST.md`
- **SpaceToots:** `games/SpaceToots/SPACE_TOOTS_SPEC.md`
- **Toots Quest:** `games/TootsQuest/TOOTS_QUEST_PRD.md`, `games/TootsQuest/SESSION_HANDOFF.md`
- **Adding GWOR songs:** `adding-a-gwor-song.md`
- **RSS caching:** `RSS_OPTIMIZATION_README.md`
- **SEO & performance:** `SEO_PERFORMANCE_PLAYBOOK.md` — checklist for WebP conversion, sitemap, structured data, robots.txt
