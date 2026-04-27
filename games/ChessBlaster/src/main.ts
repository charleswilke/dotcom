import {
  gameStatus,
  isKingInCheck,
  legalMoves,
  makeMove,
  parseFen,
  repetitionKey,
  START_FEN
} from "./engine/index.js";
import { chooseGreedyMove } from "./ai/computer.js";
import type { Color, Move, PieceType, Position, Square } from "./engine/types.js";
import {
  drawBoard,
  drawPieceAt,
  loadPieceSprites,
  squareAt,
  type RenderState
} from "./renderer/board.js";

const canvas = document.getElementById("board") as HTMLCanvasElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const promotionEl = document.getElementById("promotion") as HTMLDivElement;
const modeEl = document.getElementById("mode") as HTMLSelectElement;
const newGameEl = document.getElementById("new-game") as HTMLButtonElement;

type Mode = "human-vs-bot" | "bot-vs-human" | "human-vs-human" | "bot-vs-bot";

let mode: Mode = "human-vs-bot";
let position: Position = parseFen(START_FEN);
let history: string[] = [repetitionKey(position)];
let selected: Square | null = null;
let legalForSelected: Move[] = [];
let promotionChoice: ((piece: Exclude<PieceType, "p" | "k"> | null) => void) | null = null;
let computerThinking = false;

type DragState = {
  from: Square;
  pointerId: number;
  x: number;
  y: number;
  moved: boolean;
};
let drag: DragState | null = null;
const DRAG_THRESHOLD = 4;
const COMPUTER_DELAY_MS = 350;

function isBot(color: Color): boolean {
  if (mode === "bot-vs-bot") return true;
  if (mode === "human-vs-human") return false;
  if (mode === "human-vs-bot") return color === "b";
  return color === "w"; // bot-vs-human
}

function render(): void {
  const state: RenderState = {
    position,
    selected,
    legalTargets: legalForSelected,
    checkSquare: checkedKingSquare(position),
    ...(drag && drag.moved ? { hidePiece: drag.from } : {})
  };
  drawBoard(canvas, state);

  if (drag && drag.moved) {
    const piece = position.board[drag.from];
    if (piece) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      drawPieceAt(canvas, piece, (drag.x - rect.left) * scaleX, (drag.y - rect.top) * scaleY);
    }
  }

  const status = gameStatus(position, history);
  const turn = position.turn === "w" ? "White" : "Black";
  if (computerThinking) {
    statusEl.textContent = `${turn} calculating`;
  } else if (status === "ongoing") {
    statusEl.textContent = `${turn} to move`;
  } else if (status === "check") {
    statusEl.textContent = `${turn} to move — check`;
  } else {
    statusEl.textContent = status.replace(/-/g, " ");
  }
}

function checkedKingSquare(pos: Position): Square | null {
  if (!isKingInCheck(pos, pos.turn)) return null;
  const square = pos.board.findIndex((piece) => piece?.color === pos.turn && piece.type === "k");
  return square === -1 ? null : square;
}

function selectSquare(sq: Square): void {
  const piece = position.board[sq];
  if (piece && piece.color === position.turn) {
    selected = sq;
    legalForSelected = legalMoves(position).filter((m) => m.from === sq);
  } else {
    selected = null;
    legalForSelected = [];
  }
}

async function tryMoveTo(sq: Square): Promise<boolean> {
  if (selected === null) return false;
  const move = await chooseMove(legalForSelected.filter((m) => m.to === sq));
  if (!move) return false;
  applyMove(move);
  selected = null;
  legalForSelected = [];
  return true;
}

function applyMove(move: Move): void {
  position = makeMove(position, move);
  history.push(repetitionKey(position));
}

function isComputerTurn(): boolean {
  const status = gameStatus(position, history);
  return isBot(position.turn) && (status === "ongoing" || status === "check");
}

function queueComputerMove(): void {
  if (computerThinking || promotionChoice || !isComputerTurn()) return;

  selected = null;
  legalForSelected = [];
  drag = null;
  computerThinking = true;
  render();

  window.setTimeout(() => {
    const move = chooseGreedyMove(position);
    if (move) {
      applyMove(move);
    }
    computerThinking = false;
    render();
    queueComputerMove();
  }, COMPUTER_DELAY_MS);
}

async function chooseMove(candidates: Move[]): Promise<Move | null> {
  if (candidates.length === 0) return null;
  const promotions = candidates.filter((move) => move.promotion);
  if (promotions.length === 0) return candidates[0] ?? null;

  const promotion = await askPromotion();
  if (!promotion) return null;
  return promotions.find((move) => move.promotion === promotion) ?? null;
}

function askPromotion(): Promise<Exclude<PieceType, "p" | "k"> | null> {
  promotionEl.hidden = false;
  return new Promise((resolve) => {
    promotionChoice = resolve;
  });
}

function resolvePromotion(piece: Exclude<PieceType, "p" | "k"> | null): void {
  promotionEl.hidden = true;
  promotionChoice?.(piece);
  promotionChoice = null;
}

function resetGame(): void {
  // Cancel any pending promotion so we don't leave a dangling promise.
  if (promotionChoice) resolvePromotion(null);
  position = parseFen(START_FEN);
  history = [repetitionKey(position)];
  selected = null;
  legalForSelected = [];
  drag = null;
  computerThinking = false;
  render();
  queueComputerMove();
}

async function handlePointerDown(event: PointerEvent): Promise<void> {
  event.preventDefault();
  if (promotionChoice || computerThinking || isComputerTurn()) return;

  const sq = squareAt(canvas, event.clientX, event.clientY);
  if (sq === null) return;

  // If a piece is already selected and the click is on a legal target, treat as click-move.
  if (selected !== null && legalForSelected.some((m) => m.to === sq)) {
    await tryMoveTo(sq);
    render();
    queueComputerMove();
    return;
  }

  const piece = position.board[sq];
  if (piece && piece.color === position.turn) {
    selectSquare(sq);
    drag = { from: sq, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    canvas.setPointerCapture(event.pointerId);
  } else {
    selected = null;
    legalForSelected = [];
  }
  render();
}

function handlePointerMove(event: PointerEvent): void {
  event.preventDefault();
  if (computerThinking) return;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
  drag.moved = true;
  drag.x = event.clientX;
  drag.y = event.clientY;
  render();
}

async function handlePointerUp(event: PointerEvent): Promise<void> {
  event.preventDefault();
  if (computerThinking) return;
  if (!drag || event.pointerId !== drag.pointerId) {
    return;
  }
  const wasDrag = drag.moved;
  const sq = squareAt(canvas, event.clientX, event.clientY);
  canvas.releasePointerCapture(event.pointerId);
  drag = null;

  if (wasDrag && sq !== null) {
    await tryMoveTo(sq);
  }
  render();
  queueComputerMove();
}

function handlePointerCancel(event: PointerEvent): void {
  event.preventDefault();
  drag = null;
  render();
}

canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", handlePointerCancel);

promotionEl.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-piece]");
  if (!button) return;
  resolvePromotion(button.dataset.piece as Exclude<PieceType, "p" | "k">);
  render();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && promotionChoice) {
    event.preventDefault();
    resolvePromotion(null);
    render();
  }
});

modeEl.addEventListener("change", () => {
  mode = modeEl.value as Mode;
  resetGame();
});

newGameEl.addEventListener("click", () => {
  resetGame();
});

loadPieceSprites(render);
render();
queueComputerMove();
