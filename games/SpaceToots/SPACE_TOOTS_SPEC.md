# SPACE TOOTS — Game Design Spec

### A side-scrolling bullet hell for the web

**Target:** Single `index.html` file, pure Canvas API + vanilla JS, no dependencies. Embeddable on any website.

---

## 1. OVERVIEW

Space Toots is a 3-stage side-scrolling shoot-em-up in the R-Type tradition. Neon synthwave aesthetic. The player pilots a ship through increasingly dense enemy waves, collects weapon pickups, and defeats a boss at the end of each stage. The tone is arcade-serious with a joke layer baked into every weapon name, enemy codename, and boss title card.

**Core loop:** Fly → Shoot → Dodge → Collect pickups → Survive wave → Boss fight → Next stage

---

## 2. VISUAL STYLE

### Palette

| Role | Color | Hex |
|------|-------|-----|
| Background (deep) | Near-black blue | `#0a0a1a` |
| Grid lines | Faded magenta | `#2a1040` |
| Player ship | Cyan glow | `#00f0ff` |
| Player bullets | Hot cyan | `#00ffff` |
| Enemy base | Magenta/pink | `#ff00aa` |
| Enemy bullets | Orange-red | `#ff4400` |
| Pickups | Gold | `#ffd700` |
| Boss accents | White-hot | `#ffffff` |
| UI / HUD text | Soft white | `#e0e0ff` |

### Synthwave Treatment

- **All game objects** get a subtle outer glow (shadow blur on Canvas).
- **The player ship** pulses glow intensity slightly on a sine wave.
- **Enemies** have scanline-style horizontal stripe overlays (drawn via alternating transparent lines).
- **Explosions** are bursts of neon particles that fade through the palette (white → cyan → magenta → dark).
- **Screen flash** on boss defeat — brief white overlay that fades.

### Parallax Background (4 layers, back to front)

| Layer | Content | Scroll Speed |
|-------|---------|-------------|
| 1 (deepest) | Distant star field — tiny dots, slow drift | 0.2x |
| 2 | Synthwave grid — perspective floor lines receding to horizon | 0.5x |
| 3 | Nebula clouds — large translucent color blobs | 0.7x |
| 4 (nearest) | Foreground debris / particles — fast-moving streaks | 1.2x |

All layers are procedurally generated. No external image assets.

---

## 3. PLAYER SHIP

### Specs

| Attribute | Value |
|-----------|-------|
| Shape | Classic arrowhead silhouette, drawn with Canvas paths |
| Size | ~40x30px |
| Speed | 5px/frame base, consistent in all directions |
| Hitbox | Smaller than visual (inner 60% rectangle) — generous to player |
| Lives | 3 per game |
| Invincibility | 2 seconds on respawn, ship blinks |

### Controls

| Input | Action |
|-------|--------|
| Arrow keys / WASD | Move |
| Space (hold) | Fire primary weapon |
| Shift | Fire secondary weapon (if collected) |
| P | Pause |
| Enter | Start / confirm |

### Primary Weapon

Always available. Single forward-firing shot. Upgradeable via pickups (see Weapons section).

---

## 4. WEAPON SYSTEM

Two weapon slots: **Primary** (always active, upgradeable) and **Secondary** (pickup-based, limited ammo or duration).

### Primary Weapon Levels

Collected via "P" pickups. Each consecutive pickup advances one level. Dying resets to Level 1.

| Level | Behavior | Visual |
|-------|----------|--------|
| 1 | Single shot, forward | One cyan bolt |
| 2 | Double shot, slight spread | Two parallel bolts |
| 3 | Triple shot, fan pattern | Three bolts, ~15° spread |
| 4 | Quad shot + rear shot | Three forward + one backward |
| 5 (MAX) | Wide spread + increased fire rate | Five-way fan, faster cadence |

### Secondary Weapons

Dropped by specific enemies or from containers. Picked up on contact. Only one secondary active at a time — new pickup replaces current. Each has limited ammo (shown in HUD).

| Weapon | Codename | Behavior | Ammo |
|--------|----------|----------|------|
| Homing missiles | **"The Bloodhound"** | Lock-on to nearest enemy, moderate damage | 20 |
| Wave beam | **"The Silent But Deadly"** | Sine-wave projectile, passes through enemies | 15 |
| Spread bomb | **"Astro's Revenge"** | Fires forward, explodes into 8-direction shrapnel on impact | 10 |
| Shield orb | **"Doc's Bubble"** | Orbiting shield that absorbs 3 hits and damages on contact | 1 (duration: 15s) |
| Mega laser | **"The Full Send"** | Screen-wide beam, brief charge-up, massive damage | 3 |

> **JOKE HOOKS:** Every weapon name and its pickup flavor text are defined in the config object. Change freely without touching game logic.

---

## 5. ENEMY ROSTER

### Base Enemy Types

Each type has a codename, a behavior pattern, and a point value. Palette-swapped per stage for variety.

| Type | Codename | Behavior | HP | Points |
|------|----------|----------|----|--------|
| Drone | **"Buzzkill"** | Flies straight left at constant speed | 1 | 100 |
| Weaver | **"The Wobbler"** | Sine-wave flight path, fires single shot on approach | 2 | 200 |
| Charger | **"Karen"** | Pauses at screen edge, then rushes toward player's Y position | 3 | 300 |
| Turret | **"The Intern"** | Stationary, rotates to track player, fires burst of 3 | 4 | 250 |
| Spawner | **"The HOA"** | Large enemy that releases 3 Drones when destroyed | 5 | 500 |
| Bomber | **"Oops"** | Flies overhead, drops downward-falling projectiles | 3 | 350 |

### Enemy Bullets

- **Standard:** Small orange-red dot, travels in a straight line.
- **Aimed:** Fired toward player's current position at time of firing.
- **Spread:** 3-shot fan, each 20° apart.
- **Bomb:** Larger projectile, affected by "gravity" (curves downward).

---

## 6. STAGE DESIGN

### Stage 1 — "Void Drifter"

**Setting:** Open space, asteroid debris.
**Mood:** Easing in. Teach the player the controls.

| Wave | Enemies | Notes |
|------|---------|-------|
| 1 | 5 Drones in a V-formation | Straight line, no shooting. Warm-up. |
| 2 | 3 Weavers, staggered entry | Introduce sine-wave dodge |
| 3 | 6 Drones (top) + 2 Weavers (bottom) | Split attention |
| 4 | 2 Chargers + 4 Drones | First real threat |
| 5 | 1 Spawner + 2 Turrets | Introduce both types before boss |
| 6 | Power-up container (secondary weapon) | Breather before boss |

**Boss: "THE BIG CHUNGUS"**
A large, slow-moving sphere. Phase 1: Fires aimed shots in a slow spiral. Phase 2 (50% HP): Spiral speeds up, adds ring bursts. Weak point is a glowing core that's only exposed between attack cycles.

---

### Stage 2 — "Neon Reef"

**Setting:** Dense, organic-looking corridor — think alien coral rendered as glowing geometric shapes. Parallax layer 3 shifts to pulsing organic blobs.
**Mood:** Tighter space, more bullet density.

| Wave | Enemies | Notes |
|------|---------|-------|
| 1 | 4 Turrets placed along top/bottom walls | Establish the corridor |
| 2 | 6 Weavers in tight formation | Dodge in confined space |
| 3 | 3 Bombers overhead + 2 Chargers from right | Vertical + horizontal threats |
| 4 | 2 Spawners + 1 Turret gauntlet (3 turrets) | Frantic |
| 5 | "Quiet" wave — only pickups + 2 Drones | Let them breathe |
| 6 | 4 Chargers + 3 Bombers + 2 Weavers | Full roster mix |

**Boss: "CAPTAIN CRAMP"**
Elongated centipede-style boss that snakes across the screen. Each body segment fires independently. Destroy segments front-to-back. Phase 2: Detached segments become homing mines.

---

### Stage 3 — "The Gauntlet"

**Setting:** Full chaos. Background shifts to fast-scrolling geometric ruins. Parallax layer 4 adds warning-stripe hazard bars that scroll through.
**Mood:** Everything at once. Survival.

| Wave | Enemies | Notes |
|------|---------|-------|
| 1 | 8 Drones in 2 crossing V-formations | Immediate density |
| 2 | 4 Turrets + 3 Weavers + environmental hazard (moving laser bars) | Dodge everything |
| 3 | 2 Spawners + 3 Chargers + 2 Bombers | Non-stop spawns |
| 4 | "Revenge wave" — palette-swapped versions of Stage 1 enemies at 2x speed | Callback |
| 5 | Mini-boss: smaller version of Big Chungus (50% HP, faster attacks) | Mid-stage boss rush |
| 6 | 3 Bombers + 4 Chargers + 2 Turrets + moving hazards | Everything, everywhere |

**Boss: "EL JEFE GRANDE"**
Multi-phase final boss.
- **Phase 1:** Gunship form. Fires alternating spiral patterns and aimed burst volleys.
- **Phase 2 (60% HP):** Transforms — splits into two smaller ships that attack in tandem.
- **Phase 3 (25% HP):** Recombines into final form. Screen-filling bullet patterns with safe spots the player must find. Fires "The Full Send" beam that sweeps vertically — player must dodge to the gap.

---

## 7. PICKUPS & ITEMS

All pickups drift left at background scroll speed. Player collects on contact.

| Pickup | Visual | Effect |
|--------|--------|--------|
| Power-Up (P) | Glowing "P" in a diamond | Advance primary weapon one level |
| Secondary Weapon | Weapon icon in a hexagon | Grants secondary weapon (replaces current) |
| Extra Life | Tiny ship icon | +1 life |
| Score Bonus | Star icon | +1000 points |
| Speed Boost | Lightning bolt | +2 movement speed for 10 seconds |

**Drop rules:**
- Every 5th enemy in a wave drops a "P" pickup.
- Spawners always drop a secondary weapon.
- Extra lives appear once per stage (fixed placement).
- Score bonuses are random (10% drop chance from any enemy).

---

## 8. HUD & UI

### In-Game HUD

```
╔══════════════════════════════════════════════╗
║ SCORE: 00000000    STAGE 1    LIVES: ♦♦♦    ║
║                                    [SBD: 12] ║
╚══════════════════════════════════════════════╝
```

- **Score:** Top-left, always visible.
- **Stage indicator:** Top-center.
- **Lives:** Top-right, shown as small ship icons.
- **Secondary weapon:** Below lives. Shows weapon codename abbreviation + ammo count. Empty if none equipped.

### Title Screen

```
         ╔═══════════════════════╗
         ║     S P A C E         ║
         ║    T O O T S          ║
         ╚═══════════════════════╝

         ► PRESS ENTER TO START

           ARROW KEYS / WASD: MOVE
           SPACE: SHOOT
           SHIFT: SECONDARY
```

Synthwave grid scrolling in background. Ship logo drifts across with a glow trail.

### Game Over Screen

```
         G A M E   O V E R

         FINAL SCORE: 00000000

         ► PRESS ENTER TO RETRY
```

### Stage Clear Screen

```
         S T A G E  C L E A R

         STAGE SCORE: 00000000
         ENEMIES DESTROYED: 000
         ACCURACY: 00%

         ► PRESS ENTER TO CONTINUE
```

---

## 9. GAME STATE MACHINE

```
TITLE → STAGE_INTRO → GAMEPLAY → BOSS_WARNING → BOSS_FIGHT → STAGE_CLEAR → (next stage or WIN)
                                                                              ↓
                                                                          GAME_OVER
```

| State | Description |
|-------|-------------|
| `TITLE` | Title screen. Waiting for Enter. |
| `STAGE_INTRO` | "STAGE 1 — VOID DRIFTER" text fades in/out (2 seconds) |
| `GAMEPLAY` | Active play. Waves spawn per stage script. |
| `BOSS_WARNING` | "WARNING" text flashes. Music shift (if audio added later). 2 seconds. |
| `BOSS_FIGHT` | Boss is active. No regular waves. |
| `STAGE_CLEAR` | Score tally screen. Enter to continue. |
| `GAME_OVER` | Final score. Enter to restart. |
| `WIN` | After Stage 3 boss. Victory screen with total score. |

---

## 10. TECHNICAL ARCHITECTURE

### File Structure

Single `index.html` containing:

```
<!DOCTYPE html>
<html>
<head>
  <style>/* All CSS inline */</style>
</head>
<body>
  <canvas id="game"></canvas>
  <script>
    // === CONFIG (JSON-like object) ===
    const CONFIG = { ... };

    // === ENGINE ===
    // Canvas setup, game loop, input handling

    // === ENTITIES ===
    // Player, Enemy, Bullet, Pickup, Particle classes

    // === RENDERING ===
    // Draw functions, parallax, effects, HUD

    // === WAVES ===
    // Stage scripts — what spawns when

    // === BOSSES ===
    // Boss behavior per stage

    // === STATE MACHINE ===
    // Game state transitions

    // === INIT ===
    // Start game loop
  </script>
</body>
</html>
```

### The CONFIG Object

This is the joke layer. All names, flavor text, and tuning values live here. Safe to edit without breaking game logic.

```javascript
const CONFIG = {
  weapons: {
    secondary: {
      homing:   { name: "The Bloodhound", flavor: "Good boy. Good, deadly boy.", ammo: 20 },
      wave:     { name: "The Silent But Deadly", flavor: "You'll smell it before you see it.", ammo: 15 },
      spread:   { name: "Astro's Revenge", flavor: "He remembers what you did to his toy.", ammo: 10 },
      shield:   { name: "Doc's Bubble", flavor: "Personal space is non-negotiable.", duration: 15 },
      laser:    { name: "The Full Send", flavor: "No half measures.", ammo: 3 }
    }
  },
  enemies: {
    drone:    { name: "Buzzkill", hp: 1, points: 100 },
    weaver:   { name: "The Wobbler", hp: 2, points: 200 },
    charger:  { name: "Karen", hp: 3, points: 300 },
    turret:   { name: "The Intern", hp: 4, points: 250 },
    spawner:  { name: "The HOA", hp: 5, points: 500 },
    bomber:   { name: "Oops", hp: 3, points: 350 }
  },
  bosses: {
    stage1: { name: "THE BIG CHUNGUS", title: "Keeper of the Void" },
    stage2: { name: "CAPTAIN CRAMP", title: "Terror of the Reef" },
    stage3: { name: "EL JEFE GRANDE", title: "The Final Flatulence" }
  }
};
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Frame rate | 60 FPS |
| Max simultaneous bullets | 200 |
| Max simultaneous enemies | 30 |
| Max particles | 100 |
| Canvas resolution | 960x540 (scaled to fit viewport) |

### Collision Detection

- **Player vs Enemy Bullets:** Rectangle-to-rectangle (player hitbox is 60% of visual).
- **Player Bullets vs Enemies:** Rectangle-to-rectangle (full enemy bounds).
- **Player vs Pickups:** Circle-to-circle (generous radius).
- No pixel-perfect collision needed — generous hitboxes for fun factor.

### Object Pooling

Pre-allocate arrays for bullets, particles, and enemies. Reuse dead objects instead of creating new ones. Keeps GC pauses minimal.

---

## 11. FUTURE EXPANSION HOOKS

These are NOT in v1 scope, but the architecture should make them easy to add later:

- **Audio:** Web Audio API. Synth-generated sound effects + looping background track.
- **Local high scores:** `localStorage` leaderboard.
- **Mobile controls:** Touch joystick overlay.
- **Endless mode:** Procedurally generated waves after Stage 3, increasing difficulty.
- **Co-op:** Second player on same keyboard (WASD vs Arrows).

---

## 12. PLACEHOLDER NAMES — RIF ON THESE

These are starter names. Charles and Jessie: go wild.

### Weapons
- "The Bloodhound" → could reference Doc/Astro somehow?
- "The Silent But Deadly" → too obvious? Keep it? Lean into it?
- "Astro's Revenge" → perfect as-is
- "Doc's Bubble" → perfect as-is
- "The Full Send" → could be more specific to your world

### Enemies
- "Buzzkill" → solid
- "The Wobbler" → could be funnier
- "Karen" → universal, works
- "The Intern" → *chef's kiss*
- "The HOA" → very Omaha, love it
- "Oops" → understated, maybe needs a subtitle?

### Bosses
- "THE BIG CHUNGUS" → memetic, maybe too dated by now? Or is that the point?
- "CAPTAIN CRAMP" → fits the centipede form
- "EL JEFE GRANDE" → needs a subtitle that ties to the Toots brand

---

## 13. IMPLEMENTATION ORDER FOR CLAUDE CODE

Recommended build sequence:

1. **Canvas setup + game loop + parallax background** — Get the vibe right first.
2. **Player ship + movement + primary weapon** — Playable instantly.
3. **Basic enemy (Drone)** — Something to shoot at.
4. **Collision detection + explosions** — Satisfying feedback.
5. **Full enemy roster** — All 6 types with behaviors.
6. **Wave system + Stage 1 script** — Pacing and spawning.
7. **Pickup system** — Power-ups and secondaries.
8. **Boss system + Stage 1 boss** — Complete the loop.
9. **HUD + state machine (title, game over, stage clear)** — Full game flow.
10. **Stages 2 and 3** — Content pass with new waves and bosses.
11. **Polish** — Screen shake, particle tuning, difficulty balancing.

---

*Last updated: September 2026*
*Haus of Toots × Fellow Vector*


## Opening animation — September 2026

The page now opens with a 15-second procedural Canvas cartoon: a small ship
approaches a cut-paper planet, attempts a correction, and triggers escalating
gravity. Stars, the floor mesh, and the GAMES ring join the vortex
before the debris collapses into a single point. A final fragment drops out.
The palette retains navy, cyan, and magenta with warm cream typography.

`OPENING` precedes `TITLE` on page load only. Click, tap, Enter, Space, or Escape
skips to the title; a separate confirmation starts gameplay. Desktop R replays
the opening from the title. Reduced-motion preference bypasses it. Timing uses
animation timestamps and pauses while the document is hidden. Retries retain
the existing flow. The opening is silent; existing music starts with gameplay.
No external assets, dependencies, or gameplay entities are involved.

The typography is hand-cut paper, not a font: `PAPER_GLYPHS` holds each letter as
a polygon on a 10×10 grid (inner rings are holes, filled evenodd), and
`PAPER_LETTERS` bakes ten variants per glyph. The straight scissor cuts are kept
deliberately: each variant gets a tiny whole-letter shear, a small seeded corner
unevenness (outer ring only; counters stay nearly clean), and one angled scissor
slip on selected long outer edges. Cuts are fixed per variant, so they never
change between frames or replays. S, T, O and C each carry two base designs and a
variant picks one by parity, so the two S’s, T’s and O’s in the title are
different letters, not the same letter re-jittered; `PAPER_POSE` adds a restrained
tilt and scale per variant. Title letters use variant `i + row*5` in both the
opening and the title screen. I, L, K and R exist only so CLICK TO START / TAP TO
START can be cut from the same paper; W, G and M exist for the CW planet and the
GAMES ring. `drawPaperLetter` lays a magenta underlayer offset like a
misregistered screen print (a narrow offset, so the depth reads as one sheet on
another rather than a drop shadow), with no glow.

The SPACE TOOTS letters stay hidden through the whole buildup. On the nova beat
the frame hard-cuts to flat colour cards (cream, then magenta) for a few frames,
and the letters blast out of the card rather than the ember.

**The planet is the CW monogram.** Two bespoke faceted paper pieces, a broad C on
the left and a W fitted into the right hemisphere, form a roughly circular
silhouette with no disk behind them; a darker magenta underlayer offset a few
pixels gives them thickness. The first ship puff (t≈1.85) starts a 1.5s morph:
the pieces rotate with the planet’s spin while their inward cuts inflate toward
the outer contour, so the gaps close and the facets sweep around the edge, and
over the last third the closed shape cross-fades into the solid pink `paperCutout`
planet that the rest of the sequence deforms. It should read as the same object
changing, not a logo fading into a replacement.

**GAMES is printed once on a Saturn ring.** The ring is an annular paper band
projected in perspective on a tilted plane, drawn in two passes (rear half
before the planet, front half after) so the planet occludes it correctly. A
darker band offset downward gives the paper an edge; the cream face carries a
soft mint glow. The five glyphs’ vertices go through the same projection as the
band, so the word foreshortens with the surface instead of being rotated letter
by letter; it rests on the readable front arc, and the ring rocks gently on its
own. From t≈6.2 the gravity pull tightens the radius, tips the plane and sets
the word circulating; far-side letters are drawn subdued and fade out. Starting
at 5.4s the band dithers away over 2.8s in fixed angular sectors (stable
thresholds, not per-frame noise) and releases glowing flecks that join the
vortex early and share the final collapse. The printed word fades slightly
faster; no solid band remains by 8.2s. All shadow blur stays inside canvas saves.

**The floor is one projected mesh.** `drawOpening` samples a perspective grid
(49 depth lines, 41 cross lines; every fourth line a brighter cyan major to
establish scale, the rest a dim violet) through a single vertex function, so
both line families share exactly the same deformation and intersections stay
connected instead of each curve bowing on its own like a ribbon. It answers the
beats in order: each puff (1.75s, 4.65s) sends a localized ripple travelling
radially out from the sink; the gravity buildup (4.8s to 10.6s) pulls the mesh
toward the sink, twists it with the orbit, and lifts the horizon into a towering
well; the mesh takes an anticipatory outward breath around 10.7s; then the
collapse crunches the whole surface to the nova point. At the nova (13.12s) the
mesh releases with an expanding shock ring and `drawPaperFloor` takes over,
throwing the settled floor outward from its centre with a quick travel and a
damped landing bounce, fully settled before the opening ends.

`drawPaperFloor` with no age argument is the title screen’s floor: the same paths
at the same opacity the nova left them at, so nothing fades out or back in
across the cut.

The opening ship uses the gameplay ship’s swept wings, twin nacelles/exhausts,
angular fuselage, and wedge canopy in a simplified paper palette. Its acting is a
chain of local-time beats in story order (`openingShipPose`): a glance over the
shoulder before the turn, a head-cocking hover at the wobble it caused, a hop when
it realises, a nod (“I can fix this”), windup and kick for the corrective puff, a
lean-in to admire the fix, the alarmed double take as it makes things worse, and a
bolt with stuttering engines that gravity overrules. Braking squash, puff recoil,
trailing wing flex and tangent-facing orbital stretch ride on top. Exhaust puffs
use the ship’s release position and rotation. Planet/ring deformation and staggered
letter landing springs carry the same elastic motion through the scene.

The title screen (`drawTitleScreen`) lives in the same paper world rather than the
old neon HUD. The letters hold exactly where the nova left them so the cut is
invisible, then bob and sway from zero; the floor is the one the nova landed, the
thirty stars are back on their threads, and the dropped fragment lies where it
fell. The ship is gone, mostly: every eight seconds it barrels through on one of
three lanes (between the rows, through TOOTS, over SPACE), alternating direction,
with a paper wake, and each letter it passes fires a spring the moment the ship
crosses its x, scaled by how close the lane is. The start prompt is cut from the
same paper in cream and breathes; controls and the replay hint are quiet printed
text in the paper palette. The scenery fades up over the first beat; reduced
motion gets the settled frame with no fly-bys. It runs on its own
`performance.now()` clock (`title.start`, reset on entry) because `frame` does
not tick on the title.

**Paper in gameplay: first sample.** The player hull, the drone, the weaver and
their deaths now use the same cut-paper treatment (`PAPER GAMEPLAY SAMPLE` section in
`index.html`, gated by `PAPER_SAMPLE`; `?classic` restores the neon versions for
comparison). Drawing only: no hitbox, speed or spawn changed. The brief, what
the sample does and what is still to be judged are in `PAPER_STYLE_DIRECTION.md`.
