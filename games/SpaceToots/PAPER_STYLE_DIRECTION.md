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

### First playable sample (in the game now)

The player ship, the drone, the weaver, Karen, the bomber, their deaths, and the sky are restyled behind `PAPER_SAMPLE` in `index.html` (the `PAPER GAMEPLAY SAMPLE` section). Add `?classic` to the URL to get the neon versions back in the same waves, so the two can be compared in play. Nothing in the sample touches a hitbox, a speed, or a spawn.

- **Ship:** `drawPaperShipBody` draws the opening ship's panels (same wings, nacelles, wedge canopy, same inks) under `drawPlayer`'s existing pitch/bank/roll transform. Each panel casts a page-dark copy of itself a couple of pixels down-right onto the panel beneath, which is where the layered-paper depth comes from; there is no glow. Wings trail vertical motion, a fresh shot kicks the hull back, and the exhaust steps through a fixed seven-value cycle every three frames instead of re-rolling per frame, so it flickers like paper swapped under a camera.
- **Gear:** `drawPaperShipGear` glues what the ship is carrying onto the hull as more paper, in two passes (under the wings before the fuselage, nose and spine after). Each secondary has its own piece in its pickup colour: homing is violet missile pods under each wing (two per side while more than half the ammo is left, one after), wave is a green emitter fan on the nose that opens wider on the pulse, spread is an orange rake of three barrels that shorten on recoil, shield is a cyan dome on the spine with a breathing cream bead, laser is a long red cream-tipped spar past the nose that runs hot while the beam is out. A new pickup pops on with a settling spring driven by the HUD's `secondaryFlash` clock, and every piece kicks back on the frames after it fires (`secondaryFireTimer`). The primary weapon shows too: dark cannon stubs beside the nose at level 2, a third down the middle from level 3.
- **Drone:** `drawPaperDrone` prints the asteroid's own outline in violet ink, cuts its cracks into that base sheet as scissor lines, and glues a smaller lighter facet over them. Shapes come from the verts the enemy already carries, so nothing changes between frames. Caught in the Shepherd's suction it prints in alarm reds.
- **Weaver (The Wobbler):** `drawPaperWeaver` rebuilds the flat double-delta as a layered interceptor: canards, main delta with a pale wing tip, twin tail fins, belly stripe, cream canopy, nose to the left. It banks from the y it actually moved this frame (honest at any speed), rocks slightly because it is a Wobbler, steps its orange exhaust on the same cycle as the player, and cracks its bomb bay open with a cream mine peeking out for the last twelve frames before a drop, so the mine is telegraphed. The first pass was one polygon and two dots, which read as unfinished next to the paper ship.
- **Karen (charger):** `drawPaperCharger` is the drone's construction in rust inks with an orange-cream facet, and it acts on its beats. Over the last sixty pixels before the trigger line it shivers harder (a fixed four-step shake, stepped every two frames), and once triggered it leans toward the row it is diving for, stretches along the rush, and leaves two stepped paper ghosts behind it, as if the frames couldn't keep up. Shepherd-inbound and suction states keep their existing behaviour.
- **Bomber (Oops):** `drawPaperBomber` is a fat plum fuselage with broad swept wings, a nacelle and stepped flame on each wing, twin fins and a cream canopy, bobbing gently. The belly bay parts around a cream, red-nosed bomb that lowers into view over the last twenty frames before the drop, so the bomb is telegraphed; on release the whole plane hops up a few pixels and settles, which is the "oops".
- **Sky:** `drawPaperSky` replaces the one-layer white starfield, gradient nebulae and glowing planets with a multiplane camera, the cut-paper animator's own trick: flat sheets at different distances, each sliding at its own speed. Far to near: 90 cream specks; five torn nebula sheets in deep violet, navy and plum at 11 to 13% with a page-dark second sheet under each for thickness; cut planets (flat disc, glued page-dark crescent on the shadow side, a flat paper band behind and in front when ringed), moons and galaxies (a cut annulus with a cream core on a tilted ellipse); 22 of the opening's paper stars turning on their threads; and three big dim stars that cross fast in front of the grid. Twinkle is a stepped flip between three cut poses on each star's own clock, never a fade. One body in eight is the opening's CW planet, far back, as a wink (`CW_PIECES` is shared with `drawOpening`). No gradients anywhere. Foreground debris streaks are cream. The classic sky is intact under `?classic`.
- **Death:** `spawnPaperBurst` fires a short white flash, one expanding ring printed twice (magenta under, cream over, misregistered like the letters), and nine torn shards in the enemy's own inks (`PAPER_INKS`) that spin out and drop off the page; the weaver's burst is a size larger than the drone's, and Karen's and the bomber's larger again. Shard shapes are cut once at spawn. Rings and shards ride the existing `particles` pool with a `kind` field.

Still to evaluate: readability in dense waves, performance on mobile, and whether the drone's violet reads as hostile enough next to magenta enemy fire.

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
