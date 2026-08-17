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

No build step locally — all files are served directly, authored-as-is. **CSS is minified in Vercel's build container only** (see "CSS minification" under Deployment); nothing in git is ever minified, and the local server serves the same unminified files you edit.

**npm security:** Global `~/.npmrc` has `ignore-scripts=true` and `min-release-age=7` (supply chain protection). If `npm install` fails because a package needs lifecycle scripts, use `npm install --ignore-scripts=false` for that one install.

## Deployment

**Vercel:** All three properties (main site, TootsJam, SpaceToots) auto-deploy from `main`. Serverless functions live in `/api/`. Max duration: 15s. Routing is defined in `vercel.json` — clean URLs like `/mixtape` and `/gwor` are rewritten there.

`.htaccess` exists but is no longer active (legacy DreamHost config).

### CSS minification (build-container only)

`vercel.json` sets:

```
"buildCommand": "node tools/minify-css.js styles.css subpages.css before-times.css"
"outputDirectory": "."
```

[tools/minify-css.js](tools/minify-css.js) rewrites those three files **in place inside Vercel's build container**, which is a throwaway checkout. Git keeps the authored files, and `node .claude/static-server.js` keeps serving them unminified, so the repo's no-build-step character is intact where you actually work. It is zero-dependency, deterministic, idempotent, and refuses to write if minifying changed the brace balance.

Worth it because Vercel compresses on the fly at a low brotli level and cannot squeeze whitespace: `styles.css` goes from **86K to roughly 45K on the wire**. Since `.css` is now `immutable`, this only affects first visits.

**Fail-safe, not fail-broken:** if the build step ever stops running, the site serves the unminified sources exactly as it did before. And because minification is deterministic, hashing the *source* in `stamp-code.sh` still identifies the deployed bytes uniquely.

**`tools/` is `.vercelignore`d, so the build script has to be re-included by hand.** The first deploy of this failed with `Cannot find module '/vercel/path0/tools/minify-css.js'`: committed to git, filtered out of the deploy. And it could not be fixed with a bare `!tools/minify-css.js`, because a path under a flatly-excluded directory cannot come back — the same trap the `OMAxAI/*` and `bt-assets/*` rules are already shaped around. The directory is excluded by its contents instead:

```
tools/*
!tools/minify-css.js
```

**So a build step may only depend on files that actually reach the container.** `package.json` is `.vercelignore`d too, which means no install step runs and a build tool cannot have dependencies — another reason `minify-css.js` is zero-dependency. If you add a second build script, re-include it explicitly and verify before pushing. Note `git check-ignore` reads `.gitignore`, so it is the wrong tool here; point `--exclude-from` at the right file instead:

```
git ls-files -c --ignored --exclude-from=.vercelignore | grep '^tools/your-script.js$'
```

No output means it reaches the deploy. A match means the build will fail with `Cannot find module`.

**Never run `minify-css.js` against your working copy.** It rewrites **in place** — that is the point, since Vercel's container is a throwaway checkout — so pointing it at `styles.css` to "just check the build step works" replaces your edits with minified output. Undoing that with `git checkout styles.css` then destroys every uncommitted change in the file, not only the minification. If you want to exercise the build script, copy the sheet somewhere first:

```
cp styles.css "$SCRATCH/styles.css" && (cd "$SCRATCH" && node /path/to/tools/minify-css.js styles.css)
```

Or use the non-destructive flags the tool already has: `--check` reports without writing, `--out FILE` writes elsewhere. This cost a session's uncommitted CSS once.

**The one rule the minifier exists to encode:** it never touches whitespace around `:`. A descendant `:is()` —

```
.showcase-grid[data-layout="columns"] :is(.showcase-kicker, .showcase-meta, .showcase-cta)
```

— tightens into `[data-layout="columns"]:is(...)`, which matches the grid itself, silently dropping `font-size: 0.76rem` from the kicker, meta and CTA. That bug only manifests once `main.js` has added `.is-masonry`, so **static-HTML testing cannot see it.** Don't "improve" the minifier by handling `:`; it needs real selector-vs-declaration parsing, and it buys about a byte per declaration.

That selector was real — it lived at `styles.css:1660` — and is now gone, folded back into the base caption values when the Recently cards shrank 20% on 2026-08-17. **The rule stays anyway:** the hazard belongs to CSS, not to that one rule, and the next descendant `:is()`/`:where()`/`:not()` anyone writes brings it back silently. Don't prune the rule because grep finds no current victim.

**Verifying a minifier change:** [tools/css-fidelity-check.sh](tools/css-fidelity-check.sh) plus [tools/css-fidelity-check.js](tools/css-fidelity-check.js) diff every computed property of every element on a live page (main.js run, lightboxes open) between the original and minified sheets. Always confirm the negative control (`_fid-styles-broken.css`) reports FAIL at **≥768px** wide first — if it passes, your test is blind to the bug above.

**The control is anchored to a specific live selector, and that anchor can rot.** It used to seed the descendant `:is()` above; when that selector was deleted the seeder refused to write and said so, which is the behavior to preserve. It now tightens the descendant combinator in the Recently `h3` sizing rule instead (both selectors in that rule carry the needle, so the titles fall 1.05rem → 1.15rem and the run reports 12 differences). If you ever see `! could not seed the negative control`, **the fix is to re-anchor it on another live descendant selector whose tightening changes computed style on index.html — never to delete the guard.** A control that cannot seed is a test that proves nothing.

Current coverage, all PASS at 0 differences and 0 control drift:

| page | state | comparisons |
|---|---|---|
| index | 1280, main.js live | 44,240 |
| index | 1280, album + game lightboxes open | 72,380 |
| index | 375 / 768 | 44,240 each |
| faq | 1280, accordions open | 28,560 |
| alice-in-wonderland / jersey-boys | 1280 | 18,270 / 15,680 |
| before-times | 1280 | 57,260 |

**JS is deliberately not minified.** `main.js` is ~5,400 lines and terser would be a new dependency against the `ignore-scripts` posture, with silent-breakage risk; CSS is the larger win anyway.

## Cache busting for in-place asset replacements

Everything under `/audio/`, `/images/`, `/games/` and any `.webp/.png/.jpg/.jpeg/.gif/.ico/.mp3/.mp4/.mov` is served with `Cache-Control: public, max-age=31536000, immutable` (see [vercel.json](vercel.json)). This is intentional for performance, but it means **if an asset is replaced in place with the same filename, browsers and CDNs will serve the old version for up to a year.**

When the user updates an asset — cover art, song title art, an mp3, etc. — run [bump-cover.sh](bump-cover.sh) to append a fresh `?v=YYYYMMDDHHMM` query string to every reference across `*.html`, `*.js`, and `*.css` (img tags, og:image, twitter:image, JSON-LD image, song subpages, and JS playlist data like `main.js`'s JC track list):

```
./bump-cover.sh junkyard-cabaret-cover.webp
./bump-cover.sh the-new-survivalism.mp3
```

Defaults to a minute-precision timestamp (`YYYYMMDDHHMM`) so same-day re-stamps always produce a new value; pass a second arg to override. It replaces any existing `?v=…` in place rather than appending twice. After running it, commit and push — Vercel auto-deploys from `main`.

Cues to run this: "I updated the cover for X", "just replaced the album art", "swapped the cover", "updated the mp3", or any time the user mentions editing a cached asset in place.

### CSS and JS are immutable too — stamp them with [stamp-code.sh](stamp-code.sh)

`.css` and `.js` get the same `immutable, max-age=31536000` as images and audio. They used to be `max-age=0, must-revalidate`, which meant every repeat visit spent a round trip revalidating 86KB of CSS and 57KB of JS that had not changed.

That is only safe because every reference carries a `?v=`, so **run this before any deploy that touches CSS or JS:**

```
./stamp-code.sh
```

It hashes each file's contents and rewrites the `?v=` on every reference in `*.html`. Idempotent — no content change produces no diff — so running it every time is free. `./stamp-code.sh --check` exits non-zero if a stamp is stale and changes nothing, which is the CI-friendly form.

**Why a hash and not a timestamp:** the stamps were bumped by hand and drifted. `main.js` sat at `?v=202608052135` while its contents had moved on ten days, which under `immutable` would have pinned returning visitors to a stale script for a year. A content hash makes the URL change exactly when the file does, with no discipline required.

Division of labor: `stamp-code.sh` owns code (`.css`/`.js` referenced from HTML), `bump-cover.sh` owns media (images, audio, video — which are also referenced from JS playlist data and OG tags that `stamp-code.sh` deliberately does not touch).

## Architecture

**No frameworks.** Vanilla HTML/CSS/JS throughout.

### Routing pattern
Clean URLs are rewritten to `.html` files on the server side (both `.htaccess` and `vercel.json`). Some pages (e.g. `/mixtape`) have their own `.html` entry for OG meta tags, but then redirect the browser to `/#mixtape` to open a lightbox on the main portfolio page.

### Main site (`index.html` + `main.js`)
Hash-based navigation (`#portfolio`, `#writing`, `#projections`, `#about`). `main.js` (~5,400 lines) orchestrates:
- Fetching the Substack RSS feed via `/api/substack-feed.js` (Vercel)
- Rendering the article grid (spotlight card + 18 regular cards)
- The "Time Dial" — a vintage radio UI for browsing recap audio
- Lazy initialization via `createLazyInitializer()` and `requestIdleCallback`
- Audio player mutual exclusion (only one player active at a time)

### CSS design system (`styles.css`, ~14,500 lines)
Key CSS variables: `--primary: #1a1550`, `--neon: #00f7c2`, `--secondary: #ff5a36`. Responsive grid: 4 → 3 → 2 → 1 columns across breakpoints.

**A malformed stylesheet is silent — the browser console will not tell you.** CSS has no parse *errors* in the way JS does; a bad token makes the parser discard until it recovers, so the rules it swallowed simply never apply, and `read_console_messages` comes back clean. These sheets are comment-heavy, which makes the common way in a stray `*/`: paste a paragraph after a comment that already closed and everything up to the next `*/` is raw CSS, taking real rules down with it. Both `stamp-code.sh` and the minifier will happily process the broken file.

So after editing any sheet, check it structurally rather than trusting a quiet console:

```
python3 -c "import re,sys; s=open(sys.argv[1]).read(); t=re.sub(r'/\*.*?\*/','',s,flags=re.S); print('stray */:',t.count('*/'),'| unterminated /*:',t.count('/*'),'| braces:',s.count('{')-s.count('}'))" styles.css
```

All three must be `0`. Then confirm the rules you touched actually *compute* — read them back with `getComputedStyle` in the preview, don't just look at the page. A rule that was dropped often looks fine, because the element falls back to a plausible earlier value; the 20% Recently shrink shipped a broken comment for two full rounds of visual checking before a `getComputedStyle` read caught it.

`styles.css` is loaded **only by index.html**. Three subpages — faq, alice-in-wonderland, jersey-boys — load `subpages.css`, a **hand-maintained** ~21% subset of it (3,092 of 14,475 lines). Nothing generates that subset, so if you change a rule in styles.css that those pages also use (nav, header, footer, FAQ, production pages), mirror the change in subpages.css by hand and then check for drift:

```
python3 tools/check-subpages-css.py
```

It compares every selector the two sheets share, context-aware about `@media` blocks, and exits non-zero on a mismatch.

**before-times is not one of them.** It loads its own standalone `before-times.css` and nothing else, so styles.css edits never reach it — and, in the other direction, its footers don't inherit the site-wide `footer` rules the other pages get.

Both styles.css and subpages.css carried a dead `/* ===== BEFORE TIMES WORKSPACE ===== */` block long after that split — ~780 lines each of a System-7-style window UI (`.bt-window`, `.bt-titlebar`, `.bt-file-window`, `.bt-shelf`, 44 classes plus `--bt-*` variables). None of those classes existed in `before-times.css` or in any markup or JS; it was the generation of the page that preceded the standalone sheet. Removed 2026-08-15 — recoverable from git history if that workspace look is ever wanted again.

### Foil (Balatro-style holofoil)
**One place carries it: the About card portrait (`.foil`).** A pointer-driven hue field, a hairline etch, a specular glare, clipped by an alpha mask generated from the artwork itself, never hand-drawn:

```
node tools/make-foil-mask.js            # about-card portrait
```

The four "Recently" cards used to carry the same stack plus a pointer tilt (`.showcase-foil`, `initShowcaseFoil`, `--tile-tilt-*`). **All of it was removed.** Five holofoils answering the cursor turned the top of the page into a light show and cost the portrait its status as the one object that does this. The cards keep their float, their hover scale, and their CRT treatment; the transform is now just `rotate`/`translateY`/`scale`.

The way back is intact: `tools/make-card-foil-masks.js` and `images/foil/*.webp` are deliberately still in the tree (unreferenced, kept on purpose — don't prune them as dead assets), and commit `88314c4` has the CSS, the markup and the JS as they were. Re-run the tool if any of those four source images is replaced in the meantime; the masks are keyed off specific pixel values and will silently drift.

If any of this comes back: every card now runs the base tile transform unmodified, so anything added there applies everywhere. (JC used to override the whole declaration twice — a masonry-era 0.88 shrink, then an undo of it in the four-column layout — which silently dropped anything added to the base. Both were removed once JC's card art went 16:9 like the rest of the row.) And hairline textures need counter-rotation against `--tile-rot` or they moiré against the pixel grid under the float — that's why the scanline layers rotate backwards.

**On touch, the gyroscope drives it instead** (`initFoilMotion` in main.js). Same vars as the pointer path, so the CSS is shared; the only addition is the pair in the `@media (hover: none), (pointer: coarse)` block that hides `.foil` and un-hides it under `html.foil-motion`. Worth knowing:

- **On touch the portrait is flat until the sensor is live.** `html.foil-motion` is set on the *first real reading*, not in `start()`, so a phone that grants the sensor but never reports (no gyro, silent implementation) keeps the plain illustration instead of an inert tinted plate. A returning visitor whose grant is remembered gets it without tapping, which is the point of remembering. This replaced a slow canned drift (`@keyframes foilDrift`, now gone): before the grant that drift was a tinted plate wandering on its own, which is the state most iOS visitors actually saw.

- The two paths are mutually exclusive, gated on `(hover: hover) and (pointer: fine)`. Never let both bind.
- iOS needs `DeviceOrientationEvent.requestPermission()` from a user gesture, so activation rides the about card's existing tap. Grants are remembered in `localStorage` and retried gesture-free on the next visit.
- The model is a plate held level by gravity: the card rotates *against* the phone, and the glare slides toward whichever edge you tip down (the near one). Both axes follow that rule — if you change one sign, change both or they'll disagree.
- **The mobile breakpoint kills the card's transform** (`@media (max-width: 767px)` sets `transform: none`), so `html.foil-motion` has to restore it or the tilt silently does nothing on the exact devices the gyroscope targets. This is worth remembering as a class of bug: writing a CSS var proves nothing if no rule on that breakpoint consumes it.
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
