// Terrain — collision lives on a logical grid; rendering ignores the grid.
// Regions are merged into rounded organic blobs and baked once to an
// offscreen canvas, so the per-frame cost of the ground is one drawImage.
//
// M0.5: terrain is now a *room system*. Each room is a declarative def
// (layout grid + decor + neighbors); the current room is the live export
// `room`. Rooms connect at panel-gutter transitions (see main.js).
// The bake is print-aware: in Sunday Ink mode, color plates print slightly
// off-register and deep water / boulder shading use halftone screens.

import { PALETTE, TAU, mulberry32, PRINT } from './ink.js';
import { halftone, halftoneTile } from './print.js';

export const TILE = 32;
export const COLS = 30;
export const ROWS = 17;
export const WORLD_W = COLS * TILE;
export const WORLD_H = ROWS * TILE;

// Terrain plates are big shapes — they get a little more drift than
// character-scale fills so the misprint reads at ground scale.
const TERRAIN_DRIFT = 1.6;

// G grass · P path · W water · R rock
const ROOM_DEFS = {
  hearth: {
    seed: 99,
    layout: [
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
    ],
    decor: {
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
    },
    neighbors: { E: 'meadow' },
  },

  // The meadow east of Hearthside — the road continues out of frame and
  // into the next panel. A pond in the northeast, a path clearing, and
  // Doc's second secret to sniff out.
  meadow: {
    seed: 137,
    layout: [
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGRRGGGGGGGGGGGGGGWWWWWWGGGG',
      'GGGGRGGGGGGGGGGGGGGWWWWWWWWWGG',
      'GGGGGGGGGGGGGGGGGGGWWWWWWWWWGG',
      'GGGGGGGGGGGGGGGGGGGGWWWWWWWGGG',
      'GGGGGGGGGGGGGGGGGGGGGGWWWWGGGG',
      'GGGGGGGGGPPPPGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGPPPPGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGPPPPGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGPPPPPGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGPPPPPGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGPPPPPGGGGGGGGGGGG',
      'PPPPPPPPPPPPPPPPPPGGGGGGGGGGGG',
      'PPPPPPPPPPPPPPPPGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGRRGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGRRGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
    decor: {
      trees: [
        { x: 60, y: 70 }, { x: 160, y: 130 }, { x: 420, y: 80 },
        { x: 100, y: 300 }, { x: 250, y: 330 }, { x: 660, y: 240 },
        { x: 770, y: 300 }, { x: 900, y: 420 }, { x: 560, y: 470 },
        { x: 200, y: 480 },
      ],
      torches: [
        { x: 270, y: 230 }, { x: 600, y: 372 },
      ],
      secret: { x: 875, y: 210 },
      miteSpawns: [
        { x: 700, y: 350 }, { x: 380, y: 230 }, { x: 150, y: 420 },
      ],
      playerSpawn: { x: 80, y: 420 },
    },
    neighbors: { W: 'hearth' },
  },
};

function buildRoom(id, def) {
  const tileAt = (cx, cy) => {
    if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return 'W';
    return def.layout[cy][cx] || 'G';
  };
  const waterCells = [];
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      if (tileAt(cx, cy) === 'W') waterCells.push({ cx, cy });
    }
  }
  // Static circular blockers (tree trunks, posts).
  const staticColliders = [
    ...def.decor.trees.map(t => ({ x: t.x, y: t.y, r: 9 })),
    ...def.decor.torches.map(t => ({ x: t.x, y: t.y, r: 6 })),
  ];
  if (def.decor.banner) {
    staticColliders.push({ x: def.decor.banner.x, y: def.decor.banner.y, r: 7 });
  }
  return {
    id,
    seed: def.seed,
    decor: def.decor,
    neighbors: def.neighbors || {},
    tileAt,
    waterCells,
    staticColliders,
    mites: null,       // created lazily on first entry (main.js)
    grounds: {},       // baked ground per style: {paint, print}
  };
}

const ROOMS = {};
for (const [id, def] of Object.entries(ROOM_DEFS)) ROOMS[id] = buildRoom(id, def);

export let room = ROOMS.hearth;

export function getRoom(id) { return ROOMS[id]; }

// Drop all baked grounds — needed after live-tuning PRINT.mx/my, since
// misregistration is baked into the terrain plates.
export function invalidateGrounds() {
  for (const r of Object.values(ROOMS)) r.grounds = {};
}

export function setRoom(id) {
  room = ROOMS[id];
  return room;
}

export function solidAt(x, y) {
  const c = room.tileAt(Math.floor(x / TILE), Math.floor(y / TILE));
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
  for (const c of room.staticColliders) {
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

// Like tintMask, but the tint is a halftone screen instead of a flat color.
function tintMaskPattern(mask, tileCanvas) {
  const c = document.createElement('canvas');
  c.width = mask.width;
  c.height = mask.height;
  const g = c.getContext('2d');
  g.drawImage(mask, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = g.createPattern(tileCanvas, 'repeat');
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

function stampBlob(ctx, test, fill, inkW = 2.5, radius = 14) {
  const mask = makeMask(test, radius, 1);
  const inked = tintMask(mask, PALETTE.ink);
  const filled = tintMask(mask, fill);
  // Hand-inked line weight: the outline is thin along the top of the shape
  // and pools heavier along the underside (nib pressure, not a shadow —
  // it's the same ink color). Stamp radius varies with stamp direction.
  const STAMPS = 12;
  for (let i = 0; i < STAMPS; i++) {
    const a = (i / STAMPS) * TAU;
    const w = inkW * (0.75 + 0.55 * Math.max(0, Math.sin(a)));
    ctx.drawImage(inked, Math.cos(a) * w, Math.sin(a) * w);
  }
  // The color plate drifts off the ink plate in print mode.
  const ox = PRINT.on ? PRINT.mx * TERRAIN_DRIFT : 0;
  const oy = PRINT.on ? PRINT.my * TERRAIN_DRIFT : 0;
  ctx.drawImage(filled, ox, oy);
  return mask;
}

function bakeGround(r) {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = WORLD_H;
  const g = c.getContext('2d');
  const rnd = mulberry32(r.seed);
  const tileAt = r.tileAt;
  const ox = PRINT.on ? PRINT.mx * TERRAIN_DRIFT : 0;
  const oy = PRINT.on ? PRINT.my * TERRAIN_DRIFT : 0;

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
  if (PRINT.on) {
    // Comic water: the deep region is a halftone screen, not a flat plate.
    g.drawImage(tintMaskPattern(deepMask, halftoneTile('deepWater')), ox, oy);
  } else {
    g.drawImage(tintMask(deepMask, PALETTE.waterDeep), 0, 0);
  }

  // Baked still-water highlights (animated ripples draw at runtime).
  g.strokeStyle = 'rgba(248,233,210,0.25)';
  g.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) {
    const cell = r.waterCells[Math.floor(rnd() * r.waterCells.length)];
    if (!cell) break;
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
      // Every boulder is an individual: size, squash, tone, cell jitter,
      // and crack count all come off the seeded stream. Collision stays on
      // the tile, so the jitter must stay small relative to TILE.
      const x = (cx + 0.5) * TILE + (rnd() - 0.5) * 8;
      const y = (cy + 0.5) * TILE + (rnd() - 0.5) * 6;
      const rr0 = TILE * (0.42 + rnd() * 0.2);
      const squash = 0.78 + rnd() * 0.14;
      const rockTone = ['#a89a8a', '#9c8e7e', '#b1a494'][Math.floor(rnd() * 3)];
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * TAU;
        const rr = rr0 * (0.82 + rnd() * 0.25);
        pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * squash]);
      }
      const rockPath = () => {
        g.beginPath();
        pts.forEach(([px, py], i) => i === 0 ? g.moveTo(px, py) : g.lineTo(px, py));
        g.closePath();
      };
      g.save();
      g.translate(ox, oy);
      rockPath();
      g.fillStyle = rockTone;
      g.fill();
      g.restore();
      // Variable-weight outline: every facet gets its own nib pressure,
      // heavier on downhill edges — stroked segment by segment.
      g.strokeStyle = PALETTE.ink;
      g.lineJoin = 'round';
      g.lineCap = 'round';
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        const downhill = by > ay || ay > y;   // underside edges run heavy
        g.lineWidth = 2.5 * (0.6 + rnd() * 0.7 + (downhill ? 0.45 : 0));
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(bx, by);
        g.stroke();
      }
      // Shaded underside — soft paint, or a halftone screen in print mode.
      g.beginPath();
      g.ellipse(x + ox, y + oy + rr0 * squash * 0.4, rr0 * 0.7, rr0 * squash * 0.32, 0, 0, TAU);
      if (PRINT.on) {
        g.globalAlpha = 0.55;
        g.fillStyle = halftone(g, 'shade');
        g.fill();
        g.globalAlpha = 1;
      } else {
        g.fillStyle = 'rgba(141,127,112,0.5)';
        g.fill();
      }
      // Cracks: none, one, or two, each with its own bend.
      g.strokeStyle = 'rgba(34,26,86,0.35)';
      g.lineWidth = 1.2;
      const cracks = Math.floor(rnd() * 3);
      for (let k = 0; k < cracks; k++) {
        const sx2 = x + (rnd() - 0.5) * rr0 * 0.8;
        const sy2 = y - rr0 * squash * (0.2 + rnd() * 0.25);
        g.beginPath();
        g.moveTo(sx2, sy2);
        g.lineTo(sx2 + (rnd() - 0.5) * rr0 * 0.4, sy2 + rr0 * squash * (0.25 + rnd() * 0.2));
        g.lineTo(sx2 + (rnd() - 0.5) * rr0 * 0.5, sy2 + rr0 * squash * (0.5 + rnd() * 0.25));
        g.stroke();
      }
    }
  }

  return c;
}

// Ground for a room in the current style, baked once per (room, style).
export function groundFor(r = room) {
  const key = PRINT.on ? 'print' : 'paint';
  if (!r.grounds[key]) r.grounds[key] = bakeGround(r);
  return r.grounds[key];
}
