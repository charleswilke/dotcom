# Cosmic Putt — blueprint round

A standalone vanilla Canvas prototype: five Blueprint Course holes, each par 3. No build,
dependencies, external assets, storage, or network services.

Serve the repository with `python3 -m http.server 8080`, then visit
`http://localhost:8080/games/CosmicPutt/`.

## Controls and rules

- Drag backward from the ball and release. Return to the ball or press Escape
  before releasing to cancel. Touch works the same way.
- A single soft aiming tether stretches thinner as you pull; its end increasingly
  resists stretching. Power builds progressively for finer control over short
  putts. Release snaps the tether and putter forward.
- The putter has a rounded metal mallet head, bright striking face and alignment
  mark, outlined shaft, and silver ribbed grip for contrast against the blueprint.
  Its shaft rises upright in the same perspective as the flagpole; a lower head
  edge and ground shadow give it height while the face follows the shot angle.
  Pulling back rocks the club around the upper grip; release returns it through
  address into the contact stroke. The ball highlight and ball/putter ground
  shadows use a lower-left light source, casting up and right on screen.
  The flagpole and pennant cast a matching ground shadow in both cameras.
- Left/right arrows aim; up/down arrows adjust power; Space/Enter shoots.
  Hold Shift for finer aiming. The meter shows power as you pull back.
- Slow entry into the well's marked core captures the ball. The stroke counts;
  there is no additional penalty. The ball moves to the well center.
- The captured well turns navy and ignores the entire next stroke, including
  any return through its center. It reactivates once that shot stops.
- Use the numbered scorecard to jump between holes. Next hole advances to an
  unplayed hole; after completing all five, start a new round or replay a hole.
- Earn 3 stars for one putt, 2 for two, 1 for three, and 0 for four or more.
  Best completed results stay on the scorecard during this session round;
  replaying cannot double-count stars or erase a better result. New round clears
  all results. Reloading the page also starts fresh.
- Other wells remain active while a captured well is bypassed.
- The cup catches a ball entering below the speed threshold. Hard shots can
  overshoot. Restart is always available.
- Courses render as gently tilted blueprint models with raised white walls.
  Physics stays on the same flat world plane; dragging uses the inverse projection.
- Ball radius is 5.5 world units, with matching wall collisions and a smaller
  shadow. A minimum 6-pixel screen diameter keeps it readable on phones;
  the aiming touch target remains generous.
- Two-finger touch swipes pan the camera while preparing a shot. Adding a second
  finger cancels any active aim without shooting. The gesture remains camera-only
  until all fingers lift. Two-finger trackpad scrolling pans the course too;
  browser pinch-to-zoom gestures retain their normal behavior. Return to ball recenters; releasing a later putt also
  recenters before the ball starts moving. Course bounds limit panning.
- Course overview fits the entire playable outline. Return to ball restores the
  local view. A shot released from overview returns to local view automatically.
- Long orbit plays up-screen, with the ball in the lower third and space below
  it for a full pull-back. The drawing plane turns while world geometry and physics
  remain unchanged. Its overview, upright labels, cup cam, and vertical route map
  share that orientation. The moving camera looks ahead along the shot.
- Long orbit has two gravity sections and a route map. Its camera follows only
  while the ball is moving or being captured; a one-finger aim never pans or zooms the view.
  Overview is disabled during a drag and during motion. Restart resets the camera.
- Cup cam only appears while the cup opening is outside the main camera view.
  Panning to the cup or switching to overview hides it; it also disappears when
  the follow camera brings the cup into view during a shot.
  It appears when the predicted path comes within 180 world units of the
  cup, including near misses and fast overshoots. It uses the same projection at
  a fixed closer zoom, showing the predicted approach while aiming and the live
  ball after release. Unexpected actual approaches within 220 units activate it
  too. It briefly holds on a settled near miss; a new aim switches back to preview.
  Results and restarts clear it. On phones it replaces the route map; desktop
  places it above the map. The inset passes pointer input through to the course.
- Event horizon folds into a broad hairpin around one bend well. Its optional cyan
  wormhole pair is set into the divider and the upper lane’s outer wall, like
  small arched tunnels. It connects the outward and return lanes. Either mouth works in both
  directions: velocity rotates from the entrance’s inward travel direction to the exit’s
  outward direction,
  preserving speed after the normal timestep friction. The ball emerges beyond the
  exit sill, safely inside the course. Wall collisions yield only within an
  active mouth for an incoming ball. The pair stays locked until the ball clears both mouths, preventing
  immediate re-entry. Matching numbers identify the pair; the arches briefly glow
  on transit (the pulse is omitted with reduced motion). Preview and trail break at teleport
  gaps, so no path is drawn across the divider. Transit adds no stroke or penalty.
- The prediction uses the live fixed-step physics and shows up to one bounce.
  A ring marks rest, a cross marks capture, and a cup ring marks a predicted sink.

## Structure

- `physics.js`: shared deterministic 120 Hz simulation and five-hole course data.
- `game.js`: input, hole navigation, shot state, prediction, and blueprint rendering.
- `scoring.js`: star awards and best-result aggregation.
- `view.js`: three-quarter projection, inverse aim mapping, overview, camera tracking, and cup-approach detection.
- `motion.js`: render-only release, velocity, wall-impact, capture, settling, and sink cues. Deformation preserves area and follows projected travel or contact normals in both views. Reduced motion keeps the ball round and uses a stationary 45 ms sink fade.
- `styles.css` / `index.html`: responsive observatory controls and game shell.
- `*.test.cjs`: simulation, scoring, camera, motion, and game-loop checks; run with
  `node --test games/CosmicPutt/*.test.cjs` from the repository root.

Release drives one continuous club stroke: 65 ms to reach the ball, then 55 ms
of contact compression before launch. The club stays visible, follows the
compressing rear edge, and continues forward from contact rather than restarting
at its pull-back position. The tether contracts once and stays gone. Ball squash
starts only when the face arrives, reaching 36–48% along the shot direction.
Launch then stretches the ball by 50–85% according to power, with a 60 ms or
longer rise for softer shots, an 80 ms hold, and a 410 ms recovery. Its reciprocal
width/height preserve area, and a tight glow and crisp edge keep the tiny silhouette
readable. The follow-through cannot overtake the departing ball. Rolling stretch follows actual speed and acceleration
(up to 16%), so it relaxes with course friction and responds to gravity. The
physical launch is an instant velocity impulse; friction slows it from there,
while gravity can accelerate it again. Reduced motion skips the contact delay
and deformation. Wall contact has a 45 ms
compression and 135 ms recovery with one faint contact glint. Capture has a brief
inward pulse, and settling finishes with a single 140 ms recovery. A successful
putt finishes over 720 ms: a small lift at the rim, a diminishing rattle inside
the cup, an accelerating drop behind
the cup's near edge, and a mint ripple before results appear. A small dim cap of
the resting ball remains visible inside the near rim after the drop, until the
hole is restarted or changed. These cues do not alter
shot trajectories, prediction, capture thresholds, collision radius, or scoring. Restarting
or changing holes clears all motion state, including a pending sink.

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

5. **Event horizon:** wide hairpin, one bend well, one optional wormhole pair.
   Wormhole ace: -0.16 rad, 44.5% power; roughly 6 seconds. The conventional route uses
   -0.07 rad at 97% power, swings around the well with two wall bounces, and sinks
   in roughly 8 seconds. Removing the bend well makes that route miss.

The first three reference aces take roughly 4–5 seconds. The first four reference aces skim
each well safely and sink without a wall bounce. Removing any well from Double
swing or Triple relay makes its reference shot miss. Rendering and collisions always use the same rounded course outline.

## Next experiments

Tune the five holes through play. Preview upgrades, sound, persistent best
scores, and a full six-hole round are future work.
