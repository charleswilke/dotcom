# Before Times — Session Handoff

Read this before doing more lobby image separation or interaction work. This is
the practical record of what exists, what worked, and what cost us time during
the July 16, 2026 session.

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
- Desk bell, radio, guestbook assembly, college bulletin board, newspaper
  stand, photography lightbox, and hanging camera: pixel-exact cutouts from
  the original room art.

The photography lightbox and hanging camera are separate buttons even though
they open the same panel, so their hover behavior can evolve independently.
The small inventory medallion is covered by a responsive `CW` monogram layer.

All five doors have hover/activation motion. Their light is produced by a
dedicated `.bt-door-light` element behind each sprite, so light spill is not
clipped by an image bounding box. Its `::before` is a narrow opening aura and
its `::after` is a restrained elliptical floor pool.

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

There is no build step. If an old image persists, bump the `?v=` cache token in
`before-times.html` and reload.

## Important files

```text
before-times.html
  Lobby markup, layered image elements, cache tokens, panels.

before-times.css
  Layer placement, glow spill, hover motion, activation animation, hotspots.

before-times.js
  Panel behavior and the delayed doorway activation sequence.

images/before-times/lobby-v1.webp
  Original flattened 1672×941 lobby art. Keep this unchanged as the source of truth.

images/before-times/layers/lobby-clean-v4.png
images/before-times/layers/lobby-clean-v4.webp
  Current runtime lobby plate. V3 removes the doors; V4 adds the broad floor
  repair while deliberately retaining the bulletin, newsstand, wall displays,
  camera station, and guestbook. V5 is an experimental all-props-removed plate
  and is not used because its multiple generated repair regions read as choppy.

images/before-times/layers/door-*-v1.png
  Full-resolution transparent masters for the four career door assemblies.

images/before-times/layers/door-*-v1.webp
  Compressed runtime versions used by the page.

images/before-times/layers/portal-angle-v1.png
images/before-times/layers/portal-angle-v1.webp
  Generated return portal already painted at the room angle.

images/before-times/layers/{bell,radio,bulletin,newsstand,photo-display,camera,guestbook}.{png,webp}
  Original-pixel object layers.

tools/before-times-clean-patches/*.webp
  Generated wall/floor repair patches used to rebuild the clean plate.

tools/build-before-times-layers.py
  Deterministic masks/compositing for the old portal, all doors, the broad
  floor repair, all extracted props, and `lobby-clean-v5.png`.
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
`tools/before-times-clean-patches/props-v1.*`, but it is not used by the live
page. Combining unrelated wall, floor, and desk repairs introduced visible
texture seams. The live V4 plate keeps the original props beneath pixel-exact
effect layers; those overlays animate through light and color without shifting
far enough to expose a duplicate. The generated repair remains available if a
future prop truly needs large positional movement and can be repaired locally.

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

The live bell uses `images/before-times/layers/bell-v2.*`, a generated clean
silhouette with no baked desk pixels or navy oval. It retains only a tiny CSS
contact shadow. The older `bell.*` remains the extraction/build source but
should not be restored to the page unless its oversized shadow matte is fixed.

The live newsstand similarly uses `images/before-times/layers/newsstand-v2.*`.
It preserves the full cabinet, top rod, side cable, and newspaper face without
the wall slivers and large floor wedge carried by the older extracted matte.

Running the helper rebuilds the PNG clean plate:

```bash
python3 tools/build-before-times-layers.py
```

It does not currently rebuild the runtime WebPs. Afterward run:

```bash
cwebp -q 92 -m 6 -mt \
  images/before-times/layers/lobby-clean-v4.png \
  -o images/before-times/layers/lobby-clean-v4.webp
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
| Games | -3.11% | -13.92% | 130.23% | 107.43% |
| Content | -0.11% | -6.34% | 118.89% | 117.09% |
| Knowledge Maze | -4.28% | -10.17% | 106.32% | 112.95% |
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

## Verification completed this session

- The page was tested at `http://127.0.0.1:8080/before-times.html`.
- All four new doorway WebPs loaded at their expected natural dimensions.
- The clean plate loaded from `lobby-clean-v3.webp`.
- Rest and hover states were visually inspected at 1280 × 720.
- The Alchemy activation animation completed and its information panel opened.
- No page errors or console errors were reported.
- `node --check before-times.js`, Python compilation, and `git diff --check`
  passed.

## Working-tree warning

At the end of this session, the Before Times changes are still uncommitted. The
modified files are `before-times.html`, `before-times.css`, and
`before-times.js`. The layer assets, clean patches, and build helper are new
files. Preserve these changes and inspect `git status` before doing any cleanup,
branch switching, or broad rewrite.

## Good next steps

The door separation problem is solved. The next session should spend generation
budget only on genuinely new interactive art. Safe high-value work includes:

- Tune each door's individual hover personality without changing its geometry.
- Add restrained sound cues synchronized to `.is-activating`.
- Separate remaining wall objects only when their intended motion requires it.
- Decide which doorway opens into a navigable second room first.
- Add a small visual regression capture for the lobby rest state and one hover
  state before making more positioning changes.
