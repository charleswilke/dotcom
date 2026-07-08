# Toots Quest — Concept Sketchbook

Generator prompts for visual development. Chip away, tweak, replace. Written
July 2026; first-blush drafts by Claude, to be reworked by Charles.

## The sketchbook rule

AI renders are the sketchbook, never the printer. Every render is reference:
it gets *translated* into shape grammars and canvas paths, then discarded.
Nothing generated ever ships. The translation step is where the style gets
enforced, and where the design gets better than the reference (precedent:
the cover-art renders became in-game Toots, and the translation cut the
headphones).

Corollaries:

- **No renders in this directory, ever.** The ship criterion is zero image
  files in `games/TootsQuest/`. Keep renders in the Higgsfield library or a
  folder outside the repo.
- **No AI video inside the game, ever.** Living Ink next to diffusion
  footage reads like a hand-inked comic with a stock photo pasted into one
  panel. Story beats belong in the renderer.
- **The trailer is the one sanctioned exception, and it's lore:** the world
  is drawn by hand; only its *recording* is synthetic. Same rhyme as the
  Archive being the microfiche of the hand-printed page. (M2-era task.)

## How to prompt (what translates, what doesn't)

- **Anchor with the cover art.** Feed the existing Toots cover renders as
  the style/character reference. Consistency tools are the whole reason to
  use one platform for this.
- **Ask for flat shapes and heavy outlines.** Painterly detail that can't
  be reduced to ~10 canvas paths is noise, not inspiration.
- **Batch variations, don't perfect one image.** Eight rough takes on one
  subject teach more than one polished take. We pick silhouettes, not
  pixels.
- **The acid test is 40 pixels.** If the silhouette wouldn't read at
  gameplay scale, the concept fails no matter how good it looks big.
- **Camera:** top-down 3/4 like classic Zelda for anything meant to be
  seen in-game; straight-on model sheets are fine for characters.

### Reusable style block (paste into every prompt)

```
Hand-inked storybook illustration in the style of a Sunday newspaper comic:
flat rounded vector shapes, bold dark-indigo (#221a56) outlines with varied
hand-pressure line weight, warm cream paper (#f8e9d2), burnt orange (#f76e11)
accents, slate blue (#2c4f7c) shadows, golden path tan (#e7c98f). Neon teal
(#00f7c2) appears ONLY on magical or interactive elements. Top-down 3/4
adventure-game view. No gradients, no photorealism, no pixel art, no
texture detail — clean shapes a vector artist could trace.
```

For Archive subjects, swap the palette line for:

```
Near-black void (#0a0a1a), amber microfiche phosphor glow, scanline shimmer,
neon teal (#00f7c2) for magic and interactive elements, hot orange (#ff5a36)
for danger. Everything reads as a glowing recording of the daylight world,
like standing inside an oscilloscope.
```

---

## Batch 1 — next build session (M1)

### 1. The Tuning Stone

The world-flip landmark: a vintage radio dial standing in the landscape,
rising at the center of the green's stone ring. The most-looked-at object
in the game. The render must answer: monolith with a dial face, or cabinet
radio grown into a standing stone? How weathered? Where does the neon live?
How does the dial face read from the 3/4 camera at Toots scale (he's about
40px tall against it)?

> A mysterious standing stone shaped like a vintage radio tuning dial, rising
> from a grassy grove inside a ring of smaller standing stones. Part ancient
> monolith, part 1940s cabinet radio: a large circular dial face with
> frequency tick marks, a single needle, moss and cream-colored cross-stitch
> banding at its base. The dial's needle and one frequency marking glow neon
> teal; everything else is stone, timber, and brass gone green. A small
> ink-black hero in an orange poncho stands before it for scale. [style block]

Variation axes: dial face size relative to body · upright slab vs. leaning
cabinet vs. obelisk · how loud the radio-ness is (subtle carving vs. full
speaker grille) · intact vs. half-swallowed by the earth.

### 2. The Archive: the hearth square as microfiche

Not a new place: a *translation*. The same town square (shop, square, hoop,
boulders, pond) rendered as the Archive's phosphor recording of itself. The
render must answer: do buildings become wireframes, ghosts, or solid
glow-edged blocks? How much of the ground reads? How dark is dark?

> The same village square rendered twice, side by side: on the left, a warm
> hand-inked storybook town square with a timber shop and an embroidery hoop
> on a stand; on the right, the identical square as a phosphor microfiche
> recording — near-black void, every building and tree redrawn as glowing
> amber line-work and dim phosphor shapes, scanlines, the embroidery hoop's
> stitches glowing neon teal, light pooling around a lone figure and falling
> off into true darkness. Same composition, same camera, two moments of the
> same document: the page as printed, and the page as preserved. [style
> block + Archive palette line]

Variation axes: line-work density (blueprint-sparse vs. nearly solid) ·
amber-only vs. amber-plus-green phosphor · how much cream/ink survives
into the mirror.

### 3. The crossing moment

This one settles an open design question (PRD §6): does the Tuning Stone
crossing keep the paper gutter, or become its own transition — microfiche
frames advancing, a fade, a scanline wipe? Ask for the *moment of
crossing*, two or three ways.

> A comic page depicting a magical world-crossing in progress: in one panel
> a warm cream-paper storybook world, in the next panel the same scene as a
> dark amber microfiche recording, and between them the transition itself —
> option A: a cream paper gutter the hero physically steps across; option B:
> the page caught mid-turn on a microfiche reader, motion-blurred frame edges
> and a scanline sweep; option C: the ink of the daylight panel un-printing
> line by line into glowing phosphor. The hero (small ink-black figure,
> orange poncho, neon sword) is halfway through, half printed and half
> phosphor. [style block + Archive palette line]

Pick the one that feels inevitable. If none do, the gutter stays and that
question is closed anyway.

### 3.5 The hero image / title panel (in progress, July 2026)

Charles has a strong draft going (dutch-angle hillside, logo slammed in the
corner, both dogs in the action). Revision notes from the canon check, plus
the big-bad allusion:

- **Swap the dogs' jobs.** Canon (PRD §2.5, from the real dogs): Doc
  fights, Astro doesn't care. Doc should be the one latched onto a beetle;
  Astro should be at the edge of the frame blissfully digging, ignoring
  the battle entirely.
- **The blade is neon, not steel.** The sword is the player's magic made
  visible; the teal accent belongs to the blade AND its arc.
- **Poncho, not tunic**, ragged hem, cream cross-stitch X on the chest.
- **The Static appears as the print failing**, not as a creature: far
  ridgeline where color drains to raw uninked line art, halftone decaying
  into television static, one dead broadcast tower. The villain is the
  absence of print, creeping toward the warm foreground like weather.
- **The copy silhouette is in, and it's ambiguous** (Charles, July 2026):
  barely visible inside the static, a grotesque faceless distortion that
  only *maybe* is Toots. No eyes, nothing you could point to and say
  "that's him"; a viewer should feel the resemblance without being able to
  prove it. Foreshadows the Echo Knights and the final line ("the copy
  blinked first") on page one, but as a question, not an answer. Keep it
  faint: found on the second look, not the first.
- Open: headphones are still canon on cover art (off in-game). Charles'
  draft omits them; his call.
- **Style drift lesson (July 2026):** the first full-content render came
  back etched and crosshatched, closer to a gritty album cover than the
  funnies. Three causes: style tokens buried at the END of a long prompt
  (generators weight early tokens), detail-inviting words ("grotesque",
  "dripping", "warped", triple "scruffy"), and sheer length diluting the
  style. Fix: style first, an explicit ban list, and half the words. If a
  render still comes back textured, cut description before adding style
  words. Acid test stands: would these characters read at 40px?
- **Whatever lives in the last clause dies (v3 lesson):** v3's simplified
  style worked, but "tilted composition, action lines" sat at the prompt's
  tail and the render came back level and static, with Toots standing
  flat-footed. Camera and motion language moved up front in v4, right
  after the style block. Corollary: anything that MUST survive goes in the
  first third. Also: the static figure grew eyes in the v3 render —
  "faceless" now says "strictly faceless, no eyes" because the model will
  put eyes on anything with shoulders.

- **Toots connects (v5):** a swing at nothing read as posing, so the arc
  now ends in a beetle mid-vanquish — knocked tumbling, parts flying, with
  a small hand-lettered THOK! at the impact (the game's own onomatopoeia
  system, §4.2, doing cover duty). Watch that the THOK! stays small: two
  pieces of lettering can fight, and the logo wins every tie. If a render
  crowds, cut the word before cutting the beetle.

Current revised prompt (Toots connects, v5):

> Simple flat cartoon title panel for "TOOTS QUEST" in a clean Sunday
> newspaper comics style: characters built from a few big rounded shapes,
> bold dark-navy outlines, flat color fills, minimal interior detail, no
> crosshatching, no etching, no painterly texture; soft halftone dots for
> shading on aged cream newsprint. The whole panel is tilted on a dutch
> angle, the horizon running diagonally corner to corner, low camera
> looking up the hillside, everything caught mid-motion and off balance.
> Center: the hero, a small ink-black blob with enormous round white eyes
> and tiny pupils, a tuft of hair, ragged burnt-orange poncho with one
> cream X stitch, caught mid-lunge in a full-body sword swing — torso
> twisted into it, legs driving forward, feet off the ground, poncho
> whipping behind him, his glowing teal blade smearing a huge curved arc
> of teal light that connects square with a rusty windup beetle at the
> arc's end: the beetle knocked tumbling backward through the air, a
> spring, a bolt and a bent antenna flying off it, a small hand-lettered
> "THOK!" burst right at the point of impact. Left: a small cream-gray
> shih tzu,
> grumpy scowl, dark collar, chomping a round rusty windup beetle, a
> spring and bolts popping loose. Right: a lanky charcoal shih tzu/poodle
> mix, huge happy grin, orange collar, ignoring the battle, digging, dirt
> flying, a teal-glinting trinket unearthed. On the far ridge the print is
> failing: color fades to bare paper, a field of gray halftone static, one
> plain dead radio tower, and faint in the static a tall ragged silhouette
> made of dots, strictly faceless, no eyes, only vaguely echoing the
> hero's shape. Fat bouncy hand-lettered "TOOTS QUEST" logo slammed at an
> angle into the top corner with a halftone drop shadow. Speed lines and
> dust puffs. Flat warm palette: cream, burnt orange, olive green, deep
> indigo; teal only for the sword and the magic.

---

## Batch 2 — simmering (M2 pre-work)

### 4. The Curator

Boss of the Cathedral of Junk: a colossus of reclaimed parts. Needs a
silhouette, an assembly logic (what junk, joined how), a face or a
face-shaped absence, and a damage direction (it comes apart, it doesn't
bleed). Also: how does it hold something precious? The Curator *curates*;
it should cradle, not crush.

> A towering gentle-terrible colossus assembled entirely from salvaged junk:
> radio cabinets, bicycle wheels, bathtubs, brass horns, picture frames,
> a chandelier ribcage. It stands in a vertical cathedral of stacked scrap
> lit from high windows. Its "face" is an arrangement of dials and one cracked
> porcelain plate; one neon teal point of light burns where an eye should be.
> One enormous hand cradles a tiny glowing object with unexpected care. A
> small ink-black hero in an orange poncho stands in its shadow. Full-body
> silhouette must read as a single hunched figure. [style block]

Variation axes: hunched vs. towering-straight · dense junk vs. airy
scaffold with gaps of daylight · one eye vs. many dials · how visible the
"seams" are (magnet-vulnerable joints are a mechanic).

### 5. Cathedral of Junk: interior vocabulary

Not a boss, a *tile set*: what walls, floors, and junk piles look like in
Living Ink, so the dungeon gets its own F/B/V tile language. The holy-place-
made-of-garbage tone matters: reverent, warm, absurd.

> Interior of a cathedral built from salvage: walls of compacted flattened
> junk pressed into strata like sediment, floors of mismatched salvaged
> tiles and hammered street signs, columns of stacked washing machines and
> radios, shafts of warm light from holes in the scrap ceiling, hanging
> mobiles of spoons and gears. Reverent and absurd at once. Wide establishing
> shot plus close-up corner details of the wall and floor materials. [style
> block]

### 6. Enemy model sheets: Rust Golem, Gull Bomber, Static Wisp

One subject per sheet: front and 3/4 views, a telegraph pose (enemies
inflate or lean back before attacking), and a beat-up state. The Rust
Golem sheet must include him holding something small under one arm: that's
Doc's hostage pose, and the grab should be designed into the body plan,
not bolted on.

> Character model sheet for [ENEMY], an enemy in a hand-inked adventure
> game: front view, three-quarter view, an "about to attack" telegraph pose
> where the body inflates and leans back, and a damaged state where the
> shapes desaturate and jitter apart. Simple silhouette readable at small
> size. [style block]
>
> [ENEMY] = a lumbering golem of rusted plates and salvaged girders, one arm
> oversized, shown in one extra pose carrying a small grumpy shih tzu tucked
> under that arm while fighting one-handed
>
> [ENEMY] = a scruffy seagull in aviator goggles hauling a small bomb-shaped
> basketball, mid-swoop (TootsJam cameo — keep it recognizably the same gull)
>
> [ENEMY] = a wisp of television static barely holding a body shape,
> phasing between solid ink and dissolving noise, neon-white eyes

The Junk Mite restyle already has its reference (the cover renders: spring
antennae, bolt tips, rivets, rounder rustier bodies). No new prompt needed.

---

## Later: motion reference (video, not stills)

Closer to M2+, image-to-video on approved concepts, used as AI rotoscope
reference for parametric animation (watch the motion, steal the timing and
arcs, write the sine parameters):

- The Curator's gait: how does that much salvage shift its weight?
- The Gull Bomber airlifting Doc (dangling, furious; feeds the rope-chain
  tail/ear physics already queued in the handoff).
- Static Wisp phasing: what does "coming apart and reforming" look like at
  a readable speed?

## Picks and decisions (log what came back)

Record the keeper from each batch here, with the decision it settled, so
the next session inherits conclusions instead of a folder of images.

- Tuning Stone: —
- Archive look: —
- Crossing: —
- The Curator: —
- Cathedral vocabulary: —
- Enemy sheets: —
