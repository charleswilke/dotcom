# Toots Quest — Session Handoff

Read this (and `TOOTS_QUEST_PRD.md`) before touching the code. The PRD is the
*what and why*; this file is the *what exists right now and what bit us*.

## Current state (end of session 3, July 2026)

**M0 (Living Ink renderer proof) passed its gate in session 1. M0.5 (Sunday
Ink) was added in session 2:** a second, toggleable visual style — Sunday
newspaper comic strip — plus a two-room world with panel-gutter transitions.
Both styles are canon and both must keep working; the plan is to use them
both (PRD §3.4). **Session 3 tuned both from playtest feedback:** plate
misregistration is now horizontal-only (vertical drift read as fake
elevation), and the sword swing was rebuilt around sensation — windup →
whip → follow-through, drawn flattened into the ground plane so it reads as
a horizontal cut (PRD §4.2). M1 (vertical slice: Hearthside rooms, NPCs,
Tuning Stone, Archive mirror-rooms, save/load) is next.

**Run it:** any static server from the repo root, e.g. `python3 -m http.server 8080`
(note: this machine has no bare `python`, only `python3`) or `npx serve`,
then open `/games/TootsQuest/` on that server's port.
⚠️ Opening `index.html` directly (file://) silently fails — ES modules are blocked
by browsers without HTTP. The page shows a red warning if the engine doesn't
boot within 1.5 s. This burned us once already.

**Controls:** WASD/arrows move · Space/J attack (3-hit combo) · Shift/K dash ·
N skip time of day · **P toggle Sunday Ink print style** · walk off the east/west
edge to cross to the next room.

## File map

```
games/TootsQuest/
  index.html              # canvas + boot-failure warning + module entry
  TOOTS_QUEST_PRD.md      # full design doc — REQUIRED READING
  SESSION_HANDOFF.md      # this file
  src/
    main.js     # loop (fixed 60 Hz step + hitstop), decor drawing, HUD, combat
                # resolution, lighting orchestration, panel-gutter transitions,
                # per-room ambient (tufts/ripples), window.__TQ debug handle
    ink.js      # palette + primitives: capsule / inkCircle / inkEllipse,
                # PRINT state + plate misregistration, mulberry32, angle helpers
    print.js    # Sunday Ink: halftone dot screens as repeating canvas tiles,
                # per-context pattern cache (halftone(ctx, key), halftoneTile(key))
    terrain.js  # ROOM system: ROOM_DEFS (hearth, meadow) with layout grids
                # (30×17, 32px: G/P/W/R), decor, neighbors; live `room` export,
                # setRoom/getRoom; collision (circleBlocked/moveCircle); blob
                # baking, print-aware, cached per (room, style) via groundFor()
    entities.js # Player (Toots), Dog (Doc — one grammar, any dog), Mite,
                # particle system  (unchanged in session 2)
    light.js    # day/night keyframes (skyState), darkness pass (drawLighting)
```

## Decisions made across sessions (now canon)

- **Hero is Toots = Charles.** Orange tunic, headphones with neon dots, sword on
  back, cross-stitch chest charm. Doc & Astro are co-stars, not the player.
- **Haus of Toots is a game system** (PRD §2.6): embroidery-hoop save points,
  collectible patterns, stitched charm buffs.
- **Renderer is Canvas 2D procedural vector ("Living Ink"), zero image assets.**
  Success criterion: no image files in this directory, ever. (Sunday Ink's
  halftone tiles are canvases drawn at boot — still zero assets.)
- **Sunday Ink is the sibling style** (PRD §3.4): plate misregistration +
  selective halftone + panel frames, toggled at runtime with `P`. Lore rhyme:
  overworld = Sunday funnies page, Archive = the microfiche of that same page.
- **Rooms are comic panels; transitions cross the gutter** (PRD §3.4a). Both
  rooms slide as framed panels over cream paper; Toots visibly crosses the
  gutter (0.8 s eased). This replaced the scroll-vs-fade question.
- **Terrain rendering ≠ collision.** Collision is the tile grid; visuals are
  merged rounded blobs baked once per (room, style) to offscreen canvases.
- **Animation is parametric, never frame-based.**
- **ES modules, no build step**, served directly.

## Hard-won gotchas (do not re-learn these)

1. **Mask expand must be positive.** `makeMask(test, radius, -3)` produced
   visible grid seams (cells shrink apart). Inset a region by *membership test*
   (e.g. `isDeep` = water on all 4 sides), then still bake with `expand: +1`.
2. **Path layouts want long 2-wide runs.** Single-cell diagonal steps read as
   noisy zigzag. Diagonal sections should overlap ≥2 tiles row-to-row.
3. **rAF stops when the tab/panel is hidden** — use `window.__TQ.step(frames)`
   to drive update+render synchronously for deterministic testing. Verify
   mechanics with `__TQ` state reads, not by eyeballing.
4. **Torches/banners must sit beside the road, not on it** — DECOR positions
   are pixels; check them against the room's LAYOUT tiles when moving either.
5. **Anything teleported near a world edge must be clamped inside the
   collision bounds.** Doc was spawned at x=-12 after a gutter crossing
   (entry point 22 minus follow distance 34) and the edge check bricked his
   movement permanently. Post-transition placement clamps to [18, W-18].
6. **Misregistration must exempt ink-colored fills.** The player's feet are
   ink-colored fills; offsetting them detaches the "ink plate" from itself.
   `plateOffset()` in ink.js returns null for `fill === PALETTE.ink`.
7. **Halftone patterns are page-anchored** (canvas-origin), so moving shapes
   slide through the dots. This is correct print behavior — do not "fix" it
   by translating patterns per-entity.
8. **Transition thresholds vs. entry points:** edge trigger is >W−12.5 /
   <12.5 because movement collision stops the player ~3px short of the wall
   at walk speed; entry lands at 22 / W−22 so a crossing never immediately
   re-triggers the other way.
9. **Anything swung/thrown must be drawn in the ground plane.** The sword
   arc rendered as a true circle read as vertical uppercuts; squashing the
   arc's y by SWING_FLAT (0.55, same as shadows) made it read horizontal.
   Apply the same rule to future projectiles/spell sweeps.
10. **Vertical plate drift reads as elevation, not misprint.** PRINT.my is 0
   on purpose; keep misregistration horizontal (see PRD §3.4). Tune live
   with `__TQ.setMisreg(mx, my)` — it invalidates the baked grounds for you.

## Debug handle (window.__TQ)

```js
__TQ.player / .doc / .game        // live objects
__TQ.mites                        // getter — current room's mites
__TQ.room                         // getter — current room ({id, decor, neighbors, ...})
__TQ.transition                   // getter — active gutter transition or null
__TQ.setPrint(true|false)         // toggle Sunday Ink
__TQ.setMisreg(mx, my=0)          // live-tune plate drift (rebakes grounds)
__TQ.setTime(0.96)                // 0=midnight, 0.5=noon, 0.72=golden hour
__TQ.getTime()
__TQ.step(n)                      // run n exact 60Hz frames (works hidden)
```

## Verified this session (regression baseline)

- Everything from the M0 baseline still passes: sword combo (3 hits kill a
  mite, hitstop each hit, shake on combo 3), mite telegraph→lunge→contact
  damage, dash i-frames + afterimages, day/night cycle + darkness pass, Doc
  follow/sit/point.
- Reworked swing (session 3): 3-hit kill and mid-swing combo buffering both
  re-verified with the new hit window (active p ∈ [SWING_WIND,
  SWING_STRIKE+0.06] — windup and follow-through don't hit). Freeze a swing
  for screenshots with `__TQ.player.bufferAttack(); __TQ.step(7);
  __TQ.game.hitstopT = 9999` (hitstop pauses simulation, not rendering);
  set `hitstopT = 0` to resume.
- Gutter transitions: east crossing hearth→meadow lands player at x=22 in
  `meadow`, west crossing returns to `hearth` at x=938; Doc arrives clamped
  in-bounds and follows; mites are per-room and persist their state per room;
  particles clear on crossing; ambient (tufts/ripples) rebuilds per room seed.
- Combat verified in the meadow after crossing (3-hit kill).
- Sunday Ink: misregistered plates on terrain + characters, halftone on
  canopy shade / deep water / boulder shading, panel frame — toggles live
  with no rebake stall after first bake (grounds cached per room+style).
  Plate drift chunked up to mx=2.2 (horizontal-only) after playtest.
- Variable line weight (session 3, both styles — see PRD §3.1): directional
  stamp dilation on terrain blobs, per-facet rock strokes, down-shifted
  second stroke on canopies. Verified in both styles at ~0.2/0.4 ms.
- Per-instance identity (session 3, PRD §3.1): trees seed shape/size/tint/
  lean/wind-phase from their coordinates (`treeParams`, cached as `tree._p`
  on the decor object); rocks take size/squash/tone/jitter/cracks off the
  bake's seeded stream. Verified unique-but-stable in both rooms and both
  styles. Rock visual jitter is ≤±4px because collision stays on the tile.
- Perf: painted ~0.6 ms, print ~1.1 ms per frame at 960×544 (budget ~16 ms).

## Known gaps / not built yet

- No audio (WebAudio oscillator SFX planned — fits the frequency theme).
- No hearts/death for the player (knockback only).
- No save/load, no spells, no Archive rooms yet.
- Only E/W gutter transitions; N/S gutters unbuilt (same pattern when needed).
- Onomatopoeia combat bursts ("KRAK!" on hit) discussed for Sunday Ink,
  not built — cheap juice candidate for next session.
- Diagonal path stair-stepping (see gotcha 2).
- `__TQ` debug handle ships in the page (intentional for now).
- Not wired into the site: no `/tootsquest` rewrite in vercel.json, no share
  page, no portfolio card. Do this at M1 or M2, not before.

## Next session: M1 vertical slice (PRD §6)

The room system + gutter transitions now exist, so most of M1 is room data
plus three new systems. Queue, roughly in order:

1. **Onomatopoeia combat bursts** — warm-up task, ~cheap. A hand-lettered
   "KRAK!" on the combo-3 finisher (procedural text on a jittered starburst
   polygon, synced to the existing hitstop + shake). Maybe a small "thok" on
   hits 1–2. Sunday Ink language, but consider it in both styles.
2. **NPC + dialogue as comic speech balloons.** 2 NPCs with flag-reactive
   lines. Balloons are rounded blobs with tails pointing at the speaker —
   exactly the shape grammar the renderer already speaks, and they replace
   the need for a bottom dialogue box. Flag-conditional lines per PRD §2.5
   (one flag, one alternate line).
3. **Hearthside rooms (4–6)** — room data modules; the meadow shows the
   pattern. Haus of Toots shop interior is the anchor (Jessie NPC = one of
   the 2 NPCs?).
4. **Tuning Stone + 3 Archive mirror-rooms** — phosphor/amber palette,
   scanlines, darkness-first lighting (light.js's pass, tuned harder).
   Decide: does the Archive keep the paper gutter, or transition differently
   (microfiche frames? fade)? — open question from PRD §6.
5. **Clear as Day spell** (88.3) + the frequency-dial HUD seed.
6. **localStorage save** (`tootsquest_save_v1`): worldState flags, room id,
   autosave on gutter crossings (natural save point).

Also queued from session 3 playtests, lower priority:
- **Dog canon corrected to the real dogs (PRD §2.5):** Doc = cream-gray,
  grumpy, points to rest/food → in-game he should point at hoop save points
  and hearts, not secrets. Astro = charcoal, happy, explorer → secrets and
  dig spots are his. Migrate M0's Doc-points-at-secret behavior to Astro
  when he's added, and retune dog colors/params (both are tan today).
- Ink-weight / per-instance treatment for characters (Toots, Doc, mites
  still have uniform outlines and identical-per-class shapes — mites would
  benefit most since there are many).
- Scale tree collision radius with visual scale if scale variance ever
  exceeds the current 0.85–1.2×.

Remaining open questions (PRD §6): gamepad timing, loudness of real-life
references, Archive transition style (see item 4).
