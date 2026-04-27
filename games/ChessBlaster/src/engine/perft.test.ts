import assert from "node:assert/strict";
import test from "node:test";
import { legalMoves, parseFen, perft, positionToFen, START_FEN } from "./index.js";

test("starting position has 20 legal moves", () => {
  const position = parseFen(START_FEN);

  assert.equal(legalMoves(position).length, 20);
});

test("starting position perft matches known counts", () => {
  const position = parseFen(START_FEN);

  assert.equal(perft(position, 1), 20);
  assert.equal(perft(position, 2), 400);
  assert.equal(perft(position, 3), 8902);
  assert.equal(perft(position, 4), 197281);
});

test("FEN parser can round-trip the starting position", () => {
  const position = parseFen(START_FEN);

  assert.equal(positionToFen(position), START_FEN);
});

test("kiwipete perft covers castling and tactical edge cases", () => {
  const position = parseFen("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1");

  assert.equal(perft(position, 1), 48);
  assert.equal(perft(position, 2), 2039);
  assert.equal(perft(position, 3), 97862);
});

test("position 3 perft exercises tricky en passant cases", () => {
  const position = parseFen("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1");

  assert.equal(perft(position, 1), 14);
  assert.equal(perft(position, 2), 191);
  assert.equal(perft(position, 3), 2812);
  assert.equal(perft(position, 4), 43238);
});
