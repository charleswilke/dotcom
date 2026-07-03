# Toots Quest — Session Handoff

Read this (and `TOOTS_QUEST_PRD.md`) before touching the code. The PRD is the
*what and why*; this file is the *what exists right now and what bit us*.

## Current state (end of session 4, July 2026)

**M0 (Living Ink renderer proof) passed its gate in session 1. M0.5 (Sunday
Ink) was added in session 2:** a second, toggleable visual style — Sunday
newspaper comic strip — plus a two-room world with panel-gutter transitions.
Both styles are canon and both must keep working; the plan is to use them
both (PRD §3.4). **Session 3 tuned both from playtest feedback:** plate
misregistration is now horizontal-only (vertical drift read as fake
elevation), and the sword swing was rebuilt around sensation — windup →
whip → follow-through, drawn flattened into the ground plane so it reads as
a horizontal cut (PRD §4.2). **Session 4 started M1 proper:** onomatopoeia
combat bursts (THOK!/POK!/KRAK!/OOF!), the first two NPCs (Jessie, Old Wren)
with flag-reactive dialogue in comic speech balloons, the `worldState` flags
object, a full player-character redesign to match the cover art (ink-black
figure, big cream eyes, chunky headphones, ragged orange poncho, neon blade),
and **both real dogs**: Astro joined Doc, the corrected dog canon is now
implemented (Doc heels/sits/scowls; Astro scouts, finds the secret, points),
and dogs got a wiggle-based unstick so boulders can't pin them. Remaining
M1: more Hearthside rooms, Tuning Stone, Archive mirror-rooms, Clear as Day
spell, save/load.

**Run it:** any static server from the repo root, e.g. `python3 -m http.server 8080`
(note: this machine has no bare `python`, only `python3`) or `npx serve`,
then open `/games/TootsQuest/` on that server's port.
⚠️ Opening `index.html` directly (file://) silently fails — ES modules are blocked
by browsers without HTTP. The page shows a red warning if the engine doesn't
boot within 1.5 s. This burned us once already.

**Controls:** WASD/arrows move · Space/J attack (3-hit combo) · Shift/K dash ·
N skip time of day · **P toggle Sunday Ink print style** · walk off the east/west
edge to cross to the next room. **Near an NPC, Space/E talks instead of
attacking; J always attacks** (the escape hatch). During dialogue any of
Space/E/J advances: finish the typewriter → next page → close.

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
    entities.js # Player (Toots), Dog (one grammar, two souls: Doc heel /
                # Astro scout, mood faces, seek() wiggle-unstick), Mite,
                # particle system; session 4: cover-art Toots redesign,
                # dash/footfall dust puffs
    light.js    # day/night keyframes (skyState), darkness pass (drawLighting)
    fx.js       # session 4: onomatopoeia word bursts (spawnWord/update/draw),
                # seeded per-letter jitter, starburst polygon for big words
    npc.js      # session 4: NPC defs + entity (Jessie, Old Wren), dialogue
                # state machine, speech-balloon + talk-hint rendering
    state.js    # session 4: worldState flags (setFlag/getFlag) — grows into
                # the localStorage save at M1
```

## Decisions made across sessions (now canon)

- **Hero is Toots = Charles.** Orange tunic, headphones with neon dots, sword on
  back, cross-stitch chest charm. Doc & Astro are co-stars, not the player.
- **Both dogs are in, canon-correct** (session 4, PRD §2.5): one Dog grammar,
  two personalities via params. **Doc** = cream-gray (`PALETTE.dogDoc`),
  slate collar, chunkier (size 1.05), slow tail (freq 6), grumpy face
  (furrowed brow + downturned mouth), behavior `heel` — sticks behind Toots
  and sits almost immediately when he stops. **Astro** = charcoal
  (`PALETTE.dogAstro`), orange collar, smaller (0.95), manic tail (freq 13),
  happy face (open mouth + tongue), behavior `scout` — orbits the player at
  50–120px picking random things to investigate, and when the room's secret
  is within 170px he beelines, sniffs (head-down bob), and blinks the neon
  "!". The secret glint in main.js keys off `astro.pointing` now, NOT doc —
  the old Doc-points-at-secret behavior is gone per canon (Doc's future
  pointing targets are hoops/hearts/food when those exist).
- **Dogs unstick by wiggling, not pathfinding** (`Dog.seek()`): if a dog
  moves less than 30% of its intended speed for ~0.45s it swerves
  perpendicular (whichever side is open) for ~0.55s; chained swerves walk
  it around boulder corners. Scout additionally drops a 4s `secretCooldown`
  if the wall was on the way to the secret, so he orbits and re-approaches
  from an open angle later. This reads as dog behavior, which is the point.
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
- **Toots' look is the cover art** (session 4, from Charles' renders): an
  ink-black figure — head, arm nubs, feet all `PALETTE.ink` — with big cream
  eyes (pupils track facing), a chunky cream headphone band + cups with neon
  dots, a hair tuft poking OVER the band, an orange poncho with a ragged,
  swaying hem and the cream X chest stitch, and a NEON blade (palette law:
  neon = magic/interactive; the sword is the player's magic). Reasoning: the
  black figure IS the ink plate, so in Sunday Ink he stays registered while
  his poncho and eye-whites drift — the misregistration system flatters him
  for free (see gotcha 6).
- **Speech is comic balloons, not a dialogue box** (session 4): rounded-rect
  bubble + tail triangle in one path, drawn with fill–fat-stroke–refill so
  the tail/bubble seam vanishes; lettering is ALL-CAPS Chalkboard/Comic Sans,
  ink-colored so it stays registered in print mode while the bubble's cream
  plate drifts. Name tag rides the top edge like a tiny caption box. Balloons
  draw AFTER lighting/tint/panel-frame — lettering must stay readable at
  midnight.
- **Dialogue does not pause the world** (pillar 1). The player is input-locked
  (fed an empty key set) but everything else keeps simulating; if something
  hurts Toots mid-sentence the conversation breaks off (main.js checks
  `invuln > 0.85` right after mite updates). NPCs are placed in calm spots so
  this is rare, not annoying.
- **Input routing** (session 4): near an NPC, Space/E talk, J always attacks.
  One contextual button matches Zelda muscle memory; keeping J as pure attack
  means combat is never hijacked by an accidental conversation.
- **NPC placement is room data, NPC identity is code.** `decor.npcs` in
  terrain.js says who stands where (and feeds staticColliders, r=8); NPC_DEFS
  in npc.js owns names, lines(flags), and draw functions. Same split as the
  PRD's "rooms as data modules" rule.
- **Flag-reactive lines are cheap and already live** (PRD §2.5): killing any
  mite sets `slain_mite` (Jessie comments on the rust flecks); finishing a
  conversation sets `talked_<id>` (Wren's last line changes if you've met
  Jessie). One flag, one alternate line — keep using this shape.
- **Onomatopoeia words spawn at full impact size and settle**, never grow in:
  hitstop freezes updates but not rendering, so the word spawned on the hit
  tick IS the freeze-frame. Letter jitter is seeded per word (mulberry32) and
  re-derived each draw — crooked but stable. KRAK! spawns high (y−52) so the
  starburst doesn't swallow Toots and the blade.

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
11. **Zero combat state before scripted `__TQ.step` tests.** The live rAF
   loop keeps running between console/eval calls, so leftover hitstop, a
   buffered attack, knockback, or a live mite will corrupt the next scripted
   sequence in confusing ways (a "failed" combo that never started, phantom
   flags). Preamble that works: `game.hitstopT=0; player.attack=null;
   player.attackQueued=false; player.kvx=player.kvy=0; player.invuln=0;
   player.dashT=0`, and pin/reset any mite you're using as a target.
12. **NPCs need open sky, not just open ground.** Y-sorting draws a tree
   over anyone standing above (north of) it — Wren at (648,208) vanished
   completely behind the meadow tree at (660,240); only his talk hint
   floated over the canopy. Check new NPC spots against tree positions
   (canopy spans roughly ±35px, centered above the trunk), not just the
   collision grid.
13. **A bare moveCircle chase pins entities on walls.** Axis-separated
   movement only slides if the free axis has a component; a dead-on
   approach (dy≈0 into a vertical rock face) sticks forever. Both dogs hit
   this on the hearth boulders at (672–736, 224–288) chasing targets east
   of them. Anything that chases a point needs an unstick — dogs use
   `seek()`'s perpendicular wiggle; reuse it for future followers.

## Debug handle (window.__TQ)

```js
__TQ.player / .doc / .astro / .game   // live objects
__TQ.mites                        // getter — current room's mites
__TQ.npcs                         // getter — current room's NPC instances
__TQ.room                         // getter — current room ({id, decor, neighbors, ...})
__TQ.transition                   // getter — active gutter transition or null
__TQ.dialogue                     // getter — active conversation or null
__TQ.flags                        // getter — worldState.flags (live object)
__TQ.talk('jessie'|'wren')        // force-start a conversation
__TQ.advance()                    // advance dialogue (finish page → next → close)
__TQ.say(x, y, 'BAM!', {big:true})// spawn an onomatopoeia word anywhere
__TQ.setPrint(true|false)         // toggle Sunday Ink
__TQ.setMisreg(mx, my=0)          // live-tune plate drift (rebakes grounds)
__TQ.setTime(0.96)                // 0=midnight, 0.5=noon, 0.72=golden hour
__TQ.getTime()
__TQ.step(n)                      // run n exact 60Hz frames (works hidden)
```

## Verified in session 4

- Boot clean, 60 fps, ~0.9 ms painted / ~1.2 ms print at full scene (budget
  ~16 ms) — the new systems cost roughly nothing per frame.
- 3-hit combo end-to-end via scripted `__TQ.step`: hp 3→2→1→0, hitstop on
  every hit, KRAK! + starburst on the finisher (screenshot-verified in both
  styles), THOK!/POK! on hits 1–2, OOF! on player hurt, `slain_mite` set on
  the kill.
- Dialogue: talk-hint "…" bubble in range; balloon with name tag, tail to
  the speaker, typewriter reveal, page-turn cue; player and NPC face each
  other on start; Space/E/J all advance; finishing sets `talked_<id>`.
- Flag reactivity chain: killed a mite → Jessie's rust-flecks variant;
  finished Jessie → crossed the gutter → Wren's last page switched to the
  "You've met Jessie?" line. Flags survive room transitions (they're global).
- Gutter crossings with NPCs: both rooms' NPCs draw inside their panels
  during the slide; dialogue force-closes on transition start; words clear
  on arrival (they're positioned in room space and would be stale).
- New Toots reads at gameplay zoom and 3× zoom, in both styles; pupils
  track facing (up at Jessie when talking north); tuft clears the band;
  print mode keeps the black figure registered while poncho/eyes drift.
- Both dogs, scripted + screenshot-verified: Doc heels across the map and
  sits (grumpy) when Toots idles; Astro orbits, then finds the hearth
  secret from an open angle and sniffs/points (frame ~355 from a cold
  start); secret glint follows `astro.pointing`. The boulder trap that
  pinned both dogs is fixed by `seek()` — re-tested the exact pinning
  scenario (player at 800,230, dogs west of the rocks) and both arrive.
  Gutter crossings carry both dogs, clamped in-bounds, both ways.

## Regression baseline (sessions 1–3, re-verified where touched)

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
- Dialogue is linear pages only — no choices, no quest hooks yet.
- Jessie/Wren still use skin-tone faces; only Toots got the ink-figure
  treatment (he's unique on the cover art too — probably correct, but
  revisit when more NPCs exist).
- Wren's sprite is serviceable, not lovable — his cap/beard read muddy at
  1×. Candidate for a polish pass.
- Diagonal path stair-stepping (see gotcha 2).
- `__TQ` debug handle ships in the page (intentional for now).
- Not wired into the site: no `/tootsquest` rewrite in vercel.json, no share
  page, no portfolio card. Do this at M1 or M2, not before.

## Next session: continue M1 (PRD §6)

Session 4 knocked out the first two queue items (onomatopoeia bursts, NPCs +
speech balloons) plus an unplanned player redesign to the cover art. Queue:

1. **Hearthside rooms (4–6)** — room data modules; the meadow shows the
   pattern. Haus of Toots shop interior is the anchor (Jessie already stands
   at the banner outside; she moves inside, or the shop is her second spot).
   Remember gotcha 12 when placing anyone.
2. **Tuning Stone + 3 Archive mirror-rooms** — phosphor/amber palette,
   scanlines, darkness-first lighting (light.js's pass, tuned harder).
   Decide: does the Archive keep the paper gutter, or transition differently
   (microfiche frames? fade)? — open question from PRD §6.
3. **Clear as Day spell** (88.3) + the frequency-dial HUD seed.
4. **localStorage save** (`tootsquest_save_v1`): worldState flags (already
   the single source of truth in state.js), room id, autosave on gutter
   crossings (natural save point).

Also queued, lower priority:
- **Dog follow-ups** (canon migration itself is DONE — both dogs are in):
  Doc's pointing-at-comfy behavior needs targets — wire it to hoop save
  points / hearts / the inn when those exist. Astro's dig spots are an M3
  system. Doc's Pest Mode (PRD §2.5) is a design hook for M2+.
- **Mite render-style pass:** the cover renders give mites spring antennae
  with bolt tips, visible rivets/patch seams, and rounder rustier bodies.
  Combine with the queued per-instance identity pass (mites benefit most —
  there are many of them).
- Ink-weight / per-instance treatment for characters generally (uniform
  outlines today).
- Scale tree collision radius with visual scale if scale variance ever
  exceeds the current 0.85–1.2×.

Remaining open questions (PRD §6): gamepad timing, loudness of real-life
references, Archive transition style (see item 2).
