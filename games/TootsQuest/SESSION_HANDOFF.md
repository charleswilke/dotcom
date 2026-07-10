# Toots Quest — Session Handoff

Read this (and `TOOTS_QUEST_PRD.md`) before touching the code. The PRD is the
*what and why*; this file is the *what exists right now and what bit us*.
`CONCEPT_SKETCHBOOK.md` (new, session 6) holds the Higgsfield generator
prompts for upcoming visual development — the sketchbook rule lives there.

## Current state (end of session 9, July 2026)

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
and dogs got a wiggle-based unstick so boulders can't pin them. **Session 5
built out Hearthside (M1 queue item 1):** the world is now SIX rooms —
`lane` (Toots' house) ← `hearth` (square + Haus of Toots shop building) →
`meadow`, `green` (stone-ring grove, the future Tuning Stone site) north of
hearth, plus two interiors (`shopInterior`, `homeInterior`) entered through
doors. That required N/S gutter transitions (E/W-only before), door
transitions (same panel slide, explicit entry points), a building shape
grammar (shop + home), interior rooms (new tiles F/B/V, plank floors,
timber walls on paper void), rect colliders, furniture grammars, standing
embroidery-hoop save-point scenery (PRD §2.6 — scenery only until the save
system lands), and Doc's comfy compass wired to hoops and dog beds.
Jessie moved inside her shop. **Session 6 knocked out M1 items 3–4 (out of
order — concept art for the Tuning Stone comes first, see
`CONCEPT_SKETCHBOOK.md`): the save system and the first spell.** Save is
`localStorage tootsquest_save_v1` (flags + room + position + time of day),
written two ways: stitching at any embroidery hoop (Space/E in range — a
1.25s cross-stitch ceremony sews a ring around Toots) and autosaving on
every gutter/door crossing. Boot restores room, position, flags, and time.
**Clear as Day (88.3) is live on F:** a crisp oscilloscope wavefront — a
sine ring, no soft blobs — expands in the ground plane, rim-lights every
interactive thing it crosses (secrets get a lingering neon cross-stitch X;
hoops and doors get a courtesy flash), and punches the darkness open as it
goes, so at night the spell literally carries daylight. The frequency-dial
HUD seeded bottom-left: casting slings the needle up the band and the
cooldown is the needle tuning back home to 88.3. **Session 7 was the
key-art glean pass** (`CONCEPT_SKETCHBOOK.md`, "What the keeper feeds
back"): mites got their render pass (per-instance seeded shells with
rivets, seams, and a cream stitched X patch; a spinning **wind-up key**
whose spin rate IS the telegraph — lazy at idle, furious before the lunge;
hurt/death bursts shed part-shaped particles: springs, bolts, nuts, and
the key itself on the kill), Toots' poncho became a velocity-driven motion
instrument (trails the dash, drifts with the walk, whips with the swing)
with canon-uneven googly eyes, Doc got his underbite tooth, Astro a cream
closed-eye bliss arc while sniffing/pointing, and seeded flowers joined
the ambient pass. **Session 8 built the title screen** (`title.js`): the
July 2026 key art ("the keeper") recreated entirely in code — canted
panel, hand-lettered logo with a halftone drop shadow, Toots mid-lunge
with the teal arc connecting into a tumbling vanquished beetle (THOK!),
Doc chomping his own beetle, Astro blissfully digging up a neon-glinting
medallion, and the Static eating the print off the far ridge with the
faceless dot-copy standing in it. Everything breathes (wind, wag, churn,
key-spin); any key lifts the cover page off the live first frame of the
game (0.85s eased slide). The game does not simulate while the title is
up. **Session 9 was the depth pass**, built from Charles's Great Tuner
previz render (see `CONCEPT_SKETCHBOOK.md`, Tuning Stone log). The camera
question the render raised ("should the play cam go isometric?") was
answered with **extrusion, not projection**: the projection is untouched —
what the render actually had was altitude and one consistent light. Three
systems landed: (1) a **directional shadow pass** — sun from the upper
right, every static object casts a soft slate shadow down-left (halftone
in Sunday Ink, like the boulders) plus a dark contact core, drawn on the
ground before the y-sorted cast; (2) the green's stone ring became
**real standing stones** — y-sorted entities with a shaded side facet,
sunward rim light, seeded lean/taper/tone, walk-behind-able, colliders at
the base; (3) **the Great Tuner previz stands at the ring's center** —
168px monolith, verdigris dial with ticks and hairlines, a living neon
needle (breathes around its station, trembles like something's still
tuning), moss, the cream cross-stitch band from the render, and its own
darkness-punch light after dark. The green also got a lighter clearing
patch (authored `decor.patches`, baked into the ground) and a path that
now leads to the monument. Scenery only — the world-flip mechanic is
still M1's headliner. **The depth pass round two (same session, Charles:
"everything feels a little flat, the buildings could have some sides")
extended the extrusion to the rest of the vocabulary:** buildings turn a
west shoulder to the sun — an oblique shaded side wall (E=11, D=15) and
a west roof hip slope (RE=10, RD=9), drawn before the front faces so the
front outlines cover the seams, plus an under-eave shadow band across
the front wall; trees got real volume — highlights moved to the sunward
(upper-right) side per the one-sun law, a canopy shade lobe clipped to
the lower-left (painted slate in Living Ink, the halftone screen in
Sunday Ink — the print-mode shade ellipse moved lower-left to match),
and a slate edge-shade down the trunk's west side (cylinder read, same
as the stones' facets). **Session 10 was the dog photo-canon pass plus the building turn dial:**
Charles shared reference photos of the real Doc and Astro, which
corrected several session-4 model-sheet guesses — see the updated dog
canon bullet in Decisions. Then his Archive-square concept render came
back (sketchbook item 2) and its first gleaning went straight in-engine:
buildings now sit at individual angles to the camera via a `turn` dial
(see Decisions; the Archive style itself is still an open pick).
Remaining M1: Tuning Stone *mechanic* + Archive mirror-rooms.

**Run it:** any static server from the repo root, e.g. `python3 -m http.server 8080`
(note: this machine has no bare `python`, only `python3`) or `npx serve`,
then open `/games/TootsQuest/` on that server's port.
⚠️ Opening `index.html` directly (file://) silently fails — ES modules are blocked
by browsers without HTTP. The page shows a red warning if the engine doesn't
boot within 1.5 s. This burned us once already.

**Controls:** any key at the title lifts the cover · WASD/arrows move ·
Space/J attack (3-hit combo) · Shift/K dash ·
**F cast Clear as Day** · N skip time of day · **P toggle Sunday Ink print
style** · walk off the east/west edge to cross to the next room. **Near an
NPC, Space/E talks instead of attacking; near a hoop (and no NPC), Space/E
stitches a save; J always attacks** (the escape hatch). During dialogue any
of Space/E/J advances: finish the typewriter → next page → close.

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
    terrain.js  # ROOM system: ROOM_DEFS (hearth, meadow, lane, green,
                # shopInterior, homeInterior) with layout grids (30×17, 32px:
                # G/P/W/R outdoors, F/B/V interiors), decor (incl. buildings,
                # doors, hoops, furniture), neighbors; live `room` export,
                # setRoom/getRoom; collision (circleBlocked/moveCircle, circle
                # + rect colliders, FURN_COLLIDERS); blob baking incl.
                # bakeInterior, print-aware, cached per (room, style)
    entities.js # Player (Toots), Dog (one grammar, two souls: Doc heel /
                # Astro scout, mood faces, seek() wiggle-unstick), Mite,
                # particle system; session 4: cover-art Toots redesign,
                # dash/footfall dust puffs
    light.js    # day/night keyframes (skyState), darkness pass (drawLighting)
    fx.js       # session 4: onomatopoeia word bursts (spawnWord/update/draw),
                # seeded per-letter jitter, starburst polygon for big words
    npc.js      # session 4: NPC defs + entity (Jessie, Old Wren), dialogue
                # state machine, speech-balloon + talk-hint rendering
    state.js    # worldState flags (setFlag/getFlag) + the save file
                # (session 6): saveGame/loadGame/wipeSave on localStorage
                # tootsquest_save_v1 — flags, room id, position, time of day
    spells.js   # session 6: the Frequency Dial system seeded with Clear as
                # Day — waveform pulse, sonar pings on interactables,
                # spellLights() for the darkness pass, drawFreqDial HUD
    title.js    # session 8: the key art drawn in code — canted cover panel,
                # poster-scale cast, static ridge + dot-copy, logo lettering,
                # PRESS ANY KEY; main.js lifts it off the live game
```

## Decisions made across sessions (now canon)

- **Hero is Toots = Charles.** Orange tunic, headphones with neon dots, sword on
  back, cross-stitch chest charm. Doc & Astro are co-stars, not the player.
- **Both dogs are in, canon-correct** (session 4, PRD §2.5; colors and
  markings corrected session 10 from REAL PHOTOS — photo canon supersedes
  the session-4 model-sheet guesses): one Dog grammar, two personalities
  via params. **Doc** = cool SILVER-gray, not cream (`PALETTE.dogDoc`),
  white blaze up the muzzle (`blaze` dial — his single most identifying
  mark), SHORT ears that blend into the bob (earLen 5.5 — the long ears
  were backwards; Astro's are the long ones), olive collar
  (`dogDocCollar`) with a brass "DOCTOR" tag (`tag`), chunkier (size
  1.05), slow tail (freq 6), grumpy face (photo-canon SQUINT — a
  flat-topped lidded half-eye — plus furrowed brow + downturned mouth),
  behavior `heel` — sticks behind Toots
  and sits almost immediately when he stops. **Astro** = groomed two-tone
  charcoal: dark head/ears/tail (`dogAstro` via the `dark` dial) over a
  lighter shaved body (`dogAstroBody`) — kept SUBTLE on purpose (Charles);
  long curtain ears (earLen 11.5), wheaten `beardTint` on the muzzle, a
  long dark tail plume that POOLS on the grass when he sits (the straight
  tail is a curvedCapsule down to the ground now), mustard collar
  (`dogAstroCollar`) carrying a brass shooting-star "ASTRO" tag and a
  NEON mint tracker (`airtag` — palette law holds: finding hidden things
  IS the scout's magic; the real dog wears the AirTag), cream-backed
  button eye (dark fur gets light features), manic tail (freq 13),
  happy face (open mouth + tongue), behavior `scout` — orbits the player at
  50–120px picking random things to investigate, and when the room's secret
  is within 170px he beelines, sniffs (head-down bob), and blinks the neon
  "!". The secret glint in main.js keys off `astro.pointing` now, NOT doc —
  the old Doc-points-at-secret behavior is gone per canon (Doc's future
  pointing targets are hoops/hearts/food when those exist).
- **Body types are dials on the one grammar** (Charles' corrections, session
  4): `lift` (barrel height off the ground — legs lengthen, head carries
  higher at 1.3×, sit pose stretches tall), `bodyW`, `legW`, `topknot`, and
  `bean` (sags the barrel midline along a quadratic — belly rounds down,
  chest/rump ride up; the sit pose puffs the chest on the same curve; the
  scruff ticks and head follow), and `tailCurl` (the tail plumes up over
  the back instead of swinging out behind — tip sways over the rump with
  the wag, in both poses). **Doc is full shih tzu: defaults + bean 3.5 +
  tailCurl** — per Charles, "that signature curve to their midsection" and
  the curl over the back. Astro is the shih tzu/poodle mix (breed corrected
  by Charles July 2026 — the topknot is GONE; `topknot` stays a grammar
  dial for future dogs): lift 4.5, bodyW 9, legW 2.5, straight tail.
  Curved barrels and curled tails use the
  `curvedCapsule` primitive in ink.js (same plate rules as capsule).
- **The scout stops inventing adventures when Toots settles** (player.idleT
  > 2.5 stops wander re-targeting). Without this the ~1.5s wander clock
  re-targets forever and Astro can never accrue the 2s of stillness his
  sit requires — he literally could not sit until this fix.
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
- **Toots' look is the cover art, minus headphones** (session 4, from
  Charles' renders + revisions): an ink-black figure — head, arm nubs, feet
  all `PALETTE.ink` — with big cream eyes (pupils track facing), a hair
  tuft, an orange poncho with a ragged, swaying hem and the cream X chest
  stitch, and a NEON blade (palette law: neon = magic/interactive; the
  sword is the player's magic). Reasoning: the black figure IS the ink
  plate, so in Sunday Ink he stays registered while his poncho and
  eye-whites drift — the misregistration system flatters him for free (see
  gotcha 6).
- **Headphones are DITCHED for now** (Charles, session 4). History: first
  built cover-chunky, then slimmed + rigged as a parametric facing
  telegraph (band slides with look, near cup grows / far cup shrinks —
  commit 6c188ad has that version if they return; they're still canon on
  the cover art). Charles cut them anyway — the in-game head reads cleaner
  bare. **The facing telegraph survives in the eyes:** pupils track facing
  (`fx*1.6, fy*1.1`) and the whites shrink continuously toward north
  (`eyeK = 1 + min(0, fy)*0.5`) so N reads as the back of the head. All
  continuous, no pose snapping, per the parametric-animation rule.
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
- **Doors are triggers, not holes** (session 5): building wall rects stay
  solid; the door trigger point sits on the wall face (radius 15) and the
  transition teleports to an explicit entry point placed >30px from the
  return trigger so crossings never re-fire. Interiors' door gaps in the
  B-tile wall ring are walkable F cells so the player can stand in the
  threshold.
- **Door/N/S crossings reuse the one gutter transition** (session 5):
  entering a building is dir 'N', exiting is 'S' — an interior is just the
  next panel down the strip. `startTransition(dir, toId, entry)` covers
  edges (derived entry) and doors (explicit entry) alike.
- **Dogs land safely after any crossing via `placeDog`** (session 5): the
  trailing spot is clamped to bounds AND checked with circleBlocked — door
  arrivals put the trailing spot inside a wall, so blocked dogs pop in at
  Toots' feet and heel/scout walks them apart. Reuse for anything that
  teleports with the player.
- **Doc's comfy compass is live** (session 5, PRD §2.5): heel dogs take
  `room.comfy` (hoops + dog beds, built in buildRoom) as update()'s third
  arg; once sitting, Doc turns and stares at the nearest one within 170px
  and main.js drips warm-orange motes there (orange, not neon — rest isn't
  magic). Scouts still take the room's secret in the same slot.
- **Jessie stands beside her counter, not behind it** — TALK_RADIUS is 52
  and the counter is 26 deep plus both body radii; putting an NPC across a
  counter puts them out of talk range. Keep NPCs reachable, not staged.
- **Interior HUD flips to ink** — the HUD text is cream and interiors are
  mostly cream paper; drawHud picks ink when room.interior.
- **The save lands on the stitch's first frame; the ceremony is fiction**
  (session 6, PRD §2.6). A mite interrupting the 1.25s animation breaks
  the moment, never the progress — same invuln>0.85 check dialogue uses.
  Input-locked like dialogue (EMPTY_KEYS); the world keeps living.
- **Crossings autosave, hoops save with ceremony** — both call the same
  doSave(). The hoop is the fiction, the gutter is the guarantee.
- **Spell light is crisp, never soft** (session 6, the "crisp and
  intentional" directive): Clear as Day is stroked waveform rings and
  hairline calibration circles, zero radial-gradient blobs. Soft additive
  gradients stay reserved for fire (torches/lamps). Future spells follow
  suit: a spell is a *signal*, drawn like the oscilloscope it came from.
- **The ground-plane law extends to light** (gotcha 9's corollary): the
  spell's darkness-punch holes pass `sy: 0.55` and light.js squashes the
  gradient — a round hole under an elliptical wavefront reads as a
  spotlight, not a spell.
- **Dark fur gets light features** (session 7): ink details vanish on
  Astro's charcoal — his bliss arc is cream, and any future dark-coated
  character follows suit. (Doc's tooth learned the mirror lesson: cream
  details need ink outlines near cream fur.)
- **Mites disassemble, they don't bleed** (session 7): hits shed a bolt or
  nut, the kill sheds springs + hardware + the wind-up key itself, all as
  part-shaped particles (entities.js drawPart). Extend the parts palette
  for future junk enemies — the Rust Golem should shed girders.
- **The wind-up key IS the mite telegraph** (session 7, key-art glean):
  spin rate reads intent (1.6 idle → 24 rad/s lunge) alongside the
  existing inflate. When audio lands, the key wants a ratchet tick that
  accelerates with it.
- **The title screen IS the key art, in code** (session 8): the keeper's
  composition rebuilt from primitives, canted -0.075 rad with 1.12
  overscan. It's a cover page: the game holds its breath (zero simulation)
  under it, and any key lifts the panel off the live first frame. The
  title keeps its own clock (`title.t`), so it animates identically no
  matter how long it sits.
- **'lighter' bleaches on cream paper** (session 8): the swing arc drawn
  with the spell system's additive approach washed to white on the title's
  paper sky. Additive light needs darkness to read; on paper, teal must be
  stroked source-over. The "crisp spell light" law is about SHAPE (rings,
  no gradient blobs), not the composite op — pick the op per background.
- **The copy on the title emerges by negative space:** the static field
  thins in a halo where the figure stands, because the copy is made OF the
  static, not hidden inside it. No eyes, ever (canon).
- **Pings are the palette law made visible:** the wavefront rim-lights
  interactables in neon as it crosses their distance, sonar-style. Secrets
  get a lingering cross-stitch X (needlepoint motif = X marks the spot);
  targets are gathered per cast in main.js castSpell().
- **Depth is extrusion, not projection** (session 9, from the Great Tuner
  previz). The 3/4 camera stays: input axes = screen axes = hitbox axes is
  what makes lining up strikes comfortable, and a true isometric/perspective
  flip would re-found the engine. What the previz actually had was height:
  side facets, one sun, grounded shadows. Big verticals get a shaded facet
  on the un-sunned side + a rim light on the sunward edge, clipped inside
  the silhouette; collision stays a circle at the base.
- **One sun, upper right, for the whole world** (session 9): every static
  object shadows down-left via the drawShadows pass — soft slate
  (`rgba(44,79,124,0.30)`) in paint, the halftone 'shade' screen in print —
  plus a darker contact core at the base. The pass draws after the ground,
  BEFORE tufts/flowers and the y-sorted cast, so grass pokes up through
  shadows and nothing ever shadows over a character. **The moving cast
  keeps its shadows underfoot on purpose** (the previz does this too):
  combat positions must stay unambiguous. Interiors skip the pass (lamps
  own the light) except a small anchor under standing hoops.
- **Inline contact shadows are gone** — drawTree/drawBuilding/drawHoop no
  longer draw their own base ellipse; drawShadows owns all static shadows.
  Anything new and static needs an entry there, or it will float.
- **Everything vertical turns its west shoulder to the sun** (session 9
  round two): buildings wear an oblique side wall + west roof hip (shaded
  slate in paint, halftone in print), trees carry a canopy shade lobe
  lower-left, sunward highlights upper-right, and a trunk edge shade.
  Shaded faces are drawn FIRST so the front faces' ink covers the seams.
  Future verticals (dungeon walls, towers, the Cathedral) follow suit:
  front face + shaded west face + sunward rim is the house extrusion
  grammar now.
- **Buildings sit at an angle: the `turn` dial** (session 10, gleaned from
  the Archive-square render — Charles: the structures "sit at a
  delightful angle from the camera... not all face forward"). Signed
  `turn` in [-1, 1] on a building's decor entry: a vertical shear of
  every horizontal line, pivoting at the wall's center (±w*0.045 at the
  edges at full turn), with the visible side wall/roof hip swinging
  wider as |turn| grows. STILL extrusion, not projection: parallels stay
  parallel, verticals stay vertical, the collider stays the axis-aligned
  rect, and door triggers don't move (keep doorX near the pivot center —
  the visual shift there is sub-pixel). The one-sun law picks the side
  face's light: positive turn shows the shaded WEST face, negative the
  SUNLIT east face (faint warm lift in paint, bare cream plate in print —
  no halftone on a lit face). Gravity-hung props (shop sign, banner)
  stay vertical on purpose; the contrast is what sells the lean.
  Authored so far: shop turn -0.55 (lit east face angled toward its
  square), home turn +0.4. turn: 0 preserves session 9's fixed west
  shoulder exactly, except the wall quad dropped roundRect's r4 corners;
  the fat round-join ink stroke keeps them soft.
- **Standing stones are decor entities, not R tiles** (session 9): the
  green's ring is `decor.stones` — y-sorted (walk behind them), circle
  colliders r=11, per-instance seeded shape/lean/taper/tone/cracks/moss
  via stoneParams (same coordinate-seeding trick as trees). The old baked
  boulders remain for R tiles elsewhere; use standing stones when
  something should have height, boulders when it's furniture.
- **The Tuner previz is scenery with a promise** (session 9): collider at
  its base, neon needle (palette law: it WILL be interactive), its own
  light in the darkness pass, drawn from `decor.tuner` in the green. The
  world-flip mechanic, dial interaction, and Archive staging are still
  open — previz translation ≠ the Tuning Stone feature.
- **Authored ground patches** (session 9): `decor.patches` (x/y/rx/ry/
  color ellipses) bake into the ground after the tonal wash, before the
  flecks — used for the green's lighter clearing under the monument.
  Cheap staging tool for future landmarks.

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
13. **A restored save can spawn Toots against a world edge — and dogs are
   constructed relative to him.** Loading a save at x=22 built Doc at
   x=-18, outside the collision bounds: gotcha 5's permanent brick, now at
   boot. Boot placement goes through placeDog (clamp + blocked-fallback)
   right after construction. Anything else ever constructed relative to
   the player must do the same.
14. **A bare moveCircle chase pins entities on walls.** Axis-separated
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
__TQ.goto('shopInterior')         // jump to any room's spawn point (testing)
__TQ.advance()                    // advance dialogue (finish page → next → close)
__TQ.say(x, y, 'BAM!', {big:true})// spawn an onomatopoeia word anywhere
__TQ.setPrint(true|false)         // toggle Sunday Ink
__TQ.setMisreg(mx, my=0)          // live-tune plate drift (rebakes grounds)
__TQ.setTime(0.96)                // 0=midnight, 0.5=noon, 0.72=golden hour
__TQ.getTime()
__TQ.step(n)                      // run n exact 60Hz frames (works hidden)
__TQ.skipTitle()                  // session 8: REQUIRED before scripted
                                  // __TQ.step tests — step drives the game
                                  // loop, which is paused under the title
__TQ.title                        // getter — title state {active, leaving}
__TQ.cast()                       // cast Clear as Day from Toots (session 6)
__TQ.save()                       // force a save; returns the parsed save
__TQ.wipe()                       // delete the save AND clear live flags
__TQ.stitch                       // getter — active stitch ceremony or null
__TQ.spell                        // getter — spellState ({cooldownT})
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
- Body types: Astro visibly lanky standing AND sitting (sits tall; the
  topknot verified here was removed in session 6 — he's a shihpoo); Doc
  unchanged. Both dogs sit within ~3.5s of Toots
  idling (frame 210 from a cold approach), Doc first.
- Facing telegraph (post-headphone-removal), screenshot-verified: pupils
  track E/S, whites shrink to back-of-head at N. Continuous on diagonals
  by construction (all lerps off fx/fy).
- Doc's tail curl: plume arcs over the back standing AND sitting, tip
  sways with the wag; Astro's straight tail unchanged.

## Verified in session 5 (scripted __TQ.step + screenshots, both styles)

- All six rooms bake and populate in both styles, no console errors;
  perf 0.4–1.3 ms across exteriors, interiors, night, and print mode.
- All six edge crossings (hearth↔meadow, hearth↔green N/S, hearth↔lane)
  land at correct entry points with both dogs in-bounds. NOTE for future
  scripted tests: the edge trigger needs x/y strictly past the 12.5px
  threshold — place the player at 10/950/534, not 14/946/530.
- All four door crossings (shop in/out, home in/out) work with no
  re-trigger; dogs arrive via placeDog (wall-blocked spots fall back to
  Toots' feet).
- Doc's comfy compass: sits and faces the lane hoop (face angle verified);
  at home he stares at his own dog bed. First test failed because Toots
  idled next to a mite spawn and kept getting knocked — park test subjects
  away from mites.
- Astro finds the shop's loose-floorboard secret (~90 frames) and the
  green's stone-ring secret through the ring's south gap (~220 frames —
  seek() gets him around the stones).
- Jessie in the shop: 4 pages incl. the new hoop line, talked_jessie set;
  3-hit combo kill regression passes (hp 3→2→1→0, slain_mite set).
- Night: lit windows spill light onto the street (per-building window
  lights), lamps keep interiors livable, torch pools unchanged.

## Verified in session 10 (dog photo-canon — scripted __TQ.step + screenshots)

- Boot clean, no console errors, before and after every change below.
- Both dogs screenshot-reviewed at 2.6×/4.5× canvas zoom, sitting AND
  trotting, in paint and print modes, at pinned noon: Doc's silver +
  blaze + squint + olive collar + brass tag; Astro's two-tone +
  curtain ears + pooled tail + mint tracker + brass tag + beard tinge.
- 1× legibility check (the one that matters): both dogs stay instantly
  identifiable at gameplay zoom; the collar hardware reads as single-pixel
  glints, not noise.
- Astro's ink eye vanished on the darker head at first pass — fixed with
  a cream backing ring (session 7's "dark fur gets light features" law,
  applied again). Bliss arc re-verified on the new head color while sniffing.
- Title screen inherits the palette recolor (it draws from PALETTE.dogDoc/
  dogAstro directly): silver Doc + charcoal Astro, screenshot-verified.
- Print mode: markings drift with the color plate over registered ink,
  as they should; two-tone + blaze read through the drift.
- Test hygiene notes: dogs re-heel over manual placement within a frame —
  freeze with `game.hitstopT = 9999` to stage portraits (rendering
  continues); `setTime` re-pins are needed between screenshots because
  stepped frames advance the clock (dusk crept into two shots).
- Building turn dial (same session): shop (turn -0.55) and home (+0.4)
  screenshot-reviewed at 1×/1.6×/2×/2.5× — sheared baseline, corner
  post, lit east wedge / shaded west shoulder, windows/door/timber/
  chimney/sign all riding the shear; print mode (plate drift + no
  halftone on the lit face) and night (lamplit windows + spill on the
  sheared wall) both pass; door walk-in regression: north walk into the
  shop door still lands in shopInterior; 60 fps, ~1.2 ms; no console
  errors.

## Verified in session 9 (the depth pass — scripted __TQ.step + screenshots)

- Boot clean, no console errors across every check below; 59–60 fps,
  ~1.4 ms/frame in the green with the full monument scene, both styles
  (budget ~16 ms) — the shadow pass is a dozen ellipse fills.
- Monument composition screenshot-reviewed at 2.3× zoom in BOTH styles:
  dial overhangs the slab like the render, ticks/hairlines/needle-glow
  read, stitch band with the one orange X, moss, stone facets + rim
  lights, halftone shadows in print mode, plate drift horizontal-only.
- Collision against the new bodies, driven by synthesized key events
  (they must carry `e.code`, not `e.key` — the input reads code):
  walking north into the Tuner stops at y=220 (collider 26 + body r),
  west into the W stone stops at x=544, open-grass control moves freely.
- 3-hit combo regression: hp 3→2→1→0, slain_mite set. NOTE for future
  scripted combat: knockback pushes the mite out of the fixed swing
  spot — close the gap with a few east-walk frames between swings or the
  third hit whiffs (it did; that's the fight working, not a bug).
- South gutter crossing green→hearth mid-transition and landing verified
  (entry 250,110, dogs in-bounds); drawShadows runs inside both sliding
  panels with no errors.
- Astro found the RELOCATED green secret (640,252 — the Tuner's foot)
  through the ring's south gap unprompted during setup (neon "!"
  screenshot) — reachability confirmed by dog.
- Clear as Day cast at the monument: cooldown runs, wavefront crosses
  stones/Tuner/secret, no errors, print mode simultaneously on.
- Midnight: the Tuner's dial punches its own light pool; flanking stones
  catch the edge of it; torch pools and Toots' own light unchanged.
- Shop interior regression: hoop keeps its anchor shadow, no directional
  pass indoors, Jessie/furniture untouched.
- Test hygiene note (session 8's lesson, re-learned): the rAF loop runs
  in real time between preview eval calls — mites knocked Toots through
  TWO gutters (green→hearth→meadow) while I was reading screenshots.
  Pin the player, park the mites, and pin tDay before every shot.
- Round two (building sides + tree volume), screenshot-verified: shop at
  2.4× — west wall + orange hip + under-eave band read, seams covered by
  the front faces' ink; home in the lane — slate hip + chimney coexist;
  hearth at midnight — volume survives the darkness pass, window spill
  unchanged; print mode — all new shaded faces take halftone screens;
  green wide shot — trees rounder, monument unchanged. 59–60 fps,
  0.9 ms/frame at the full hearth scene. No console errors anywhere.

## Verified in session 8 (title screen)

- Title renders at 60.4 fps measured over 90 rAF frames (the static/copy
  dot fields are the priciest elements and still cost ~nothing).
- Iterated from screenshots: arc rebuilt source-over after 'lighter'
  bleached on paper; static field densified; the copy moved inboard of the
  frame and given its negative-space halo — it now reads on the second
  look, faceless, behind the dead tower.
- Any-key lift verified: keydown → 0.85s eased slide revealing the live
  game; post-title combat regression passes (scripted kill, hp→0); game
  keydown bindings dead while the title is up, alive after.
- "YOUR STITCHES HELD · RESUMING" line appears only when a save exists.
- Incidental find: left idle in a tab for minutes, a mite knocked Toots
  across a room edge and the crossing autosaved — the game can play
  itself into a save. Harmless (arguably canon), noted for test hygiene:
  wipe before boot-state assertions.

## Verified in session 7 (scripted __TQ.step + screenshots, both styles)

- 3-hit combo regression passes against the reworked mite (hp 3→2→1→0,
  slain_mite set, key spinning throughout).
- Close-up verification at 2.2×/4× canvas scale (set `canvas.style.width`
  and scrollTo — cheap zoom for shape-grammar review): wind-up key + cream
  X patch + rivets read; telegraph shows inflate + hot eyes + key spin-up;
  dash slings the poncho visibly behind Toots; uneven eyes read at 1×.
- Two contrast bugs caught at 4× and fixed: Doc's tooth was cream-on-cream
  against his snout (now an ink-outlined triangle past the jaw) and
  Astro's bliss arc was ink-on-charcoal (now cream — dark fur gets light
  features, see decisions).
- Kill in print mode: THOK! + parts scatter through the halftone; flowers
  read as warm dots in both styles; 59–60 fps, ~1.3 ms print.
- Clean fresh boot after wipe, no console errors.

## Verified in session 6 (scripted __TQ.step + screenshots, both styles)

- Boot clean, no console errors; perf 0.7–1.0 ms painted / ~1.3 ms print
  with a live pulse on screen (budget ~16 ms).
- 3-hit combo regression passes post-integration (hp 3→2→1→0, slain_mite).
- Hoop stitch: Space near the lane hoop starts the ceremony (player
  input-locked, faces the hoop), save written on frame one with correct
  room/x/y/flags/tDay, ceremony runs the full 1.25s, "× STITCHED" HUD cue.
  At the hearth hoop the first test got interrupted by the mite spawn 61px
  away (session 5's lesson re-learned: park test subjects away from mites)
  — which also proved the interrupt path: ceremony broke, save survived.
- Autosave: east crossing lane→hearth wrote roomId hearth, entry-point
  position, flags intact.
- Full round-trip: location.reload() restored room, position (22,290),
  flags, and time of day; dogs placed in-bounds (after fixing gotcha 13,
  which this exact test caught: Doc constructed at x=-18, bricked; now
  placeDog clamps at boot — re-verified Doc chases 280px across the room
  and sits).
- Clear as Day, screenshot-verified in both styles: waveform front + echo
  ring + calibration hairlines, all ground-plane ellipses; secret ping X at
  the green's stone-ring center; print mode adds radial ink dashes chasing
  the front. At deep night the pulse punches an expanding ellipse of
  daylight through the darkness pass (light.js sy squash) — the spell
  clears the dark, as named.
- Routing regressions: second F blocked during cooldown, needle returns and
  station dot re-lights after 5s; F dead during dialogue; J attacks beside
  a hoop; Space stitches beside a hoop with no NPC near; Jessie's dialogue
  unaffected (talked_jessie sets).

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

- No audio (WebAudio oscillator SFX planned — fits the frequency theme;
  the spell cast is begging for an oscillator sweep).
- No hearts/death for the player (knockback only) — which means the save
  has nothing to restore on death yet; wire that when hearts land.
- No Archive rooms yet; Clear as Day's true job (revealing Archive geometry
  in the Hollow) is stubbed as secret/hoop/door pings until the mirror
  exists. No mana/Signal Strength — cooldown stands in for it.
- The frequency dial HUD shows one station; the hold-to-tune interaction
  (PRD §4.3) arrives when there are two spells to choose between.
- Dialogue is linear pages only — no choices, no quest hooks yet.
- No "new game" path from the title — any key resumes the save if one
  exists; wiping is `__TQ.wipe()` only. Fine until strangers play it.
- Jessie/Wren still use skin-tone faces; only Toots got the ink-figure
  treatment (he's unique on the cover art too — probably correct, but
  revisit when more NPCs exist).
- Wren's sprite is serviceable, not lovable — his cap/beard read muddy at
  1×. Candidate for a polish pass.
- Diagonal path stair-stepping (see gotcha 2).
- `__TQ` debug handle ships in the page (intentional for now).
- Not wired into the site: no `/tootsquest` rewrite in vercel.json, no share
  page, no portfolio card. Do this at M1 or M2, not before.

## Next session: finish M1 (PRD §6)

Sessions 5–6 cleared the queue except its headliner. What remains is the
one item that was deliberately deferred for concept art:

1. **Tuning Stone mechanic + 3 Archive mirror-rooms** — phosphor/amber
   palette, scanlines, darkness-first lighting (light.js's pass, tuned
   harder). **The Tuner now STANDS in the green (session 9's depth pass
   — look, moss, dial, ring composition all previz'd in-engine); what
   remains is making it DO something:** the world-flip interaction, and
   the Archive side. Decide: does the Archive keep the paper gutter, or
   transition differently (microfiche frames? fade)? — open question from
   PRD §6. `CONCEPT_SKETCHBOOK.md` batch 1 items 2–3 (Archive-as-
   microfiche, the crossing moment) exist precisely to settle that before
   code. Check the sketchbook's "Picks and decisions" log — if Charles
   has filled it in, build to it. Clear as Day's reveal hook is waiting:
   when mirror-rooms exist, add Archive geometry to castSpell()'s target
   gathering.

Also queued, lower priority:
- **Dog follow-ups** (canon migration itself is DONE — both dogs are in):
  Doc's pointing-at-comfy behavior needs targets — wire it to hoop save
  points / hearts / the inn when those exist. Astro's dig spots are an M3
  system. Doc's Pest Mode (PRD §2.5) is a design hook for M2+. **Combat
  roles decided July 2026 (PRD §2.5, M2+ hook): Doc harasses/staggers
  (fully autonomous, no commands) and his failure state is being taken
  hostage — no dog HP ever; captured Doc nags via nonstop §4.2
  onomatopoeia barks, grabbers can drag him one screen away for a brief
  rescue aside, and Pest Mode Doc gets grabbed more (care loop = combat
  prep). Astro never fights and can't be grabbed; he digs mid-combat.**
- ~~**Mite render-style pass**~~ **DONE session 7** — went with the
  keeper's wind-up key instead of spring antennae; per-instance identity
  (size/tone/rivets/patch/key phase) included.
- **Physics-rope tails/ears** (idea borrowed from a 3D SDF-blend-shell
  write-up, July 2026): render dog tails/ears as 2–3 segment rope chains of
  curvedCapsules — parametric (no frames), floppy juice, and the future
  gull-airlifts-Doc hostage animation basically requires a dangling dog.
- Ink-weight / per-instance treatment for characters generally (uniform
  outlines today).
- Scale tree collision radius with visual scale if scale variance ever
  exceeds the current 0.85–1.2×.

Remaining open questions (PRD §6): gamepad timing, loudness of real-life
references, Archive transition style (see item 2).
