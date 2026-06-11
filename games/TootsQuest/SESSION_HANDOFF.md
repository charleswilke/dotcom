# Toots Quest — Session Handoff

Read this (and `TOOTS_QUEST_PRD.md`) before touching the code. The PRD is the
*what and why*; this file is the *what exists right now and what bit us*.

## Current state (end of session 1, June 2026)

**M0 — Living Ink renderer proof — is complete and passed its gate.** One playable
room exists with terrain, characters, combat, and lighting. Nothing is committed
to a milestone beyond this; M1 (vertical slice: Hearthside, NPCs, Tuning Stone,
Archive mirror-rooms, save/load) is next.

**Run it:** any static server from the repo root, e.g. `python -m http.server 8080`,
then `http://localhost:8080/games/TootsQuest/`.
⚠️ Opening `index.html` directly (file://) silently fails — ES modules are blocked
by browsers without HTTP. The page now shows a red warning if the engine doesn't
boot within 1.5 s. This burned us once already.

**Controls:** WASD/arrows move · Space/J attack (3-hit combo) · Shift/K dash ·
N skip time of day.

## File map

```
games/TootsQuest/
  index.html              # canvas + boot-failure warning + module entry
  TOOTS_QUEST_PRD.md      # full design doc — REQUIRED READING
  SESSION_HANDOFF.md      # this file
  src/
    main.js     # loop (fixed 60 Hz step + hitstop), decor drawing, HUD, combat
                # resolution, lighting orchestration, window.__TQ debug handle
    ink.js      # palette + primitives: capsule / inkCircle / inkEllipse,
                # mulberry32 seeded PRNG, angle helpers
    terrain.js  # LAYOUT grid (30×17, 32px tiles: G/P/W/R), collision
                # (circleBlocked / moveCircle), blob baking (stampBlob),
                # DECOR positions (trees, torches, banner, secret, spawns)
    entities.js # Player (Toots), Dog (Doc — one grammar, any dog), Mite,
                # particle system
    light.js    # day/night keyframes (skyState), darkness pass (drawLighting)
```

## Decisions made this session (now canon)

- **Hero is Toots = Charles.** Orange tunic, headphones with neon dots, sword on
  back, cross-stitch chest charm. Doc & Astro are co-stars, not the player.
- **Haus of Toots is a game system** (PRD §2.6): Jessie's needlepoint shop in
  Hearthside; embroidery-hoop save points; collectible patterns; stitched charm
  buffs. The procedural cross-stitch banner in the M0 room is the visual proof.
- **Renderer is Canvas 2D procedural vector ("Living Ink"), zero image assets.**
  WebGL and SVG were considered and rejected (PRD §3.2). Success criterion: no
  image files in this directory, ever.
- **Terrain rendering ≠ collision.** Collision is the tile grid; visuals are
  merged rounded blobs baked once per room to an offscreen canvas.
- **Animation is parametric, never frame-based.** Walk = sine bob + lean;
  telegraphs = inflate + lean back + shiver; damage = flash param, not frames.
- **ES modules, no build step**, served directly — consistent with house rules.

## Hard-won gotchas (do not re-learn these)

1. **Mask expand must be positive.** `makeMask(test, radius, -3)` produced
   visible grid seams in the pond (every cell shrank apart). Inset a region by
   *membership test* (e.g. `isDeep` = water on all 4 sides), then still bake
   with `expand: +1`.
2. **Path layouts want long 2-wide runs.** The first LAYOUT used single-cell
   diagonal steps and read as noisy zigzag. Current road: 2-tile-wide straights
   with stepped switchbacks. Still slightly stair-stepped on diagonals —
   acceptable for now; true 45° miters in `roundedCellPath` are the known next
   terrain upgrade if it bothers us.
3. **rAF stops when the tab/panel is hidden** — the game "freezes" in background
   preview panels. That's why `window.__TQ.step(frames)` exists: it drives
   update+render synchronously for deterministic testing and screenshots.
   Verify mechanics with `__TQ` state reads, not by eyeballing.
4. **Torches/banners must sit beside the road, not on it** — DECOR positions are
   in pixels; check them against LAYOUT tiles when moving either.

## Debug handle (window.__TQ)

```js
__TQ.player / .doc / .mites / .game   // live objects
__TQ.setTime(0.96)                    // 0=midnight, 0.5=noon, 0.72=golden hour
__TQ.getTime()
__TQ.step(n)                          // run n exact 60Hz frames (works hidden)
```

## Verified this session (regression baseline)

- Sword combo: 3 hits kill a mite (hp 3→2→1→dead), each hit triggers hitstop;
  combo 3 adds screen shake. One hit max per mite per swing (hitSet).
- Mite: telegraph (inflate 0.42 s) → lunge → contact damages player (0.9 s
  invuln + knockback + mite bounces off). Dead 6 s → respawns at full hp.
- Dash: ~78 px burst, afterimages render, i-frames block damage during/just
  after (this blocked a damage test before we accounted for it — it works).
- Day/night: full cycle 150 s; darkness pass + torch/player light holes at
  night; multiply tint by day. Golden hour ~t=0.7.
- Doc: follows behind, trots, sits when you idle ~2 s; if sitting within 190 px
  of DECOR.secret he faces it, shows "!", and the spot glints.
- Perf: 0.2–0.7 ms/frame at 960×544 (budget ~16 ms). Perf readout is in the HUD
  and turns hot-orange above 12 ms.

## Known gaps / not built yet

- No audio (WebAudio oscillator SFX planned — fits the frequency theme).
- No hearts/death for the player (knockback only).
- No save/load, no rooms beyond this one, no spells, no Archive.
- Diagonal path stair-stepping (see gotcha 2).
- `__TQ` debug handle ships in the page (intentional for now).
- Not wired into the site: no `/tootsquest` rewrite in vercel.json, no share
  page, no portfolio card. Do this at M1 or M2, not before.

## Next session: M1 vertical slice (PRD §6)

Hearthside (4–6 rooms), 2 NPCs with flag-reactive dialogue, one Tuning Stone,
3 Archive mirror-rooms (phosphor/amber palette + scanlines), Clear as Day spell,
localStorage save. Open questions to settle first are listed at the end of
PRD §6 (room transition style, gamepad timing, how loud the real-life
references should be).
