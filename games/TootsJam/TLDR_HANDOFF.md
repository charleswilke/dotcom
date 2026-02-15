# Toots Jam - TLDR Handoff

## Where To Start
- Launch page: `tootsjam.html`
- Main logic: `game.js`
- Styling/UI: `styles.css`
- Full notes: `SESSION_HANDOFF.md`

## What’s In Place
- Free throw game with hold/release shooting + trajectory preview.
- Physics collisions (rim/backboard/floor) + bounce + auto-reset.
- Combo scoring is exponential (`2x, 4x, 8x...`).
- Splash intro with level selector and start stinger gate.

## Level Flow
- L1 (Night) -> base gameplay.
- L2 at 20 points -> sunrise palette + gull collisions.
- L3 at 24 points -> afternoon palette + helicopter collider.
- L4 at 28 points -> golden-hour palette + rising balloons with shape-aware collision.

## Trick Shots
- If make follows obstacle contact (gull/heli/balloon):
  - extra sparkles
  - `Trick Shot!` text treatment.

## Audio Highlights
- Category-based random SFX pools in `sfx` object (`game.js`).
- Charge audio is hold-bound:
  - starts on charge
  - stops immediately on release/reset/blur.
- Mute toggle behavior:
  - muted charging uses `charge6-10` at low volume
  - unmute island plays once only
  - mute click uses `fine/okay`.

## Quick Tune Knobs (Tomorrow)
- Thresholds: `level2ScoreThreshold`, `level3ScoreThreshold`, `level4ScoreThreshold`.
- Obstacle difficulty: gull/heli/balloon object params.
- Score economy: `getComboMultiplier()` + scoring block in `physicsStep()`.
- Palette: level branches in `drawCourt()`.
- SFX volumes: per `playSfx(...)` call sites.
