# Toots Jam - Roadmap

## Goal
Ship a polished, portable arcade free-throw game that is fun in short sessions and easy to drop into a personal site.

## Priority 0: Stability Pass (Do First)
1. Fix level transition edge cases.
2. Verify score, combo, and multiplier math across all levels.
3. Confirm make/miss classification is correct on rim rattles, airballs, and obstacle ricochets.
4. Validate all audio triggers fire once at intended moments (no silent gaps, no overlap spam).
5. Add a quick regression checklist and run it before every new feature.

## Priority 1: Game Feel and Balance
1. Tune shot arc readability and charge curve for consistent intuition.
2. Balance obstacle windows: Level 2 gulls should leave a fair timing lane every cycle.
3. Balance obstacle windows: Level 3 helicopter should preserve trick-shot opportunities without blocking normal shots.
4. Balance obstacle windows: Level 4 balloons should keep ricochet fun without random-feeling misses.
5. Revisit point economy so higher levels feel rewarding but not runaway.

## Priority 2: Visual and FX Polish
1. Tighten court line perspective and line thickness consistency.
2. Expand sparkle/trick-shot variants for rare moments.
3. Add subtle ambient animation loops per level (without visual clutter).
4. Polish HUD hierarchy so score/combo/readability remain clear on all palettes.
5. Keep retro 90s aesthetic consistent across splash, HUD, and in-game overlays.

## Priority 3: Audio Polish
1. Normalize loudness across all SFX folders (`start`, `net`, `swish`, `brick`, `charge`, `squawk`, `heli`).
2. Add short cooldown guards to avoid repeated collision sounds in a single frame burst.
3. Verify mute/silence button rules still hold after new content additions.
4. Add optional "master SFX volume" slider if needed for embed contexts.

## Priority 4: Content and Progression
1. Define target session length (example: 3-6 minutes per run).
2. Add level-complete callouts (simple banner + transition beat).
3. Decide whether level 4 is final or gateway to endless/challenge mode.
4. Optional: add score goals per level for clearer player objectives.

## Priority 5: Codebase Cleanup
1. Split `game.js` into modules: `audio.js`, `physics.js`, `render.js`, `levels.js`, `ui.js`, `state.js`.
3. Move all tuning constants to a central config object.
4. Add lightweight comments for non-obvious math and collision decisions.
5. Keep `tootsjam.html` thin and focused on wiring only.

## Priority 6: Packaging for Site Drop-In
1. Confirm relative paths are robust when hosted in subfolders.
2. Add cache-friendly asset naming strategy (optional).
3. Add a minimal `README.md` with run/embed instructions.
4. Add a one-command local run note (simple static server).

## Tomorrow Starter Plan (90 Minutes)
1. 20 min: run regression checklist and log bugs.
2. 30 min: tune level 2-4 obstacle fairness.
3. 20 min: audio loudness pass and collision cooldown pass.
4. 20 min: visual polish on HUD + trick-shot feedback.

## Definition of Done (Current Milestone)
1. No obvious scoring/audio/collision bugs in a 10-minute playtest.
2. Level progression feels intentional and readable.
3. Audio is punchy but controlled.
4. Build is cleanly embeddable via `tootsjam.html`.
