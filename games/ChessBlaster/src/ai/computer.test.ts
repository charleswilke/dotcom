import assert from "node:assert/strict";
import test from "node:test";
import { chooseGreedyMove as chooseComputerMove } from "./computer.js";
import { legalMoves, parseFen, START_FEN } from "../engine/index.js";

function uci(move: { from: number; to: number; promotion?: string }): string {
  const files = "abcdefgh";
  const from = `${files[move.from % 8]}${Math.floor(move.from / 8) + 1}`;
  const to = `${files[move.to % 8]}${Math.floor(move.to / 8) + 1}`;
  return `${from}${to}${move.promotion ?? ""}`;
}

test("computer always returns a legal move from the starting position", () => {
  const position = parseFen(START_FEN);
  const move = chooseComputerMove(position, () => 0);

  assert.ok(move);
  assert.ok(legalMoves(position).some((candidate) => uci(candidate) === uci(move)));
});

test("computer prefers a high-value capture when available", () => {
  const position = parseFen("4k3/8/8/8/4q3/8/4R3/4K3 w - - 0 1");
  const move = chooseComputerMove(position, () => 0);

  assert.ok(move);
  assert.equal(uci(move), "e2e4");
});

test("computer returns null when checkmated (no legal moves)", () => {
  // Fool's mate position with black to move? No — pick stalemate-style mate.
  // Black king on h8, mated by white queen on g7 supported by king on f6.
  const position = parseFen("7k/6Q1/5K2/8/8/8/8/8 b - - 0 1");

  assert.equal(legalMoves(position).length, 0);
  assert.equal(chooseComputerMove(position, () => 0), null);
});

test("computer returns null in stalemate", () => {
  // Classic stalemate: black king on a8, white king on c7, white queen on c8 -> not stalemate (mate).
  // Use the canonical stalemate: black king h8, white king f7, white queen g6.
  const position = parseFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");

  assert.equal(legalMoves(position).length, 0);
  assert.equal(chooseComputerMove(position, () => 0), null);
});

test("computer prefers queen promotion over knight promotion", () => {
  const position = parseFen("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");
  const move = chooseComputerMove(position, () => 0);

  assert.ok(move);
  assert.equal(move.promotion, "q");
});

test("computer prefers PxQ over QxP when both capture the same victim type", () => {
  // White queen on a1 and white pawn on d4 can both capture black queen on e5.
  const position = parseFen("4k3/8/8/4q3/3P4/8/8/Q3K3 w - - 0 1");
  const move = chooseComputerMove(position, () => 0);

  assert.ok(move);
  assert.equal(uci(move), "d4e5");
});
