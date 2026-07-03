// Living Ink — shared drawing primitives and utilities.
// Everything in Toots Quest is drawn by code. No image assets, ever.

export const TAU = Math.PI * 2;

export const PALETTE = {
  ink: '#221a56',
  cream: '#f8e9d2',
  orange: '#f76e11',
  hotOrange: '#ff5a36',
  neon: '#00f7c2',
  slate: '#2c4f7c',
  grass: '#a9ba64',
  grassDark: '#8d9e4e',
  grassLight: '#c2cf7e',
  path: '#e7c98f',
  pathDark: '#d2b070',
  water: '#3f6ea5',
  waterDeep: '#2c4f7c',
  rock: '#a89a8a',
  rockDark: '#8d7f70',
  trunk: '#8a5a3a',
  canopy: '#6e9c4f',
  canopyLight: '#8ab864',
  dogBody: '#c98a4b',
  dogChest: '#f3e2c0',
  // The real dogs (cover-art model sheets, session 4): Doc is cream-gray
  // scruff, Astro is charcoal with an ink undertone so he sits well on
  // the outlines.
  dogDoc: '#d8cbb6',
  dogDocChest: '#f3e6cd',
  dogAstro: '#57506a',
  dogAstroChest: '#867e9a',
  skin: '#f2c89b',
  rust: '#b06a3a',
  rustDark: '#8c5128',
};

// Sunday Ink print mode — a global switch the whole renderer reads.
// When on, every primitive prints its color "plate" slightly off-register
// from its ink plate, like a cheaply printed Sunday comic. The ink outline
// never moves; only the color drifts. mx/my is the plate drift in pixels.
// The drift is HORIZONTAL-ONLY: a vertical offset reads as a drop shadow,
// i.e. fake elevation, in the 3/4 view. Sideways drift has no gravity
// story, so it reads as print. (Playtest finding, session 3.)
export const PRINT = { on: false, mx: 2.2, my: 0 };

export function setPrintMode(v) { PRINT.on = !!v; }

// Ink-colored fills ARE the ink plate — they must stay registered.
function plateOffset(fill) {
  if (!PRINT.on || fill === PALETTE.ink) return null;
  return [PRINT.mx, PRINT.my];
}

// Deterministic PRNG — seeded detail never flickers between frames.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
export function easeOutCubic(t) { const u = 1 - t; return 1 - u * u * u; }

// Smallest signed angle from a to b.
export function angleDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

// A rounded thick line — the basic limb/body unit of every character.
export function capsule(ctx, x1, y1, x2, y2, w, fill, inkColor, inkW = 2.2) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (inkColor) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = w + inkW * 2;
    ctx.stroke();
  }
  const off = plateOffset(fill);
  const [ox, oy] = off || [0, 0];
  ctx.beginPath();
  ctx.moveTo(x1 + ox, y1 + oy);
  ctx.lineTo(x2 + ox, y2 + oy);
  ctx.strokeStyle = fill;
  ctx.lineWidth = w;
  ctx.stroke();
}

export function inkCircle(ctx, x, y, r, fill, inkColor, inkW = 2.2) {
  const off = plateOffset(fill);
  const [ox, oy] = off || [0, 0];
  ctx.beginPath();
  ctx.arc(x + ox, y + oy, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (inkColor) {
    if (off) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = inkW;
    ctx.stroke();
  }
}

// Arbitrary closed shape with the same plate rules as the primitives:
// fill drifts in print mode, ink outline stays registered. buildPath must
// begin its own path and be safe to call twice.
export function inkShape(ctx, buildPath, fill, inkColor, inkW = 2.2) {
  const off = plateOffset(fill);
  const [ox, oy] = off || [0, 0];
  ctx.save();
  ctx.translate(ox, oy);
  buildPath(ctx);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  if (inkColor) {
    if (off) buildPath(ctx);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = inkW;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

export function inkEllipse(ctx, x, y, rx, ry, rot, fill, inkColor, inkW = 2) {
  const off = plateOffset(fill);
  const [ox, oy] = off || [0, 0];
  ctx.beginPath();
  ctx.ellipse(x + ox, y + oy, rx, ry, rot, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (inkColor) {
    if (off) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
    }
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = inkW;
    ctx.stroke();
  }
}
