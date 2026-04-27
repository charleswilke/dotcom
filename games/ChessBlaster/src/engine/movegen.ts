import { fileOf, isOnBoard, rankOf, square } from "./coordinates.js";
import { clonePosition, opposite } from "./fen.js";
import type { Color, Move, Piece, PieceType, Position, Square } from "./types.js";

const knightOffsets = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2]
] as const;

const bishopDirections = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1]
] as const;

const rookDirections = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1]
] as const;

const kingOffsets = [...bishopDirections, ...rookDirections] as const;
const queenDirections = kingOffsets;
const promotionPieces: Array<Exclude<PieceType, "p" | "k">> = ["q", "r", "b", "n"];

export function legalMoves(position: Position): Move[] {
  return pseudoLegalMoves(position).filter((move) => {
    const next = makeMove(position, move);
    return !isKingInCheck(next, position.turn);
  });
}

export function perft(position: Position, depth: number): number {
  if (depth === 0) {
    return 1;
  }

  let nodes = 0;
  for (const move of legalMoves(position)) {
    nodes += perft(makeMove(position, move), depth - 1);
  }

  return nodes;
}

export function makeMove(position: Position, move: Move): Position {
  const next = clonePosition(position);
  const moving = next.board[move.from];
  if (!moving) {
    throw new Error("Cannot move from an empty square");
  }

  const captured = next.board[move.to];
  next.board[move.from] = null;
  next.board[move.to] = move.promotion
    ? { color: moving.color, type: move.promotion }
    : moving;

  if (move.flags.includes("en-passant")) {
    const captureRank = moving.color === "w" ? rankOf(move.to) - 1 : rankOf(move.to) + 1;
    next.board[square(fileOf(move.to), captureRank)] = null;
  }

  if (move.flags.includes("king-side-castle")) {
    const rank = moving.color === "w" ? 0 : 7;
    next.board[square(5, rank)] = next.board[square(7, rank)] ?? null;
    next.board[square(7, rank)] = null;
  }

  if (move.flags.includes("queen-side-castle")) {
    const rank = moving.color === "w" ? 0 : 7;
    next.board[square(3, rank)] = next.board[square(0, rank)] ?? null;
    next.board[square(0, rank)] = null;
  }

  next.enPassant = null;
  if (move.flags.includes("double-pawn-push")) {
    const direction = moving.color === "w" ? 1 : -1;
    next.enPassant = square(fileOf(move.from), rankOf(move.from) + direction);
  }

  updateCastlingRights(next, moving, move.from, move.to, captured);

  next.halfmoveClock = moving.type === "p" || captured || move.flags.includes("en-passant")
    ? 0
    : next.halfmoveClock + 1;

  if (position.turn === "b") {
    next.fullmoveNumber += 1;
  }

  next.turn = opposite(position.turn);
  return next;
}

export function isKingInCheck(position: Position, color: Color): boolean {
  const kingSquare = position.board.findIndex((piece) => piece?.color === color && piece.type === "k");
  if (kingSquare === -1) {
    return false;
  }

  return isSquareAttacked(position, kingSquare, opposite(color));
}

export function isSquareAttacked(position: Position, target: Square, byColor: Color): boolean {
  const targetFile = fileOf(target);
  const targetRank = rankOf(target);
  const pawnDirection = byColor === "w" ? 1 : -1;

  for (const fileDelta of [-1, 1]) {
    const file = targetFile - fileDelta;
    const rank = targetRank - pawnDirection;
    if (isOnBoard(file, rank) && hasPiece(position, square(file, rank), byColor, "p")) {
      return true;
    }
  }

  for (const [fileDelta, rankDelta] of knightOffsets) {
    const file = targetFile + fileDelta;
    const rank = targetRank + rankDelta;
    if (isOnBoard(file, rank) && hasPiece(position, square(file, rank), byColor, "n")) {
      return true;
    }
  }

  if (isAttackedAlong(position, target, byColor, bishopDirections, ["b", "q"])) {
    return true;
  }

  if (isAttackedAlong(position, target, byColor, rookDirections, ["r", "q"])) {
    return true;
  }

  for (const [fileDelta, rankDelta] of kingOffsets) {
    const file = targetFile + fileDelta;
    const rank = targetRank + rankDelta;
    if (isOnBoard(file, rank) && hasPiece(position, square(file, rank), byColor, "k")) {
      return true;
    }
  }

  return false;
}

function pseudoLegalMoves(position: Position): Move[] {
  const moves: Move[] = [];

  for (let from = 0; from < 64; from += 1) {
    const piece = position.board[from];
    if (!piece || piece.color !== position.turn) {
      continue;
    }

    if (piece.type === "p") addPawnMoves(position, from, piece, moves);
    if (piece.type === "n") addJumpMoves(position, from, piece, knightOffsets, moves);
    if (piece.type === "b") addSlidingMoves(position, from, piece, bishopDirections, moves);
    if (piece.type === "r") addSlidingMoves(position, from, piece, rookDirections, moves);
    if (piece.type === "q") addSlidingMoves(position, from, piece, queenDirections, moves);
    if (piece.type === "k") addKingMoves(position, from, piece, moves);
  }

  return moves;
}

function addPawnMoves(position: Position, from: Square, piece: Piece, moves: Move[]): void {
  const direction = piece.color === "w" ? 1 : -1;
  const startRank = piece.color === "w" ? 1 : 6;
  const promotionRank = piece.color === "w" ? 7 : 0;
  const fromFile = fileOf(from);
  const fromRank = rankOf(from);
  const oneRank = fromRank + direction;

  if (isOnBoard(fromFile, oneRank)) {
    const oneForward = square(fromFile, oneRank);
    if (!position.board[oneForward]) {
      addPawnMove(from, oneForward, oneRank === promotionRank, false, moves);

      const twoRank = fromRank + direction * 2;
      const twoForward = square(fromFile, twoRank);
      if (fromRank === startRank && !position.board[twoForward]) {
        moves.push({ from, to: twoForward, flags: ["double-pawn-push"] });
      }
    }
  }

  for (const fileDelta of [-1, 1]) {
    const toFile = fromFile + fileDelta;
    const toRank = fromRank + direction;
    if (!isOnBoard(toFile, toRank)) {
      continue;
    }

    const to = square(toFile, toRank);
    const target = position.board[to];
    if (target && target.color !== piece.color) {
      addPawnMove(from, to, toRank === promotionRank, true, moves);
    }

    if (position.enPassant === to) {
      moves.push({ from, to, flags: ["en-passant", "capture"] });
    }
  }
}

function addPawnMove(from: Square, to: Square, promotes: boolean, captures: boolean, moves: Move[]): void {
  const flags = captures ? ["capture"] as const : ["quiet"] as const;
  if (!promotes) {
    moves.push({ from, to, flags: [...flags] });
    return;
  }

  for (const promotion of promotionPieces) {
    moves.push({ from, to, promotion, flags: ["promotion", ...flags] });
  }
}

function addJumpMoves(
  position: Position,
  from: Square,
  piece: Piece,
  offsets: ReadonlyArray<readonly [number, number]>,
  moves: Move[]
): void {
  const fromFile = fileOf(from);
  const fromRank = rankOf(from);

  for (const [fileDelta, rankDelta] of offsets) {
    const toFile = fromFile + fileDelta;
    const toRank = fromRank + rankDelta;
    if (!isOnBoard(toFile, toRank)) {
      continue;
    }

    addMoveIfAvailable(position, from, square(toFile, toRank), piece, moves);
  }
}

function addSlidingMoves(
  position: Position,
  from: Square,
  piece: Piece,
  directions: ReadonlyArray<readonly [number, number]>,
  moves: Move[]
): void {
  const fromFile = fileOf(from);
  const fromRank = rankOf(from);

  for (const [fileDelta, rankDelta] of directions) {
    let toFile = fromFile + fileDelta;
    let toRank = fromRank + rankDelta;

    while (isOnBoard(toFile, toRank)) {
      const to = square(toFile, toRank);
      const target = position.board[to];
      if (!target) {
        moves.push({ from, to, flags: ["quiet"] });
      } else {
        if (target.color !== piece.color) {
          moves.push({ from, to, flags: ["capture"] });
        }
        break;
      }

      toFile += fileDelta;
      toRank += rankDelta;
    }
  }
}

function addKingMoves(position: Position, from: Square, piece: Piece, moves: Move[]): void {
  addJumpMoves(position, from, piece, kingOffsets, moves);
  const rank = piece.color === "w" ? 0 : 7;

  if (from !== square(4, rank) || isKingInCheck(position, piece.color)) {
    return;
  }

  if (
    position.castling[piece.color].kingSide &&
    !position.board[square(5, rank)] &&
    !position.board[square(6, rank)] &&
    !isSquareAttacked(position, square(5, rank), opposite(piece.color)) &&
    !isSquareAttacked(position, square(6, rank), opposite(piece.color))
  ) {
    moves.push({ from, to: square(6, rank), flags: ["king-side-castle"] });
  }

  if (
    position.castling[piece.color].queenSide &&
    !position.board[square(3, rank)] &&
    !position.board[square(2, rank)] &&
    !position.board[square(1, rank)] &&
    !isSquareAttacked(position, square(3, rank), opposite(piece.color)) &&
    !isSquareAttacked(position, square(2, rank), opposite(piece.color))
  ) {
    moves.push({ from, to: square(2, rank), flags: ["queen-side-castle"] });
  }
}

function addMoveIfAvailable(position: Position, from: Square, to: Square, piece: Piece, moves: Move[]): void {
  const target = position.board[to];
  if (!target) {
    moves.push({ from, to, flags: ["quiet"] });
  } else if (target.color !== piece.color) {
    moves.push({ from, to, flags: ["capture"] });
  }
}

function updateCastlingRights(
  position: Position,
  moving: Piece,
  from: Square,
  to: Square,
  captured: Piece | null | undefined
): void {
  if (moving.type === "k") {
    position.castling[moving.color].kingSide = false;
    position.castling[moving.color].queenSide = false;
  }

  disableRookCastling(position, moving.color, from);
  if (captured?.type === "r") {
    disableRookCastling(position, captured.color, to);
  }
}

function disableRookCastling(position: Position, color: Color, rookSquare: Square): void {
  const rank = color === "w" ? 0 : 7;
  if (rookSquare === square(0, rank)) {
    position.castling[color].queenSide = false;
  }
  if (rookSquare === square(7, rank)) {
    position.castling[color].kingSide = false;
  }
}

function hasPiece(position: Position, at: Square, color: Color, type: PieceType): boolean {
  const piece = position.board[at];
  return piece?.color === color && piece.type === type;
}

function isAttackedAlong(
  position: Position,
  target: Square,
  byColor: Color,
  directions: ReadonlyArray<readonly [number, number]>,
  attackers: PieceType[]
): boolean {
  const targetFile = fileOf(target);
  const targetRank = rankOf(target);

  for (const [fileDelta, rankDelta] of directions) {
    let file = targetFile + fileDelta;
    let rank = targetRank + rankDelta;

    while (isOnBoard(file, rank)) {
      const piece = position.board[square(file, rank)];
      if (!piece) {
        file += fileDelta;
        rank += rankDelta;
        continue;
      }

      if (piece.color === byColor && attackers.includes(piece.type)) {
        return true;
      }

      break;
    }
  }

  return false;
}
