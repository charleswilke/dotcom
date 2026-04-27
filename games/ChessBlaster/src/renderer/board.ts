import { fileOf, rankOf } from "../engine/coordinates.js";
import type { Move, Piece, Position, Square } from "../engine/types.js";

const LIGHT = "#1d2740";
const DARK = "#101626";
const ISO_LIGHT = "#26365a";
const ISO_DARK = "#151d34";
const ISO_SIDE_LIGHT = "#111a30";
const ISO_SIDE_DARK = "#0b1020";
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

export type BoardView = "flat" | "isometric";

export type RenderState = {
  position: Position;
  selected: Square | null;
  legalTargets: Move[];
  checkSquare: Square | null;
  view: BoardView;
  /** Optional: square to skip drawing (e.g. piece being dragged). */
  hidePiece?: Square;
};

type Point = {
  x: number;
  y: number;
};

type FlatProjection = {
  view: "flat";
  originX: number;
  originY: number;
  tile: number;
};

type IsometricProjection = {
  view: "isometric";
  originX: number;
  originY: number;
  tileW: number;
  tileH: number;
};

type BoardProjection = FlatProjection | IsometricProjection;

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

  const projection = createProjection(canvas, state.view);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (projection.view === "isometric") {
    drawIsometricBoard(ctx, projection, state);
    return;
  }

  drawFlatBoard(ctx, projection, state);
}

export function drawPieceAt(
  canvas: HTMLCanvasElement,
  piece: Piece,
  x: number,
  y: number,
  view: BoardView
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const projection = createProjection(canvas, view);

  if (projection.view === "isometric") {
    drawIsometricPiece(ctx, projection, piece, x, y + projection.tileH * 0.45);
    return;
  }

  ctx.font = `${Math.floor(projection.tile * 0.78)}px "Segoe UI Symbol", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  drawPiece(ctx, piece, x - projection.tile / 2, y - projection.tile / 2, projection.tile);
}

export function squareAt(canvas: HTMLCanvasElement, x: number, y: number, view: BoardView): Square | null {
  const rect = canvas.getBoundingClientRect();
  const px = (x - rect.left) * (canvas.width / rect.width);
  const py = (y - rect.top) * (canvas.height / rect.height);
  const projection = createProjection(canvas, view);

  if (projection.view === "isometric") {
    return isometricSquareAt(projection, px, py);
  }

  const file = Math.floor((px - projection.originX) / projection.tile);
  const rank = 7 - Math.floor((py - projection.originY) / projection.tile);
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return rank * 8 + file;
}

function drawFlatBoard(ctx: CanvasRenderingContext2D, projection: FlatProjection, state: RenderState): void {
  const { originX, originY, tile } = projection;

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const isLight = (file + rank) % 2 === 1;
      ctx.fillStyle = isLight ? LIGHT : DARK;
      ctx.fillRect(originX + file * tile, originY + (7 - rank) * tile, tile, tile);
    }
  }

  if (state.checkSquare !== null) {
    ctx.fillStyle = CHECK_TINT;
    ctx.fillRect(
      originX + fileOf(state.checkSquare) * tile,
      originY + (7 - rankOf(state.checkSquare)) * tile,
      tile,
      tile
    );
  }

  if (state.selected !== null) {
    const f = fileOf(state.selected);
    const r = rankOf(state.selected);
    ctx.fillStyle = HIGHLIGHT;
    ctx.fillRect(originX + f * tile, originY + (7 - r) * tile, tile, tile);
  }

  for (const move of state.legalTargets) {
    const f = fileOf(move.to);
    const r = rankOf(move.to);
    ctx.fillStyle = move.flags.includes("capture") ? CAPTURE : TARGET;
    ctx.beginPath();
    ctx.arc(originX + f * tile + tile / 2, originY + (7 - r) * tile + tile / 2, tile * 0.18, 0, Math.PI * 2);
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
    drawPiece(ctx, piece, originX + f * tile, originY + (7 - r) * tile, tile);
  }
}

function drawIsometricBoard(ctx: CanvasRenderingContext2D, projection: IsometricProjection, state: RenderState): void {
  for (let depth = 0; depth <= 14; depth += 1) {
    for (let rank = 7; rank >= 0; rank -= 1) {
      const file = depth - (7 - rank);
      if (file < 0 || file > 7) continue;
      drawIsometricTile(ctx, projection, file, rank, tileFill(file, rank), false);
    }
  }

  if (state.checkSquare !== null) {
    const square = state.checkSquare;
    drawIsometricTile(ctx, projection, fileOf(square), rankOf(square), CHECK_TINT, true);
  }

  if (state.selected !== null) {
    drawIsometricTile(ctx, projection, fileOf(state.selected), rankOf(state.selected), HIGHLIGHT, true);
  }

  for (const move of state.legalTargets) {
    const center = isometricCenter(projection, fileOf(move.to), rankOf(move.to));
    ctx.fillStyle = move.flags.includes("capture") ? CAPTURE : TARGET;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, projection.tileW * 0.12, projection.tileH * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let depth = 0; depth <= 14; depth += 1) {
    for (let rank = 7; rank >= 0; rank -= 1) {
      const file = depth - (7 - rank);
      if (file < 0 || file > 7) continue;
      const square = rank * 8 + file;
      if (state.hidePiece === square) continue;
      const piece = state.position.board[square];
      if (!piece) continue;
      const center = isometricCenter(projection, file, rank);
      drawIsometricPiece(ctx, projection, piece, center.x, center.y);
    }
  }
}

function createProjection(canvas: HTMLCanvasElement, view: BoardView): BoardProjection {
  if (view === "isometric") {
    const tileW = Math.min((canvas.width * 0.86) / 8, (canvas.height * 1.45) / 8);
    const tileH = tileW * 0.5;
    return {
      view,
      originX: canvas.width / 2,
      originY: (canvas.height - tileH * 7) / 2,
      tileW,
      tileH
    };
  }

  const tile = Math.min(canvas.width, canvas.height) / 8;
  return {
    view,
    originX: (canvas.width - tile * 8) / 2,
    originY: (canvas.height - tile * 8) / 2,
    tile
  };
}

function tileFill(file: number, rank: number): string {
  return (file + rank) % 2 === 1 ? ISO_LIGHT : ISO_DARK;
}

function isometricCenter(projection: IsometricProjection, file: number, rank: number): Point {
  const row = 7 - rank;
  return {
    x: projection.originX + (file - row) * (projection.tileW / 2),
    y: projection.originY + (file + row) * (projection.tileH / 2)
  };
}

function isometricTilePoints(projection: IsometricProjection, file: number, rank: number): Point[] {
  const center = isometricCenter(projection, file, rank);
  return [
    { x: center.x, y: center.y - projection.tileH / 2 },
    { x: center.x + projection.tileW / 2, y: center.y },
    { x: center.x, y: center.y + projection.tileH / 2 },
    { x: center.x - projection.tileW / 2, y: center.y }
  ];
}

function drawIsometricTile(
  ctx: CanvasRenderingContext2D,
  projection: IsometricProjection,
  file: number,
  rank: number,
  fill: string,
  overlay: boolean
): void {
  const points = isometricTilePoints(projection, file, rank);
  drawPolygon(ctx, points, fill);

  if (!overlay) {
    const sideFill = (file + rank) % 2 === 1 ? ISO_SIDE_LIGHT : ISO_SIDE_DARK;
    const [, right, bottom, left] = points;
    drawPolygon(ctx, [
      left!,
      bottom!,
      { x: bottom!.x, y: bottom!.y + projection.tileH * 0.22 },
      { x: left!.x, y: left!.y + projection.tileH * 0.22 }
    ], sideFill);
    drawPolygon(ctx, [
      right!,
      bottom!,
      { x: bottom!.x, y: bottom!.y + projection.tileH * 0.22 },
      { x: right!.x, y: right!.y + projection.tileH * 0.22 }
    ], sideFill);
    ctx.strokeStyle = "rgba(108, 242, 255, 0.12)";
  } else {
    ctx.strokeStyle = "rgba(230, 241, 255, 0.3)";
  }

  ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.stroke();
}

function drawPolygon(ctx: CanvasRenderingContext2D, points: Point[], fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.closePath();
  ctx.fill();
}

function drawIsometricPiece(
  ctx: CanvasRenderingContext2D,
  projection: IsometricProjection,
  piece: Piece,
  x: number,
  y: number
): void {
  const key = `${piece.color}${piece.type}`;
  const sprite = pieceSprites.get(key);
  const size = projection.tileW * 0.68;
  const top = y - size * 0.88;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + projection.tileH * 0.2, projection.tileW * 0.18, projection.tileH * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  if (sprite?.complete && sprite.naturalWidth > 0) {
    ctx.drawImage(sprite, x - size / 2, top, size, size);
    return;
  }

  const glyph = PIECE_GLYPHS[key];
  if (!glyph) return;
  ctx.font = `${Math.floor(size * 0.8)}px "Segoe UI Symbol", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = piece.color === "w" ? "#f4faff" : "#0a0d18";
  ctx.fillText(glyph, x, top + size / 2);
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

function isometricSquareAt(projection: IsometricProjection, x: number, y: number): Square | null {
  for (let depth = 14; depth >= 0; depth -= 1) {
    for (let rank = 0; rank < 8; rank += 1) {
      const file = depth - (7 - rank);
      if (file < 0 || file > 7) continue;
      if (pointInPolygon({ x, y }, isometricTilePoints(projection, file, rank))) {
        return rank * 8 + file;
      }
    }
  }
  return null;
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    const intersects = (a.y > point.y) !== (b.y > point.y)
      && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}
