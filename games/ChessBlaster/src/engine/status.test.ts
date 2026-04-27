import assert from "node:assert/strict";
import test from "node:test";
import {
  gameStatus,
  hasInsufficientMaterial,
  legalMoves,
  makeMove,
  parseFen,
  repetitionKey
} from "./index.js";

test("fool's mate position is checkmate", () => {
  const position = parseFen("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");

  assert.equal(gameStatus(position), "checkmate");
});

test("classic stalemate position is recognized", () => {
  const position = parseFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");

  assert.equal(gameStatus(position), "stalemate");
});

test("plain king vs king is insufficient material", () => {
  const position = parseFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1");

  assert.equal(hasInsufficientMaterial(position), true);
  assert.equal(gameStatus(position), "draw-insufficient-material");
});

test("king and bishop vs king is insufficient material", () => {
  const position = parseFen("4k3/8/8/8/8/8/8/3BK3 w - - 0 1");

  assert.equal(hasInsufficientMaterial(position), true);
});

test("king and rook vs king has sufficient material", () => {
  const position = parseFen("4k3/8/8/8/8/8/8/3RK3 w - - 0 1");

  assert.equal(hasInsufficientMaterial(position), false);
});

test("fifty-move rule triggers draw at 100 halfmoves", () => {
  const position = parseFen("4k3/8/4K3/4R3/8/8/8/8 w - - 100 60");

  assert.equal(gameStatus(position), "draw-fifty-move");
});

test("threefold repetition is detected from history", () => {
  const position = parseFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
  const key = repetitionKey(position);

  assert.equal(gameStatus(position, [key, key, key]), "draw-insufficient-material");
});

test("ongoing position with check reports check", () => {
  const position = parseFen("4k3/8/8/8/8/8/4r3/4K3 w - - 0 1");

  assert.equal(gameStatus(position), "check");
  assert.ok(legalMoves(position).length > 0);
});

test("makeMove preserves a legal continuation", () => {
  const position = parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const moves = legalMoves(position);
  const e4 = moves.find((m) => m.flags.includes("double-pawn-push"));

  assert.ok(e4);
  const next = makeMove(position, e4!);
  assert.equal(next.turn, "b");
});
