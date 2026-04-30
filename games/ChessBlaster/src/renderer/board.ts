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

export type BoardView = "flat" | "isometric";

export type RenderState = {
  position: Position;
  selected: Square | null;
  legalTargets: Move[];
  checkSquare: Square | null;
  view: BoardView;
  /** Optional: square to skip drawing (e.g. piece being dragged). */
  hidePiece?: Square;
  hidePieces?: Square[];
  movingPiece?: {
    piece: Piece;
    from: Square;
    to: Square;
    progress: number;
  };
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
  onReady();
  return Promise.resolve();
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
  const hidden = hiddenSquares(state);

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
    if (hidden.has(i)) continue;
    const piece = state.position.board[i];
    if (!piece) continue;
    const f = fileOf(i);
    const r = rankOf(i);
    drawPiece(ctx, piece, originX + f * tile, originY + (7 - r) * tile, tile);
  }

  if (state.movingPiece) {
    const from = flatSquareCenter(projection, state.movingPiece.from);
    const to = flatSquareCenter(projection, state.movingPiece.to);
    const progress = easedProgress(state.movingPiece.progress);
    const arc = Math.sin(Math.PI * state.movingPiece.progress) * tile * 0.1;
    drawPiece(
      ctx,
      state.movingPiece.piece,
      lerp(from.x, to.x, progress) - tile / 2,
      lerp(from.y, to.y, progress) - tile / 2 - arc,
      tile,
      state.movingPiece.progress
    );
  }
}

function drawIsometricBoard(ctx: CanvasRenderingContext2D, projection: IsometricProjection, state: RenderState): void {
  const hidden = hiddenSquares(state);

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
      if (hidden.has(square)) continue;
      const piece = state.position.board[square];
      if (!piece) continue;
      const center = isometricCenter(projection, file, rank);
      drawIsometricPiece(ctx, projection, piece, center.x, center.y);
    }
  }

  if (state.movingPiece) {
    const from = isometricSquareCenter(projection, state.movingPiece.from);
    const to = isometricSquareCenter(projection, state.movingPiece.to);
    const progress = easedProgress(state.movingPiece.progress);
    const lift = Math.sin(Math.PI * state.movingPiece.progress) * projection.tileH * 0.34;
    drawIsometricPiece(
      ctx,
      projection,
      state.movingPiece.piece,
      lerp(from.x, to.x, progress),
      lerp(from.y, to.y, progress) - lift,
      state.movingPiece.progress
    );
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

function flatSquareCenter(projection: FlatProjection, square: Square): Point {
  return {
    x: projection.originX + fileOf(square) * projection.tile + projection.tile / 2,
    y: projection.originY + (7 - rankOf(square)) * projection.tile + projection.tile / 2
  };
}

function isometricSquareCenter(projection: IsometricProjection, square: Square): Point {
  return isometricCenter(projection, fileOf(square), rankOf(square));
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
  y: number,
  morphProgress = 0
): void {
  const size = projection.tileW * 0.68;

  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + projection.tileH * 0.2, projection.tileW * 0.18, projection.tileH * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  drawBlasterPiece(ctx, piece, x, y + projection.tileH * 0.1, size * 1.06, morphProgress);
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  x: number,
  y: number,
  tile: number,
  morphProgress = 0
): void {
  const inset = tile * 0.08;
  drawBlasterPiece(ctx, piece, x + tile / 2, y + tile - inset * 0.72, tile - inset * 2, morphProgress);
}

function hiddenSquares(state: RenderState): Set<Square> {
  const hidden = new Set<Square>();
  if (state.hidePiece !== undefined) hidden.add(state.hidePiece);
  for (const square of state.hidePieces ?? []) hidden.add(square);
  if (state.movingPiece) {
    hidden.add(state.movingPiece.from);
    hidden.add(state.movingPiece.to);
  }
  return hidden;
}

function drawBlasterPiece(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  centerX: number,
  bottomY: number,
  size: number,
  morphProgress: number
): void {
  const pulse = Math.sin(Math.PI * clamp(morphProgress, 0, 1));
  const lean = pulse * (piece.color === "w" ? -5 : 5);
  const palette = piecePalette(piece.color);

  ctx.save();
  ctx.translate(centerX, bottomY);
  ctx.rotate((lean * Math.PI) / 180);
  ctx.scale(size / 100, (size / 100) * (1 + pulse * 0.06));

  drawPieceGlow(ctx, palette, pulse);
  drawMotionSignature(ctx, piece, palette, pulse);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = palette.rim;
  ctx.fillStyle = palette.body;

  drawPieceSilhouette(ctx, piece.type, pulse);
  ctx.fill();
  ctx.stroke();

  drawPieceCuts(ctx, piece, palette, pulse);
  ctx.restore();
}

function drawPieceSilhouette(ctx: CanvasRenderingContext2D, type: Piece["type"], pulse: number): void {
  ctx.beginPath();
  if (type === "p") {
    ctx.moveTo(-23, -4);
    ctx.quadraticCurveTo(-20, -22, -10, -32);
    ctx.quadraticCurveTo(-22, -48, 0, -62 - pulse * 5);
    ctx.quadraticCurveTo(22, -48, 10, -32);
    ctx.quadraticCurveTo(20, -22, 23, -4);
  } else if (type === "r") {
    ctx.moveTo(-31 - pulse * 3, -4);
    ctx.quadraticCurveTo(-30, -13, -21, -18);
    ctx.lineTo(-18, -26);
    ctx.lineTo(-23, -54);
    ctx.lineTo(-30, -54);
    ctx.lineTo(-30, -70 - pulse * 4);
    ctx.lineTo(-17, -70 - pulse * 4);
    ctx.lineTo(-17, -60);
    ctx.lineTo(-6, -60);
    ctx.lineTo(-6, -70 - pulse * 5);
    ctx.lineTo(6, -70 - pulse * 5);
    ctx.lineTo(6, -60);
    ctx.lineTo(17, -60);
    ctx.lineTo(17, -70 - pulse * 4);
    ctx.lineTo(30, -70 - pulse * 4);
    ctx.lineTo(30, -54);
    ctx.lineTo(23, -54);
    ctx.lineTo(18, -26);
    ctx.lineTo(21, -18);
    ctx.quadraticCurveTo(30, -13, 31 + pulse * 3, -4);
  } else if (type === "b") {
    ctx.moveTo(-27, -4);
    ctx.quadraticCurveTo(-27, -14, -18, -19);
    ctx.lineTo(-13, -25);
    ctx.quadraticCurveTo(-28, -47, -5, -66);
    ctx.quadraticCurveTo(0, -76 - pulse * 6, 8 + pulse * 3, -66);
    ctx.quadraticCurveTo(29, -47, 13, -25);
    ctx.lineTo(18, -19);
    ctx.quadraticCurveTo(27, -14, 27, -4);
  } else if (type === "n") {
    ctx.moveTo(-31, -4);
    ctx.quadraticCurveTo(-29, -16, -17, -22);
    ctx.quadraticCurveTo(-20, -40, -8, -59);
    ctx.lineTo(-2, -74 - pulse * 4);
    ctx.lineTo(7, -62);
    ctx.quadraticCurveTo(18, -68 - pulse * 3, 30 + pulse * 3, -56);
    ctx.quadraticCurveTo(36 + pulse * 3, -49, 29, -43);
    ctx.lineTo(18, -40);
    ctx.quadraticCurveTo(14, -33, 5, -29);
    ctx.quadraticCurveTo(-5, -24, 3, -16);
    ctx.lineTo(25, -4);
  } else if (type === "q") {
    ctx.moveTo(-34 - pulse * 3, -4);
    ctx.quadraticCurveTo(-32, -14, -22, -19);
    ctx.lineTo(-18, -28);
    ctx.lineTo(-28, -61 - pulse * 3);
    ctx.quadraticCurveTo(-23, -66, -17, -61);
    ctx.lineTo(-8, -68 - pulse * 5);
    ctx.quadraticCurveTo(-4, -74 - pulse * 4, 0, -66);
    ctx.quadraticCurveTo(4, -74 - pulse * 4, 8, -68 - pulse * 5);
    ctx.lineTo(17, -61);
    ctx.quadraticCurveTo(23, -66, 28, -61 - pulse * 3);
    ctx.lineTo(18, -28);
    ctx.lineTo(22, -19);
    ctx.quadraticCurveTo(32, -14, 34 + pulse * 3, -4);
  } else {
    ctx.moveTo(-33, -4);
    ctx.quadraticCurveTo(-31, -14, -21, -19);
    ctx.lineTo(-16, -28);
    ctx.quadraticCurveTo(-28, -50, -7, -59);
    ctx.lineTo(-7, -72 - pulse * 4);
    ctx.lineTo(-17, -72 - pulse * 4);
    ctx.lineTo(-17, -82 - pulse * 4);
    ctx.lineTo(-7, -82 - pulse * 4);
    ctx.lineTo(-7, -93 - pulse * 6);
    ctx.lineTo(7, -93 - pulse * 6);
    ctx.lineTo(7, -82 - pulse * 4);
    ctx.lineTo(17, -82 - pulse * 4);
    ctx.lineTo(17, -72 - pulse * 4);
    ctx.lineTo(7, -72 - pulse * 4);
    ctx.lineTo(7, -59);
    ctx.quadraticCurveTo(28, -50, 16, -28);
    ctx.lineTo(21, -19);
    ctx.quadraticCurveTo(31, -14, 33, -4);
  }
  ctx.closePath();
}

function drawPieceCuts(ctx: CanvasRenderingContext2D, piece: Piece, palette: PiecePalette, pulse: number): void {
  ctx.strokeStyle = palette.cut;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(-24, -4);
  ctx.lineTo(24, -4);
  ctx.moveTo(-18, -14);
  ctx.lineTo(18, -14);
  ctx.moveTo(-15, -23);
  ctx.quadraticCurveTo(0, -17, 15, -23);
  ctx.stroke();

  if (piece.type === "b") {
    ctx.beginPath();
    ctx.moveTo(-7 - pulse * 2, -56);
    ctx.quadraticCurveTo(4, -48, 12 + pulse * 4, -36);
    ctx.stroke();
  } else if (piece.type === "n") {
    ctx.beginPath();
    ctx.arc(15, -52, 2.4 + pulse * 0.8, 0, Math.PI * 2);
    ctx.moveTo(-7, -60);
    ctx.lineTo(-12, -48);
    ctx.moveTo(-10, -49);
    ctx.lineTo(-15, -39);
    ctx.moveTo(-12, -38);
    ctx.lineTo(-16, -29);
    ctx.moveTo(18, -40);
    ctx.quadraticCurveTo(25, -38, 31, -42);
    ctx.stroke();
  } else if (piece.type === "r") {
    for (const x of [-13, 0, 13]) {
      ctx.beginPath();
      ctx.moveTo(x, -52);
      ctx.lineTo(x, -30);
      ctx.stroke();
    }
  } else if (piece.type === "q") {
    for (const [x, y] of [[-26, -60], [-9, -67], [9, -67], [26, -60]] as const) {
      drawCore(ctx, x, y, 4 + pulse * 2, palette.core);
    }
  } else if (piece.type === "k") {
    ctx.beginPath();
    ctx.moveTo(-11 - pulse * 3, -45);
    ctx.quadraticCurveTo(0, -39, 11 + pulse * 3, -45);
    ctx.stroke();
  }

  drawCore(ctx, 0, piece.type === "p" ? -43 : -31, piece.type === "k" ? 5.5 : 4.5, palette.core);
}

function drawMotionSignature(ctx: CanvasRenderingContext2D, piece: Piece, palette: PiecePalette, pulse: number): void {
  if (pulse <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = 0.42 * pulse;
  ctx.fillStyle = palette.core;
  ctx.strokeStyle = palette.core;
  ctx.lineWidth = 3;

  if (piece.type === "r") {
    ctx.fillRect(-42, -43, 14 * pulse, 9);
    ctx.fillRect(28, -43, 14 * pulse, 9);
  } else if (piece.type === "b") {
    ctx.beginPath();
    ctx.moveTo(-34, -62);
    ctx.lineTo(0, -22);
    ctx.lineTo(34, -2);
    ctx.stroke();
  } else if (piece.type === "n") {
    ctx.beginPath();
    ctx.moveTo(-31, -27);
    ctx.quadraticCurveTo(4, -93, 39, -51);
    ctx.stroke();
  } else if (piece.type === "q") {
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 22, -42 + Math.sin(angle) * 18);
      ctx.lineTo(Math.cos(angle) * (34 + pulse * 8), -42 + Math.sin(angle) * (28 + pulse * 8));
      ctx.stroke();
    }
  } else if (piece.type === "k") {
    ctx.beginPath();
    ctx.ellipse(0, -42, 39 + pulse * 5, 26 + pulse * 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(0, 18 + pulse * 8);
    ctx.lineTo(12, -2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawPieceGlow(ctx: CanvasRenderingContext2D, palette: PiecePalette, pulse: number): void {
  ctx.save();
  ctx.globalAlpha = 0.22 + pulse * 0.18;
  ctx.fillStyle = palette.glow;
  ctx.beginPath();
  ctx.ellipse(0, -22, 36 + pulse * 7, 22 + pulse * 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCore(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

type PiecePalette = {
  body: string;
  rim: string;
  cut: string;
  core: string;
  glow: string;
};

function piecePalette(color: Piece["color"]): PiecePalette {
  if (color === "w") {
    return {
      body: "#f4fbff",
      rim: "#66f5ff",
      cut: "#16305c",
      core: "#00f7c2",
      glow: "#6cf2ff"
    };
  }

  return {
    body: "#111827",
    rim: "#ff6b8a",
    cut: "#a9f8ff",
    core: "#ff5a36",
    glow: "#ff5a36"
  };
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function easedProgress(progress: number): number {
  return 1 - Math.pow(1 - clamp(progress, 0, 1), 3);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
