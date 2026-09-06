# Space Toots — paper style direction

Design notes for discussion. These are proposed directions, not implemented gameplay changes.

## Bringing the intro style into gameplay

Carry the intro's cut-paper shapes, printed colors, and elastic motion into the game while preserving combat readability.

- **Player ship and enemies:** layered paper panels, offset shadows, expressive banking, and recoil. Keep silhouettes distinct and hitboxes unchanged.
- **Explosions:** torn fragments, expanding paper rings, and short impact flashes. Use larger visual reactions for larger events.
- **World:** layered scenery with perspective-grid distortion for boss entrances and major attacks. Keep ordinary combat calmer so those moments have scale.
- **HUD:** hand-cut stage titles and weapon announcements; crisp score, ammo, and other frequently read numbers.
- **Bullets:** strong silhouettes and selective glow, with clear separation between friendly fire, enemy fire, and scenery.
- **Motion:** intentional squash, recoil, and settling springs. Shape irregularities should be fixed per object, not randomly regenerated each frame.

### Suggested first playable sample

Restyle the player ship, one common enemy, and one explosion. Evaluate them together during actual combat before expanding the treatment across stages, bosses, and UI. Check readability in dense waves and performance on mobile.

## CW planet refinement

The letters themselves should form the planet silhouette, rather than sitting on a circular backing.

- Design a bespoke CW monogram with a roughly circular outer contour: broad curved/faceted C at left, W fitted into the right hemisphere.
- Keep recognizable internal negative spaces and a few deliberate jagged cuts. Think two paper pieces cut to assemble into a small world.
- Use a small offset underlayer for depth, without placing a separate disk behind the letters.
- On the first ship puff, rotate and compress the letterforms. Their gaps narrow, facets sweep around the edge, and the silhouette resolves into the existing more solid planet.
- Preserve enough of the CW's color and facets during the transformation that it reads as the same object changing, not a logo fading into a replacement.

## GAMES ring refinement

Replace the individually rotated orbiting letters with a tilted, physically coherent ring carrying printed text on its upper surface.

- Project an annular band as a plane in perspective, with a visible upper face and a restrained darker edge for thickness.
- Treat GAMES as a word printed on that surface. Project its glyph vertices with the same transform as the band, so its scale and foreshortening agree with the ring.
- Make the near/front arc the readable hero area. The far arc should be occluded by the CW where appropriate and visually subdued.
- Avoid flipping individual letters to keep them upright; this breaks the illusion of a shared surface. Arrange the word on the readable near arc, and control its circulation so upside-down far-side text is hidden or fades before becoming distracting.
- Start with one clear GAMES word and generous spacing. Add repetitions only if they improve the composition.
- Let the ring rock or precess gently when the ship disturbs it. During the gravity buildup, tighten its radius, tip the plane, and stretch the printed word with the band as both spiral inward.

### Questions to resolve visually

- How circular can the CW silhouette become while remaining immediately recognizable?
- Should the ring feel like a thin cream paper strip or a translucent cyan orbital surface? A thin paper strip is the initial preference for consistency with the intro.
- How much text movement is needed? A slowly rocking ring with a readable word may communicate the idea better than continuous full-orbit circulation.
