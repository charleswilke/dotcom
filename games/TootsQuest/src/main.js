// Toots Quest — M0.5 renderer proof: Living Ink + Sunday Ink.
// Two rooms of the Hollow joined like Sunday-strip panels: baked blob
// terrain, parametric characters, wind, day/night light, torches, mites,
// a 3-hit sword combo with hitstop — and a toggleable newsprint style
// (press P): misregistered color plates + halftone screens. Walking off
// the east/west edge slides the world to the next panel across a paper
// gutter, with Toots crossing the gutter himself.

import {
  TAU, PALETTE, PRINT, setPrintMode, clamp, lerp, dist, angleDiff,
  mulberry32, capsule, inkCircle, inkEllipse,
} from './ink.js';
import { WORLD_W, WORLD_H, TILE, room, setRoom, getRoom, groundFor, invalidateGrounds } from './terrain.js';
import { Player, Dog, Mite, particles, spawnParticle, burst, updateParticles, drawParticles } from './entities.js';
import { skyState, timeLabel, drawLighting } from './light.js';
import { halftone } from './print.js';
import { spawnWord, updateWords, drawWords, clearWords } from './fx.js';
import {
  NPC, TALK_RADIUS, dialogue, startDialogue, advanceDialogue, closeDialogue,
  updateDialogue, drawDialogue, drawTalkHint,
} from './npc.js';
import { worldState } from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const lightCanvas = document.createElement('canvas');
lightCanvas.width = WORLD_W;
lightCanvas.height = WORLD_H;
const lctx = lightCanvas.getContext('2d');

function fit() {
  const s = Math.min(innerWidth / WORLD_W, (innerHeight - 70) / WORLD_H, 1.5);
  canvas.style.width = `${Math.floor(WORLD_W * s)}px`;
}
addEventListener('resize', fit);
fit();

// --- World state -----------------------------------------------------------

const DAY_LENGTH = 150;       // seconds per full day — fast, for the demo
let tDay = 0.56;              // start in the warm afternoon

const player = new Player(room.decor.playerSpawn.x, room.decor.playerSpawn.y);
const doc = new Dog(player.x - 40, player.y + 10, { earLen: 10, tailFreq: 9 });

function roomMites(r) {
  if (!r.mites) r.mites = r.decor.miteSpawns.map(s => new Mite(s.x, s.y));
  return r.mites;
}
let mites = roomMites(room);

function roomNpcs(r) {
  if (!r.npcs) r.npcs = (r.decor.npcs || []).map(n => new NPC(n.id, n.x, n.y));
  return r.npcs;
}
let npcs = roomNpcs(room);

// Nearest townsperson close enough to talk to, or null.
function npcInTalkRange() {
  let best = null;
  let bd = TALK_RADIUS;
  for (const n of npcs) {
    const d = dist(player.x, player.y, n.x, n.y);
    if (d < bd) { bd = d; best = n; }
  }
  return best;
}

const game = {
  hitstopT: 0,
  shakeAmp: 0,
  shakeT: 0,
  hitstop(s) { this.hitstopT = Math.max(this.hitstopT, s); },
  shake(amp, dur) {
    this.shakeAmp = Math.max(this.shakeAmp, amp);
    this.shakeT = Math.max(this.shakeT, dur);
  },
};

// Seeded ambient detail: grass tufts and water ripple anchors, per room.
let tufts = [];
let ripples = [];

function buildAmbient() {
  const rnd = mulberry32(room.seed);
  tufts = [];
  let guard = 0;
  while (tufts.length < 95 && guard++ < 2000) {
    const x = rnd() * WORLD_W;
    const y = rnd() * WORLD_H;
    // Tufts on path edges read as overgrowth, so only skip water.
    if (room.waterCells.some(c => c.cx === Math.floor(x / TILE) && c.cy === Math.floor(y / TILE))) continue;
    tufts.push({ x, y, h: 5 + rnd() * 5, tone: rnd() });
  }
  ripples = [];
  if (room.waterCells.length) {
    for (let i = 0; i < 12; i++) {
      const cell = room.waterCells[Math.floor(rnd() * room.waterCells.length)];
      ripples.push({
        x: (cell.cx + 0.25 + rnd() * 0.5) * TILE,
        y: (cell.cy + 0.25 + rnd() * 0.5) * TILE,
        ph: rnd(),
      });
    }
  }
}
buildAmbient();

// --- Panel transitions (the Sunday-strip gutter) ----------------------------

const GUTTER = 44;            // paper between panels, px
let transition = null;        // {dir, t, dur, fromRoom, toRoom, exitX, entryX, y}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function startTransition(dir) {
  const toRoom = getRoom(room.neighbors[dir]);
  roomMites(toRoom);          // populate the next panel before it slides in
  roomNpcs(toRoom);
  closeDialogue();
  player.attack = null;
  player.attackQueued = false;
  player.kvx = player.kvy = 0;
  player.invuln = 0;
  player.ghosts.length = 0;
  transition = {
    dir, t: 0, dur: 0.8,
    fromRoom: room, toRoom,
    exitX: player.x,
    entryX: dir === 'E' ? 22 : WORLD_W - 22,
    y: player.y,
  };
}

function finishTransition() {
  const tr = transition;
  transition = null;
  setRoom(tr.toRoom.id);
  player.x = tr.entryX;
  player.y = tr.y;
  // Doc arrives beside Toots — clamped inside the walkable bounds, or the
  // collision edge strands him out of the world forever.
  doc.x = clamp(player.x + (tr.dir === 'E' ? -34 : 34), 18, WORLD_W - 18);
  doc.y = player.y + 8;
  doc.sitting = false;
  doc.pointing = false;
  mites = roomMites(room);
  npcs = roomNpcs(room);
  particles.length = 0;
  clearWords();
  buildAmbient();
}

// --- Input -----------------------------------------------------------------

const keys = new Set();
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.repeat) return;
  keys.add(e.code);
  // Action routing: Space is contextual (talk when a townsperson is in
  // range, attack otherwise); E only talks; J always attacks — the escape
  // hatch if you want to swing right next to someone.
  if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyE') {
    if (dialogue.active) {
      advanceDialogue();
    } else if (!transition) {
      const n = e.code === 'KeyJ' ? null : npcInTalkRange();
      if (n) startDialogue(n, player);
      else if (e.code !== 'KeyE') player.bufferAttack();
    }
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') {
    if (!dialogue.active) player.tryDash();
  }
  if (e.code === 'KeyN') tDay = (tDay + 0.08) % 1;
  if (e.code === 'KeyP') setPrintMode(!PRINT.on);
});
addEventListener('keyup', (e) => keys.delete(e.code));

// --- Update ----------------------------------------------------------------

let emberClock = 0;
const EMPTY_KEYS = new Set();   // what the player "presses" while talking

function update(dt, time) {
  tDay = (tDay + dt / DAY_LENGTH) % 1;

  if (transition) {
    transition.t += dt;
    if (transition.t >= transition.dur) finishTransition();
    return;
  }

  // Talking locks Toots' input but the world keeps living (pillar 1):
  // mites still wander, Doc still settles, torches still spit embers.
  player.update(dt, dialogue.active ? EMPTY_KEYS : keys, game);
  doc.update(dt, player, room.decor.secret);
  for (const n of npcs) n.update(dt, player);
  for (const m of mites) m.update(dt, player, game);
  // A lunge that lands mid-sentence breaks off the conversation — hurt()
  // just set invuln to 0.9 and it hasn't decayed yet this frame.
  if (dialogue.active && player.invuln > 0.85) closeDialogue();
  updateParticles(dt);
  updateWords(dt);
  updateDialogue(dt);

  // Walked off an open edge? Slide to the neighboring panel.
  if (player.x > WORLD_W - 12.5 && room.neighbors.E) { startTransition('E'); return; }
  if (player.x < 12.5 && room.neighbors.W) { startTransition('W'); return; }

  // Sword connects: sector test against each live mite, once per swing.
  const sw = player.swing();
  if (sw) {
    for (const m of mites) {
      if (m.dead || sw.hitSet.has(m)) continue;
      if (dist(player.x, player.y, m.x, m.y) > sw.range + m.r) continue;
      const a = Math.atan2(m.y - player.y, m.x - player.x);
      if (Math.abs(angleDiff(sw.dir, a)) > 1.8) continue;
      sw.hitSet.add(m);
      m.hurt(m.x - player.x, m.y - player.y, game);
      game.hitstop(sw.combo === 2 ? 0.09 : 0.05);
      if (sw.combo === 2) game.shake(3, 0.12);
      const wx = (player.x + m.x) / 2;
      const wy = (player.y + m.y) / 2;
      // Onomatopoeia, spawned the same tick as the hitstop so the word's
      // impact frame is what the freeze holds on screen. The big burst
      // rides high so it doesn't swallow Toots and the swing.
      if (sw.combo === 2) spawnWord(wx, wy - 52, 'KRAK!', { big: true });
      else spawnWord(wx, wy - 32, sw.combo === 0 ? 'THOK!' : 'POK!');
      burst(wx, wy - 8, 6, {
        color: PALETTE.neon, speed: 150, life: 0.3, add: true, g: 0,
      });
    }
  }

  // Torch embers.
  emberClock -= dt;
  if (emberClock <= 0) {
    emberClock = 0.12;
    for (const t of room.decor.torches) {
      if (Math.random() < 0.7) {
        spawnParticle({
          x: t.x + (Math.random() - 0.5) * 4,
          y: t.y - 34,
          vx: (Math.random() - 0.5) * 12,
          vy: -25 - Math.random() * 20,
          g: -15,
          life: 0.55 + Math.random() * 0.4,
          size: 1.6,
          color: Math.random() < 0.8 ? PALETTE.hotOrange : PALETTE.cream,
          add: true,
        });
      }
    }
  }

  // Doc marks the secret with a glint while he's pointing.
  if (doc.pointing && room.decor.secret && Math.random() < dt * 1.5) {
    spawnParticle({
      x: room.decor.secret.x + (Math.random() - 0.5) * 10,
      y: room.decor.secret.y - 4,
      vy: -18, g: 0, life: 0.8, size: 1.8, color: PALETTE.neon, add: true,
    });
  }

  game.shakeT = Math.max(0, game.shakeT - dt);
  if (game.shakeT <= 0) game.shakeAmp = 0;
}

// --- Decor drawing ---------------------------------------------------------

// Fill + fat stroke + refill: overlapping circles read as one inked blob.
// In print mode the refill (the color plate) drifts off-register.
function blobCircles(c, circles, fill, inkW = 5) {
  const path = () => {
    c.beginPath();
    for (const [x, y, r] of circles) {
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, TAU);
    }
  };
  path();
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = PALETTE.ink;
  c.lineWidth = inkW;
  c.lineJoin = 'round';
  c.stroke();
  // Ink pools along the underside: a second, down-shifted stroke. The refill
  // covers it everywhere except the bottom edge, where it thickens the line.
  c.save();
  c.translate(0, 1.7);
  path();
  c.lineWidth = inkW * 0.9;
  c.stroke();
  c.restore();
  if (PRINT.on) {
    c.save();
    c.translate(PRINT.mx, PRINT.my);
    path();
    c.fill();
    c.restore();
  } else {
    c.fill();
  }
}

// Every tree is an individual: shape, size, lean, tint, wind phase, and
// outline weight are all seeded from its coordinates — deterministic, so a
// tree is always the same tree, but no two are alike. Params are built once
// and cached on the decor object.
const CANOPY_TINTS = ['#6e9c4f', '#679549', '#78a75a'];
const CANOPY_LIGHTS = ['#8ab864', '#82b05c', '#95c46f'];
const TRUNK_TINTS = ['#8a5a3a', '#815336', '#93613e'];

function treeParams(tree) {
  if (tree._p) return tree._p;
  const rnd = mulberry32(((tree.x * 2654435761) ^ (tree.y * 40503)) >>> 0);
  const scale = 0.85 + rnd() * 0.35;
  const trunkH = (27 + rnd() * 9) * scale;
  const topY = -(trunkH + 15 * scale);
  const blobs = [
    [0, topY, 19 * scale * (0.9 + rnd() * 0.25)],
    [-(13 + rnd() * 5) * scale, topY + (7 + rnd() * 3) * scale, (11 + rnd() * 4) * scale],
    [(13 + rnd() * 5) * scale, topY + (7 + rnd() * 3) * scale, (11 + rnd() * 4) * scale],
  ];
  if (rnd() < 0.4) {
    blobs.push([(rnd() - 0.5) * 10 * scale, topY - (9 + rnd() * 4) * scale, (9 + rnd() * 4) * scale]);
  }
  const tone = Math.floor(rnd() * 3);
  tree._p = {
    scale, trunkH, topY, blobs, tone,
    trunkW: (6 + rnd() * 2.5) * scale,
    leanX: (rnd() - 0.5) * 6,
    inkW: 4 + rnd() * 1.6,
    swayAmp: 0.8 + rnd() * 0.5,
    ph: rnd() * TAU,
    hl: [
      [(-8 + rnd() * 4) * scale, topY - (4 + rnd() * 3) * scale, (6 + rnd() * 2) * scale],
      [(7 + rnd() * 4) * scale, topY + (1 + rnd() * 4) * scale, (4 + rnd() * 1.5) * scale],
    ],
  };
  return tree._p;
}

function drawTree(tree, time) {
  const p = treeParams(tree);
  const sway = (Math.sin(time * 1.4 + p.ph) * 2.6 +
                Math.sin(time * 2.3 + p.ph * 1.7) * 1.1) * p.swayAmp;
  const bx = tree.x + p.leanX + sway;
  const circles = p.blobs.map(([ox, oy, r]) => [bx + ox, tree.y + oy, r]);
  inkEllipse(ctx, tree.x, tree.y + 2, 16 * p.scale, 6 * p.scale, 0, 'rgba(34,26,86,0.18)', null);
  capsule(ctx, tree.x, tree.y, tree.x + p.leanX + sway * 0.5, tree.y - p.trunkH,
    p.trunkW, TRUNK_TINTS[p.tone], PALETTE.ink, 2.2);
  blobCircles(ctx, circles, CANOPY_TINTS[p.tone], p.inkW);
  // Halftone shading on the canopy's under-side (print mode only): the
  // pattern is page-anchored, so the canopy sways through the dots.
  if (PRINT.on) {
    ctx.save();
    ctx.beginPath();
    for (const [x, y, r] of circles) {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.clip();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = halftone(ctx, 'shade');
    ctx.beginPath();
    ctx.ellipse(bx + 6, tree.y + p.topY + 9 * p.scale, 24 * p.scale, 17 * p.scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  for (const [ox, oy, r] of p.hl) {
    inkCircle(ctx, bx + ox, tree.y + oy, r, CANOPY_LIGHTS[p.tone], null);
  }
}

function drawTorch(t, time) {
  capsule(ctx, t.x, t.y, t.x, t.y - 26, 5, PALETTE.trunk, PALETTE.ink, 2);
  inkEllipse(ctx, t.x, t.y - 27, 6, 3.5, 0, PALETTE.rockDark, PALETTE.ink, 2);
  const fl = Math.sin(time * 13 + t.x) * 2 + Math.sin(time * 29 + t.y) * 1.2;
  const tip = t.y - 42 - fl;
  const wob = Math.sin(time * 17) * 1.5;
  ctx.beginPath();
  ctx.moveTo(t.x - 5, t.y - 29);
  ctx.quadraticCurveTo(t.x - 6, tip + 8, t.x + wob, tip);
  ctx.quadraticCurveTo(t.x + 6, tip + 8, t.x + 5, t.y - 29);
  ctx.closePath();
  ctx.fillStyle = PALETTE.hotOrange;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(t.x - 2.5, t.y - 29);
  ctx.quadraticCurveTo(t.x - 3, tip + 12, t.x + wob * 0.6, tip + 7);
  ctx.quadraticCurveTo(t.x + 3, tip + 12, t.x + 2.5, t.y - 29);
  ctx.closePath();
  ctx.fillStyle = PALETTE.cream;
  ctx.fill();
}

// The first Haus of Toots artifact: a needlepoint banner, stitched in code.
const HEART = [
  '.XX...XX.',
  'XXXX.XXXX',
  'XXXXXXXXX',
  '.XXXXXXX.',
  '.XXXXXXX.',
  '..XXXXX..',
  '...XXX...',
  '....X....',
];

function drawBanner(b, time) {
  const swing = Math.sin(time * 1.7 + 1) * 0.05;
  capsule(ctx, b.x, b.y, b.x, b.y - 54, 5, PALETTE.trunk, PALETTE.ink, 2);
  capsule(ctx, b.x - 2, b.y - 52, b.x + 34, b.y - 50, 4, PALETTE.trunk, PALETTE.ink, 2);

  ctx.save();
  ctx.translate(b.x + 16, b.y - 49);
  ctx.rotate(swing);
  const w = 36, h = 32;
  ctx.fillStyle = PALETTE.cream;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-w / 2, 0, w, h, 3);
  ctx.fill();
  ctx.stroke();
  // Cross-stitches.
  const cell = 3.4;
  const ox = -HEART[0].length * cell / 2;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  for (let r = 0; r < HEART.length; r++) {
    for (let c = 0; c < HEART[r].length; c++) {
      const x = ox + c * cell + 0.6;
      const y = 2.5 + r * cell + 0.6;
      const s = cell - 1.2;
      ctx.strokeStyle = HEART[r][c] === 'X' ? PALETTE.orange : 'rgba(210,176,112,0.45)';
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y); ctx.lineTo(x, y + s);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Shop sign reveals itself when Toots wanders close.
  if (dist(player.x, player.y, b.x, b.y) < 90) {
    const ty = b.y - 70 + Math.sin(time * 2) * 1.5;
    ctx.font = 'italic 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = PALETTE.cream;
    ctx.strokeText('Haus of Toots · needlepoint by Jessie', b.x + 16, ty);
    ctx.fillStyle = PALETTE.ink;
    ctx.fillText('Haus of Toots · needlepoint by Jessie', b.x + 16, ty);
    ctx.textAlign = 'left';
  }
}

function drawSecret(s, time) {
  inkCircle(ctx, s.x - 5, s.y, 2.5, PALETTE.rock, PALETTE.ink, 1.4);
  inkCircle(ctx, s.x + 4, s.y + 2, 2, PALETTE.rock, PALETTE.ink, 1.4);
  inkCircle(ctx, s.x, s.y - 3, 1.6, PALETTE.rockDark, null);
}

function drawTufts(time) {
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.6;
  for (const tf of tufts) {
    const wind = Math.sin(time * 1.6 + tf.x * 0.012) * 1.5 +
                 Math.sin(time * 2.9 + tf.y * 0.01) * 0.8;
    ctx.strokeStyle = tf.tone < 0.6 ? PALETTE.grassDark : PALETTE.grassLight;
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(tf.x + k * 2, tf.y);
      ctx.quadraticCurveTo(
        tf.x + k * 2 + wind, tf.y - tf.h * 0.6,
        tf.x + k * 2 + wind * 2 + k, tf.y - tf.h,
      );
      ctx.stroke();
    }
  }
}

function drawRipples(time) {
  ctx.lineWidth = 1.4;
  for (let i = 0; i < ripples.length; i++) {
    const rp = ripples[i];
    const p = (time * 0.35 + rp.ph) % 1;
    ctx.strokeStyle = `rgba(248,233,210,${(1 - p) * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(rp.x, rp.y, 3 + p * 12, (3 + p * 12) * 0.45, 0, 0, TAU);
    ctx.stroke();
  }
}

// --- Render ----------------------------------------------------------------

let fps = 60;
let frameMs = 0;

// A comic panel frame: paper margin + ink border. Drawn around each panel
// during transitions, and around the whole view in Sunday Ink mode.
function drawPanelFrame(px = 0) {
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 10;
  ctx.strokeRect(px + 5, 5, WORLD_W - 10, WORLD_H - 10);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(px + 10, 10, WORLD_W - 20, WORLD_H - 20);
}

// One room drawn as a comic panel at screen offset px: ground, static decor,
// its mites (and optionally Doc), then the sky tint — all clipped to the
// panel so nothing bleeds into the gutter.
function drawRoomPanel(r, px, time, withDoc) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, 0, WORLD_W, WORLD_H);
  ctx.clip();
  ctx.translate(px, 0);
  ctx.drawImage(groundFor(r), 0, 0);
  if (r.decor.secret) drawSecret(r.decor.secret, time);
  const list = [
    ...r.decor.trees.map(tr => ({ y: tr.y, fn: () => drawTree(tr, time) })),
    ...r.decor.torches.map(to => ({ y: to.y, fn: () => drawTorch(to, time) })),
  ];
  if (r.decor.banner) list.push({ y: r.decor.banner.y, fn: () => drawBanner(r.decor.banner, time) });
  if (r.npcs) for (const n of r.npcs) list.push({ y: n.y, fn: () => n.draw(ctx, time) });
  if (r.mites) for (const m of r.mites) list.push({ y: m.y, fn: () => m.draw(ctx, time) });
  if (withDoc) list.push({ y: doc.y, fn: () => doc.draw(ctx, time) });
  list.sort((a, b) => a.y - b.y);
  for (const d of list) d.fn();
  const [tr, tg, tb, ta] = skyState(tDay).tint;
  if (ta > 0.01) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(${tr | 0},${tg | 0},${tb | 0},${ta})`;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

// The gutter crossing: both rooms slide as panels over paper, and Toots
// walks across the gutter from the old panel to the new one.
function renderTransition(time) {
  const tr = transition;
  const p = easeInOut(clamp(tr.t / tr.dur, 0, 1));
  const span = WORLD_W + GUTTER;
  const off = (tr.dir === 'E' ? 1 : -1) * p * span;
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  const fromX = -off;
  const toX = (tr.dir === 'E' ? span : -span) - off;
  drawRoomPanel(tr.fromRoom, fromX, time, true);
  drawRoomPanel(tr.toRoom, toX, time, false);
  drawPanelFrame(fromX);
  drawPanelFrame(toX);

  // Toots rides the exiting panel and lands at the entry point — which
  // means for a moment he is standing in the gutter. On purpose.
  const sx = lerp(tr.exitX + fromX, tr.entryX + toX, p);
  const ox = player.x, oy = player.y;
  player.x = sx;
  player.y = tr.y;
  player.draw(ctx, time);
  player.x = ox;
  player.y = oy;
}

function render(time) {
  if (transition) {
    renderTransition(time);
    drawHud(time);
    return;
  }

  const sky = skyState(tDay);

  ctx.save();
  if (game.shakeAmp > 0) {
    ctx.translate(
      (Math.random() - 0.5) * 2 * game.shakeAmp,
      (Math.random() - 0.5) * 2 * game.shakeAmp,
    );
  }

  ctx.drawImage(groundFor(room), 0, 0);
  drawRipples(time);
  drawTufts(time);
  if (room.decor.secret) drawSecret(room.decor.secret, time);

  // Y-sorted world objects.
  const drawList = [
    ...room.decor.trees.map(tr => ({ y: tr.y, fn: () => drawTree(tr, time) })),
    ...room.decor.torches.map(to => ({ y: to.y, fn: () => drawTorch(to, time) })),
    { y: player.y, fn: () => player.draw(ctx, time) },
    { y: doc.y, fn: () => doc.draw(ctx, time) },
    ...npcs.map(n => ({ y: n.y, fn: () => n.draw(ctx, time) })),
    ...mites.map(m => ({ y: m.y, fn: () => m.draw(ctx, time) })),
  ];
  if (room.decor.banner) {
    drawList.push({ y: room.decor.banner.y, fn: () => drawBanner(room.decor.banner, time) });
  }
  drawList.sort((a, b) => a.y - b.y);
  for (const d of drawList) d.fn();

  drawParticles(ctx);
  drawWords(ctx);

  // Warm additive glow around each torch flame, day or night.
  ctx.globalCompositeOperation = 'lighter';
  for (const t of room.decor.torches) {
    const g = ctx.createRadialGradient(t.x, t.y - 36, 4, t.x, t.y - 36, 44);
    g.addColorStop(0, 'rgba(255,140,50,0.30)');
    g.addColorStop(1, 'rgba(255,140,50,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(t.x, t.y - 36, 44, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Darkness pass with punched-out light, then the day tint.
  const lights = [
    ...room.decor.torches.map(t => ({ x: t.x, y: t.y - 34, r: 105, flicker: true })),
    { x: player.x, y: player.y - 14, r: 135, flicker: false },
  ];
  if (drawLighting(lctx, WORLD_W, WORLD_H, sky.dark, lights, time)) {
    ctx.drawImage(lightCanvas, 0, 0);
  }
  ctx.restore();

  const [tr, tg, tb, ta] = sky.tint;
  if (ta > 0.01) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(${tr | 0},${tg | 0},${tb | 0},${ta})`;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Sunday Ink frames the whole view as a strip panel.
  if (PRINT.on) drawPanelFrame(0);

  // Speech lives above the lighting and the panel frame: balloons are
  // lettering, and lettering must stay readable at midnight.
  if (dialogue.active) {
    drawDialogue(ctx, WORLD_W, time);
  } else {
    const n = npcInTalkRange();
    if (n) drawTalkHint(ctx, n, time);
  }

  drawHud(time);
}

function drawHud(time) {
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = 'rgba(248,233,210,0.9)';
  ctx.fillText(`TOOTS QUEST · M0.5 ${PRINT.on ? 'SUNDAY INK' : 'LIVING INK'}`, 14, 22);

  // Perf readout — the frame budget is part of the M0 gate.
  ctx.textAlign = 'right';
  ctx.fillStyle = frameMs > 12 ? PALETTE.hotOrange : 'rgba(248,233,210,0.7)';
  ctx.fillText(`${fps | 0} fps · ${frameMs.toFixed(1)} ms`, WORLD_W - 14, 22);

  // Tiny time dial.
  const dx = WORLD_W - 60, dy = 44;
  ctx.fillStyle = 'rgba(34,26,86,0.55)';
  ctx.beginPath();
  ctx.arc(dx, dy, 11, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(248,233,210,0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const na = tDay * TAU - Math.PI / 2;
  ctx.strokeStyle = PALETTE.neon;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dx, dy);
  ctx.lineTo(dx + Math.cos(na) * 8, dy + Math.sin(na) * 8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(248,233,210,0.7)';
  ctx.fillText(timeLabel(tDay), dx - 18, dy + 4);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(248,233,210,0.55)';
  ctx.fillText('WASD move · SPACE attack/talk · SHIFT dash · N time · P print style', 14, WORLD_H - 18);
}

// --- Loop: fixed-step update, hitstop freezes simulation but not rendering --

const STEP = 1 / 60;
let last = performance.now();
let acc = 0;

function frame(now) {
  const t0 = performance.now();
  let dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  fps = fps * 0.95 + (1 / Math.max(dt, 0.0001)) * 0.05;

  if (game.hitstopT > 0) {
    game.hitstopT -= dt;
  } else {
    acc += dt;
    while (acc >= STEP) {
      update(STEP, now / 1000);
      acc -= STEP;
    }
  }
  render(now / 1000);
  frameMs = frameMs * 0.9 + (performance.now() - t0) * 0.1;
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Debug handle for the M0 gate — harmless to ship, handy in the console.
let debugClock = performance.now() / 1000;
window.__TQ = {
  player, doc, game,
  get mites() { return mites; },
  get npcs() { return npcs; },
  get room() { return room; },
  get transition() { return transition; },
  get dialogue() { return dialogue.active; },
  get flags() { return worldState.flags; },
  // Force a conversation from the console: __TQ.talk('jessie').
  talk: (id) => {
    const n = npcs.find(x => x.id === id) || npcs[0];
    if (n) startDialogue(n, player);
    return n;
  },
  advance: () => advanceDialogue(),
  say: (x, y, text, opts) => spawnWord(x, y, text, opts),
  setPrint: (v) => setPrintMode(v),
  // Live-tune the plate drift, e.g. setMisreg(2) or setMisreg(0) to kill it.
  setMisreg: (mx, my = 0) => { PRINT.mx = mx; PRINT.my = my; invalidateGrounds(); },
  setTime: (v) => { tDay = ((v % 1) + 1) % 1; },
  getTime: () => tDay,
  // Drive exact frames even when the tab is hidden and rAF is throttled.
  step: (frames = 1) => {
    for (let i = 0; i < frames; i++) {
      debugClock += STEP;
      if (game.hitstopT > 0) game.hitstopT -= STEP;
      else update(STEP, debugClock);
      render(debugClock);
    }
  },
};
