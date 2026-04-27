import type { Square } from "./types.js";

const files = "abcdefgh";

export function square(file: number, rank: number): Square {
  return rank * 8 + file;
}

export function fileOf(squareIndex: Square): number {
  return squareIndex % 8;
}

export function rankOf(squareIndex: Square): number {
  return Math.floor(squareIndex / 8);
}

export function isOnBoard(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

export function squareName(squareIndex: Square): string {
  return `${files[fileOf(squareIndex)]}${rankOf(squareIndex) + 1}`;
}

export function parseSquare(name: string): Square {
  if (!/^[a-h][1-8]$/.test(name)) {
    throw new Error(`Invalid square: ${name}`);
  }

  return square(files.indexOf(name[0]!), Number(name[1]) - 1);
}

