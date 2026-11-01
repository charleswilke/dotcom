# Toots Jam Regression Checklist

Run this quick pass before/after feature changes.

## Core Flow
1. Launch `tootsjam.html`, verify splash appears and Start unlocks after intro.
2. Start from Level 1 and confirm shoot/dribble/reset controls all respond.
3. Confirm charge audio starts on hold and stops immediately on release/reset/blur.
4. Verify rendering follows the display refresh rate (60/120/144/240 Hz), with consistent charge timing and shot motion. After returning from a background tab, the level timer should reflect elapsed time without a long catch-up freeze.
5. Verify ball flight is visibly slower (60% of the original speed), while a full-power shot still reaches the hoop and the guide tracks the slower flight.
6. Check that minor display timing jitter does not cause skipped draws or ball freezes, and that resetting the ball snaps directly to the hand.

## Scoring and Combos
1. Make a swish and confirm points/combo update correctly.
2. Make a non-swish and confirm lower base points still use combo multiplier.
3. Miss with rim contact and confirm BRICK stamp behavior appears once.
4. Miss without rim/backboard contact and confirm Airball behavior.

## Obstacle Interactions
1. Level 2: collide with a gull and make a basket; confirm trick-shot FX + BANK SHOT callout.
2. Level 3: collide with helicopter and make a basket; confirm trick-shot FX + BANK SHOT callout.
3. Level 4: collide with balloon body/taper and make a basket; confirm trick-shot FX + BANK SHOT callout.

## Hoop Structure
1. Hit the backboard from the front, rear, top, underside, and corners; verify the rebound follows the contacted surface without snapping to the left.
2. Hit the support arm from above/below and both sides of the post; verify the ball cannot pass through the drawn structure or get caught at a seam.
3. Check glancing corner misses and departing contacts: no square hitbox false positives or second bounce.
4. Land on the base or another flat structure surface; confirm the ball settles and auto-resets.
5. Verify board/support banks are non-swish makes and support misses do not become Airballs.
6. In all levels, verify the guide marks and continues predicted structure rebounds without changing live collision flags or playing sounds.

## Aiming Guide
1. Hold a charge in levels 2–4 and 6: predicted contacts show a ring and the rebound arc turns amber (dark rust in level 3).
2. Change power/timing: the guide follows the moving obstacles and disappears on release/reset.
3. Verify level 2 gulls circle slowly (roughly 8–10 seconds) for readable bank-shot timing.
4. Verify aiming alone does not play impact audio, consume obstacle cooldowns, or count as a trick shot.
5. Levels 1–6 include hoop-structure banks; level 5 retains its current-phase beam gravity approximation.
6. Automated browser coverage: `node --test tests/tootsjam-trajectory-browser.test.cjs`.

## Audio Triggers
1. Confirm net/rim/floor collision sounds are not spammy.
2. Confirm bank-shot make uses `sounds/bank/*` instead of swish/made clips.
3. Toggle mute/unmute and verify charge-voice rules still hold.

## Progression
1. Verify score thresholds transition levels at 20, 24, and 28 points.
2. Confirm large score jumps still land on the correct level immediately.
3. Start directly from splash Level selector (1-4) and verify expected palette/obstacles.
