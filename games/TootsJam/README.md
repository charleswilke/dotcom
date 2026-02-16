# Toots Jam

Retro arcade free-throw game built with plain HTML/CSS/JS.

## Run Locally
Run the bundled Node server from the project root. It serves the game and leaderboard API.

PowerShell example:

```powershell
npm start
```

Then open:

`http://localhost:8080/tootsjam.html`

## Leaderboard API
- `GET /api/scores?limit=10` returns top scores (highest first).
- `GET /api/scores?limit=10&mode=normal` filters by mode (`normal` or `free_throw`).
- `POST /api/scores` accepts:

```json
{
  "initials": "ABC",
  "score": 123,
  "mode": "normal",
  "startLevel": 1
}
```

Server-side validation:
- Initials must be exactly 3 letters (`A-Z`)
- Score must be a non-negative integer
- Basic per-IP rate limit is applied to score posts

## Embed / Drop-In
1. Copy `tootsjam.html`, `styles.css`, `game.js`, and the `sounds/` folder together.
2. Keep relative paths unchanged so audio loads correctly.
3. Host files under the same folder (or preserve equivalent relative structure).

## Controls
- Left click or `Space`: hold to charge, release to shoot
- Right click: dribble
- `R`: reset ball

## Tuning Quick Links
- Thresholds and progression: `game.js`
- Obstacle behavior: `game.js`
- Audio pools and volumes: `game.js`
- UI styling: `styles.css`

## Regression
Use `REGRESSION_CHECKLIST.md` before and after gameplay/audio changes.
