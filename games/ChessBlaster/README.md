# Chess Blaster

Chess Blaster is a futuristic tactics game inspired by the theatrical spirit of classic Battle Chess. The first goal is a fast, readable 2D chess game with animated captures and sci-fi combat flavor. The longer-term visual direction is a more isometric arena where each move feels like a tactical action in a living battlefield.

## Direction

- Start with correct, satisfying chess play.
- Keep the board readable before making it cinematic.
- Build the renderer around logical board coordinates so the game can move from flat 2D to isometric presentation without rewriting the rules or game state.
- Treat capture animations as short combat moments: blaster shots, shields, teleport strikes, heavy impacts, and piece-specific attacks.
- Grow toward an AI opponent, beginning with classical move search and later training a neural model.

## Tech Stack

- **Language:** TypeScript.
- **Build:** Vite.
- **Renderer:** HTML Canvas 2D to start, with the option to graduate to Pixi.js for richer effects or Three.js for full isometric/3D later.
- **Chess Engine:** Custom TypeScript mailbox engine, with perft tests used as the first line of defense against rule regressions.
- **Targets:** Web first (deployable to a static site). Mobile via Capacitor, which wraps the same web build into iOS and Android apps for the App Store and Play Store as a stretch goal.
- **Cost:** Everything in the stack is free and open source.

## Getting Started

```bash
npm install        # one-time
npm run dev        # Vite dev server (the game, hot-reloaded)
npm run check      # tsc + Node's built-in test runner (perft + rules)
npm run build:web  # production web bundle
```

Build outputs are split on purpose:

- `build/` — TypeScript output from `tsc`, used only by the Node test runner.
- `dist/` — Vite's web bundle, the thing that gets deployed.

Both directories are gitignored. Run `npm run check` before pushing; it covers move generation, FEN round-trips, and game-status rules.

## Asset Layout

Static assets that ship with the web build live under `public/` and are served from the site root by Vite:

- `public/assets/pieces/<color><type>.svg` — piece sprites (e.g. `wk.svg`, `bn.svg`). Color is `w` or `b`; type is `p`, `n`, `b`, `r`, `q`, or `k`.
- `public/assets/pieces/cel-v1/<color><type>-<facing>.png` — transparent cel-shaded character sprites. Facing is `front` or `rear`; the renderer uses rear views for White and front views for Black so the armies face each other, then falls back to a front sprite or the procedural silhouette while the set is incomplete.
- Future sound effects, capture animations, and isometric tiles should follow the same `public/assets/<category>/` convention so the renderer can load them by predictable paths.

## Game Loop and Input

- Animations block input while they play out. The next move cannot start until the current animation finishes. This keeps state management simple while the project is young; concurrent/interruptible animations can come later.

## Move Representation

- Use a plain 8×8 array ("mailbox") board. Each square holds a piece value or empty.
- Bitboards were considered but rejected for now: JavaScript has no native 64-bit integer, and `BigInt` is slow enough to wipe out the usual bitboard advantage. A mailbox board is fast enough for minimax to reasonable depths and is far easier to debug.
- Moves are represented as `{ from, to, promotion?, flags }` objects. Standard notation (SAN) is generated for display and history; UCI-style coordinate strings are used internally where convenient.
- This decision can be revisited if performance ever blocks the AI roadmap.

## Architecture Sketch

The game should separate core systems cleanly:

- `game`: chess state, legal moves, turn flow, win/draw conditions, history.
- `renderer`: board projection, piece sprites/models, animation timing, visual effects.
- `input`: square selection, drag/click movement, hover states, previews.
- `ai`: move choice, evaluation, search, neural model integration.
- `assets`: sprites, effects, audio, and future isometric/3D resources.

The renderer should convert between two coordinate spaces:

- Board space: files/ranks such as `e4`, plus row/column indices.
- Screen space: pixels on the canvas or DOM.

Flat 2D can use a simple grid projection first. Later, an isometric projection can map the same board coordinates into diamond-shaped tiles while the rest of the game logic stays unchanged.

## First Playable Milestone

1. Render a futuristic chessboard.
2. Show all pieces in their starting positions.
3. Allow legal click-to-move or drag-to-move interactions.
4. Animate ordinary moves.
5. Animate captures with placeholder blaster effects.
6. Display turn, check, checkmate, draw, and move history.
7. Support local human-vs-human play.

## Testing Strategy

The chess rules have many edge cases (en passant, castling rights, castling through check, promotion, fifty-move rule, threefold repetition, stalemate vs checkmate). These need to be locked down early or they will quietly break the AI later.

- **Perft tests.** "Perft" counts the number of legal move sequences from a position to a given depth. The chess community publishes exact node counts for well-known positions. Any bug in move generation shows up as a wrong count. The project will include perft tests against:
  - The standard starting position.
  - "Kiwipete" (a tactical position that exercises castling, promotions, en passant, and checks).
  - A few additional published test positions.
- **Unit tests** for each rule in isolation: legal moves per piece, pinned pieces, check detection, castling legality, en passant timing, promotion, draw conditions.
- **Golden game replay tests.** Load a recorded PGN, play it through the engine, and assert the final position and result match. Catches regressions in move legality and SAN parsing.
- **AI smoke tests.** The AI must always return a legal move from any legal position, never crash on edge positions (stalemate, checkmate, single-king positions used in tests), and respect time/depth limits.
- **Renderer tests are deferred.** Visuals are verified by eye until the game is stable.

## AI Roadmap

1. Add a simple legal random mover for plumbing.
2. Add minimax with a handcrafted evaluation.
3. Add configurable difficulty through search depth and move noise.
4. Generate games from self-play or engine-assisted play.
5. Train a neural policy/evaluation model.
6. Combine the model with search for stronger play.

When the AI grows past the current greedy 1-ply chooser, search must not block the UI thread. Once minimax lands, the search will move into a Web Worker so the main thread keeps animating drags, captures, and effects while the bot is thinking. The `setTimeout` "thinking delay" used today is only a cosmetic placeholder for an instant scan; it is not a substitute for off-main-thread search.

The neural step is a stretch goal and must stay cheap:

- **Training** happens locally in PyTorch on the developer machine (Apple Silicon GPU is supported by PyTorch's MPS backend). No cloud GPU spend.
- **Inference** runs in the browser via `onnxruntime-web`. The trained model is exported to ONNX and shipped as a static asset alongside the game. No inference server, no API costs.
- Model size is kept small enough to load over the web without hurting page load. A distilled or small policy/value network is preferred over an AlphaZero-scale model.
- If full self-play training proves too slow on a laptop, a fallback is to train on positions labeled by an open-source engine (e.g., Stockfish) running locally — still free.
