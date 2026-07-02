// Sunday Ink — the newsprint layer of the Living Ink renderer.
// Halftone dot screens, built as tiny repeating canvas tiles (still zero
// image assets: the tiles are drawn by code at boot). Dots sit on a 45°
// lattice like a real print screen, and — like a real print screen — the
// pattern is anchored to the page, not the object: shapes move *through*
// the dots. That's authentic, not a bug.

import { PALETTE } from './ink.js';

const TILE_DEFS = {
  shade: { s: 7, r: 1.9, color: PALETTE.ink },        // shadow/shading screen
  light: { s: 7, r: 1.2, color: PALETTE.ink },        // sparser, for soft tone
  deepWater: { s: 8, r: 2.6, color: PALETTE.waterDeep }, // comic-water dots
};

const tileCanvases = {};

// A seamless 45° dot lattice: quarter-dots in the corners + one center dot.
export function halftoneTile(key) {
  if (tileCanvases[key]) return tileCanvases[key];
  const { s, r, color } = TILE_DEFS[key];
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = color;
  for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s], [s / 2, s / 2]]) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  tileCanvases[key] = c;
  return c;
}

// Patterns are cached per-context (bake contexts and the live canvas each
// get their own), keyed by screen name.
const patternCache = new WeakMap();

export function halftone(ctx, key = 'shade') {
  let m = patternCache.get(ctx);
  if (!m) {
    m = new Map();
    patternCache.set(ctx, m);
  }
  if (!m.has(key)) m.set(key, ctx.createPattern(halftoneTile(key), 'repeat'));
  return m.get(key);
}
