/* Session round scoring, shared with regression tests. */
(function (root) {
  'use strict';
  function starsForStrokes(strokes) {
    return Number.isInteger(strokes) && strokes > 0 ? Math.max(0, 4 - strokes) : 0;
  }
  function recordBest(scores, index, strokes) {
    if (!Number.isInteger(index) || index < 0 || index >= scores.length ||
        !Number.isInteger(strokes) || strokes < 1) return scores;
    return scores.map((previous, i) => i === index ? Math.min(previous ?? Infinity, strokes) : previous);
  }
  function totalStars(scores) {
    return scores.reduce((total, strokes) => total + starsForStrokes(strokes), 0);
  }
  const api = { starsForStrokes, recordBest, totalStars };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CosmicScoring = api;
})(typeof window !== 'undefined' ? window : globalThis);
