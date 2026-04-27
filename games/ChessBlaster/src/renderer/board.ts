import { fileOf, rankOf } from "../engine/coordinates.js";
import type { Move, Piece, Position, Square } from "../engine/types.js";

const LIGHT = "#1d2740";
const DARK = "#101626";
const HIGHLIGHT = "rgba(108, 242, 255, 0.35)";
const TARGET = "rgba(108, 242, 255, 0.55)";
const CAPTURE = "rgba(255, 92, 132, 0.55)";
const CHECK_TINT = "rgba(255, 64, 96, 0.4)";

const PIECE_GLYPHS: Record<string, string> = {
  wk: "\u2654", wq: "\u2655", wr: "\u2656", wb: "\u2657", wn: "\u2658", wp: "\u2659",
  bk: "\u265A", bq: "\u265B", br: "\u265C", bb: "\u265D", bn: "\u265E", bp: "\u265F"
};

const PIECE_SPRITE_PATHS: Record<string, string> = {
  wk: "./assets/pieces/wk.svg",
  wq: "./assets/pieces/wq.svg",
  wr: "./assets/pieces/wr.svg",
  wb: "./assets/pieces/wb.svg",
  wn: "./assets/pieces/wn.svg",
  wp: "./assets/pieces/wp.svg",
  bk: "./assets/pieces/bk.svg",
  bq: "./assets/pieces/bq.svg",
  br: "./assets/pieces/br.svg",
  bb: "./assets/pieces/bb.svg",
  bn: "./assets/pieces/bn.svg",
  bp: "./assets/pieces/bp.svg"
};

const pieceSprites = new Map<string, HTMLImageElement>();
let spriteLoadPromise: Promise<void> | null = null;

export type RenderState = {
  position: Position;
  selected: Square | null;
  legalTargets: Move[];
  checkSquare: Square | null;
  /** Optional: square to skip drawing (e.g. piece being dragged). */
  hidePiece?: Square;
};

export function loadPieceSprites(onReady: () => void): Promise<void> {
  if (spriteLoadPromise) {
    spriteLoadPromise.then(onReady);
    return spriteLoadPromise;
  }

  const entries = Object.entries(PIECE_SPRITE_PATHS);
  let remaining = entries.length;

  spriteLoadPromise = new Promise<void>((resolve) => {
    const done = () => {
      remaining -= 1;
      if (remaining === 0) {
        onReady();
        resolve();
      }
    };

    for (const [key, src] of entries) {
      const image = new Image();
      image.decoding = "async";
      image.onload = done;
      image.onerror = done;
      image.src = src;
      pieceSprites.set(key, image);
    }
  });

  return spriteLoadPromise;
}

export function drawBoard(canvas: HTMLCanvasElement, state: RenderState): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const size = canvas.width;
  const tile = size / 8;

  ctx.clearRect(0, 0, size, size);

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const isLight = (file + rank) % 2 === 1;
      ctx.fillStyle = isLight ? LIGHT : DARK;
      ctx.fillRect(file * tile, (7 - rank) * tile, tile, tile);
    }
  }

  if (state.checkSquare !== null) {
    ctx.fillStyle = CHECK_TINT;
    ctx.fillRect(
      fileOf(state.checkSquare) * tile,
      (7 - rankOf(state.checkSquare)) * tile,
      tile,
      tile
    );
  }

  if (state.selected !== null) {
    const f = fileOf(state.selected);
    const r = rankOf(state.selected);
    ctx.fillStyle = HIGHLIGHT;
    ctx.fillRect(f * tile, (7 - r) * tile, tile, tile);
  }

  for (const move of state.legalTargets) {
    const f = fileOf(move.to);
    const r = rankOf(move.to);
    ctx.fillStyle = move.flags.includes("capture") ? CAPTURE : TARGET;
    ctx.beginPath();
    ctx.arc(f * tile + tile / 2, (7 - r) * tile + tile / 2, tile * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = `${Math.floor(tile * 0.78)}px "Segoe UI Symbol", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 64; i += 1) {
    if (state.hidePiece === i) continue;
    const piece = state.position.board[i];
    if (!piece) continue;
    const f = fileOf(i);
    const r = rankOf(i);
    drawPiece(ctx, piece, f * tile, (7 - r) * tile, tile);
  }
}

export function drawPieceAt(
  canvas: HTMLCanvasElement,
  piece: Piece,
  x: number,
  y: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const tile = canvas.width / 8;
  ctx.font = `${Math.floor(tile * 0.78)}px "Segoe UI Symbol", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawPiece(ctx, piece, x - tile / 2, y - tile / 2, tile);
}

function drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, x: number, y: number, tile: number): void {
  const key = `${piece.color}${piece.type}`;
  const sprite = pieceSprites.get(key);
  const inset = tile * 0.08;

  if (sprite?.complete && sprite.naturalWidth > 0) {
    ctx.drawImage(sprite, x + inset, y + inset, tile - inset * 2, tile - inset * 2);
    return;
  }

  const glyph = PIECE_GLYPHS[key];
  if (!glyph) return;
  ctx.fillStyle = piece.color === "w" ? "#f4faff" : "#0a0d18";
  ctx.fillText(glyph, x + tile / 2, y + tile / 2);
}

export function squareAt(canvas: HTMLCanvasElement, x: number, y: number): Square | null {
  const rect = canvas.getBoundingClientRect();
  const tile = rect.width / 8;
  const file = Math.floor((x - rect.left) / tile);
  const rank = 7 - Math.floor((y - rect.top) / tile);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return rank * 8 + file;
}
