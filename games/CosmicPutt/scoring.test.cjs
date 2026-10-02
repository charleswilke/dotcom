const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('./scoring.js');

test('stars reward one, two, and three putts; longer or unfinished holes earn zero', () => {
  assert.deepEqual([1, 2, 3, 4, 8, null, 0, -1].map(S.starsForStrokes), [3, 2, 1, 0, 0, 0, 0, 0]);
});
test('replaying improves a hole without accumulating duplicate rewards or losing a better result', () => {
  let scores = [null, null, null];
  scores = S.recordBest(scores, 0, 3);
  scores = S.recordBest(scores, 1, 2);
  assert.equal(S.totalStars(scores), 3);
  scores = S.recordBest(scores, 0, 1);
  assert.equal(S.totalStars(scores), 5);
  scores = S.recordBest(scores, 0, 4);
  assert.deepEqual(scores, [1, 2, null]);
  scores = S.recordBest(scores, 2, 1);
  assert.equal(S.totalStars(scores), 8);
});
test('invalid or unfinished attempts cannot create a completed score', () => {
  const scores = [null, null, null];
  for (const [index, strokes] of [[0, 0], [0, null], [-1, 1], [3, 1], [1, 1.5]]) {
    assert.deepEqual(S.recordBest(scores, index, strokes), scores);
  }
});
