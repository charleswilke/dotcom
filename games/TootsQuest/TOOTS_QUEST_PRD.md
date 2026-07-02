# Toots Quest — Product Requirements Document (v0.1)

A top-down, Zelda-inspired action-adventure for charleswilke.com. A bright, reactive
overworld; a darker mirrored underworld; dungeons, swordplay, and spellcasting — all
woven through with the real mythology of this site: the songs, the dogs, the radios,
the junk, the frequencies.

**Status:** M0 (Living Ink renderer proof) is BUILT and PASSED its gate.
**M0.5 (Sunday Ink)** added a second, toggleable visual style — newsprint
misregistration + halftone screens (§3.4) — plus a two-room world with
panel-gutter transitions (§3.4a). See §6 and `SESSION_HANDOFF.md` for
implementation notes. Next milestone: M1 vertical slice.

---

## 1. Vision

> *You tune a dial, and the world answers.*

Toots Quest is the third Toots game, and the most ambitious: where TootsJam is one
court and SpaceToots is one corridor, Toots Quest is a **place**. The player explores
a warm, hand-drawn-feeling world stitched together from the site's own lore — the
Cathedral of Junk, the broadcast towers, the Archive — accompanied by two very good
dogs, fighting back a creeping static that is un-tuning the world.

### Design pillars

1. **A world that reacts.** NPCs notice what you've done. Doors stay open. Gardens
   you water grow. The world has state, and the state is the reward.
2. **No sprites, no assets.** Every pixel is drawn by code. The art style *is* the
   renderer (see §3 — this is the heart of the project).
3. **The site is the lore.** Every dungeon, item, and NPC traces to a real song,
   album, motif, or family member. Players who know the site get goosebumps;
   players who don't get a coherent fantasy world anyway.
4. **Tight, readable combat.** Few mechanics, deeply tuned — the TootsJam philosophy
   (one ball, perfect physics) applied to a sword and four spells.

---

## 2. The world

### 2.1 Overworld — "The Hollow"

Bright, warm, painterly. Palette pulled from the site's daylight colors: cream
(`#f8e9d2`), burnt orange (`#f76e11`), golden grid amber. A small interconnected
region — think original-Zelda density, not Breath of the Wild sprawl.

Regions (each maps to an album's themes):

| Region | Source | Feel |
|---|---|---|
| **Hearthside** (start) | The about page; home | Village, the player's house, and **Haus of Toots** — Jessie's needlepoint atelier (see §2.6) |
| **The Junkyard** | *Junkyard Cabaret* | Salvage fields; everything is reclaimed parts; shopkeeper's stall sign reads **"EVERYTHING MUST GO"** |
| **The Relay Fields** | *GWOR* | Rolling hills studded with broadcast towers; weather rolls in as **Scattered Thunderstorms** |
| **The Margins** | *Mixtape / Side Two* | Misty edge-lands where the world fragments; signal-and-noise themed |

### 2.2 Underworld — "The Archive"

The dark mirror. Where the overworld is warm paper, the Archive is a **phosphor
CRT**: near-black blue (`#0a0a1a`), everything rendered in amber and phosphor-green
glow, scanline shimmer, light falling off into true darkness. It is literally the
site's microfiche/oscilloscope aesthetic turned into a place — the world's
*recording* of itself, where deleted things go.

Travel between worlds happens at **Tuning Stones** (vintage radio dials standing in
the landscape — the Time Dial, made diegetic). Some puzzles require flipping: a
collapsed bridge in the Hollow still *exists as a record* in the Archive, so you
cross down there.

### 2.3 Dungeons (initial four)

1. **The Cathedral of Junk** — vertical scrapyard temple. Theme: salvage. Puzzles
   about re-assembling broken machinery. Boss: **The Curator**, a colossus of
   reclaimed parts. Reward: the **Magnet Gauntlet** (pull/push metal junk).
2. **The Refused Frequency** — a dead broadcast tower in the Relay Fields. Theme:
   sound and silence. Enemies are deaf to you in silent rooms. Boss: **The Jammer**.
   Reward: the second spell frequency (see §4.3).
3. **Three-Fifteen** — a clock-tower dungeon frozen at 3:15. Theme: time. Rooms
   loop until you advance the mechanism. Reward: the **Slow the Clock** spell.
4. **The Siege of Social Atomization** — an Archive-only dungeon; final dungeon of
   v1. The deepest stack of the Archive, where the static originates.

### 2.4 Story spine (one paragraph, v1)

A creeping **Static** is un-tuning the Hollow — colors desaturating, NPCs forgetting
things, songs going missing. The player is **Toots himself** — headphones around his
ears, sword on his back, dogs **Doc** and **Astro** at his side. He learns the world
has a memory — the Archive —
and that something down there has stopped *refusing the frequency*. Restore the four
regional signals, then descend to silence the source. Final line of the game,
naturally: *the copy blinked first.*

### 2.5 Reactivity (the "thriving world" requirement)

Backed by a single global `worldState` flags object (see §5), cheap to add to:

- **Day/night cycle** (~8 real minutes) drives NPC schedules: the Junkyard shop
  closes at dusk, certain enemies only spawn at night, fireflies come out.
- **NPC memory:** NPCs reference completed quests in later dialogue. One flag, one
  alternate dialogue line — high perceived depth per unit of work.
- **Persistent world edits:** burned bushes stay burned this session; unlocked
  shortcuts stay open forever (saved).
- **Doc & Astro as systems:** Doc trails you and *points* (sits and stares) toward
  nearby secrets — a diegetic hint system. Astro digs up buried items at marked
  spots. The dogs ARE the quality-of-life features.

### 2.6 Haus of Toots (needlepoint as a game system)

Jessie's real needlepoint canvas design business becomes Hearthside's anchor shop,
and needlepoint becomes the game's craft/collection layer:

- **Save points are embroidery hoops.** Standing hoops scattered through the world;
  saving plays a quick "stitching" animation that literally stitches your progress.
  (Thematically perfect: the Archive *records*, Jessie *preserves*.)
- **Patterns are collectibles.** Hidden throughout the world are lost needlepoint
  patterns (each a tiny procedural cross-stitch rendering of a song, place, or
  character). Return them to Haus of Toots and Jessie stitches them; finished
  canvases hang on the shop wall — a visible, growing gallery of your exploration.
- **Stitched charms.** Jessie sews completed patterns onto your gear as charms —
  small passive buffs (a Doc charm extends secret-sniffing range, an Astro charm
  improves dig yields, a thunderstorm charm cheapens that spell).
- **Visual motif:** cross-stitch X's become a recurring procedural texture — the
  needlepoint banner, menu borders, the save animation — drawn as stitch grids in
  code, consistent with the no-asset rule.

### 2.7 Easter eggs (seed list — grow forever)

- A gravestone: *"Value Is Myth."* A merchant who disagrees stands next to it.
- An NPC at the inn watching tiny drag performances: *"the library is OPEN, henny."*
- A Yankees cap on a scarecrow in the Relay Fields.
- An arcade cabinet in the inn that actually plays a 20-second micro-TootsJam.
- A locked door requiring you to tune a dial to a specific frequency learned from a
  song lyric on the site.
- The **Hum of Humanity**: a faint audio drone that gets warmer as more NPCs are helped.
- Omaha references in town signage; "Fellow Vector" as the name of the spell tutor.

---

## 3. Rendering: "Living Ink" — the no-sprite art direction

This is the project's signature. The brief: sprites feel ancient; no texture maps;
a unique visual identity. The answer is to go **fully procedural-vector on Canvas
2D** — the SpaceToots philosophy ("all layers procedurally generated, no external
image assets") matured into an art style with a name.

### 3.1 The style: Living Ink

Everything is **flat, rounded vector shapes with painted lighting** — like a
storybook illustration that breathes. No pixels, no tiles, no texture images.
Concretely:

- **Characters are shape grammars, not frames.** The hero is ~10 layered Canvas
  paths (body capsule, head circle, hood arc, two eye dots, sword, etc.). Animation
  is **parametric, not frame-based**: a walk cycle is `bob = sin(t*10)*2` on the
  body, counter-rotation on the head, alternating leg ellipse scales. Squash on
  landing, stretch on dash, lean into movement direction. Because animation is
  math, every speed/state blends smoothly — something sprite sheets can never do.
  Doc and Astro are the same grammar with different parameters (ear length, tail
  wag frequency, body ratio) — one `drawDog(params)` function, two dogs.
- **Terrain is blobs, not tiles.** Collision lives on a logical grid (cheap, robust),
  but *rendering* ignores the grid: contiguous grass/water/cliff cells are merged
  and drawn as **rounded organic polygons** (trace the region edge, round the
  corners with quadratic curves). The world reads as hand-inked shapes, with zero
  tile seams — this single decision is most of why it won't look like a retro game.
- **Texture without textures.** Where surfaces need interest, use *deterministic
  procedural detail* (the TootsJam speckle trick — seeded positions so nothing
  flickers): grass flecks as short strokes, dirt speckles, stone cracks as jittered
  polylines. Cheap, infinite, and on-palette by construction.
- **Variable line weight (added session 3).** Uniform outlines feel sterile;
  real inking has nib pressure. Three techniques, all in both styles:
  terrain blob outlines dilate *directionally* (stamp radius varies with
  angle — thin on top, pooling along the underside); rock outlines are
  stroked facet-by-facet with seeded per-edge widths, heavier downhill;
  canopy outlines get a second down-shifted stroke that the refill masks
  everywhere but the bottom edge. Same ink color throughout — it's pressure,
  not shadow.
- **Per-instance identity (added session 3).** No two trees or rocks are
  alike: every instance seeds its own parameters from its coordinates
  (trees: canopy blob layout incl. occasional 4th lobe, scale, trunk
  height/width/lean, one of three green tints, outline weight, wind phase;
  rocks: size, squash, tone, cell jitter, 0–2 cracks). Deterministic — a
  tree is always the same tree — and cached, so it costs nothing per frame.
  This is the shape-grammar promise (§3.1, characters) applied to flora.
- **Painted light as composite ops.** A dedicated lighting pass using
  `globalCompositeOperation`:
  - Overworld: a full-canvas time-of-day tint (`multiply` rect whose color lerps
    cream→gold→dusk-purple) plus `lighter` radial gradients for torches/spells.
  - **Archive: darkness-first.** Fill the light-layer with near-black, then punch
    visibility holes with `destination-out` radial gradients around the player,
    lanterns, and glowing enemies. Add scanlines (1px alternating alpha rows,
    drawn once to an offscreen canvas and overlaid) + a subtle sine "phosphor
    breathing" on glow intensity. The underworld becomes an oscilloscope you walk
    around inside — directly continuous with the site's Time Dial aesthetic.
- **Wind and life everywhere.** Because everything is parametric, ambience is
  nearly free: every tree/grass blob gets `skew(sin(t + x*0.01) * windStrength)`.
  The whole world sways. This, plus particle pollen/fireflies/static-motes, is
  what makes it feel *alive* rather than rendered.

### 3.2 Why this beats the alternatives

| Option | Verdict |
|---|---|
| Sprite sheets / tilesets | Rejected by brief; also requires asset production pipeline |
| SVG DOM scene graph | Elegant but chokes at hundreds of animated nodes; poor compositing control |
| WebGL + shaders (SDF rendering) | The "pro" version of this idea, but a huge complexity jump, breaks the no-framework ethos, and Canvas 2D comfortably hits 60fps at this art density |
| **Canvas 2D procedural vector** | Matches existing codebase skills, zero assets, unique look, fast iteration — *chosen* |

### 3.3 Performance plan (the catch, handled)

Path-drawing is more CPU-expensive per object than blitting sprites. Mitigations,
all proven in this repo or standard practice:

1. **Bake static layers.** When the player enters a room/chunk, render the terrain
   blobs + speckle detail **once** to an offscreen canvas; per frame it's a single
   `drawImage`. Only entities, particles, and lighting redraw every frame. (This
   recovers sprite-like performance while keeping vector authorship.)
2. **Layered canvases:** `ground` (baked) → `entities` (dynamic) → `light`
   (composite ops) → `ui`. Each layer only clears/redraws when needed.
3. **Object pooling** for particles/projectiles (already done in SpaceToots).
4. **Fixed-timestep update, interpolated render** at 960×540 logical resolution
   (SpaceToots' canvas size), CSS-scaled.
5. Budget: ≤ ~60 dynamic entities on screen; profile with a frame-time HUD from day one.

### 3.4 Sunday Ink — the newsprint sibling style

**Added at M0.5.** The second visual identity, layered on Living Ink rather than
replacing it: the Hollow as a **Sunday newspaper comic strip**. The thematic rhyme
that earns it: the Archive is the site's microfiche aesthetic — and microfiche is
literally how newspapers were archived. The two worlds become the same document at
two moments of its life: the page as printed, and the page as preserved.

Concretely (all procedural, all live in the M0.5 build, toggled with `P`):

- **Plate misregistration.** Every primitive prints its color plate slightly
  off-register from its ink plate (`PRINT.mx/my`; terrain plates drift 1.6×
  more). The ink outline never moves; only the color drifts. Ink-colored
  fills are exempt — they ARE the ink plate. **The drift is horizontal-only**
  (playtest, session 3): a vertical offset reads as a drop shadow — fake
  elevation — in the 3/4 view; sideways drift has no gravity story, so it
  reads as print. Future hook: drive drift up where the Static has un-tuned
  the world — a diegetic "reality misprint" meter.
- **Halftone screens on select elements** (not a whole-screen filter): canopy
  under-shading, deep water, boulder shading. 45° dot lattices built as tiny
  repeating canvas tiles (`print.js`); patterns are page-anchored, so shapes
  sway *through* the dots — exactly how a real print screen behaves.
- **Panel structure.** Rooms are comic panels. Sunday Ink frames the view with
  a paper-margin + ink border; room-to-room movement is a **gutter transition**
  in both styles (see §4.1a).

Both styles are first-class and cheap to keep: grounds bake once per
(room, style) and everything else is parameter reads at draw time.

### 3.4a Room transitions: crossing the gutter

Walking off an open edge slides both rooms across the screen as framed panels
separated by a cream paper gutter, and Toots visibly *crosses the gutter* from
the old panel to the new one (0.8s, eased). This resolves the old open question
"scroll vs. fade": the answer was **panels**.

### 3.5 Palette law

Two palettes, both already on the site, enforced as constants:

- **Hollow:** cream `#f8e9d2` ground-light, burnt orange `#f76e11` accents, slate
  `#2c4f7c` shadows, deep purple `#1a1550` outlines/night.
- **Archive:** void `#0a0a1a`, amber phosphor (microfiche), neon `#00f7c2` for
  magic/interactive, hot orange `#ff5a36` for danger.

Neon cyan means "magic/interactable" in BOTH worlds — the one constant across the
mirror, and the same role it plays on the site itself.

---

## 4. Core mechanics

### 4.1 Movement & feel

8-direction analog-feeling movement (normalized WASD/arrows), slight acceleration/
friction, a short **dash/roll** with i-frames on a cooldown. Camera: room-based with
smooth scroll between rooms (Link's Awakening style) — pairs perfectly with
per-room baking (§3.3) and keeps world-building modular.

### 4.2 Swordplay

- **Slash:** 3-hit combo. Each swing is **windup → whip → follow-through**
  (reworked session 3 — a constant-speed arc felt like a windshield wiper):
  the blade cocks back ~10% past the start angle, whips through the full arc
  in about a third of the swing's duration, then settles. The forward step is
  synced to the whip, not the buttonpress. Toots' body twists against the
  windup and throws into the whip.
  **The slash is drawn in the ground plane**: the arc is vertically squashed
  to the same ~0.55 the shadows use, so it reads as a cut *across* in the 3/4
  view (unflattened arcs pivot like a wheel and read as uppercuts). Whip
  frames get a crescent smear + ghost blades; Sunday Ink adds comic action
  lines. Hitbox = sector test (angle + radius) active only during the whip.
- **Hold-charge spin** (classic, earned, satisfying).
- **Knockback + hitstop** (2–3 frames of freeze on contact) — the cheap juice that
  makes vanilla combat feel expensive.
- Enemies telegraph with shape language: they *inflate/lean back* before attacking
  (parametric animation again — no telegraph frames to draw).

### 4.3 Magic: the Frequency Dial

The spell system **is the site's radio motif**. The player carries a tuning dial
(bottom-left HUD, drawn like the Time Dial). Spells are *frequencies* you've
attuned; hold the spell button to raise the dial, flick to tune, release to cast.

| Frequency | Spell | Source |
|---|---|---|
| 88.3 | **Clear as Day** — light burst; reveals Archive geometry in the Hollow (and vice versa) | Side Two |
| 94.7 | **Scattered Thunderstorms** — AoE lightning, charges metal junk | GWOR |
| 101.1 | **Slow the Clock** — brief local time-dilation bubble | GWOR |
| 108.9 | **Refuse the Frequency** — parry/reflect projectiles as static | GWOR |

Mana = **Signal Strength**, which regenerates faster near broadcast towers and
slower deep in the Archive. Spell visuals are pure composite-op light (additive
gradients, oscilloscope-waveform projectiles) — the renderer and the magic system
are the same technology, which is why this combination will look unique.

### 4.4 Enemies (launch set, ~8)

Hollow: **Junk Mites** (scuttle, swarm), **Gull Bombers** (TootsJam cameo),
**Rust Golems** (magnet-vulnerable), **Static Wisps** (phase in/out).
Archive: **Redactions** (ink-black blobs that eat light), **Echo Knights**
(mirror your last 2 seconds of movement — *The Copy Blinked First*), **Index
Wraiths**, plus dungeon bosses (§2.3). Every enemy body is a shape grammar with a
"damaged" parameter (desaturate + jitter) instead of damage frames.

### 4.5 Progression

Hearts + sword tiers via dungeon completion; spells via dungeons/quests; **Salvage**
(currency, naturally) from enemies and digging (Astro). Side-quests gate cosmetic
*and* reactive rewards (the inn gets a new room; the band at the cabaret gains a
member per quest line — the world visibly thrives, per pillar 1).

---

## 5. Technical architecture

**Vanilla JS, no framework, no build step** — house rules. But unlike SpaceToots'
single file, this is too big for one file; unlike TootsJam, we can do better than
one 3,400-line file. Use **native ES modules** (`<script type="module">`) — served
directly, zero tooling, works on the existing Python dev server and Vercel.

```
games/TootsQuest/
  index.html            # canvas stack + module entry
  TOOTS_QUEST_PRD.md    # this file
  src/
    main.js             # boot, fixed-timestep loop, layer canvases
    world/
      worldgen.js       # region/room definitions (data), logical collision grid
      blobs.js          # grid → merged rounded-polygon terrain renderer (§3.1)
      bake.js           # offscreen room baking
      state.js          # worldState flags, save/load (localStorage)
      daynight.js       # clock, tint lerp, NPC schedule hooks
    render/
      ink.js            # shape-grammar primitives (capsule, blob, stroke-jitter)
      light.js          # composite-op lighting pass, Archive darkness
      particles.js      # pooled particles (pollen, static, sparks)
    entities/
      player.js  dogs.js  npc.js  enemies/*.js
    systems/
      combat.js         # sector hitboxes, hitstop, knockback
      spells.js         # frequency dial, four spells
      dialogue.js       # box + flag-conditional lines
      input.js  audio.js
    data/
      rooms/*.js        # one module per room: layout grid + entity spawns + flags
```

Key decisions:

- **Rooms as data modules** — a room is a small declarative object (terrain grid
  string, spawn list, door links, flag conditions). Adding world content never
  touches engine code. This is also the easter-egg pipeline: an egg is usually
  just a room-data entry + a dialogue line.
- **Entity model:** lightweight base-class style (like both existing games), not a
  full ECS — overkill at this scope.
- **Save:** `localStorage` (`tootsquest_save_v1`): worldState flags, inventory,
  hearts, room id. Autosave on room transitions.
- **Audio:** WebAudio-generated SFX where possible (oscillator zaps/chimes fit the
  frequency theme *perfectly* — a synth IS a tuning instrument); ambient loops can
  reuse the existing audio pipeline. Music can come later — stub the hook like
  SpaceToots did.
- **Leaderboard/backend:** none for v1. Single-player, local saves. (A future
  "speedrun timer" could reuse the Cloudflare Workers pattern.)
- **Site integration:** clean URL `/tootsquest` via `vercel.json` rewrite, OG/share
  page following the existing per-game pattern, card on the portfolio grid.

---

## 6. Scope & phasing

The honest risk is scope: this is 3–5× either existing game. Phase it so every
milestone is independently shippable and *fun*.

**M0 — Renderer proof (the style test).** One hand-built room: blob terrain,
animated hero + one dog, wind, day/night tint, one enemy, sword combo with
hitstop. **Gate: does Living Ink look as good as it sounds?** If not, iterate here
— style is the project. *(Smallest milestone, highest information.)*

> ✅ **M0 COMPLETE** (June 2026). Built in `games/TootsQuest/` exactly per §5's
> module layout. Frame cost 0.2–0.7 ms against a ~16 ms budget. All mechanics
> verified (combo kill, hitstop, dash i-frames, knockback, respawn, day/night,
> darkness lighting). Three rendering techniques proved out and are now canon:
>
> 1. **Stamp-dilation outlines** — render a region's cells to a white offscreen
>    mask (with per-corner rounding only where the region actually ends, +1px
>    expand so cells merge seamlessly — NEVER negative expand, it creates grid
>    seams), tint a copy ink and a copy fill, stamp the ink copy at 8 offsets,
>    draw the fill on top. Clean blob outlines with zero interior seams.
> 2. **Fill–fat-stroke–refill** — for clustered shapes (tree canopies): fill the
>    union path, stroke it at 2× the desired outline width, fill again. The
>    refill covers the stroke's inner half and all interior seams, leaving a
>    clean outer outline.
> 3. **Hitstop as loop-level freeze** — a global timer that skips simulation
>    steps while rendering continues. 0.05 s per hit, 0.09 s + shake on combo 3.

**M1 — Vertical slice.** Hearthside (4–6 rooms), 2 NPCs with flag-reactive
dialogue, one Tuning Stone, 3 Archive mirror-rooms with darkness lighting, one
spell (Clear as Day), save/load. *This is shippable as a teaser.*

**M2 — Dungeon One.** The Cathedral of Junk, complete: 8–10 rooms, Magnet
Gauntlet, The Curator boss, 3 enemy types. Ship it: "Toots Quest: Chapter One."

**M3 — The Hollow.** All four regions traversable, full spell dial, dungeons 2–3,
Doc/Astro systems, day/night schedules, side-quests, easter-egg pass.

**M4 — The Archive & finale.** Dungeon 4, mirror-world puzzles throughout, ending,
polish pass (screen shake, transitions, ambient audio), share page, portfolio card.

### Open questions (decide before M1)

1. ~~Who is the hero?~~ **Resolved: the hero is Toots — Charles himself**, rendered
   as a small warm-orange figure with headphones. Doc and Astro remain the co-stars.
2. ~~Scroll-between-rooms vs. fade transitions?~~ **Resolved at M0.5: panel-gutter
   transitions** (§3.4a) — rooms slide as comic panels across a paper gutter.
   Whether the Archive keeps the gutter (microfiche frames?) or fades is still
   open.
3. Gamepad support at launch or post-launch? (Input module should abstract for it
   either way.)
4. How loud should the real-life references be — ambient flavor (recommended) or
   explicit "about Charles" content?

---

## 7. Success criteria

- M0 screenshot is *immediately* identifiable as this game and no other.
- 60fps on a mid-tier laptop with lighting on.
- A first-time player completes the vertical slice without instructions.
- At least one person emails about an easter egg unprompted.
- Zero image files in `games/TootsQuest/` at ship. The whole world is code.
