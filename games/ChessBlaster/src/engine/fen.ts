import { parseSquare, square, squareName } from "./coordinates.js";
import type { CastlingRights, Color, Piece, PieceType, Position } from "./types.js";

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const pieceTypes = new Set(["p", "n", "b", "r", "q", "k"]);

export function parseFen(fen: string): Position {
  const parts = fen.trim().split(/\s+/);
  if (parts.length !== 6) {
    throw new Error(`FEN must have 6 fields: ${fen}`);
  }

  const [placement, activeColor, castlingText, enPassantText, halfmoveText, fullmoveText] = parts;
  const board: Array<Piece | null> = Array.from({ length: 64 }, () => null);
  const ranks = placement!.split("/");

  if (ranks.length !== 8) {
    throw new Error(`FEN placement must contain 8 ranks: ${placement}`);
  }

  for (let fenRank = 0; fenRank < 8; fenRank += 1) {
    const rankText = ranks[fenRank]!;
    const rank = 7 - fenRank;
    let file = 0;

    for (const char of rankText) {
      if (/\d/.test(char)) {
        file += Number(char);
        continue;
      }

      const lower = char.toLowerCase();
      if (!pieceTypes.has(lower)) {
        throw new Error(`Invalid FEN piece: ${char}`);
      }

      if (file > 7) {
        throw new Error(`Too many files in FEN rank: ${rankText}`);
      }

      board[square(file, rank)] = {
        color: char === lower ? "b" : "w",
        type: lower as PieceType
      };
      file += 1;
    }

    if (file !== 8) {
      throw new Error(`FEN rank does not contain 8 files: ${rankText}`);
    }
  }

  if (activeColor !== "w" && activeColor !== "b") {
    throw new Error(`Invalid active color: ${activeColor}`);
  }

  return {
    board,
    turn: activeColor,
    castling: parseCastling(castlingText!),
    enPassant: enPassantText === "-" ? null : parseSquare(enPassantText!),
    halfmoveClock: Number(halfmoveText),
    fullmoveNumber: Number(fullmoveText)
  };
}

export function positionToFen(position: Position): string {
  const ranks: string[] = [];

  for (let rank = 7; rank >= 0; rank -= 1) {
    let text = "";
    let empty = 0;

    for (let file = 0; file < 8; file += 1) {
      const piece = position.board[square(file, rank)];
      if (!piece) {
        empty += 1;
        continue;
      }

      if (empty > 0) {
        text += String(empty);
        empty = 0;
      }

      const symbol = piece.color === "w" ? piece.type.toUpperCase() : piece.type;
      text += symbol;
    }

    if (empty > 0) {
      text += String(empty);
    }
    ranks.push(text);
  }

  return [
    ranks.join("/"),
    position.turn,
    castlingToText(position.castling),
    position.enPassant === null ? "-" : squareName(position.enPassant),
    position.halfmoveClock,
    position.fullmoveNumber
  ].join(" ");
}

function parseCastling(text: string): CastlingRights {
  if (text !== "-" && !/^[KQkq]+$/.test(text)) {
    throw new Error(`Invalid castling rights: ${text}`);
  }

  return {
    w: {
      kingSide: text.includes("K"),
      queenSide: text.includes("Q")
    },
    b: {
      kingSide: text.includes("k"),
      queenSide: text.includes("q")
    }
  };
}

function castlingToText(castling: CastlingRights): string {
  const text = [
    castling.w.kingSide ? "K" : "",
    castling.w.queenSide ? "Q" : "",
    castling.b.kingSide ? "k" : "",
    castling.b.queenSide ? "q" : ""
  ].join("");

  return text === "" ? "-" : text;
}

export function clonePosition(position: Position): Position {
  return {
    board: position.board.map((piece) => (piece ? { ...piece } : null)),
    turn: position.turn,
    castling: {
      w: { ...position.castling.w },
      b: { ...position.castling.b }
    },
    enPassant: position.enPassant,
    halfmoveClock: position.halfmoveClock,
    fullmoveNumber: position.fullmoveNumber
  };
}

export function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}
