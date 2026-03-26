# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

**Local server:** `python -m http.server 8080` — serves the site at http://localhost:8080

**TootsJam leaderboard server** (optional): `cd games/TootsJam && npm start`

**Audio transcription tools** (require Python env with faster-whisper):
```
cd tools && pip install -r requirements.txt
python transcribe.py <audio-file>
python verify-lyrics.py
```

No build step — all files are served directly.

## Deployment

**Vercel:** All three properties (main site, TootsJam, SpaceToots) auto-deploy from `main`. Serverless functions live in `/api/`. Max duration: 15s. Routing is defined in `vercel.json` — clean URLs like `/mixtape` and `/gwor` are rewritten there.

`.htaccess` exists but is no longer active (legacy DreamHost config).

## Architecture

**No frameworks.** Vanilla HTML/CSS/JS throughout.

### Routing pattern
Clean URLs are rewritten to `.html` files on the server side (both `.htaccess` and `vercel.json`). Some pages (e.g. `/mixtape`) have their own `.html` entry for OG meta tags, but then redirect the browser to `/#mixtape` to open a lightbox on the main portfolio page.

### Main site (`index.html` + `main.js`)
Hash-based navigation (`#portfolio`, `#writing`, `#projections`, `#about`). `main.js` (2,836 lines) orchestrates:
- Fetching the Substack RSS feed via `/api/substack-feed.js` (Vercel)
- Rendering the article grid (spotlight card + 18 regular cards)
- The "Time Dial" — a vintage radio UI for browsing recap audio
- Lazy initialization via `createLazyInitializer()` and `requestIdleCallback`
- Audio player mutual exclusion (only one player active at a time)

### CSS design system (`styles.css`, 8,499 lines)
Key CSS variables: `--primary: #1a1550`, `--neon: #00f7c2`, `--secondary: #ff5a36`. Responsive grid: 4 → 3 → 2 → 1 columns across breakpoints.

### Content organization
- `songs/{album}/{song-name}/` — metadata per song
- `audio/` — MP3s organized by project
- `lyrics/` — lyric files, parallel structure to `songs/`
- `images/` — organized by project (aiw, gpts, jb)

### Games
**TootsJam** (`games/TootsJam/`): Multi-file arcade game. `game.js` (3,405 lines) handles the full game loop, physics, collision, scoring, and audio. Leaderboard via optional `server.js` or Cloudflare Workers (`cloudflare-api/`). Read `SESSION_HANDOFF.md` before making changes — it documents gameplay mechanics, level thresholds, and audio rules in detail. `REGRESSION_CHECKLIST.md` covers what to test.

**SpaceToots** (`games/SpaceToots/`): Single-file Canvas game (all code inline in `index.html`). Read `SPACE_TOOTS_SPEC.md` for the full design doc before modifying.

### API
`/api/substack-feed.js` — Vercel serverless function that fetches the Substack RSS feed and returns JSON. Response is cached; `cache_substack_feed.json` holds a local copy.

## Key docs to read before working on a feature area
- **Time Dial audio system:** `AUDIO_RECAP_GUIDE.md`
- **TootsJam game:** `games/TootsJam/SESSION_HANDOFF.md`, `REGRESSION_CHECKLIST.md`
- **SpaceToots:** `games/SpaceToots/SPACE_TOOTS_SPEC.md`
- **Adding GWOR songs:** `adding-a-gwor-song.md`
- **RSS caching:** `RSS_OPTIMIZATION_README.md`
