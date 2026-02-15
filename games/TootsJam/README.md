# Toots Jam

Retro arcade free-throw game built with plain HTML/CSS/JS.

## Run Locally
Use any static server from the project root (`D:\TootsJam`).

PowerShell example:

```powershell
python -m http.server 8080
```

Then open:

`http://localhost:8080/tootsjam.html`

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
