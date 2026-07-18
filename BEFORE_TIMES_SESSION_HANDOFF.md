# Before Times — Session Handoff

Read this before doing more lobby image separation or interaction work. This is
the practical record of what exists, what worked, and what cost us time during
the July 16–17, 2026 sessions.

## Current state

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

The guestbook assembly stays baked into the runtime lobby plate. Its extracted
layer included a broad, jagged desk-and-floor matte that nicked the gold plaque,
so the page now places an invisible interactive hotspot over the clean baked
art instead of rendering the redundant `guestbook.webp` cutout.

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
  through reloads for that browser tab. A localized clean layer permanently
  masks the baked room pen after pickup. In the lobby, the guest book remains
  pen-free and locked while the pen is in inventory. Dragging the inventory pen
  onto the book places it there, removes it from inventory, reveals the baked
  guest-book pen, and opens the signing modal. Clicking or keyboard-activating
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

## July 16–17 finishing-pass notes

### Layer choices that held up

- Treat the lobby as a flattened illustration first, not a collection of
  separable objects. Before moving anything, inspect the background plate for
  baked duplicates, shadows, rods, and edge fragments.
- The guestbook should remain baked into the desk. Its cleanest interaction is
  an invisible semantic hotspot over the original art; the extracted guestbook
  layer carried a jagged desk/floor matte and nicked the gold plaque.
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
  Current runtime lobby plate. It applies only the localized, feathered
  upper-silhouette repair over V4 so the independent `newsstand-v2` sprite has
  no doubled diagonal rod or original top plane peeking behind it. The baked
  cabinet body, base, and grounding shadow remain; removing them made the
  dispenser look pulled from the wall and reintroduced generated floor shadows.
  V5 remains an experimental all-props-removed plate and is not used because
  its multiple generated repair regions read as choppy.

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

images/before-times/layers/alchemy-exit-door-lobby-v2.{png,webp}
  Full-scene transparent exit sprite. Original concept pixels preserve the
  installed reverse-view perspective; frame, threshold, reverse clapboard,
  and visible lobby interior share one alpha silhouette for hover lighting.

images/before-times/layers/alchemy-hand-logo-v1.{png,webp}
  Full-scene transparent hand-emblem interaction layer, aligned to the repaired
  case top. The original production-camera layer remains as the deterministic
  removal mask but is no longer loaded by the page.

images/before-times/inventory/fountain-pen-{chroma-,}v1.png
  Generated black-and-gold pen sprite. The chroma source is retained so the
  transparent runtime PNG can be rebuilt with the imagegen chroma-key helper.

images/before-times/layers/guestbook-no-pen-v4.{png,webp}
  Surgical pen-free lobby guestbook replacement. The original guestbook crop is
  the base, and only pixels inside the pen/contact-shadow silhouette come from
  the aligned clean-page donor. Book geometry, handwriting outside the pen,
  binding, page edges, desk, floor, chair fragment, and complete plaque remain
  original. The layer stays pinned on hover/focus until the pen is placed.

images/before-times/layers/alchemy-pen-free-patch-v4.{png,webp}
  Coherent 340 × 190 single-sheet replacement with softly feathered transitions
  in the surrounding dark equipment. It removes both the pen and the generated
  lower duplicate-pad wedge, and remains visible after pickup so revisiting
  Absurd Alchemy cannot reveal the baked pen again.

images/before-times/production/*
  Sagan thumbnail and the two current silent production-monitor MP4 loops.

tools/build-absurd-alchemy-plate.py
  Deterministically composites the dark-screen donor crop into the locked
  concept and writes both the PNG master and WebP runtime plate.

tools/build-absurd-alchemy-hand-logo.py
  Builds the localized V3 camera-removal plate, sizes and places the isolated
  generated hand master, writes the runtime PNG/WebP layer, and emits a preview.

tools/build-absurd-alchemy-exit-door.py
  Builds the combined exit sprite from original concept pixels, applies the
  localized no-door repair to V3, and writes the V4 plate plus runtime WebP.

tools/build-guestbook-no-pen.py
  Composites a narrow generated ruled-paper donor into the locked guest-book
  crop with a feathered pen silhouette and writes the PNG/WebP clean layer.

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
far enough to expose a duplicate. The live `lobby-clean-v4-newsstand-v1`
derivative is the one exception: it uses the generated empty-room source only
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
elliptical body pool and diagonal antenna trace sit behind the extracted raster,
so the selection glow has breathing room without outlining the dirty matte or
being clipped by the radio image bounds. Do not fold this effect back into an
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
Its matching background is `lobby-clean-v4-newsstand-v1.*`; do not restore the
plain V4 plate unless the doubled handle and top plane are intentionally wanted.

Running the helper rebuilds the PNG clean plate:

```bash
python3 tools/build-before-times-layers.py
```

It does not currently rebuild the runtime WebPs. Afterward run:

```bash
cwebp -q 92 -m 6 -mt \
  images/before-times/layers/lobby-clean-v4-newsstand-v1.png \
  -o images/before-times/layers/lobby-clean-v4-newsstand-v1.webp
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

## Verification completed this session

- The page was repeatedly tested at `http://localhost:8080/before-times.html`.
- The runtime plate loads from `lobby-clean-v4-newsstand-v1.webp` with the
  localized newsstand-top repair.
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
`bell-v4.*`, `exit-button-v2.png`, `exit-button-v3.png`, and
`lobby-clean-v4-newsstand-v1.*`. The PNG/WebP files are project sources, not
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
