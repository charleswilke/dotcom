import { fileOf, rankOf } from "./coordinates.js";
import { isKingInCheck, legalMoves } from "./movegen.js";
import type { Piece, Position } from "./types.js";

export type GameStatus =
  | "ongoing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw-fifty-move"
  | "draw-threefold"
  | "draw-insufficient-material";

export type GameResult = "white-wins" | "black-wins" | "draw" | "ongoing";

export function gameStatus(position: Position, history: string[] = []): GameStatus {
  if (hasInsufficientMaterial(position)) {
    return "draw-insufficient-material";
  }

  if (position.halfmoveClock >= 100) {
    return "draw-fifty-move";
  }

  if (isThreefoldRepetition(history)) {
    return "draw-threefold";
  }

  const moves = legalMoves(position);
  const inCheck = isKingInCheck(position, position.turn);

  if (moves.length === 0) {
    return inCheck ? "checkmate" : "stalemate";
  }

  return inCheck ? "check" : "ongoing";
}

export function gameResult(status: GameStatus, sideToMove: Position["turn"]): GameResult {
  if (status === "checkmate") {
    return sideToMove === "w" ? "black-wins" : "white-wins";
  }
  if (status === "ongoing" || status === "check") {
    return "ongoing";
  }
  return "draw";
}

export function repetitionKey(position: Position): string {
  const pieces: string[] = [];
  for (let i = 0; i < 64; i += 1) {
    const piece = position.board[i];
    pieces.push(piece ? (piece.color === "w" ? piece.type.toUpperCase() : piece.type) : ".");
  }

  const castling = [
    position.castling.w.kingSide ? "K" : "",
    position.castling.w.queenSide ? "Q" : "",
    position.castling.b.kingSide ? "k" : "",
    position.castling.b.queenSide ? "q" : ""
  ].join("") || "-";

  return `${pieces.join("")}|${position.turn}|${castling}|${position.enPassant ?? "-"}`;
}

function isThreefoldRepetition(history: string[]): boolean {
  if (history.length === 0) return false;
  const last = history[history.length - 1];
  let count = 0;
  for (const key of history) {
    if (key === last) count += 1;
  }
  return count >= 3;
}

export function hasInsufficientMaterial(position: Position): boolean {
  const minor: Array<{ piece: Piece; squareColor: 0 | 1 }> = [];

  for (let i = 0; i < 64; i += 1) {
    const piece = position.board[i];
    if (!piece) continue;
    if (piece.type === "k") continue;
    if (piece.type === "p" || piece.type === "r" || piece.type === "q") {
      return false;
    }
    const squareColor: 0 | 1 = ((fileOf(i) + rankOf(i)) % 2) as 0 | 1;
    minor.push({ piece, squareColor });
  }

  if (minor.length === 0) return true;
  if (minor.length === 1) return true;
  if (minor.length === 2) {
    const [a, b] = minor as [(typeof minor)[number], (typeof minor)[number]];
    if (a.piece.type === "b" && b.piece.type === "b" && a.squareColor === b.squareColor) {
      return true;
    }
  }

  return false;
}
