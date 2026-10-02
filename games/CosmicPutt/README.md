# Cosmic Putt — blueprint round

A standalone vanilla Canvas prototype: four Blueprint Course holes, each par 3. No build,
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
- Use the numbered scorecard to jump between holes. Next hole advances to an
  unplayed hole; after completing all four, start a new round or replay a hole.
- Earn 3 stars for one putt, 2 for two, 1 for three, and 0 for four or more.
  Best completed results stay on the scorecard during this session round;
  replaying cannot double-count stars or erase a better result. New round clears
  all results. Reloading the page also starts fresh.
- Other wells remain active while a captured well is bypassed.
- The cup catches a ball entering below the speed threshold. Hard shots can
  overshoot. Restart is always available.
- Courses render as gently tilted blueprint models with raised white walls.
  Physics stays on the same flat world plane; dragging uses the inverse projection.
- Two-finger touch swipes pan the camera while preparing a shot. Adding a second
  finger cancels any active aim without shooting. The gesture remains camera-only
  until all fingers lift. Two-finger trackpad scrolling pans the course too;
  browser pinch-to-zoom gestures retain their normal behavior. Return to ball recenters; releasing a later putt also
  recenters before the ball starts moving. Course bounds limit panning.
- Course overview fits the entire playable outline. Return to ball restores the
  local view. A shot released from overview returns to local view automatically.
- Long orbit has two gravity sections and a route map. Its camera follows only
  while the ball is moving or being captured; a one-finger aim never pans or zooms the view.
  Overview is disabled during a drag and during motion. Restart resets the camera.
- Cup cam appears when the predicted path comes within 180 world units of the
  cup, including near misses and fast overshoots. It uses the same projection at
  a fixed closer zoom, showing the predicted approach while aiming and the live
  ball after release. Unexpected actual approaches within 220 units activate it
  too. It briefly holds on a settled near miss; a new aim switches back to preview.
  Results and restarts clear it. On phones it replaces the route map; desktop
  places it above the map. The inset passes pointer input through to the course.
- The prediction uses the live fixed-step physics and shows up to one bounce.
  A ring marks rest, a cross marks capture, and a cup ring marks a predicted sink.

## Structure

- `physics.js`: shared deterministic 120 Hz simulation and four-hole course data.
- `game.js`: input, hole navigation, shot state, prediction, and blueprint rendering.
- `scoring.js`: star awards and best-result aggregation.
- `view.js`: three-quarter projection, inverse aim mapping, overview, camera tracking, and cup-approach detection.
- `styles.css` / `index.html`: responsive observatory controls and game shell.
- `physics.test.cjs` / `scoring.test.cjs` / `view.test.cjs`: simulation, scoring,
  and camera checks; run with
  `node --test games/CosmicPutt/physics.test.cjs games/CosmicPutt/scoring.test.cjs games/CosmicPutt/view.test.cjs` from the repository root.

The first hole is a blueprint course study: deep blue drafting paper, a measured
grid, white rounded walls, and a violet gravity field with its full influence
radius marked. Rendering and collision share the same sampled rounded outline.
The wider, gradual bend supports a gravity-only hole in one without wall bounces.
A reference swing is angle -0.14 radians at 41–42.5% power; nearby angles work with
slightly different power. The default aim sits near that route, leaving room to tune.

Motion runs at 0.9 times the original prototype's pace (about 38% slower than the
previous 1.45 setting). Launch speed, gravity, friction, drag, and capture thresholds
scale together to keep similar reach while giving curves time to unfold. The
first well has a broader, stronger field for a visible swing beneath its core.
The reference ace unfolds over roughly 4–5 seconds.

## Blueprint holes

1. **First orbit:** one well, a gradual bend. Reference ace: -0.14 rad, 42% power.
2. **Double swing:** swing below A, then above B for an S-shaped approach.
   Reference ace: -0.05 rad, 44% power.
3. **Triple relay:** link A and B, then let C curl the approach upward.
   Reference ace: -0.05 rad, 46% power.

4. **Long orbit:** two pairs of wells connected by a quiet stretch in a 2200×800
   world. Reference ace: -0.05 rad, 80–83% power; roughly 6–8 seconds.

The first three reference aces take roughly 4–5 seconds. All reference aces skim
each well safely and sink without a wall bounce. Removing any well from Double
swing or Triple relay makes its reference shot miss. Rendering and collisions always use the same rounded course outline.

## Next experiments

Tune the four holes through play. Preview upgrades, sound, persistent best
scores, and a full six-hole round are future work.
