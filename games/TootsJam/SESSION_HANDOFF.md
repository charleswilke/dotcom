# Toots Jam - Session Handoff

## Project Snapshot
- Game file entry page is now `tootsjam.html` (renamed from `index.html`).
- Core logic/rendering lives in `game.js`.
- Styles/UI live in `styles.css`.
- Theme direction is retro arcade with multiple level palettes and obstacle phases.

## Core Gameplay (Current)
- Side-view free throw game with hold-to-charge, release-to-shoot.
- Rendering follows the display’s native refresh rate (no artificial FPS cap); physics/charge updates use a fixed 60 Hz step for consistent shot timing on all displays. Background catch-up is bounded, while the level timer follows wall time. Ball positions interpolate between physics ticks, HUD text updates only when its value changes, and static asphalt/CRT details are cached rather than rebuilt every frame.
- Trajectory preview shown while charging (level-aware contrast).
  - Levels 2–4 and 6 predict moving-obstacle ricochets, mark contacts with rings, and show the rebound path in amber (dark rust on the afternoon sky).
  - Uses the live collision responses on copies, with obstacle positions projected at the fixed physics step.
  - Random collision kicks use their mean; future random laser spawns are not predicted. Level 5 keeps its current-phase gravity guide.
  - All levels preview banks off the solid backboard, rear edge, support arm, post, and base using shared geometry and collision response.
  - Ends at rim/floor/sidewall contact or a settled structure landing; rim and floor rebounds are not included in the guide.
- Ball flight runs at 60% speed (40% slower), preserving the original free-flight arc and shooting range. The ricochet guide uses the same flight update and a longer lookahead. Charge timing, obstacle motion, effects, and the level timer use their existing clocks.
- Ball uses physics with:
  - gravity + air drag
  - rim/backboard/support/floor collisions
  - Circle/polygon contact handles the correct face or corner, including drawn outlines; separating contacts do not bounce twice. Board/support banks are non-swish makes and non-airball misses. A ball resting on the structure still auto-resets.
  - bounce + settle + auto-reset flow
- Scoring supports robust "rattle still counts" logic.
- Combo scoring is exponential:
  - 1st make: `2x`
  - 2nd: `4x`
  - 3rd: `8x`
  - formula: `2^streak`
- Swish and non-swish base points:
  - swish base: 2
  - normal make base: 1
  - final points = `base * comboMultiplier`

## Levels and Progression
- `Level 1` (Night city): baseline game.
- `Level 2` at score `20`: sunrise palette + gull collisions.
- `Level 3` at score `24`: afternoon palette + helicopter nearfield collider.
- `Level 4` at score `28`: golden-hour palette + rising hot air balloons with shape-aware collision.

### Level Select
- Splash screen now includes a Level selector and Start button.
- Selector and Start stay disabled until intro stinger animation finishes.
- You can start directly on levels 1-4 from splash.

## Obstacles by Level
- Level 2:
  - Gulls move in slow elliptical motion (roughly 8–10 seconds per circuit).
  - Ball-gull collision deflects shot.
  - Squawk SFX on hit.
- Level 3:
  - Helicopter hovers elliptically in nearfield.
  - Ball can bounce off top/body for trick shots.
  - Helicopter hit SFX enabled.
- Level 4:
  - Balloons rise low with lateral sway.
  - Collision approximates balloon body + basket region.
  - Designed for ricochet creativity.

## Trick Shot Treatment
- If a made basket occurred after touching obstacle during that shot:
  - extra sparkle burst
  - state text appends `Trick Shot!`
- Applies to gull/helicopter/balloon contacts.

## Audio System (High Level)
- SFX are grouped by category in `sfx` map in `game.js`.
- Random variant selection per category.
- Notable categories:
  - `charge` (normal charging voice)
  - `silence` (charge6-10, used when character is muted, at low volume)
  - `net`, `rim`, `floor`, `swish`, `made`, `brick*`, `squawk`, `heli`, `start`
- Charge audio behavior:
  - starts on charge begin
  - is cut off immediately on release/reset/blur
- "Silence that White Man" toggle:
  - mutes normal charge voice
  - unmute island clip plays only once globally
  - mute button still has `fine/okay` behavior for first/subsequent mute activations

## UI/UX Changes Added
- Splash screen for `Toots Jam` with:
  - year
  - credit line
  - intro stinger animation
  - level select + Start
- HUD cleanup:
  - removed power label
  - centered combo badge with neon styling + sparkle animation on combo increase
- Floating `+points` popups near hoop on makes.
- BRICK stamped overlay on likely/confirmed missed rim shots.

## Visual Direction Notes
- Night sky includes moon/cloud mood and periodic plane banner event (level 1 only).
- Morning/sunrise and afternoon palettes are separated.
- Golden-hour palette now exists for level 4.
- Court has asphalt half-court look with perspective-minded markings.

## Controls (Current)
- Left mouse: charge/release shot.
- Space: charge/release shot.
- Right mouse: dribble (discrete cycles when held).
- `R`: reset ball.
- Splash: `Press Start` (or keyboard start once enabled).

## Quick Tune Points for Tomorrow
- Level thresholds:
  - `level2ScoreThreshold`, `level3ScoreThreshold`, `level4ScoreThreshold` in `game.js`.
- Obstacle difficulty:
  - gull/heli/balloon motion/collision params near their object definitions.
- Combo economy:
  - `getComboMultiplier()` and make scoring block in `physicsStep()`.
- Audio levels:
  - per-call volumes in collision/score/button handlers.
- Palette:
  - `drawCourt()` has explicit per-level branches (`isSunrise`, `isAfternoon`, `isGolden`).

## Suggested Next Cleanup (Optional)
- Split `game.js` into modules:
  - `audio`, `physics`, `render`, `levels`, `ui`.
- Move hardcoded tuning values into a single config object for rapid balancing.
