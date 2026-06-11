// Toots Quest — M0 renderer proof.
// One room of the Hollow: baked blob terrain, parametric characters, wind,
// day/night light, torches, one enemy, and a 3-hit sword combo with hitstop.

import { TAU, PALETTE, clamp, dist, angleDiff, mulberry32, capsule, inkCircle, inkEllipse } from './ink.js';
import { WORLD_W, WORLD_H, TILE, DECOR, bakeGround, waterCells } from './terrain.js';
import { Player, Dog, Mite, particles, spawnParticle, burst, updateParticles, drawParticles } from './entities.js';
import { skyState, timeLabel, drawLighting } from './light.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const lightCanvas = document.createElement('canvas');
lightCanvas.width = WORLD_W;
lightCanvas.height = WORLD_H;
const lctx = lightCanvas.getContext('2d');

const ground = bakeGround();

function fit() {
  const s = Math.min(innerWidth / WORLD_W, (innerHeight - 70) / WORLD_H, 1.5);
  canvas.style.width = `${Math.floor(WORLD_W * s)}px`;
}
addEventListener('resize', fit);
fit();

// --- World state -----------------------------------------------------------

const DAY_LENGTH = 150;       // seconds per full day — fast, for the demo
let tDay = 0.56;              // start in the warm afternoon

const player = new Player(DECOR.playerSpawn.x, DECOR.playerSpawn.y);
const doc = new Dog(player.x - 40, player.y + 10, { earLen: 10, tailFreq: 9 });
const mites = DECOR.miteSpawns.map(s => new Mite(s.x, s.y));

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

// Seeded ambient detail: grass tufts and water ripple anchors.
const rnd = mulberry32(99);
const tufts = [];
while (tufts.length < 95) {
  const x = rnd() * WORLD_W;
  const y = rnd() * WORLD_H;
  const cell = `${Math.floor(x / TILE)},${Math.floor(y / TILE)}`;
  // crude check: skip water/rock/path neighborhoods by sampling the bake is
  // overkill — tufts on path edges read as overgrowth, so only skip water.
  if (waterCells.some(c => c.cx === Math.floor(x / TILE) && c.cy === Math.floor(y / TILE))) continue;
  tufts.push({ x, y, h: 5 + rnd() * 5, tone: rnd() });
}
const ripples = [];
for (let i = 0; i < 12; i++) {
  const cell = waterCells[Math.floor(rnd() * waterCells.length)];
  ripples.push({
    x: (cell.cx + 0.25 + rnd() * 0.5) * TILE,
    y: (cell.cy + 0.25 + rnd() * 0.5) * TILE,
    ph: rnd(),
  });
}

// --- Input -----------------------------------------------------------------

const keys = new Set();
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.repeat) return;
  keys.add(e.code);
  if (e.code === 'Space' || e.code === 'KeyJ') player.bufferAttack();
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') player.tryDash();
  if (e.code === 'KeyN') tDay = (tDay + 0.08) % 1;
});
addEventListener('keyup', (e) => keys.delete(e.code));

// --- Update ----------------------------------------------------------------

let emberClock = 0;

function update(dt, time) {
  tDay = (tDay + dt / DAY_LENGTH) % 1;

  player.update(dt, keys, game);
  doc.update(dt, player, DECOR.secret);
  for (const m of mites) m.update(dt, player, game);
  updateParticles(dt);

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
      burst((player.x + m.x) / 2, (player.y + m.y) / 2 - 8, 6, {
        color: PALETTE.neon, speed: 150, life: 0.3, add: true, g: 0,
      });
    }
  }

  // Torch embers.
  emberClock -= dt;
  if (emberClock <= 0) {
    emberClock = 0.12;
    for (const t of DECOR.torches) {
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
  if (doc.pointing && Math.random() < dt * 1.5) {
    spawnParticle({
      x: DECOR.secret.x + (Math.random() - 0.5) * 10,
      y: DECOR.secret.y - 4,
      vy: -18, g: 0, life: 0.8, size: 1.8, color: PALETTE.neon, add: true,
    });
  }

  game.shakeT = Math.max(0, game.shakeT - dt);
  if (game.shakeT <= 0) game.shakeAmp = 0;
}

// --- Decor drawing ---------------------------------------------------------

// Fill + fat stroke + refill: overlapping circles read as one inked blob.
function blobCircles(c, circles, fill, inkW = 5) {
  c.beginPath();
  for (const [x, y, r] of circles) {
    c.moveTo(x + r, y);
    c.arc(x, y, r, 0, TAU);
  }
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = PALETTE.ink;
  c.lineWidth = inkW;
  c.lineJoin = 'round';
  c.stroke();
  c.fill();
}

function drawTree(tree, time) {
  const sway = Math.sin(time * 1.4 + tree.x * 0.013) * 2.6 +
               Math.sin(time * 2.3 + tree.y * 0.011) * 1.1;
  inkEllipse(ctx, tree.x, tree.y + 2, 16, 6, 0, 'rgba(34,26,86,0.18)', null);
  capsule(ctx, tree.x, tree.y, tree.x + sway * 0.5, tree.y - 30, 7, PALETTE.trunk, PALETTE.ink, 2.2);
  blobCircles(ctx, [
    [tree.x + sway, tree.y - 46, 20],
    [tree.x + sway - 15, tree.y - 38, 13],
    [tree.x + sway + 15, tree.y - 38, 13],
  ], PALETTE.canopy);
  inkCircle(ctx, tree.x + sway - 7, tree.y - 51, 7, PALETTE.canopyLight, null);
  inkCircle(ctx, tree.x + sway + 9, tree.y - 44, 4.5, PALETTE.canopyLight, null);
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

function render(time) {
  const sky = skyState(tDay);

  ctx.save();
  if (game.shakeAmp > 0) {
    ctx.translate(
      (Math.random() - 0.5) * 2 * game.shakeAmp,
      (Math.random() - 0.5) * 2 * game.shakeAmp,
    );
  }

  ctx.drawImage(ground, 0, 0);
  drawRipples(time);
  drawTufts(time);
  drawSecret(DECOR.secret, time);

  // Y-sorted world objects.
  const drawList = [
    ...DECOR.trees.map(tr => ({ y: tr.y, fn: () => drawTree(tr, time) })),
    ...DECOR.torches.map(to => ({ y: to.y, fn: () => drawTorch(to, time) })),
    { y: DECOR.banner.y, fn: () => drawBanner(DECOR.banner, time) },
    { y: player.y, fn: () => player.draw(ctx, time) },
    { y: doc.y, fn: () => doc.draw(ctx, time) },
    ...mites.map(m => ({ y: m.y, fn: () => m.draw(ctx, time) })),
  ];
  drawList.sort((a, b) => a.y - b.y);
  for (const d of drawList) d.fn();

  drawParticles(ctx);

  // Warm additive glow around each torch flame, day or night.
  ctx.globalCompositeOperation = 'lighter';
  for (const t of DECOR.torches) {
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
    ...DECOR.torches.map(t => ({ x: t.x, y: t.y - 34, r: 105, flicker: true })),
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

  drawHud(time);
}

function drawHud(time) {
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = 'rgba(248,233,210,0.9)';
  ctx.fillText('TOOTS QUEST · M0 LIVING INK', 14, 22);

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
  ctx.fillText('WASD move · SPACE attack · SHIFT dash · N skip time', 14, WORLD_H - 12);
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
  player, doc, mites, game,
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
