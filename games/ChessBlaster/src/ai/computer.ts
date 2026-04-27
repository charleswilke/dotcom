import { isKingInCheck, legalMoves, makeMove } from "../engine/index.js";
import type { Move, PieceType, Position } from "../engine/types.js";

/**
 * Greedy 1-ply move chooser. This is roadmap step 1.5 (random mover plus
 * handcrafted move scoring), not minimax. It only evaluates the immediate
 * consequences of a move and has no idea what the opponent will play next,
 * so it will happily hang pieces against any reply. Real lookahead arrives
 * with the minimax module later.
 */

const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 300,
  b: 320,
  r: 500,
  q: 900,
  k: 0
};

type Rng = () => number;

export function chooseGreedyMove(position: Position, rng: Rng = Math.random): Move | null {
  const moves = legalMoves(position);
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMoves: Move[] = [];

  for (const move of moves) {
    const score = scoreMove(position, move);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(rng() * bestMoves.length)] ?? bestMoves[0] ?? null;
}

/** Backward-compatible alias; prefer `chooseGreedyMove` in new code. */
export const chooseComputerMove = chooseGreedyMove;

function scoreMove(position: Position, move: Move): number {
  let score = 0;
  const attacker = position.board[move.from];
  const target = position.board[move.to];

  // MVV-LVA-ish: prefer capturing high-value pieces with low-value attackers.
  // Pure 1-ply still can't see the recapture, but among capture choices this
  // pushes PxQ ahead of QxP.
  if (target) {
    score += PIECE_VALUES[target.type] + 80;
    if (attacker) score -= PIECE_VALUES[attacker.type] / 10;
  }

  if (move.flags.includes("en-passant")) {
    score += PIECE_VALUES.p + 80;
    if (attacker) score -= PIECE_VALUES[attacker.type] / 10;
  }

  if (move.promotion) {
    score += PIECE_VALUES[move.promotion] - PIECE_VALUES.p + 300;
  }

  const next = makeMove(position, move);
  if (isKingInCheck(next, next.turn)) {
    score += 60;
  }

  return score;
}
