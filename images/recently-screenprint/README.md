# Recently: screenprinted edition

The homepage chooses between the original six cards and this screenprinted
edition with equal probability on each full page load. `/recently-edition.js`
chooses in the head and mounts the selected markup synchronously before the
homepage's DOM-ready initializers bind the album, slide and game lightboxes.
The original card content and artwork are retained. The classic cards retain
Toots Jam; the poster edition uses Space Toots.

Direct review links: `/index.html?recently=classic#portfolio` and
`/index.html?recently=posters#portfolio`. Overrides are URL-only and do not store
a visitor preference. Normal URLs make a fresh random choice. Original image
URLs are activated only for the classic edition, with per-image `noscript`
fallbacks. The poster template is inert until selected. Only the selected Toast
IQ artwork is preloaded, and the lighting script loads only for the posters.

Shared production presentation lives in `/recently-posters.css` and
`/recently-posters.js`. The local wall study `/recently-posters-preview.html`
adds `/recently-posters-preview.css` for its toolbar and plaster backdrop.

`/recently-posters-in-context.html` shows the actual homepage in a same-origin
iframe pinned to `?recently=posters`. It retains the native
`.dimensional-showcase` backdrop, dot texture, colored glows, header and
surrounding sections. The preview-only base page styles are
scoped to `.poster-study`; the production stylesheet has no page-wide resets or
plaster backdrop. This older study remains available for comparison.

Verified during integration: both forced editions, fresh random page loads
producing both choices, unique active IDs, phone/two-column/three-column layouts
without horizontal overflow, album and slide lightboxes, and the Space Toots
overlay opening and clearing its iframe on close. The activated classic markup
matches the original section exactly. Source and production-minified JS/CSS
were checked; the classic image `noscript` fallbacks are retained.

## Selected edition

1. Toast IQ — cobalt and orange.
2. The Before Times — deep teal and amber.
3. Junkyard Cabaret — burgundy and golden yellow.
4. Grief Without Ritual — charcoal and brick red.
5. Spectator to Initiator — forest green and golden yellow.
6. Space Toots — midnight violet and magenta, with the player's ship.

Space Toots replaces Toots Jam in this edition. The original bonus Space Toots
proof without the ship is retained as `space-toots.webp`; the preview uses
`space-toots-ship.webp` and live metadata numbered 06.

## Assets and generation briefs

All poster art was generated with the built-in ImageGen tool. The WebP versions
here use `cwebp -q 88 -m 6` on the approved generated PNGs, without overwriting
the originals. No generated files outside this repository are required to serve
the study.

Common generation brief: one flat, front-facing 4:5 screenprinted project poster
on warm uncoated cream paper, exactly two spot inks, oversized heavy condensed
grotesk title, fine metadata and caption rules, one strong central illustration,
restrained halftone dots and uneven ink coverage. Square corners, generous paper
margins, accurate existing project copy. Avoid neon, gradients, CRT frames,
photographic presentation, drop shadows, heavy fake aging, or extra text.
The Toast IQ proof serves as the style reference for the remaining series;
the Before Times proof is also supplied as a companion reference.

Project-specific generation briefs:

- Toast IQ: cobalt title, oversized orange serving cloche whose dome becomes a
  speech bubble, cobalt tray, cream paper and sparse emphasis rays.
- The Before Times: deep teal monumental open archive doorway, golden amber door
  and halftone light spilling toward the viewer, nested passages beyond.
- Junkyard Cabaret: burgundy patched top-hatted barker tipping his hat, other arm
  extended, golden spotlight, restrained curtains and two starbursts.
- Grief Without Ritual: charcoal three-line title, roughly sixteen separated
  brick-red polygonal fragments loosely forming a heart with an open center.
- Spectator to Initiator: forest-green split seed and shoot with two leaves,
  golden five-to-seven-petal abstract flower, small emphasis rays.
- Space Toots: violet two-line title, magenta four-point Shepherd core, two broken
  orbital rings and six chunky violet asteroids with cream facets.

Final Space Toots edit prompt (built-in ImageGen, using the approved poster as
the edit target and `images/games/spacetoots-opening.webp` as the ship reference):

> Add the game's player ship to the lower-left foreground of the approved Space
> Toots poster, pointing diagonally up and right, skimming in front of the orbital
> system without covering the core. Keep the six asteroids and broken rings.
> Preserve the ship's long pointed wedge nose, swept wings, twin engine nacelles,
> wedge canopy and twin short exhaust flames. Adapt the turquoise ship to the
> poster's two inks: midnight violet body, magenta panels and exhaust, cream
> canopy and facets, with matching halftone texture. Keep the paper, typography,
> footer and all copy unchanged. Change RECENTLY 07 to RECENTLY 06.

Generated PNG source names, retained in the original ImageGen output directory
`/Users/cwilke/.codex/generated_images/01a17b1d-c80c-7c10-9538-d43fc71175d2/`:

| Workspace asset | Original PNG |
| --- | --- |
| toast-iq.webp | exec-1894d74d-4b82-42b3-adba-5843bb4212a1.png |
| before-times.webp | exec-ae886279-23c8-4449-84b9-9c6fe703d702.png |
| junkyard-cabaret.webp | exec-6893236b-aaf3-4970-8bcb-5a02e31420d7.png |
| grief-without-ritual.webp | exec-c0e584d6-0eed-4952-a521-bd79a0de4b6d.png |
| spectator-to-initiator.webp | exec-c6429935-57b1-43ed-af37-ca4724e2c800.png |
| space-toots.webp | exec-6b101341-a0c6-4d79-9ed8-e7c09f0a0a39.png |
| space-toots-ship.webp | exec-79c2623a-8295-44e1-ac26-e149610d4a94.png |

## Presentation

The CSS artwork window crops out each proof's baked-in metadata and caption.
Those are live HTML, including the Space Toots edition number. Raster title art
has corresponding accessible HTML headings. Cards remain single native links.

The wall uses a static repeating SVG plaster texture. Each paper silhouette uses
a slightly different CSS clip path and fixed small rotation, with close contact
shadows and faint paste/crease layers. The paper stays flat, with the light
providing the hover highlight. Each poster has a fixed, distinct crease angle
and position, defined by
`--crease-angle` and `--crease-position` on its card. A warm overhead spotlight swings to the hovered or
keyboard-focused print: a tapered beam and oval light pool move with a damped
spring while other prints dim slightly. Animation stops when the lamp settles;
only the two lighting layers receive JavaScript frame updates. Thirty-two subtle
dust motes (0.65–1.4px) drift within the beam using CSS transform/opacity animations
with different sizes, phases and speeds. Uneven, softly blurred light rays
converge on the lamp, with a slowly shifting secondary haze layer and feathered
cone edges. These effects run only while a poster is highlighted
and the wall is visible; hidden tabs pause them too. Reduced motion snaps the
light into place, hides the dust, and leaves the rays static. Touch uses the ambient wall lighting. Layouts are three columns
at 1200px, two at 768px, and one below.

Local link paths use the actual HTML files so the standard Python HTTP server
can open them without Vercel's rewrite rules.
