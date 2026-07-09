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
        { x: 70, y: 95 }, { x: 185, y: 58 }, { x: 560, y: 62 },
        { x: 645, y: 110 }, { x: 905, y: 195 }, { x: 80, y: 360 }, { x: 52, y: 448 },
        { x: 175, y: 505 }, { x: 430, y: 512 }, { x: 880, y: 320 }, { x: 735, y: 520 },
      ],
      torches: [
        { x: 305, y: 242 }, { x: 625, y: 370 },
      ],
      banner: { x: 348, y: 170 },
      // Haus of Toots — the shop itself. The vertical path leads to its door.
      // Toots can slip behind the roof along the top rows; the y-sort hides
      // him back there, which is classic and correct.
      buildings: [
        { x: 292, y: 162, w: 168, h: 92, kind: 'shop', doorX: 384 },
      ],
      doors: [
        { x: 384, y: 166, to: 'shopInterior', dir: 'N', entry: { x: 480, y: 400 } },
      ],
      // The town square's embroidery-hoop save point (PRD §2.6). No save
      // system yet — scenery + Doc's comfy target until M1 item 4 lands.
      hoops: [{ x: 444, y: 252 }],
      npcs: [],   // Jessie moved inside her shop (session 5)
      secret: { x: 762, y: 252 },
      miteSpawns: [
        { x: 505, y: 300 }, { x: 245, y: 425 }, { x: 805, y: 425 },
      ],
      playerSpawn: { x: 330, y: 320 },
    },
    neighbors: { E: 'meadow', W: 'lane', N: 'green' },
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
      // Clear of the tree at (660,240): its canopy y-sorts over anything
      // standing above it. NPCs need open sky, not just open ground.
      npcs: [{ id: 'wren', x: 585, y: 190 }],
      secret: { x: 875, y: 210 },
      miteSpawns: [
        { x: 700, y: 350 }, { x: 380, y: 230 }, { x: 150, y: 420 },
      ],
      playerSpawn: { x: 80, y: 420 },
    },
    neighbors: { W: 'hearth' },
  },

  // The lane west of the square — Toots' own house at the end of the road.
  // Quieter than the square: fewer mites, a pond to the south, a hoop by
  // the porch. The road continues east into hearth at rows 8–9.
  lane: {
    seed: 173,
    layout: [
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GRRGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GRGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGPPGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGPPGGGGGGGGGGGGGGGGGGG',
      'GGGGGGPPPPPPPPPPPPPPPPPPPPPPPP',
      'GGGGGGPPPPPPPPPPPPPPPPPPPPPPPP',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGWWWWGGGGGG',
      'GGGGGGGGGGGGGGGGGGGWWWWWWGGGGG',
      'GGGGGGGGGGGGGGGGGGGWWWWWGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGWWWGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
    decor: {
      trees: [
        { x: 80, y: 120 }, { x: 150, y: 60 }, { x: 500, y: 120 },
        { x: 700, y: 80 }, { x: 870, y: 150 }, { x: 100, y: 480 },
        { x: 300, y: 470 }, { x: 650, y: 330 }, { x: 862, y: 430 },
      ],
      torches: [
        { x: 280, y: 205 }, { x: 620, y: 350 },
      ],
      buildings: [
        { x: 240, y: 186, w: 150, h: 96, kind: 'home', doorX: 315 },
      ],
      doors: [
        { x: 315, y: 190, to: 'homeInterior', dir: 'N', entry: { x: 480, y: 344 } },
      ],
      hoops: [{ x: 356, y: 214 }],
      npcs: [],
      secret: { x: 226, y: 140 },
      miteSpawns: [
        { x: 560, y: 430 }, { x: 820, y: 240 },
      ],
      playerSpawn: { x: 70, y: 290 },
    },
    neighbors: { E: 'hearth' },
  },

  // The green north of the square — the grove of the Great Tuner. The
  // stone ring is now real standing stones (y-sorted, walk behind them)
  // around the Tuning Stone previz at its center — the depth pass built
  // from the July 2026 previz render: contact shadows, side facets, and
  // a monument with real height. The path now leads to the monument.
  green: {
    seed: 211,
    layout: [
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGWWWWWGGGGGGGGGGGGGGGGGGGGGGG',
      'GWWWWWWWGGGGGGGGGGGGGGGGGGGGGG',
      'GGWWWWWGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGWWGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGPPGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGPPGGGGGGGGGG',
      'GGGGGGGPPPPPPPPPPPPPGGGGGGGGGG',
      'GGGGGGGPPPPPPPPPPPPPGGGGGGGGGG',
      'GGGGGGGPPGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGPPGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGPPGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGPPGGGGGGGGGGGGGGGGGGGGG',
    ],
    decor: {
      trees: [
        { x: 60, y: 200 }, { x: 170, y: 190 }, { x: 420, y: 90 },
        { x: 460, y: 110 }, { x: 870, y: 90 }, { x: 910, y: 260 },
        { x: 300, y: 300 }, { x: 520, y: 400 }, { x: 820, y: 440 },
      ],
      torches: [{ x: 230, y: 420 }],
      npcs: [],
      // The ring of standing stones, open to the south — the previz
      // render's composition. Each stone seeds its own shape/lean/tone.
      stones: [
        { x: 699, y: 130 }, { x: 744, y: 160 }, { x: 758, y: 200 },
        { x: 737, y: 239 }, { x: 542, y: 238 }, { x: 522, y: 193 },
        { x: 580, y: 130 },
      ],
      // The Great Tuner previz (M1 item: the Tuning Stone). Scenery until
      // the world-flip lands, but it already glows like the interactive
      // thing it will become.
      tuner: { x: 640, y: 188 },
      // A lighter clearing under the monument, like the render's mound.
      patches: [
        { x: 640, y: 196, rx: 195, ry: 122, color: 'rgba(194,207,126,0.40)' },
        { x: 640, y: 196, rx: 122, ry: 80, color: 'rgba(194,207,126,0.30)' },
      ],
      // Buried at the foot of the Tuner. Astro knows.
      secret: { x: 640, y: 252 },
      miteSpawns: [
        { x: 200, y: 300 }, { x: 500, y: 430 }, { x: 780, y: 140 },
      ],
      playerSpawn: { x: 250, y: 470 },
    },
    neighbors: { S: 'hearth' },
  },

  // Haus of Toots, inside (PRD §2.6): Jessie's counter, the gallery wall
  // waiting for found patterns, the shelf of thread, and a standing hoop
  // by the door. Interior rooms sit as a smaller panel on the paper void.
  shopInterior: {
    seed: 305,
    interior: true,
    layout: [
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVBBBBBBBBBBBBBBBBVVVVVVV',
      'VVVVVVVBFFFFFFFFFFFFFFBVVVVVVV',
      'VVVVVVVBFFFFFFFFFFFFFFBVVVVVVV',
      'VVVVVVVBFFFFFFFFFFFFFFBVVVVVVV',
      'VVVVVVVBFFFFFFFFFFFFFFBVVVVVVV',
      'VVVVVVVBFFFFFFFFFFFFFFBVVVVVVV',
      'VVVVVVVBFFFFFFFFFFFFFFBVVVVVVV',
      'VVVVVVVBFFFFFFFFFFFFFFBVVVVVVV',
      'VVVVVVVBFFFFFFFFFFFFFFBVVVVVVV',
      'VVVVVVVBFFFFFFFFFFFFFFBVVVVVVV',
      'VVVVVVVBBBBBBBFFBBBBBBBVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    ],
    decor: {
      furniture: [
        { kind: 'gallery', x: 330, y: 132 },
        { kind: 'shelf', x: 660, y: 140 },
        { kind: 'counter', x: 500, y: 230 },
        { kind: 'lamp', x: 610, y: 300 },
        { kind: 'rug', x: 440, y: 330 },
      ],
      hoops: [{ x: 300, y: 404 }],
      npcs: [{ id: 'jessie', x: 394, y: 256 }],
      // A loose floorboard in the corner. Astro knows.
      secret: { x: 656, y: 180 },
      playerSpawn: { x: 480, y: 380 },
      doors: [
        { x: 480, y: 436, to: 'hearth', dir: 'S', entry: { x: 384, y: 200 } },
      ],
    },
    neighbors: {},
  },

  // Toots' house, inside. A bed, a rug, the radio — and two dog beds,
  // because of course. Doc's comfy compass points here too.
  homeInterior: {
    seed: 421,
    interior: true,
    layout: [
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVBBBBBBBBBBBBVVVVVVVVV',
      'VVVVVVVVVBFFFFFFFFFFBVVVVVVVVV',
      'VVVVVVVVVBFFFFFFFFFFBVVVVVVVVV',
      'VVVVVVVVVBFFFFFFFFFFBVVVVVVVVV',
      'VVVVVVVVVBFFFFFFFFFFBVVVVVVVVV',
      'VVVVVVVVVBFFFFFFFFFFBVVVVVVVVV',
      'VVVVVVVVVBFFFFFFFFFFBVVVVVVVVV',
      'VVVVVVVVVBFFFFFFFFFFBVVVVVVVVV',
      'VVVVVVVVVBBBBBFFBBBBBVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    ],
    decor: {
      furniture: [
        { kind: 'bed', x: 380, y: 230 },
        { kind: 'table', x: 590, y: 230 },
        { kind: 'lamp', x: 530, y: 210 },
        { kind: 'rug', x: 480, y: 310 },
        { kind: 'dogbed', x: 400, y: 340 },
        { kind: 'dogbed', x: 448, y: 356 },
      ],
      npcs: [],
      // Under the rug's corner — the floorboard every dog knows about.
      secret: { x: 530, y: 330 },
      playerSpawn: { x: 480, y: 330 },
      doors: [
        { x: 480, y: 404, to: 'lane', dir: 'S', entry: { x: 315, y: 226 } },
      ],
    },
    neighbors: {},
  },
};

// Furniture collision footprints, by kind. Draw code lives in main.js;
// keep these in sync with the shapes drawn there. `rect` is centered on
// the furniture point; `r` is a circle; absent = walkable (rug, gallery,
// wall shelf, dog beds — dogs stand on their beds, that's the point).
const FURN_COLLIDERS = {
  counter: { rect: [170, 26] },
  bed: { rect: [64, 84] },
  table: { r: 20 },
  lamp: { r: 5 },
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
  const d = def.decor;
  // Static circular blockers (tree trunks, posts, hoops, table legs).
  const staticColliders = [
    ...(d.trees || []).map(t => ({ x: t.x, y: t.y, r: 9 })),
    ...(d.torches || []).map(t => ({ x: t.x, y: t.y, r: 6 })),
    ...(d.hoops || []).map(h => ({ x: h.x, y: h.y, r: 6 })),
    // Standing stones block at the base; their height is drawn, not walked.
    ...(d.stones || []).map(s => ({ x: s.x, y: s.y, r: 11 })),
  ];
  if (d.tuner) {
    staticColliders.push({ x: d.tuner.x, y: d.tuner.y - 4, r: 26 });
  }
  if (d.banner) {
    staticColliders.push({ x: d.banner.x, y: d.banner.y, r: 7 });
  }
  for (const n of d.npcs || []) {
    staticColliders.push({ x: n.x, y: n.y, r: 8 });
  }
  // Rect blockers: building wall bands and boxy furniture. Doors need no
  // hole in the wall — the door trigger sits on the wall face and the
  // transition teleports; nobody ever walks *through* the rect.
  const rectColliders = (d.buildings || []).map(b => ({
    x0: b.x, y0: b.y - b.h, x1: b.x + b.w, y1: b.y,
  }));
  for (const f of d.furniture || []) {
    const fc = FURN_COLLIDERS[f.kind];
    if (!fc) continue;
    if (fc.rect) {
      rectColliders.push({
        x0: f.x - fc.rect[0] / 2, y0: f.y - fc.rect[1] / 2,
        x1: f.x + fc.rect[0] / 2, y1: f.y + fc.rect[1] / 2,
      });
    } else if (fc.r) {
      staticColliders.push({ x: f.x, y: f.y, r: fc.r });
    }
  }
  return {
    id,
    seed: def.seed,
    interior: !!def.interior,
    decor: d,
    neighbors: def.neighbors || {},
    tileAt,
    waterCells,
    staticColliders,
    rectColliders,
    // Doc's comfy compass targets (PRD §2.5): hoops, and the dog beds.
    comfy: [
      ...(d.hoops || []),
      ...(d.furniture || []).filter(f => f.kind === 'dogbed'),
    ],
    mites: null,       // created lazily on first entry (main.js)
    npcs: null,        // ditto — NPC instances built from decor.npcs
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
  return c === 'W' || c === 'R' || c === 'B' || c === 'V';
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
  for (const rc of room.rectColliders) {
    const nx = Math.max(rc.x0, Math.min(x, rc.x1));
    const ny = Math.max(rc.y0, Math.min(y, rc.y1));
    if (Math.hypot(x - nx, y - ny) < r) return true;
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

// Interior rooms: the walkable world is a small walled panel floating on
// the cream paper void — the comic's paper showing through around a tight
// interior panel. Floor is planked wood; walls are a timber band with the
// same stamped ink outline as every other blob.
function bakeInterior(r) {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = WORLD_H;
  const g = c.getContext('2d');
  const rnd = mulberry32(r.seed);
  const tileAt = r.tileAt;

  g.fillStyle = PALETTE.cream;
  g.fillRect(0, 0, WORLD_W, WORLD_H);

  // Floor: one blob, then plank seams and the odd knot — texture without
  // textures, same trick as the grass flecks.
  const isFloor = (cx, cy) => tileAt(cx, cy) === 'F';
  stampBlob(g, isFloor, PALETTE.path, 2.5, 8);
  g.strokeStyle = 'rgba(169,126,82,0.5)';
  g.lineWidth = 1.4;
  g.lineCap = 'round';
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      if (!isFloor(cx, cy)) continue;
      // Horizontal plank seam per cell row, staggered like real boards.
      const y = cy * TILE + (cy % 2 ? 10 : 22);
      g.beginPath();
      g.moveTo(cx * TILE + 2, y);
      g.lineTo((cx + 1) * TILE - 2, y);
      g.stroke();
      // Board-end joints, offset every other row.
      if ((cx + cy) % 3 === 0) {
        g.beginPath();
        g.moveTo(cx * TILE + 16, y);
        g.lineTo(cx * TILE + 16, y + 10);
        g.stroke();
      }
      if (rnd() < 0.12) {
        g.beginPath();
        g.arc(cx * TILE + 6 + rnd() * 20, cy * TILE + 6 + rnd() * 20, 1.3, 0, TAU);
        g.fillStyle = 'rgba(169,126,82,0.55)';
        g.fill();
      }
    }
  }

  // Walls: a timber band. In print mode its underside gets a halftone
  // screen, like the boulders do.
  const isWall = (cx, cy) => tileAt(cx, cy) === 'B';
  const wallMask = stampBlob(g, isWall, PALETTE.timber, 3, 6);
  if (PRINT.on) {
    g.save();
    g.globalAlpha = 0.4;
    g.drawImage(tintMaskPattern(wallMask, halftoneTile('shade')), 0, 2);
    g.restore();
  }
  // Wainscot line along the wall band for a hand-drawn interior read.
  g.strokeStyle = 'rgba(34,26,86,0.35)';
  g.lineWidth = 1.6;
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      if (!isWall(cx, cy) || isWall(cx, cy + 1)) continue;
      // Bottom edge of a wall run: a second seam just above the floor.
      g.beginPath();
      g.moveTo(cx * TILE, (cy + 1) * TILE - 7);
      g.lineTo((cx + 1) * TILE, (cy + 1) * TILE - 7);
      g.stroke();
    }
  }

  return c;
}

function bakeGround(r) {
  if (r.interior) return bakeInterior(r);
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

  // Authored ground patches (room data) — the lighter clearing under the
  // Great Tuner, painted before the flecks so the texture reads through.
  for (const p of r.decor.patches || []) {
    g.beginPath();
    g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU);
    g.fillStyle = p.color;
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
