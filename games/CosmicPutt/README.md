# Cosmic Putt — first playable

A standalone vanilla Canvas prototype: one Lunar Gardens hole, par 3. No build,
dependencies, external assets, storage, or network services.

Serve the repository with `python3 -m http.server 8080`, then visit
`http://localhost:8080/games/CosmicPutt/`.

## Controls and rules

- Drag backward from the ball and release. Return to the ball or press Escape
  before releasing to cancel. Touch works the same way.
- A single soft aiming tether stretches thinner as you pull; its end increasingly
  resists stretching. Power builds progressively for finer control over short
  putts. Release snaps the tether and putter forward.
- Left/right arrows aim; up/down arrows adjust power; Space/Enter shoots.
  Hold Shift for finer aiming. The meter shows power as you pull back.
- Slow entry into the well's marked core captures the ball. The stroke counts;
  there is no additional penalty. The ball moves to the well center.
- The captured well turns navy and ignores the entire next stroke, including
  any return through its center. It reactivates once that shot stops.
- The cup catches a ball entering below the speed threshold. Hard shots can
  overshoot. Restart is always available.
- The prediction uses the live fixed-step physics and shows up to one bounce.
  A ring marks rest, a cross marks capture, and a cup ring marks a predicted sink.

## Structure

- `physics.js`: shared deterministic 120 Hz simulation and first-hole data.
- `game.js`: input, shot state, prediction, procedural scenery, and rendering.
- `styles.css` / `index.html`: responsive observatory controls and game shell.
- `physics.test.cjs`: simulation regression checks; run with
  `node --test games/CosmicPutt/physics.test.cjs` from the repository root.

Art follows the concept: cream/amber observatory controls, moon-rock diorama,
teal turf, ivory ball, cyan trail, violet active gravity, navy bypass. The playfield uses clean, broad shapes and a single moon landmark, with
procedural rendering so it can scale with the viewport. The generated concept
image is a visual reference, not a course background.

Motion runs at 1.45 times the initial prototype's pace. Launch speed, gravity,
friction, drag, and capture thresholds scale together to retain similar shot
ranges while reducing the wait for a shot to settle.

## Next experiments

Tune gravity and friction after playing. Add holes as course data, then select
the active course in the game; simulation already accepts a course parameter.
Preview upgrades, sound, persistence, and a full six-hole round are future work.
