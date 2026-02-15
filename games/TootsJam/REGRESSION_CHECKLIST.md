# Toots Jam Regression Checklist

Run this quick pass before/after feature changes.

## Core Flow
1. Launch `tootsjam.html`, verify splash appears and Start unlocks after intro.
2. Start from Level 1 and confirm shoot/dribble/reset controls all respond.
3. Confirm charge audio starts on hold and stops immediately on release/reset/blur.

## Scoring and Combos
1. Make a swish and confirm points/combo update correctly.
2. Make a non-swish and confirm lower base points still use combo multiplier.
3. Miss with rim contact and confirm BRICK stamp behavior appears once.
4. Miss without rim/backboard contact and confirm Airball behavior.

## Obstacle Interactions
1. Level 2: collide with a gull and make a basket; confirm trick-shot FX + BANK SHOT callout.
2. Level 3: collide with helicopter and make a basket; confirm trick-shot FX + BANK SHOT callout.
3. Level 4: collide with balloon body/taper and make a basket; confirm trick-shot FX + BANK SHOT callout.

## Audio Triggers
1. Confirm net/rim/floor collision sounds are not spammy.
2. Confirm bank-shot make uses `sounds/bank/*` instead of swish/made clips.
3. Toggle mute/unmute and verify charge-voice rules still hold.

## Progression
1. Verify score thresholds transition levels at 20, 24, and 28 points.
2. Confirm large score jumps still land on the correct level immediately.
3. Start directly from splash Level selector (1-4) and verify expected palette/obstacles.
