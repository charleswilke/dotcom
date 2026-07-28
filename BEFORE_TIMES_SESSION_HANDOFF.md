# Before Times — Session Handoff

Read this before doing more lobby image separation or interaction work. This is
the practical record of what exists, what worked, and what cost us time during
the July 16–17, 2026 sessions.

## Current state

The experience now opens directly into the archive lobby. The former
dog-guardian password gate was retired before launch; there is no client-side
password, session gate state, inert lobby, or blocking threshold. Its artwork
remains preserved rather than deleted: the original gate was split into two
transparent runtime layers.
`images/before-times/gate/dog-medallion-v1.webp` holds the dog portraits and
field recess, while `dog-shackle-v1.webp` holds the separate shackle. The
full-resolution transparent PNG masters live beside those WebPs, and the
original magenta chroma renders remain in
`tools/before-times-clean-patches/gate-*-chroma-v1.png` if the threshold is ever
revisited as a non-blocking introduction.

On touch-first mobile devices, portrait mode opens a themed rotate-phone
interstitial that can be dismissed with “Stay in portrait.” Its fullscreen
button makes a best-effort browser fullscreen request and landscape orientation
lock while the tap gesture is still active. Both APIs are progressive
enhancements: Android browsers commonly honor them, while iPhone Safari may
not. Supported browsers also keep a small Full screen control available when
the archive is landscape but not immersive. The lobby stays immediately
available throughout; this feature must not restore the retired password gate.

The first lobby is now built as a clean background plate plus independent
interactive raster layers. The visible career doors are not warped crops. Each
is a newly rendered asset that already contains the correct installed
perspective, its themed interior, the full physical frame, and its decorative
arch or crest.

The layered scene currently includes:

- Absurd Alchemy: film-set doorway plus full clapperboard arch.
- Game Development: workstation doorway plus game-symbol crest.
- The Content Factory: robotic factory doorway, control panel, and
  cloud-and-gears arch.
- The Knowledge Maze: documentation interior, angular frame, and circular maze
  medallion.
- Return portal: a separately generated angled door and frame.
- Radio, college bulletin board, photography lightbox, and hanging camera:
  pixel-exact cutouts from the original room art.
- Desk bell and newspaper stand: cleaned or regenerated independent sprites
  paired with deliberately local background repairs.

The guestbook is now fully separated from the desk. The runtime lobby plate
repairs the original book footprint while preserving the baked brass plaque;
a fresh pen-free ledger and placed-pen overlay sit inside the existing semantic
hotspot. This lets the smaller book lift on hover without exposing duplicate
art or the earlier pen-shaped page patch.

The photography lightbox and hanging camera are separate buttons even though
they open the same panel, so their hover behavior can evolve independently.
The small inventory medallion is covered by a responsive `CW` monogram layer.

The question-mark control now contains both the About copy and the former
How-to-explore instructions, including the opt-in sound toggle. The hotspot
reveal control has been removed; its baked hand icon is covered by a small
header-colored mask. The upper-right cog is covered by an accessible X link
that exits to `/`; its rough dry-brush illustrated sprite lives at
`images/before-times/layers/exit-button-v3.png`. The X link's header-colored
backing mask deliberately extends beyond the hotspot so no fragment of the
baked cog can peek around the replacement.

All five doors have hover/activation motion. Their light is produced by a
dedicated `.bt-door-light` element behind each sprite, so light spill is not
clipped by an image bounding box. Its `::before` is a narrow opening aura and
its `::after` is a restrained elliptical floor pool.

## Absurd Alchemy room

The Absurd Alchemy doorway now enters a full-width illustrated production room
at `#absurd-alchemy`. The runtime image is a clean 1672×941 plate with an empty
hero CRT; only that screen was replaced, so the original VHS 25, chair, solar
system, door, props, and perspective remain locked to the concept render.

- The director's chair opens a call-sheet playlist. Selecting a title loads the
  Vimeo source and calls `play()` inside the same click gesture. The current
  reel is also primed silently when the room opens, which makes delegated
  autoplay much more reliable; a visible Press play fallback remains for strict
  browser policies.
- The call sheet now carries 27 reels in five groups: the 11-video Vimeo vault
  (Call Me Lucifer 1–4, The NoHo Rag 1–4, shorts and one-offs) plus, last on
  the list, The NoHo Rag Season One (12 YouTube episodes, 2014–15) and
  Segments (4 YouTube shorts, 2015). Vimeo entries carry `id` (+ optional
  `hash`; only Sagan has one); YouTube entries carry `yt`. The presence of
  `yt` is what routes a cue to the YouTube path.
- The hero CRT is dual-source: two stacked iframes inside the same keystoned
  video plane, with `data-crt-source` on the hero screen controlling which is
  visible. The YouTube IFrame API loads lazily on first YouTube cue. A thin
  adapter maps YT state changes onto the same handlers Vimeo uses (play/pause
  labels, power-off on ended) and a 250ms poll substitutes for Vimeo's
  timeupdate to drive the glow. Tap toggle, press-play fallback, and
  leave-room cleanup all branch on `heroSource`.
- The small cat figure cues the French Kitty trailer on the hero screen, the
  same way the solar system cues Sagan.
- The fountain pen on the left-side script stack is now a collectible. Picking
  it up animates a compact inventory drawer from the bottom of the room; the
  drawer tucks itself after 2.9 seconds but its handle remains available. The
  item and its `room` → `inventory` → `guestbook` location are stored in
  `sessionStorage` under `bt-inventory-v1`, so both state and location persist
  through reloads for that browser tab. The complete pen-free V4 room plate
  replaces the original background after pickup, so revisiting the room cannot
  reveal the baked pen or a localized repair seam. In the lobby, the guest book
  remains pen-free and locked while the pen is in inventory. Hovering or focusing
  the room pen also reveals that clean plate beneath the lifted pen sprite, avoiding
  a doubled pen during the preview animation. Dragging the inventory pen onto the
  book places it there, removes it from inventory, reveals the
  independent placed-pen overlay, and opens the signing modal. Clicking or keyboard-activating
  the pen selects it; activating the book then provides the equivalent
  accessible path. Both the entry handler and submit handler enforce that the
  pen must actually be on the book, not merely collected.
- The old production camera on the right-side equipment case has been replaced
  by a dimensional Absurd Alchemy hand emblem: blackened metal, the original
  yellow cuff, and a gray mounting base. It keeps the compact curio-style
  silhouette glow and exposes an object label/status line on hover or focus.
- Once a reel has started, an invisible `.bt-crt-tap-toggle` button covers the
  picture area and toggles play/pause through the Player API (a tap after the
  reel ends rewinds and replays).
- When a reel ends, the set powers itself off instead of showing Vimeo's
  end screen: the `ended` handler collapses the picture to a bright line
  (`bt-crt-power-off` on the shared power-line surface), fades the iframe,
  restores the SELECT A REEL idle state, and resets the glow to neutral teal.
  Tapping the dark screen powers it back on with the same reel from the top. Its bottom 16% strip is deliberately left
  open so Vimeo's scrubber, volume, and fullscreen controls remain reachable —
  don't extend the toggle to full height. It also sidesteps unreliable
  hit-testing on the 3D-transformed iframe.
- The hero embed now plays on a true 3D keystoned surface. `.bt-crt-video-plane`
  is oversized to the right and rotated away with
  `perspective(800px) rotateZ(2.1deg) rotateY(14deg)` from a left-edge origin,
  so the video texture itself compresses toward the receding right side the way
  the painted CRT does; rounded plane corners plus the inset shadow supply the
  curved-tube feel. The plane no longer carries its own screen-shape clip —
  the parent `.bt-alchemy-hero-screen`'s clip-path owns the final silhouette,
  and the glow layer still shares it. The scanline/vignette/sheen overlay
  (`.bt-alchemy-hero-screen .bt-crt-glass`) rides the identical surface. The
  shared geometry lives in the `--bt-alchemy-crt-surface-*` custom properties
  on `.bt-alchemy-scene` (inset, transform, origin, radius); change those, not
  the individual rules, so the video and its glass can never drift apart.
  Adjust `--bt-alchemy-screen-shape` for contour changes, but keep the surface
  oversize in step with any rotation or perspective change. The surface is
  scale-invariant: `.bt-alchemy-scene` is an inline-size container and the
  modern values (`perspective(60cqw)`, right inset -21%, iframe 106%) live in
  an `@supports (width: 1cqw)` block, giving a uniform ~1.7% projected
  overhang past the clip at every scene width. Do not go back to a px
  perspective with a fat oversize — that combination ate up to 11% of the
  video frame's right side on small stages. The px fallback values outside
  the `@supports` block serve legacy browsers only.
  While Vimeo is playing, a separate layer behind the embed adds teal spill
  and radial rays across the television frame. The light runs three
  desynchronized drift animations (breathe 5.8s, beam shimmer 8.3s, ray sweep
  12.7s) so the combined glow never visibly loops; they are gated on
  `.is-playing`, stop entirely on pause, and collapse under reduced motion.
- The TV light is content-reactive. The page cannot sample the cross-origin
  Vimeo iframe, so `tools/build-alchemy-glow-tracks.py` analyzes low-res
  local copies of the reels offline (2 samples/sec of average color + luma)
  and writes `images/before-times/glow-tracks-v1.json` (~100KB). At runtime,
  the player's `timeupdate` event indexes the current sample and a small rAF
  lerp drives the `--bt-glow-rgb` / `--bt-glow-hi-rgb` / `--bt-glow-mult`
  custom properties on `.bt-alchemy-scene`; all glow colors and the breathe
  keyframes consume those vars. Defaults are the room teal, so a missing or
  failed JSON fetch degrades silently to the old fixed glow. After adding a
  new reel, re-run the script (yt-dlp a low-res copy keyed by playlist key,
  e.g. `noho-5.mp4`) or the new reel simply keeps the neutral teal glow.
- The tiny solar system directly cues/restarts Carl Sagan: Prank Master.
- VHS 25 plays a short procedural Web Audio joke and animates the tape. It
  respects the site's existing sound preference and needs no audio asset.
- The two smaller CRTs run short, silent production fragments on an 8–20 second
  randomized schedule. Normally only one plays; a rare double hit is allowed.
  Clicking either screen triggers it immediately. Add future clips by extending
  `PRODUCTION_LOOPS` in `before-times.js`. Each monitor has its own measured
  4:3-ish inner-glass polygon, perspective-skewed video, and matching active
  glow; do not reuse the hero-screen contour or a generic rectangle for them.
- The right-side doorway and fixed mobile Lobby button return to the central
  room and restore the URL/history state.
- The right-side exit is now one opaque interaction sprite containing the
  physical frame, threshold, reverse side of the lobby's clapboard, and the
  complete lobby view inside the opening. The room plate is repaired beneath
  it. The light span now uses the lobby's shared `.bt-door-light` component,
  including its opening aura, threshold pool, hover opacity, and scale. The
  doorway raster uses the same brightness/saturation as the lobby doors, but
  remains stationary: unlike the tight lobby sprites, this full-scene layer
  would expose the source-colored antialias fringe retained beneath it if moved.
- On narrow screens the room stays a 1000px horizontal stage inside its own
  scroll area. This keeps the CRT and hotspots legible rather than shrinking
  the full illustration to phone width.

Fragments play through exactly once: `video.loop` is off and each video's
`ended` listener powers the monitor down with the blip, so a clip never wraps
back to its opening frames. The ghost timer remains only as a cap for stalled
or slow-loading video (and still cuts mid-clip when it draws a short window).

The production monitors rotate through fifty-six real 6-second fragments cut
from the actual reels (`images/before-times/production/fragment-*-v1.mp4`,
320×240 silent h264 at 12fps, center-cropped to the monitors' 4:3 glass).
Every reel is covered; the longer ones carry second (`-b`) and third (`-c`)
moments whose timestamps were scored with all earlier picks' neighborhoods
(±50–60s) excluded, so each clip is a genuinely different scene.
`chooseProductionLoop` deals from a shuffled deck, so every fragment appears
once before any repeats. YouTube source downloads occasionally fail with
transient "unavailable"/403 errors — just retry the same command.
Clip moments were chosen programmatically: a scorer over the glow tracks
(mean intensity + chroma + frame-to-frame color activity, restricted to the
middle 70% of each reel) picked the liveliest window. To add or re-cut a
fragment, download a ≤360p source keyed by playlist key and run the same
ffmpeg recipe; bump the `-v1` suffix on re-cuts because `/images/*` ships
with immutable caching. The old thumbnail-derived
`sagan-production-fragment-a/b.mp4` files remain on disk but are out of the
rotation.

For re-measuring the two production monitors' glass, open
`/before-times.html?calibrate=production#absurd-alchemy`. This is the
generalized four-corner tool the game room's `?calibrate=monitors` pioneered,
with one twist for these convex tubes: the four handles per monitor mark the
TRUE corners (where the straight edges would meet), and the overlay generates
the actual glass silhouette from them — quadratic corner arcs plus edges bowed
outward along their normals, tuned by the panel's Corner radius (fraction of
the shorter adjacent edge, ≤0.35) and Edge bulge (fraction of edge length,
≤0.08) sliders. The dashed quad shows the corners; the solid line is the
generated contour. Contour math runs aspect-corrected against the 1672×941
plate so curves read circular on screen. State autosaves under
`bt-production-calibration-v1`; Copy points exports the corners, curvature
params, and a `generated` block with each monitor's element box
(left/top/width/height scene %) and a 64-point local `polygon()` ready for
`--bt-production-upper/lower-shape`. Like the game tool it is measuring-only:
nothing touches the live CSS until the exported values are applied by hand.

The accepted July 23 measurement (third pass, same day) is applied to the
CSS and stored as the Reset default: upper `TL [51.63,15.4]`,
`TR [61.51,15.37]`, `BR [61.36,29.25]`, `BL [51.84,29.28]`; lower
`TL [51.03,35.62]`, `TR [60.84,36.12]`, `BR [60.8,49.75]`,
`BL [50.99,49.53]`; cornerRadius `0.16`, edgeBulge `0.025`. Both tubes sit
far more upright than the original hand-drawn polygons assumed, so the
inner-video and power-line skews were retuned to the measured edges: the
upper monitor sits dead level (no skew), the lower eased from `1.7deg` to
`1.2deg`.

## July 16–17 finishing-pass notes

### Layer choices that held up

- Treat the lobby as a flattened illustration first, not a collection of
  separable objects. Before moving anything, inspect the background plate for
  baked duplicates, shadows, rods, and edge fragments.
- The earlier advice to keep the guestbook baked into the desk is superseded.
  The clean solution is a generated empty-desk repair plus a fresh isolated
  book, while the original brass plaque stays baked. The repair uses the clean
  full-scene donor through one expanded, feathered old-book silhouette; do not
  add a cloned texture strip, because it duplicates the desk edge.
- The newsstand needs only an upper-silhouette repair behind its replacement
  sprite. Keep the baked cabinet body, base, and grounding shadow. Removing the
  whole object made it look pulled away from the wall and brought generated
  floor shadows back.
- The radio selection effect belongs in the separate `.bt-radio-aura` DOM
  layer. This gives the antenna and body glow breathing room without clipping
  the aura to the raster bounds or lighting up the extraction's dirty matte.
- The bell is small enough that a cohesive redraw works better than surgical
  pixel repair. `bell-v4.*` was generated as one object, chroma-keyed, cleaned,
  and fitted to the original 140px sprite box by its alpha bounds.
- The exit control needs both a rough illustrated sprite and an oversized
  header-colored backing mask. `exit-button-v3.png` uses dry-brush linework;
  the mask extends outside the hotspot because the baked cog silhouette is
  wider than the new X.
- Door-frame tuning is most convincing in small percentage increments. The
  generated doors already contain the room perspective; large transforms make
  them look assembled instead of drawn into the wall.

### Dead ends and why they failed

- The full-room all-props-removed plate repaired too many unrelated regions at
  once. It introduced choppy texture seams and invented floor shadows.
- A broad newsstand removal exposed more generated floor than the replacement
  could cover. The cabinet lost contact with the wall and the old shadow
  problem returned.
- Rebuilding only the malformed knob on the 140px bell produced pinched,
  mushroom-shaped, or dome-clipping results. Regenerating the whole bell was
  faster and visually more coherent.
- Transparent PNG inspection can be misleading because fully transparent
  pixels may still contain stale RGB values. Composite the asset over black or
  the real scene before judging a matte or apparent fragment.
- The first X replacement was too smooth and geometric at runtime size. The
  roughness must be exaggerated in the high-resolution master so dry-brush
  gaps and stroke variation survive downscaling.
- A backing mask sized only to the X hotspot left a tiny piece of the baked cog
  visible above-left. Mask the full old silhouette, not just the replacement.
- Generated assets still need a cleanup pass. The otherwise successful bell
  included a small interior spindle that was only obvious after chroma removal
  and live-scale inspection.

### Repeatable finishing workflow

1. Inspect the full lobby and a tight crop to determine what is baked into the
   plate and what is truly isolated.
2. Preserve original art whenever an invisible hotspot or restrained CSS
   effect provides the interaction without moving the object.
3. For a genuinely new sprite, generate the complete physical object on a flat
   chroma background with no wall, floor, glow, or cast shadow.
4. Remove the chroma key, validate transparent corners and partial-alpha counts,
   then fit the visible alpha bounding box rather than the padded canvas.
5. Save a sibling versioned PNG master and runtime WebP when appropriate. Do
   not overwrite the prior source asset.
6. Repair only the background pixels the moving sprite can expose, using a
   feathered shaped mask rather than a large rectangular replacement.
7. Inspect the asset both enlarged on a dark background and at actual lobby
   scale. Exercise its hover/activation state before calling it finished.
8. Bump the HTML cache token whenever CSS or a same-named runtime asset changes.

### Guestbook wiring and deployment state

- The client flow is complete: open the modal, load recent entries, submit
  `name`, `message`, and the hidden honeypot, reset the form, and refresh the
  visible ledger.
- `api/before-times-guestbook.js` implements public `GET` and `POST`, plus an
  authenticated `DELETE`. It stores 100 entries, returns the newest 40, blocks
  links, normalizes text, and limits one IP fingerprint to three posts per 15
  minutes.
- The endpoint accepts `guestbook_KV_*`, `plays_KV_*`, or generic `KV_*` REST
  credentials. Production's existing play-counter API gets past its KV config
  gate, so the guestbook should be able to reuse that store after deployment.
- `python3 -m http.server` is visual-only and returns 404 for `/api/*`. Use a
  deployed Vercel preview or an authenticated/linked `vercel dev` session for
  a real end-to-end guestbook test.
- As of this handoff, `https://charleswilke.com/api/before-times-guestbook`
  returns 404 because the feature is still on `codex/before-times`, not
  production `main`. A local mocked POST→GET round trip passed with 201/200.
- Entries publish immediately. There is an admin-token delete route, but no
  moderation queue or management UI; the current spam defenses are deliberately
  lightweight.

## Run and verify

From the repository root:

```bash
python3 -m http.server 8080
```

Open:

```text
http://127.0.0.1:8080/before-times.html
```

Use localhost, not `file://`. The absolute asset paths and browser behavior are
reliable over HTTP, while direct file preview previously looked broken.

This static server does not execute the Vercel functions under `/api`. A 404
from the guestbook on this localhost is expected and does not diagnose the
serverless handler.

There is no build step. If an old image persists, bump the `?v=` cache token in
`before-times.html` and reload.

## Important files

```text
before-times.html
  Lobby markup, layered image elements, cache tokens, panels.

before-times.css
  Layer placement, glow spill, hover motion, activation animation, hotspots.

before-times.js
  Panel behavior, delayed doorway activation, radio/bell actions, guestbook
  loading/submission, Vimeo cueing, Tape 25 audio, and production-loop scheduling.

api/before-times-guestbook.js
  Vercel serverless ledger API, KV persistence, validation, rate limiting, and
  authenticated deletion.

images/before-times/lobby-v1.webp
  Original flattened 1672×941 lobby art. Keep this unchanged as the source of truth.

images/before-times/layers/lobby-clean-v4.png
images/before-times/layers/lobby-clean-v4.webp
  Base lobby plate. V3 removes the doors; V4 adds the broad floor repair while
  deliberately retaining the bulletin, newsstand, wall displays, camera
  station, and guestbook.

images/before-times/layers/lobby-clean-v4-newsstand-v1.png
images/before-times/layers/lobby-clean-v4-newsstand-v1.webp
  Base plate for the current runtime lobby. It applies only the localized, feathered
  upper-silhouette repair over V4 so the independent `newsstand-v2` sprite has
  no doubled diagonal rod or original top plane peeking behind it. The baked
  cabinet body, base, and grounding shadow remain; removing them made the
  dispenser look pulled from the wall and reintroduced generated floor shadows.
  V5 remains an experimental all-props-removed plate and is not used because
  its multiple generated repair regions read as choppy.

images/before-times/layers/lobby-clean-v4-newsstand-guestbook-v3.{png,webp}
  Current runtime lobby plate. It derives from the newsstand V1 base and repairs
  only the original full-size book footprint. The expanded feathered mask takes
  the complete tabletop and rim repair from the clean full-scene donor, covering
  the old contact shadow without introducing the V2 clone strip's false edge.

images/before-times/layers/door-*-v1.png
  Full-resolution transparent masters for the four career door assemblies.

images/before-times/layers/door-*-v1.webp
  Compressed runtime versions used by the page.

images/before-times/layers/portal-angle-v1.png
images/before-times/layers/portal-angle-v1.webp
  Generated return portal already painted at the room angle.

images/before-times/layers/{bell,radio,bulletin,newsstand,photo-display,camera}.{png,webp}
  Original-pixel object layers.

images/before-times/layers/bell-v4.png
images/before-times/layers/bell-v4.webp
  Current cohesive generated desk bell with one clean plunger.

images/before-times/layers/exit-button-v3.png
  Current rough dry-brush X control. V2 is the cleaner superseded iteration.

tools/before-times-clean-patches/*.webp
  Generated wall/floor repair patches used to rebuild the clean plate.

tools/build-before-times-layers.py
  Deterministic masks/compositing for the old portal, all doors, the broad
  floor repair, all extracted props, the newsstand-only runtime plate, and
  `lobby-clean-v5.png`.

images/before-times/absurd-alchemy-concept-v1.png
  Locked full-room concept render and source of truth for prop placement.

images/before-times/absurd-alchemy-clean-v1.{png,webp}
  Master and runtime room plates with only the hero CRT glass cleaned.

images/before-times/absurd-alchemy-clean-v3.{png,webp}
  Previous room plate. It starts from V2 and uses only the expanded,
  feathered production-camera matte to composite the generated empty-shelf
  repair; the rest of the room remains pixel-identical to V2.

images/before-times/absurd-alchemy-clean-v4.{png,webp}
  Current runtime room plate. It starts from V3 and applies the localized
  generated teal wall/floor repair only beneath the extracted exit doorway.

images/before-times/absurd-alchemy-clean-v4-no-pen.{png,webp}
  Full-room post-pickup plate. It matches V4 but removes the fountain pen from
  the left script stack. The page swaps to this plate whenever persisted pen
  state says the pen is in inventory or on the guest book.

images/before-times/layers/alchemy-exit-door-lobby-v2.{png,webp}
  Superseded full-scene reverse-clapboard exit sprite.

images/before-times/layers/alchemy-exit-door-lobby-v3.{png,webp}
  Current full-scene transparent exit sprite. The visible lobby and threshold
  retain original concept pixels; the inside-facing surround uses blackened
  steel, oxblood acoustic padding, worn brass trim, and three amber utility
  lamps. The combined silhouette remains one hoverable layer.

tools/before-times-clean-patches/alchemy-exit-door-interior-frame-source-v1.png
  Generated source render for the V3 inside-facing cinema surround. The exit
  builder masks out all regenerated lobby/room pixels and perspective-warps
  only the lintel and jambs into the locked full-room composition.

images/before-times/layers/alchemy-hand-logo-v1.{png,webp}
  Full-scene transparent hand-emblem interaction layer, aligned to the repaired
  case top. The original production-camera layer remains as the deterministic
  removal mask but is no longer loaded by the page.

images/before-times/inventory/fountain-pen-{chroma-,}v1.png
  Generated black-and-gold pen sprite. The chroma source is retained so the
  transparent runtime PNG can be rebuilt with the imagegen chroma-key helper.

images/before-times/layers/guestbook-no-pen-v4.{png,webp}
  Superseded surgical pen-free replacement. The original guestbook crop is
  the base, and only pixels inside the pen/contact-shadow silhouette come from
  the aligned clean-page donor. Book geometry, handwriting outside the pen,
  binding, page edges, desk, floor, chair fragment, and complete plaque remain
  original. Keep only as a record of the earlier patch approach.

images/before-times/layers/guestbook-fresh-v1.{png,webp}
images/before-times/layers/guestbook-placed-pen-v1.{png,webp}
  Current full-canvas interaction layers. The fresh isolated ledger is rendered
  at roughly two-thirds of the earlier book size and sits lower/right, toward
  the brass plaque. The placed pen is a separate, proportionally scaled overlay
  so both layers can move together.

images/before-times/layers/alchemy-pen-free-patch-v4.{png,webp}
  Superseded 340 × 190 single-sheet replacement retained as a record of the
  earlier localized repair approach. The runtime now swaps the complete room
  plate after pickup.

images/before-times/production/*
  Sagan thumbnail and the two current silent production-monitor MP4 loops.

tools/build-absurd-alchemy-plate.py
  Deterministically composites the dark-screen donor crop into the locked
  concept and writes both the PNG master and WebP runtime plate.

tools/build-absurd-alchemy-hand-logo.py
  Builds the localized V3 camera-removal plate, sizes and places the isolated
  generated hand master, writes the runtime PNG/WebP layer, and emits a preview.

tools/build-absurd-alchemy-exit-door.py
  Builds the combined exit sprite from original lobby pixels plus the
  generated inside-facing frame, applies the localized no-door repair to V3,
  and writes the V4 plate plus runtime WebP.

tools/build-guestbook-no-pen.py
  Composites a narrow generated ruled-paper donor into the locked guest-book
  crop with a feathered pen silhouette and writes the PNG/WebP clean layer.

tools/build-fresh-guestbook.py
  Builds the current empty-desk V3 runtime plate, fits the fresh book, and
  creates the proportional placed-pen overlay. Run this after rebuilding the
  newsstand V1 base plate.

tools/build-alchemy-pen-patch.py
  Builds the localized script-stack repair from the generated donor and locked
  room pixels, then writes the PNG/WebP runtime patch.

tools/before-times-clean-patches/alchemy-hero-screen-dark-v1.webp
  Donor crop used by the room-plate builder. Keep this with the script.

tools/before-times-clean-patches/alchemy-no-production-camera-v1.png
tools/before-times-clean-patches/alchemy-hand-logo-{chroma,isolated}-v1.png
  Generated empty-shelf repair and preserved hand-emblem masters used by the
  hand-logo builder. Keep the chroma source so the alpha can be rebuilt.

tools/before-times-clean-patches/alchemy-no-exit-door-v1.png
  Generated teal wall/floor repair used only beneath the combined exit sprite.

tools/before-times-clean-patches/guestbook-no-pen-generated-v1.png
  Generated pen-free book edit retained as the ruled-paper donor for the
  localized guest-book clean-layer builder.

tools/before-times-clean-patches/guestbook-no-pen-generated-v2.png
  Current coherent full-crop donor. It keeps the complete plaque inside frame
  and replaces the entire right page, avoiding the old pen-shaped smudge.

tools/before-times-clean-patches/guestbook-empty-desk-fullscene-v3.png
  Full-scene precise-object-edit donor used only inside the original book mask.
  It supplies the desk geometry hidden behind the old book.

tools/before-times-clean-patches/guestbook-fresh-{chroma,isolated}-v1.png
  Preserved generated master and chroma-removed source for the current fresh
  pen-free book layer.

tools/before-times-clean-patches/alchemy-pen-free-generated-v2.png
  Generated pen-free script-paper edit retained as the texture donor for the
  localized Alchemy clean-layer builder.

tools/before-times-clean-patches/alchemy-paper-single-sheet-generated-v3.png
  Generated single-sheet crop with the lower duplicate-pad wedge removed. This
  is the current donor used by the Alchemy clean-layer builder.
```

## The rule that solved the perspective problem

Do not extract a flattened doorway and then try to correct it with CSS warping.
Do not ask an image model to make a clean front-facing door and plan to distort
it later. Both approaches fight the room's hand-drawn perspective and make the
asset look pasted on.

Instead, render each complete architectural assembly at its final installed
angle. Give the generator both:

1. The full lobby image for style, lighting, and scene context.
2. A tight crop of the original doorway for exact geometry and perspective.

The prompt must explicitly say:

```text
Preserve the exact installed room perspective, trapezoidal geometry,
foreshortening, proportions, and irregular asymmetry in the close-up.
Do not straighten, front-correct, make orthographic, or symmetrize it.
Render the full interior, physical frame, arch, and crest as one asset.
No surrounding wall, floor, shadow, ambient light spill, text, or adjacent objects.
```

This wording was the turning point. The return portal and four career doors all
use this approach.

## Generation-budget discipline

Image generation is the expensive part. Next time:

- Never regenerate an existing master just to change its size, placement,
  transparency, compression, glow, or motion. Those are deterministic edits.
- Make one generation call per genuinely new visual asset.
- Use the full room plus one tight crop as references rather than trying several
  vague prompt variations.
- Inspect the first result before generating a replacement. A few-percent CSS
  placement adjustment is far cheaper and usually more faithful.
- Preserve every generated PNG master. Runtime WebP files can always be rebuilt.
- Keep ambient glow and cast light out of the generated sprite. Add them in CSS,
  where they remain adjustable and cannot be cropped.

## Transparency lessons

Generating directly to alpha was less predictable than generating on a flat
chroma background and removing it afterward.

The successful sprite prompt used a perfectly flat `#ff00ff` background with no
shadow or glow outside the physical object. Chroma removal used:

```text
/Users/cwilke/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py
```

For Alchemy, Games, and Content, a soft matte with a sampled border worked well:

```bash
--auto-key border --soft-matte --transparent-threshold 12 \
--opaque-threshold 220 --despill
```

The Knowledge Maze is purple, so a broad magenta soft matte made much of the
actual doorway partially transparent. It required a hard key instead:

```bash
--auto-key border --tolerance 55 --edge-feather 0.6 --despill
```

Always inspect the transparent PNG on a dark background and check the reported
partially-transparent pixel count. A huge partial count is a warning that the
matte is eating the asset's real colors.

## Background-repair pipeline

Moving a sprite reveals whatever is behind it. Leaving the original flattened
door in the lobby therefore creates an obvious duplicate.

The successful pipeline is:

1. Generate a clean wall/floor version of the tight doorway crop using a
   precise-object-edit prompt.
2. Preserve nearby floor geometry, ceiling trim, furniture edges, and adjacent
   door/light spill in that patch.
3. Save the patch under `tools/before-times-clean-patches/`.
4. Composite it into the original lobby through a deliberately limited,
   feathered mask in `tools/build-before-times-layers.py`.
5. Put the generated transparent doorway over the repaired region.

The background patch does not need to be perfect everywhere. Only the masked
area matters, and the doorway covers most seams at rest. Avoid replacing a full
large crop when a shaped mask will preserve more original art.

For the smaller props, one full-room precise-object-edit pass removed all five
prop groups at once. That experimental room is stored as
`tools/before-times-clean-patches/props-v1.*`, but it is not used wholesale by
the live page. Combining unrelated wall, floor, and desk repairs introduced
visible texture seams. The base V4 plate keeps the original props beneath pixel-exact
effect layers; those overlays animate through light and color without shifting
far enough to expose a duplicate. The `lobby-clean-v4-newsstand-v1`
base is the newsstand exception: it uses the generated empty-room source only
through a narrow upper-silhouette mask because the replacement cabinet's rod
and top plane did not align perfectly with the baked original. The cabinet
body, base, grounding shadow, and remaining props stay untouched.

The active V4 floor now uses `tools/before-times-clean-patches/floor-v2.*`.
This is a neutral continuous-tile repaint with the triangular yellow beam,
clipped shadows, and colored streaks removed. Do not restore the broad rod-area
cutout in `paint_floor_repair`; that cutout was preserving the old yellow wedge.
The generated plate preserved the desk, chair, newsstand, and camera pedestal,
so the floor mask now runs continuously to the bottom of the scene with no
foreground exclusion holes. Reintroducing those holes creates old/new floor
seams along the left and right edges.

The original background also had an info medallion baked into the center of
the inventory divider. `medallion-v1.*` is a tiny generated repair crop that
continues the navy band and copper trim through that area. The builder applies
it with a local feathered mask; do not replace the full room with the generated
source edit, since only this crop is meant to be used.

The first radio extraction left its diagonal antenna and low body silhouette
embedded behind the independent radio sprite. `radio-ghost-v1.*` is the clean
floor/desk repair crop for that area. The builder uses separate shaped masks
for the antenna and body while excluding the central chair.

The small-prop alpha mattes are not clean enough for large CSS drop shadows.
Those shadows illuminate retained desk/floor pixels and read as cyan blocks.
Keep prop hover effects to restrained brightness/saturation until the props get
true per-object background repairs and cleaner mattes.

The radio is the exception only through a separate `.bt-radio-aura` layer. Its
hover treatment is now a soft elliptical mint-and-amber pool centered over the
radio face with `mix-blend-mode: screen`; the old diagonal antenna trace was
removed because it read as a stray stripe. The same aura strengthens when the
radio is a cassette drop target, without outlining the dirty matte or being
clipped by the radio image bounds. Do not fold the base effect back into an
image `drop-shadow()`.

The live bell uses `images/before-times/layers/bell-v4.*`, a fresh generated
hand-inked brass sprite with a single cohesive knob and stem. Its chroma-key
background and stray interior spindle were removed before sizing it to the
existing 140px sprite box. It has no baked desk pixels or navy oval and retains
only a tiny CSS contact shadow. The older `bell.*` remains the extraction/build
source but should not be restored to the page unless its oversized shadow matte
is fixed.

The live newsstand similarly uses `images/before-times/layers/newsstand-v2.*`.
It preserves the full cabinet, top rod, side cable, and newspaper face without
the wall slivers and large floor wedge carried by the older extracted matte.
Its matching base background is `lobby-clean-v4-newsstand-v1.*`; the live plate
is the guestbook V3 derivative. Do not restore the plain V4 plate unless the
doubled handle and top plane are intentionally wanted.

Running the helper rebuilds the PNG clean plate:

```bash
python3 tools/build-before-times-layers.py
```

It does not currently rebuild the runtime WebPs or the separated guestbook.
Afterward rebuild the live plate and guestbook layers with:

```bash
python3 tools/build-fresh-guestbook.py
```

## Geometry and placement

The lobby source coordinate system is always `1672 × 941`. Hotspots are
percentage-positioned in that space. Door images are absolutely positioned
inside those hotspots.

Current generated master dimensions:

| Asset | Master size |
| --- | ---: |
| Return portal | 1011 × 1556 |
| Alchemy | 989 × 1590 |
| Games | 1043 × 1508 |
| Content | 984 × 1599 |
| Knowledge Maze | 936 × 1680 |

Current fitted image placement inside each hotspot:

| Layer | Top | Left | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| Alchemy | -5.31% | -5.28% | 107.93% | 113.78% |
| Games | -0.45% | -11.64% | 125.67% | 103.67% |
| Content | -3.4% | -4.26% | 114.73% | 113% |
| Knowledge Maze | -3.65% | -9.14% | 104.25% | 110.75% |
| Return portal | 9.39% | -13.27% | 121.95% | 103.27% |

These values already produce a convincing rest-state fit. Tune them in very
small increments. Do not introduce a CSS perspective transform unless the
underlying generated art is actually wrong.

If fitting a future generated sprite mathematically, use its alpha bounding box
rather than the full padded canvas. Fit that visible box to the intended lobby
coordinates, then convert the resulting element rectangle into percentages of
the hotspot rectangle.

## Glow and motion rules

The object image should contain only the physical assembly. Light spill belongs
to the separate `.bt-door-light` element inside the hotspot. Its two layers
separate the opening aura from the floor pool, which prevents one large blurred
rectangle from reading as the light source.

This avoids the first major visual failure: a rectangular sprite boundary
cutting through the portal glow.

The relevant CSS contracts are:

- `.bt-layered-hotspot`: removes the generic rectangular hotspot treatment.
- `.bt-layered-doorway`: shared career-door glow and motion behavior.
- `.bt-door-light::before`: narrow light around the opening.
- `.bt-door-light::after`: low elliptical pool on the floor.
- `.bt-object-layer-*`: exact asset placement.
- Door-specific `--bt-door-light-rgb`, rest opacity, and hover opacity values.
- `.is-activating`: short pre-panel movement applied by JavaScript.

Keep hover motion subtle. Large scaling exposes more repaired background and
makes perspective differences easier to notice. The current lift/breathe effect
is intentionally only a few percent.

The reduced-motion media rule already collapses animation and transitions.

## Wrong turns to avoid

- Do not use a rectangular crop as the visible sprite. It cuts through light
  spill and surrounding wall texture.
- Do not manually warp a front-facing generated door into place. The hand-drawn
  linework gives the distortion away.
- Do not keep the original flattened door underneath a moving layer.
- Do not include wall, floor, ambient glow, or cast shadow in an isolated sprite.
- Do not apply a generous soft chroma matte to an asset whose palette resembles
  the key color.
- Do not judge the result from `file://`; use localhost.
- Do not overcorrect charming asymmetry. The irregular geometry is part of why
  the room feels illustrated rather than assembled.
- Do not regenerate because of a placement issue. Fix the percentages first.
- Do not manually reconstruct a tiny malformed generated object when a complete
  cohesive redraw is cheaper and cleaner.
- Do not judge transparent edges without compositing the asset over an opaque
  background.
- Do not assume the replacement icon's bounds cover the baked control beneath
  it; mask the source silhouette.
- Do not use the plain static server to validate a Vercel `/api` route.

## Game Development room

The Game Development doorway now enters a full-width illustrated studio at
`#game-development`. Its runtime plate is
`images/before-times/games/game-development-room-v2-no-lamp.webp` (`1672 × 941`),
with the PNG master beside it. The original v1 plate remains the rebuild source.
The baked desk lamp was removed from v2 so the transparent foreground lamp is
the only visible copy. Rebuild the clean plate with
`tools/build-game-development-no-lamp.py`; its localized repair input and
generated repair live in `tools/before-times-clean-patches/`. The eight game
cases, writing binder, mocap mannequin,
dual-monitor workstation, and the reverse/inside view of the Game Development
door frame are intentionally baked into that plate. Interactive HTML surfaces
are mapped over the two monitor screens and transparent hotspots sit over the
cases and props.

`GAME_PROJECTS` in `before-times.js` is the source of truth for project title,
year, credited role, official YouTube trailer, and per-project monitor/case
glow. The current cases are:

- Quest for Booty (`Wuql7jRIn6Y`) — Quality Assurance.
- Resistance 2 (`hnk_zWmBK6Y`, Insomniac Games' “Last Hours” trailer) —
  Quality Assurance + Cinematic Support. The earlier PlayStation E3 upload was
  replaced because its age gate prevents embedded playback.
- A Crack in Time (`trDZcBShFl0`) — Cinematic Scripter.
- All 4 One (`D_7W4-9Rfsc`) — Cinematic Scripter.
- Resistance 3 (`3t8ZoFCGfyQ`) — Cinematic Scripter.
- Full Frontal Assault (`ZY1aeurQ2z4`) — Cinematic Scripter.
- Fuse (`4JyokG3aHVo`) — Cinematic Scripter.
- Into the Nexus (`4RZpGvGgdZA`) — Cinematic Scripter.

Selecting a case updates the left HTML monitor with the title, year, and role,
then cues the trailer through the shared lazily loaded YouTube IFrame API on the
right monitor. Only one player exists. Room exit pauses it, and a visible
Press play fallback handles browsers that block autoplay. The iframe title is
also updated for the selected trailer.

The left monitor is a compact project dossier rather than a sparse terminal:
project title and year are the visual anchors, the current case is numbered,
each credit gets its own numbered high-contrast row, and the footer reports the
trailer lifecycle (linking, rolling, paused, or complete). Keep the decorative
archive labels quiet; title, year, and credits must remain the readable layer.
Both monitor textures use true four-point projective transforms inside exact
four-corner outer clips. `createRectangleToQuadMatrix()` maps each rectangular
source plane directly to the accepted `tl`, `tr`, `br`, `bl` quadrilateral and
emits a CSS `matrix3d()`; a `ResizeObserver` recalculates it with the rendered
screen dimensions. The right video plane remains 16:9 before projection. The
outer containers deliberately have no CSS transform: the measured bounding
boxes and local clip polygons are the authoritative bezel fit. Do not
reintroduce hand-tuned `rotateY`, `rotateZ`, outer rotation, or iframe overscan.
The left screen's outer clip is deliberately asymmetric: its near-left edge is
taller and tucked inside the frame, while the far-right edge is substantially
shorter at the center hinge. A transparent foreground lamp now provides the
physical occlusion over that screen. Runtime asset:
`images/before-times/games/game-development-lamp-v1.webp`; PNG master beside it;
flat-key generation source at
`tools/before-times-clean-patches/game-development-lamp-chroma-v1.png`. The lamp
must remain above the screen/glass layers (`z-index: 6`) and non-interactive.

For exact monitor-edge calibration, open
`/before-times.html?calibrate=monitors#game-development`. The calibration-only
overlay exposes four draggable handles per monitor, draws the resulting
quadrilaterals, autosaves them under `bt-monitor-calibration-v1`, and copies the
two sets of JSON coordinates for handoff. Arrow keys nudge the focused handle by
`0.25%`; Shift + Arrow uses `0.1%`. This overlay is deliberately a measuring
tool only: it does not alter the normal room or apply the exported coordinates
to the CSS surface mappings until they are reviewed.

The July 22 calibration pass added translucent targeting-reticle handles with
an exact center dot and crosshair, so the painted corner remains visible while
dragging. `Left guides` and `Right guides` independently hide each monitor's
four handles and SVG polygon. `Screen overlays` hides both runtime screen
surfaces to expose the painted room plate while leaving the guides active. All
three visibility controls are calibration-only and never alter saved points.

The accepted July 22 calibration is applied to the CSS and stored as the Reset
default: left `TL [20.3,28.35]`, `TR [37.88,29.41]`,
`BR [37.88,48.19]`, `BL [20.29,50.55]`; right `TL [39.01,29.74]`,
`TR [55.16,29.72]`, `BR [55.26,47.63]`, `BL [38.97,47.92]`. These are scene
percentages at the inside corners of the painted glass.

### Reusable four-corner screen calibration

Use this same pattern for any future Before Times screen, frame, poster, or
projected surface that needs to follow illustrated perspective:

1. Put an opt-in calibration layer over the full scene with an SVG
   `viewBox="0 0 100 100"` and four draggable handles ordered `tl`, `tr`, `br`,
   `bl` for each surface.
2. Convert each pointer position through the scene's `getBoundingClientRect()`
   and store it as `[xPercent, yPercent]`. Draw the SVG polygon live, persist a
   versioned JSON object in local storage, and provide a one-click copy action.
3. Treat the copied points as the authoritative inside corners. Compute the
   outer rectangle as `left = min(x)`, `top = min(y)`,
   `width = max(x) - min(x)`, and `height = max(y) - min(y)`.
4. Convert every scene point into the container's local clip coordinate with
   `localX = (x - left) / width * 100` and
   `localY = (y - top) / height * 100`, then use those four local pairs in a
   CSS `clip-path: polygon(...)`.
5. Do not transform the outer calibrated container after this conversion; that
   would move the measured corners. Put perspective, rotation, and overscan on
   an inner content plane instead. Keep any foreground occluders above both.
6. Preserve the accepted JSON as the calibration Reset default and document the
   query parameter, storage key, and final points here for reproducibility.

The current `?calibrate=monitors` implementation is the reference version of
this tool. Generalize its data attributes and storage key when another room
needs multiple independently calibrated surfaces.

The selected case uses the Content Factory article treatment: an inset radial
`::before` spotlight with screen blending, no border, and no detached outer
glow. It becomes persistent when selected, breathes while the trailer plays,
and settles to a lower intensity when paused. Each case supplies its own glow
RGB so the light relates to the cover instead of washing every case purple.

The binder remains baked into the room plate and now opens a dedicated
read-only Game-Writing Terminal rather than the generic Game Development panel.
Its six recovered records live in `before-times-game-binder.js`: the Dark Eden
spec teaser, Kulture Captain Peters journal, FUSE Xenotech intel, FUSE
Interrogation scene, FUSE Inner Sanctum scene, and the 2012 Insomniac
self-review. Source spelling is preserved; the old personal contact information
on the Dark Eden title page is intentionally not exposed. The modal supports
click/tap plus Arrow Up/Down, Home, and End navigation, uses a horizontal file
rail on narrow screens, and gives screenplay, journal, intel, and prose records
their own readable treatments inside the CRT-terminal shell. The mocap
mannequin currently reports that its tape source is still missing; it is already
a dedicated hotspot so the recovered video can be mapped there without changing
the room geometry. The right-side reverse door and the fixed mobile Lobby button
both return to the lobby and pause the active trailer.

### The Boat cassette and radio unlock (July 22, 2026)

The Game Development room now hides a small collectible hand-labeled cassette
on the near-left corner of the front-right desk. The interactive sprite is
`images/before-times/inventory/the-boat-cassette-v1.webp`; the transparent PNG
master lives beside it and the flat-green generation source is
`tools/before-times-clean-patches/the-boat-cassette-chroma-v1.png`. Its runtime
position is intentionally an HTML layer rather than a baked plate edit, so the
same asset can animate into inventory and disappear cleanly after collection.

The cassette shares `bt-inventory-v1` through the `boatCassette` boolean and
`boatCassetteLocation`, which moves from `room` to `inventory` to `radio`.
Collecting it leaves the lobby radio locked and shows the cassette in both the
drawer and the centered fourth lobby inventory bay. Mouse and touch visitors
can drag it onto the radio; click/keyboard visitors can select the cassette and
then activate the radio. Inserting it removes the cassette from inventory,
marks the radio as unlocked, and opens the dedicated receiver dialog. Older
session records with only `boatCassette: true` migrate to the inventory step so
the insertion can still be played.

The Boat player uses the existing album-player vocabulary: a live mint CRT
oscilloscope, persistent title/date glass copy, five-track list, previous/play/
next transport, seek rail, elapsed/duration readout, autoplay advance, keyboard
controls, and a single shared audio element. Audio remains user-initiated. The
Web Audio analyser is created lazily on the first explicit play action, and the
dialog pauses playback when it closes.

The untouched archival MP3s remain in `bt-assets/radio/`. Deployable 96 kbps
copies live in `audio/before-times/the-boat/`; each individual runtime file is
below GitHub's 100 MB file limit. The runtime order is Walken on Water,
Elections, Robotic Brayton, Burnt Sienna, then Viva Variety.

## Content Factory room and quarter path

The Content Factory is now a navigable second room at `#content-factory`.
The lobby door enters the room directly and no longer carries the
under-construction sandwich board. The room is back on its original static plate,
`images/before-times/content-factory-room-v1.webp` (`1672 × 941`), with the
control console, foreground conveyor, and rocket article baked into the image.
The reverse lobby view, partial newspaper dispenser, and desk bell remain
visible through the open doorway. The attempted console/conveyor isolation was
not adopted; no replacement visual layers are loaded.

The room collectible and all inventory representations use the face-on
`images/before-times/inventory/content-quarter-doc-v1.webp` runtime asset: a
fictional silver novelty coin embossed with Doc's portrait and a paw-print mint
mark. The transparent PNG is its master; the flat-green generation source lives
at `tools/before-times-clean-patches/content-quarter-doc-chroma-v1.png`. In the
room, slight horizontal compression makes the coin look leaned against the
lower-right machinery inside the hanging lamp's pool of light. The earlier
realistic V1 and edge-only V2 assets remain available but are no longer loaded.

Quarter state shares the existing `bt-inventory-v1` session-storage record:
`contentQuarter` tracks whether it has been collected, and
`contentQuarterLocation` moves from `room` to `inventory` to `newsstand`. Once
inserted, the quarter is consumed for the session, the lobby dispenser changes
to its unlocked state, and the student press panel opens. Mouse drag, touch
drag, click selection, and keyboard activation all use the same transition.

End-to-end local verification completed: enter the room, collect the quarter,
return through the Content Factory door, select the inventory quarter, unlock
the newspaper dispenser, and open the student press panel. The browser reported
no console errors or error overlays.

### The card catalog (July 19, 2026)

The output archive now has a second tier below the 13 restored pieces: a card
catalog grouped by client. `contentCatalog` in `before-times-archive.js` holds
eight drawer entries (client, years, piece count, formats, summary, sample
titles, and `restored` ids that cross-link to full pieces). The counts were
taken from `bt-assets/ContentWritingClippings`, deduplicated across formats
and the Review-Weekly/EquateMedia overlap: 195 pieces total. GoDaddy's five
help-center rewrites were deliberately excluded; that material belongs to The
Knowledge Maze, not the Content Factory.

The room now carries nine article hotspots on the conveyor papers (up from
three): Solar, Metrics, and Watcher in the foreground, plus Urban Climb,
40-Hour Workweek, Google Glass, Hip Neighborhood Bubble, Trimming the Fringe,
and DeepMind & DeepDream matched to mid-ground papers whose printed images fit
each piece. The six new ones use `.bt-content-hotspot-article-far`, which
floats the label chip above the paper instead of inside the small hotspot.
Article highlight is an inner spotlight: a `::before` radial layer with
`mix-blend-mode: screen` fading in on hover, no border or outer glow. The
archive dialog highlights (index items, catalog tabs, restored links) use a
soft layered glow instead of the earlier solid-indigo hard-shadow flip.

In `before-times.js`, `renderArchiveIndex` renders both lists (drawer tabs are
numbered D1–D8 and use `.bt-archive-catalog-tab`), `renderCatalogCard` renders
a drawer in the detail pane, and the active index item is scrolled into view
after every render. The archive intro line and the room panel facts compute or
state the logged totals; update `contentCatalog` counts if clippings are added.
Promoting a piece to full restoration means adding it to `content` and listing
its id in the owning drawer's `restored` array.

## Knowledge Maze room and retrieval path

The Knowledge Maze is now a navigable fourth room at `#knowledge-maze`. Its
contained runtime plate is
`images/before-times/knowledge-maze/knowledge-maze-contained-v3.webp`
(`1672 × 941`); the PNG beside it is the generated master. The room uses a
large wall-mounted circular maze, paired blank document panels, a three-control
voice-and-tone apparatus, an impact gauge, and a foreground terminal whose
screen is deliberately empty in the raster so the live HTML interface stays
sharp and accessible.

The two formerly blank document panels now hold separate image-generated K-27
field-manual artifacts. `knowledge-answer-exists-v1.webp` is a dense, tangled
archive dossier; `knowledge-answer-arrives-v1.webp` resolves the same material
into WHO, GOAL, FRICTION, and NEXT STEP. Their PNG masters remain beside the
runtime WebPs. Both pages are additive scene layers, so the before dossier can
jitter/search independently while the after page breathes and lifts toward the
terminal. Selecting the paired panels opens a wider evidence viewer with the
two high-resolution pages side by side; each links to its full `1024 × 1536`
PNG. On phones the pair becomes a two-stop horizontal swipe rail without making
the page itself overflow.

The two room-scale documents and the main terminal use the same
rectangle-to-quad `matrix3d` homography as the Game Development monitors. Their
authoritative four-corner defaults are `DOCUMENT_CALIBRATION_DEFAULTS` in
`before-times.js`; local working points persist under
`bt-document-calibration-v1`. Open
`/before-times.html?calibrate=documents#knowledge-maze` to tune all three
surfaces. The mode provides twelve draggable handles, arrow-key nudging
(`0.25%`, or `0.1%` while holding Shift), independent guide toggles, a document
art visibility toggle, reset, and copyable JSON. All three surfaces reproject
live while handles move. Each document keeps its ambient animation on an inner
layer, so calibration transforms and motion do not fight over the same CSS
`transform` property. The terminal's positioning surface carries its calibration
transform while the child interface retains its searching animation. The
child's `overflow: hidden` and border radius preserve the rounded CRT corners
without clipping the calibrated quad into sharp corners.

The far-right reverse doorway was corrected as a spatially distinct sightline
from Door 04. It now looks diagonally across the lobby: the back edge of the
reception desk and archive chair occupy the near field, the wooden newspaper
dispenser remains visible farther across the room, and a narrow bulletin-board
wall fragment establishes depth. Do not restore the generic desk-and-bell view
used by earlier room concepts or isolate the dispenser in an empty corridor.

Three room hotspots supply the early assistance prototype with the context
missing from `HELP ME WITH MY WEBSITE`:

- The voice-and-tone controls recover `WHO // A NEW BUSINESS OWNER`.
- The before/after documentation panels recover
  `GOAL // HELP CUSTOMERS FIND THE BUSINESS`.
- The impact gauge recovers `FRICTION // UNFAMILIAR SEO LANGUAGE` and explains
  the 93% customer-care-escalation reduction.

Every recovered piece now advances a matched image-generated background plate:
`knowledge-maze-crack-stage-{1,2,3}-v1.webp`. The sequence moves from a physical
hairline fissure to branching ring damage to a heavily separated pre-breach
state. The SVG fractures are gone entirely: the rupture is sold physically
instead, with a short decaying room shake, a mint light bloom that flares out
of the fissure, and twelve soft CSS smoke puffs (plus the original debris
chips) that escape along the crack line. All rupture animations are wrapped in
`prefers-reduced-motion: no-preference`, and every smoke delay + duration
resolves inside the 1350ms `is-rupturing` window so nothing is cut off. After
all three pieces are present, `Ask a better question` starts the rupture. The
final plate crossfades to
`images/before-times/knowledge-maze/knowledge-maze-breached-v3.webp`; its dark
aperture is filled by a muted, looping six-second screen recording of the real
present-day homepage at a `390 × 844` phone viewport. The viewport remains
locked at the top of the page and captures only the site's native ambient
animation, making the breach feel like the present is alive just beyond the
wall without turning the portal into a scrolling demo. The optimized H.264 recording is
`images/before-times/knowledge-maze/present-site-peek-v1.mp4`; its reduced-motion
and loading fallback is `present-site-peek-poster-v1.webp`. The video pauses
outside the room and whenever reduced motion is requested. The portal goes to
`/#portfolio`, so the destination is the real present rather than an abstract
sci-fi landscape.

The recording is reproducible: run the local site on port 8080, then run
`node tools/capture-knowledge-maze-present.mjs`. The script records 96 real
Chrome frames at 16 fps, encodes the MP4 with ffmpeg, and builds the poster with
cwebp. The four image-generated full-room sources and deterministic runtime
composites are preserved in the same asset directory.
`tools/build-knowledge-maze-states.py` uses a feathered maze-wall mask over the
locked contained plate, so the terminal, evidence stations, furniture, and
reverse-lobby doorway remain pixel-identical across all five states. Run it
with the bundled workspace Python (the system Python may not include Pillow),
then rebuild the four WebPs with `cwebp` if a source changes.

Puzzle state lives in session storage under `bt-knowledge-v1` as a recovered
context-key array plus `breached`. Once solved, the room reopens in its breached
state and the lobby's circular Knowledge Maze medallion keeps a mint vertical
scar for the session. This is intentionally not a security or progress gate:
the normal lobby doorway and the permanent Return portal remain available.

The exact built-in image-generation prompts, including the three crack stages,
broken doorway, and both K-27 documents, are recorded in
`tools/knowledge-maze-imagegen-prompts.md`. The terminal, present-day portal,
rupture shake/bloom/smoke/debris, and lobby scar remain code-native layers.
Tune placement, copy, and timing in HTML/CSS/JS; rebuild the masked plates only
when changing the physical maze damage.

## Verification completed this session

- The page was repeatedly tested at `http://localhost:8080/before-times.html`.
- The Knowledge Maze was tested from a fresh direct `#knowledge-maze` load:
  all three evidence dialogs opened, context advanced from 0/3 to 3/3, the
  rupture persisted in session storage, the live present-day portal rendered,
  and activating it landed on `/#portfolio` with the current Charles Wilke
  header and portfolio present. Returning through the reverse door restored the
  lobby and left the maze-medallion scar visible. The same solved room was
  checked at a 390×844 mobile viewport on the existing 1000px horizontal stage;
  the room remained swipeable and the fixed Lobby control remained available.
  The recorded portal was then rechecked in Chrome: the `390 × 844` H.264 source
  reached ready state 4, advanced during normal playback, paused under reduced
  motion, and still navigated to `/#portfolio`. No runtime exceptions or error
  overlays were detected.
- The Game Development room was tested from a fresh direct hash load. All eight
  case hotspots selected the expected title, year, role, and case state; live
  YouTube playback rendered on the right monitor; the binder, mocap status, and
  reverse door were exercised; and the browser reported no console errors or
  error overlays. A binder/case hotspot overlap found during this pass was fixed
  by keeping the case layer above the foreground prop hotspots.
- The rebuilt game-writing binder was opened from its existing baked-book
  hotspot at desktop and 390px phone widths. All six records rendered, Arrow
  Down changed the selected file and detail in sync, the phone file rail became
  the only horizontal scroller, the page itself did not overflow, and the live
  browser reported no console errors.
- The dossier redesign was visually checked with Resistance 2's two credit rows
  and Full Frontal Assault's wrapped title. Neither overflows the mapped screen.
  Insomniac's replacement Resistance 2 trailer played inside the monitor without
  the previous age-gate block, and the trailer lifecycle status updated correctly.
- The runtime plate loads from `lobby-clean-v4-newsstand-guestbook-v3.webp`
  with the localized newsstand-top and empty-desk repairs.
- Door rest states, adjusted frame positions, radio aura, guestbook hotspot,
  generated bell, rough X, and X backing mask were visually inspected in the
  live lobby.
- The bell interaction completed and reported its status without error.
- The generated bell and X assets returned HTTP 200 and retained transparent
  corners after their PNG/WebP export steps.
- The guestbook handler passed a local mocked POST→GET persistence round trip.
- The production guestbook route was confirmed absent (404) pending branch
  deployment; the existing production play API confirmed KV configuration is
  present.
- `node --check before-times.js` and `git diff --check` passed after the final
  asset and documentation edits.

## Branch and asset warning

This finishing pass belongs together on `codex/before-times`: the handoff,
HTML, CSS, JavaScript, layer builder, and the binary runtime assets
`bell-v4.*`, `exit-button-v2.png`, `exit-button-v3.png`, the fresh guestbook
layers, and `lobby-clean-v4-newsstand-guestbook-v3.*`. The PNG/WebP files are project sources, not
disposable temp output. Inspect `git status` before any cleanup, branch switch,
or broad rewrite.

## Good next steps

The door separation and lobby finishing problems are solved. The next session
should spend generation budget only on genuinely new interactive art. Safe
high-value work includes:

- Review the branch diff or existing PR and merge it when the lobby is ready to
  become public.
- After deployment, make one real guestbook test entry, confirm it appears on a
  fresh GET, and verify the admin-delete path before inviting public traffic.
- Decide whether immediate publication plus the current honeypot/rate limit is
  enough, or whether a moderation view or stronger abuse control is warranted.
- Tune each door's individual hover personality without changing its geometry.
- Add restrained sound cues synchronized to `.is-activating`.
- Separate remaining wall objects only when their intended motion requires it.
- Decide which doorway opens into a navigable second room first.
- Add a small visual regression capture for the lobby rest state and one hover
  state before making more positioning changes.
