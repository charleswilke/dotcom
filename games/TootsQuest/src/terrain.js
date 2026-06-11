// Terrain — collision lives on a logical grid; rendering ignores the grid.
// Regions are merged into rounded organic blobs and baked once to an
// offscreen canvas, so the per-frame cost of the ground is one drawImage.

import { PALETTE, TAU, mulberry32 } from './ink.js';

export const TILE = 32;
export const COLS = 30;
export const ROWS = 17;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

// G grass · P path · W water · R rock
const LAYOUT = [
  'GGGGGGGGGGGGGGGGGGGGGGWWWWWWWG',
  'GGGGGGGGGGGGGGGGGGGGGWWWWWWWWG',
  'GGGGGGGGGGGGGGGGGGGGGWWWWWWWWG',
  'GGGGGGGGGGGGGGGGGGGGGGWWWWWWGG',
  'GGGGGGGGGGGGGGGGGGGGGGGWWWWGGG',
  'GGGGGGGGGGGPPGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGPPGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGPPGGGGGGGGRGGGGGGGG',
  'PPPPPPPPPPPPPGGGGGGGGRRGGGGGGG',
  'PPPPPPPPPPPPPPPGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGPPPPPGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGPPPPPGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGPPPPPPPPPPPPPP',
  'GGGGGGGGGGGGGGGGGGPPPPPPPPPPPP',
  'GGGRGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGRRGGGGGGGGGGGGGGGGGGGGGGGGGG',
  'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
];

function tileAt(cx, cy) {
  if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return 'W';
  return LAYOUT[cy][cx] || 'G';
}

// Fixed decor for the M0 room. In M1+ this becomes per-room data modules.
export const DECOR = {
  trees: [
    { x: 70, y: 95 }, { x: 185, y: 58 }, { x: 340, y: 78 }, { x: 560, y: 62 },
    { x: 645, y: 110 }, { x: 905, y: 195 }, { x: 80, y: 360 }, { x: 52, y: 448 },
    { x: 175, y: 505 }, { x: 430, y: 512 }, { x: 880, y: 320 }, { x: 735, y: 520 },
  ],
  torches: [
    { x: 305, y: 242 }, { x: 625, y: 370 },
  ],
  banner: { x: 348, y: 170 },
  secret: { x: 762, y: 252 },
  miteSpawns: [
    { x: 505, y: 300 }, { x: 245, y: 425 }, { x: 805, y: 425 },
  ],
  playerSpawn: { x: 330, y: 320 },
};

// Static circular blockers (tree trunks, posts).
export const STATIC_COLLIDERS = [
  ...DECOR.trees.map(t => ({ x: t.x, y: t.y, r: 9 })),
  ...DECOR.torches.map(t => ({ x: t.x, y: t.y, r: 6 })),
  { x: DECOR.banner.x, y: DECOR.banner.y, r: 7 },
];

export function solidAt(x, y) {
  const c = tileAt(Math.floor(x / TILE), Math.floor(y / TILE));
  return c === 'W' || c === 'R';
}

export function circleBlocked(x, y, r) {
  if (x - r < 0 || y - r < 0 || x + r > WORLD_W || y + r > WORLD_H) return true;
  const pts = [
    [x, y], [x + r, y], [x - r, y], [x, y + r], [x, y - r],
    [x + r * 0.7, y + r * 0.7], [x - r * 0.7, y + r * 0.7],
    [x + r * 0.7, y - r * 0.7], [x - r * 0.7, y - r * 0.7],
  ];
  for (const [px, py] of pts) if (solidAt(px, py)) return true;
  for (const c of STATIC_COLLIDERS) {
    if (Math.hypot(x - c.x, y - c.y) < r + c.r) return true;
  }
  return false;
}

// Axis-separated movement so entities slide along walls.
export function moveCircle(e, dx, dy, r) {
  if (dx !== 0 && !circleBlocked(e.x + dx, e.y, r)) e.x += dx;
  if (dy !== 0 && !circleBlocked(e.x, e.y + dy, r)) e.y += dy;
}

// ---------------------------------------------------------------------------
// Blob rendering: a region's cells are drawn to a mask with per-corner
// rounding (a corner rounds only where the region actually ends), then the
// mask is stamped 8 ways in ink to form a clean outline under the fill.
// ---------------------------------------------------------------------------

function roundedCellPath(ctx, cx, cy, test, radius, expand) {
  const x0 = cx * TILE - expand;
  const y0 = cy * TILE - expand;
  const x1 = (cx + 1) * TILE + expand;
  const y1 = (cy + 1) * TILE + expand;
  const n = test(cx, cy - 1), s = test(cx, cy + 1);
  const w = test(cx - 1, cy), e = test(cx + 1, cy);
  const rNW = (!n && !w) ? radius : 0;
  const rNE = (!n && !e) ? radius : 0;
  const rSE = (!s && !e) ? radius : 0;
  const rSW = (!s && !w) ? radius : 0;
  ctx.moveTo(x0 + rNW, y0);
  ctx.lineTo(x1 - rNE, y0);
  ctx.quadraticCurveTo(x1, y0, x1, y0 + rNE);
  ctx.lineTo(x1, y1 - rSE);
  ctx.quadraticCurveTo(x1, y1, x1 - rSE, y1);
  ctx.lineTo(x0 + rSW, y1);
  ctx.quadraticCurveTo(x0, y1, x0, y1 - rSW);
  ctx.lineTo(x0, y0 + rNW);
  ctx.quadraticCurveTo(x0, y0, x0 + rNW, y0);
  ctx.closePath();
}

function makeMask(test, radius, expand) {
  const mask = document.createElement('canvas');
  mask.width = WORLD_W;
  mask.height = WORLD_H;
  const m = mask.getContext('2d');
  m.fillStyle = '#fff';
  m.beginPath();
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      if (test(cx, cy)) roundedCellPath(m, cx, cy, test, radius, expand);
    }
  }
  m.fill();
  return mask;
}

function tintMask(mask, color) {
  const c = document.createElement('canvas');
  c.width = mask.width;
  c.height = mask.height;
  const g = c.getContext('2d');
  g.drawImage(mask, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

function stampBlob(ctx, test, fill, inkW = 2.5, radius = 14) {
  const mask = makeMask(test, radius, 1);
  const inked = tintMask(mask, PALETTE.ink);
  const filled = tintMask(mask, fill);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.drawImage(inked, Math.cos(a) * inkW, Math.sin(a) * inkW);
  }
  ctx.drawImage(filled, 0, 0);
  return mask;
}

export const waterCells = [];
for (let cy = 0; cy < ROWS; cy++) {
  for (let cx = 0; cx < COLS; cx++) {
    if (tileAt(cx, cy) === 'W' ) waterCells.push({ cx, cy });
  }
}

export function bakeGround(seed = 7) {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = WORLD_H;
  const g = c.getContext('2d');
  const rnd = mulberry32(seed);

  // Base grass with broad soft tonal variation.
  g.fillStyle = PALETTE.grass;
  g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    g.arc(rnd() * WORLD_W, rnd() * WORLD_H, 40 + rnd() * 90, 0, TAU);
    g.fillStyle = rnd() < 0.5 ? 'rgba(141,158,78,0.25)' : 'rgba(194,207,126,0.18)';
    g.fill();
  }

  // Grass flecks — short seeded strokes, the "texture without textures" trick.
  g.lineCap = 'round';
  for (let i = 0; i < 1400; i++) {
    const x = rnd() * WORLD_W;
    const y = rnd() * WORLD_H;
    if (tileAt(Math.floor(x / TILE), Math.floor(y / TILE)) !== 'G') continue;
    const len = 2 + rnd() * 3;
    const lean = (rnd() - 0.5) * 1.6;
    g.strokeStyle = rnd() < 0.7 ? 'rgba(141,158,78,0.55)' : 'rgba(248,233,210,0.30)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + lean, y - len);
    g.stroke();
  }

  // Path blob + pebbles.
  const isPath = (cx, cy) => tileAt(cx, cy) === 'P';
  stampBlob(g, isPath, PALETTE.path);
  for (let i = 0; i < 320; i++) {
    const x = rnd() * WORLD_W;
    const y = rnd() * WORLD_H;
    const cx = Math.floor(x / TILE), cy = Math.floor(y / TILE);
    if (!isPath(cx, cy)) continue;
    g.beginPath();
    g.arc(x, y, 0.8 + rnd() * 1.6, 0, TAU);
    g.fillStyle = rnd() < 0.6 ? 'rgba(210,176,112,0.8)' : 'rgba(248,233,210,0.6)';
    g.fill();
  }

  // Water: full blob, then a deep-water blob where surrounded by water.
  const isWater = (cx, cy) => tileAt(cx, cy) === 'W';
  stampBlob(g, isWater, PALETTE.water, 2.8);
  const isDeep = (cx, cy) =>
    isWater(cx, cy) && isWater(cx - 1, cy) && isWater(cx + 1, cy) &&
    isWater(cx, cy - 1) && isWater(cx, cy + 1);
  // Positive expand so adjacent cells overlap into one seamless blob —
  // the inset comes from the isDeep test itself, never from cell shrinking.
  const deepMask = makeMask(isDeep, 15, 1);
  g.drawImage(tintMask(deepMask, PALETTE.waterDeep), 0, 0);

  // Baked still-water highlights (animated ripples draw at runtime).
  g.strokeStyle = 'rgba(248,233,210,0.25)';
  g.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) {
    const cell = waterCells[Math.floor(rnd() * waterCells.length)];
    const x = (cell.cx + 0.2 + rnd() * 0.6) * TILE;
    const y = (cell.cy + 0.2 + rnd() * 0.6) * TILE;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 5 + rnd() * 8, y);
    g.stroke();
  }

  // Boulders: each rock cell gets an irregular ink-outlined stone.
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      if (tileAt(cx, cy) !== 'R') continue;
      const x = (cx + 0.5) * TILE;
      const y = (cy + 0.5) * TILE;
      const r = TILE * 0.52;
      g.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * TAU;
        const rr = r * (0.82 + rnd() * 0.25);
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr * 0.85;
        i === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
      }
      g.closePath();
      g.fillStyle = PALETTE.rock;
      g.fill();
      g.strokeStyle = PALETTE.ink;
      g.lineWidth = 2.5;
      g.lineJoin = 'round';
      g.stroke();
      // Shaded underside + a couple of cracks.
      g.beginPath();
      g.ellipse(x, y + r * 0.35, r * 0.7, r * 0.3, 0, 0, TAU);
      g.fillStyle = 'rgba(141,127,112,0.5)';
      g.fill();
      g.strokeStyle = 'rgba(34,26,86,0.35)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x - r * 0.3, y - r * 0.3);
      g.lineTo(x - r * 0.05, y);
      g.lineTo(x - r * 0.25, y + r * 0.3);
      g.stroke();
    }
  }

  return c;
}
