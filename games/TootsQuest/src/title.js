// Title screen — the key art, drawn in code (session 8).
//
// The July 2026 hero image ("the keeper", CONCEPT_SKETCHBOOK.md §3.5) was
// generated as marketing art; per the sketchbook rule it never ships. This
// module is its translation: the same composition rebuilt from shape
// grammars — canted panel, Toots mid-lunge connecting THOK-first with a
// windup beetle, Doc chomping his own, Astro blissfully digging, and the
// Static eating the print off the far ridge, a faceless dot-figure inside
// it. Everything animates gently (wind, wag, churn, arc shimmer) because
// parametric ambience is nearly free — a cover that breathes.
//
// Zero image assets, as ever. If this screen looks like the keeper, the
// style survived translation both ways.

import {
  TAU, PALETTE, lerp, clamp, mulberry32, capsule, inkCircle, inkEllipse,
  inkShape,
} from './ink.js';
import { WORLD_W, WORLD_H } from './terrain.js';
import { halftone } from './print.js';

export const TITLE_LEAVE = 0.85;   // seconds for the cover page to lift

export const title = {
  active: true,
  leaving: false,
  t: 0,
  leaveT: 0,
  hasSave: false,   // main.js sets this at boot
};

export function beginTitleLeave() { title.leaving = true; }
export function skipTitle() { title.active = false; }   // tests jump straight in

export function updateTitle(dt) {
  title.t += dt;
  if (title.leaving) title.leaveT += dt;
}

// --- Layout constants (scene space is WORLD_W × WORLD_H, then canted) -------

const CANT = -0.075;            // the dutch angle, radians
const RIDGE = [
  [-90, 400], [140, 372], [320, 334], [500, 286], [640, 250],
  [760, 256], [900, 282], [1060, 304],
];

function ridgeAt(x) {
  for (let i = 0; i < RIDGE.length - 1; i++) {
    const [x0, y0] = RIDGE[i];
    const [x1, y1] = RIDGE[i + 1];
    if (x >= x0 && x <= x1) return lerp(y0, y1, (x - x0) / (x1 - x0));
  }
  return x < 0 ? RIDGE[0][1] : RIDGE[RIDGE.length - 1][1];
}

function groundPath(c) {
  c.beginPath();
  c.moveTo(RIDGE[0][0], RIDGE[0][1]);
  for (let i = 1; i < RIDGE.length; i++) {
    const [px, py] = RIDGE[i - 1];
    const [x, y] = RIDGE[i];
    c.quadraticCurveTo(px + (x - px) * 0.5, py, x, y);
  }
  c.lineTo(1060, WORLD_H + 120);
  c.lineTo(-90, WORLD_H + 120);
  c.closePath();
}

// --- Scene pieces ------------------------------------------------------------

function drawSky(ctx, t) {
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(-120, -120, WORLD_W + 240, WORLD_H + 240);
  // Speed lines chasing the diagonal — the panel is mid-motion.
  ctx.strokeStyle = 'rgba(34,26,86,0.14)';
  ctx.lineCap = 'round';
  const rnd = mulberry32(77);
  for (let i = 0; i < 7; i++) {
    const y = 20 + rnd() * 150;
    const x = 340 + rnd() * 320;
    const len = 120 + rnd() * 200;
    ctx.lineWidth = 1.5 + rnd() * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - len, y + len * 0.14);
    ctx.stroke();
  }
}

// The Static: a field of churning gray dots eating the top-right of the
// page, and inside it, a tall ragged faceless figure that only vaguely
// echoes the hero's shape — never with eyes (canon).
function drawStatic(ctx, t) {
  const rnd = mulberry32(4242);
  const SP = 9;
  ctx.fillStyle = '#7e7c92';
  for (let gy = -60; gy < 360; gy += SP) {
    for (let gx = 440; gx < WORLD_W + 100; gx += SP) {
      let d = clamp((gx - 440) / 400, 0, 1) * clamp(1 - gy / 340, 0, 1) * 1.5;
      // A negative-space halo around the copy: the figure is made OF the
      // static, so the field thins where it stands.
      const hx = (gx - 782) / 78, hy = (gy - 190) / 170;
      if (hx * hx + hy * hy < 1) d *= 0.25;
      const r = rnd();
      if (r > d) continue;
      const churn = 0.55 + 0.45 * Math.sin(t * 2.4 + r * 40 + gx * 0.05);
      ctx.globalAlpha = clamp(0.52 * churn * d, 0, 0.6);
      ctx.fillRect(gx + (r - 0.5) * 4, gy + (rnd() - 0.5) * 4, 2.6, 2.6);
    }
  }
  ctx.globalAlpha = 1;

  // The copy: a lumpy column of denser dots. Head, shoulders, drooping
  // arm-lobes, all suggestion — a shape the static half-remembers.
  const srnd = mulberry32(1313);
  const breathe = 0.58 + 0.1 * Math.sin(t * 0.45);
  ctx.fillStyle = '#4a4664';
  for (let i = 0; i < 720; i++) {
    const u = srnd();                       // 0 head → 1 hem
    const y = 58 + u * 262;
    const spine = 782 + Math.sin(y * 0.045 + 2) * 9;
    // Width profile: head 15, neck 10, shoulders 38, taper to 22, ragged hem.
    let w = u < 0.14 ? 15 : u < 0.2 ? 10 : u < 0.34 ? 38 : lerp(34, 22, (u - 0.34) / 0.66);
    w *= 0.62 + srnd() * 0.75;             // ragged edges
    const x = spine + (srnd() - 0.5) * 2 * w;
    const flick = 0.65 + 0.35 * Math.sin(t * 3.1 + i);
    ctx.globalAlpha = breathe * (0.5 + 0.5 * srnd()) * flick;
    ctx.fillRect(x, y + Math.sin(t * 0.8 + i) * 1.2, 2.8, 2.8);
  }
  ctx.globalAlpha = 1;

  // Tuft echo: a few crooked spikes off the head.
  ctx.strokeStyle = 'rgba(74,70,100,0.55)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const [dx, dy, a] of [[-6, -8, -0.5], [2, -11, 0.1], [9, -7, 0.6]]) {
    ctx.beginPath();
    ctx.moveTo(782 + dx, 58 + 4);
    ctx.lineTo(782 + dx + Math.sin(a) * 9, 54 + dy);
    ctx.stroke();
  }
}

// The dead broadcast tower on the crest — outlines decaying into dashes.
function drawTower(ctx) {
  ctx.strokeStyle = 'rgba(34,26,86,0.55)';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.setLineDash([7, 4]);
  const bx = 700, by = 252, tx = 700, ty = 128;
  ctx.beginPath();
  ctx.moveTo(bx - 22, by); ctx.lineTo(tx - 3, ty);
  ctx.moveTo(bx + 22, by); ctx.lineTo(tx + 3, ty);
  ctx.stroke();
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    const u = i / 5;
    const w = lerp(22, 3, u);
    const y = lerp(by, ty, u);
    const w2 = lerp(22, 3, u + 0.2);
    const y2 = lerp(by, ty, u + 0.2);
    ctx.beginPath();
    ctx.moveTo(700 - w, y); ctx.lineTo(700 + w2, y2);
    ctx.moveTo(700 + w, y); ctx.lineTo(700 - w2, y2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(tx, ty); ctx.lineTo(tx, ty - 16);
  ctx.stroke();
  ctx.setLineDash([]);
  // The beacon, dead — a gray dot where neon should be.
  inkCircle(ctx, tx, ty - 18, 2.2, '#8a8898', null);
}

function drawGround(ctx, t) {
  // Grass fill with soft tonal blobs, then the color drains toward the
  // Static — the print failing at the crest.
  const rnd = mulberry32(909);
  ctx.save();
  groundPath(ctx);
  ctx.clip();
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(-90, 120, WORLD_W + 180, WORLD_H + 200);
  for (let i = 0; i < 22; i++) {
    ctx.beginPath();
    ctx.arc(rnd() * WORLD_W, 250 + rnd() * 320, 50 + rnd() * 90, 0, TAU);
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(141,158,78,0.25)' : 'rgba(194,207,126,0.18)';
    ctx.fill();
  }
  // The path, cresting the ridge toward the tower.
  const PATH = [[470, 580], [516, 470], [556, 396], [598, 322], [636, 258]];
  const PW = [86, 62, 48, 36, 24];
  ctx.beginPath();
  for (let i = 0; i < PATH.length; i++) ctx.lineTo(PATH[i][0] - PW[i] / 2, PATH[i][1]);
  for (let i = PATH.length - 1; i >= 0; i--) ctx.lineTo(PATH[i][0] + PW[i] / 2, PATH[i][1]);
  ctx.closePath();
  ctx.fillStyle = PALETTE.path;
  ctx.fill();
  ctx.strokeStyle = 'rgba(34,26,86,0.7)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Grass flecks below the ridge; sparser near the drained crest.
  ctx.lineCap = 'round';
  for (let i = 0; i < 420; i++) {
    const x = rnd() * (WORLD_W + 100) - 50;
    const y = ridgeAt(x) + 14 + rnd() * (WORLD_H - ridgeAt(x));
    if (x > 620 && rnd() < 0.6) continue;
    ctx.strokeStyle = rnd() < 0.7 ? 'rgba(141,158,78,0.55)' : 'rgba(248,233,210,0.30)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * 2, y - 2 - rnd() * 3);
    ctx.stroke();
  }
  // The drain: cream washes the grass out as it nears the Static.
  const g = ctx.createLinearGradient(520, 0, 940, 0);
  g.addColorStop(0, 'rgba(248,233,210,0)');
  g.addColorStop(1, 'rgba(248,233,210,0.72)');
  ctx.fillStyle = g;
  ctx.fillRect(430, 100, 620, WORLD_H + 200);
  ctx.restore();

  // Ridge ink line: confident on the living side, broken where the print
  // is failing.
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  const seg = (fromX, toX, dash) => {
    ctx.setLineDash(dash);
    ctx.beginPath();
    let first = true;
    for (let x = fromX; x <= toX; x += 14) {
      const y = ridgeAt(x);
      first ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      first = false;
    }
    ctx.stroke();
  };
  seg(-90, 590, []);
  ctx.lineWidth = 2.6;
  ctx.globalAlpha = 0.7;
  seg(590, 1050, [8, 7]);
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
}

// Foreground flora: oversized flowers and tufts along the bottom, swaying.
function drawFlora(ctx, t) {
  const rnd = mulberry32(505);
  for (let i = 0; i < 26; i++) {
    const x = rnd() * WORLD_W;
    const y = ridgeAt(x) + 40 + rnd() * (WORLD_H - ridgeAt(x) - 20);
    const s = 1 + (y / WORLD_H) * 1.2;
    const wind = Math.sin(t * 1.5 + x * 0.012) * 2 * s;
    if (rnd() < 0.3) {
      const col = [PALETTE.orange, PALETTE.hotOrange, PALETTE.cream][Math.floor(rnd() * 3)];
      ctx.strokeStyle = PALETTE.grassDark;
      ctx.lineWidth = 1.4 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + wind * 0.5, y - 4 * s, x + wind, y - 7 * s);
      ctx.stroke();
      ctx.fillStyle = col;
      for (let k = 0; k < 4; k++) {
        const a = k * (TAU / 4) + 0.4;
        ctx.beginPath();
        ctx.arc(x + wind + Math.cos(a) * 2 * s, y - 8 * s + Math.sin(a) * 2 * s, 1.6 * s, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = col === PALETTE.cream ? PALETTE.orange : PALETTE.cream;
      ctx.beginPath();
      ctx.arc(x + wind, y - 8 * s, 1.1 * s, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = rnd() < 0.6 ? PALETTE.grassDark : PALETTE.grassLight;
      ctx.lineWidth = 1.7 * s;
      ctx.lineCap = 'round';
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * 2.4 * s, y);
        ctx.quadraticCurveTo(x + k * 2.4 * s + wind, y - 5 * s, x + k * 2.4 * s + wind * 2 + k, y - 9 * s);
        ctx.stroke();
      }
    }
  }
}

// A windup beetle, posable: rot for tumbling, dead=true for X eyes.
function drawBeetle(ctx, x, y, s, rot, t, opts = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    const k = i % 3;
    const flail = opts.flail ? Math.sin(t * 10 + i * 1.3) * 3 : Math.sin(t * 4 + i) * 1;
    ctx.beginPath();
    ctx.moveTo(side * 6, -6 + k * 2.5);
    ctx.lineTo(side * 12, -2 + k * 2.5 + flail);
    ctx.stroke();
  }
  inkEllipse(ctx, 0, -7, 10, 8.5, 0, '#a4602f', PALETTE.ink, 2.4);
  ctx.strokeStyle = PALETTE.rustDark;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -4, 8, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(248,233,210,0.75)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-5.6, -8.6); ctx.lineTo(-2.4, -5.4);
  ctx.moveTo(-2.4, -8.6); ctx.lineTo(-5.6, -5.4);
  ctx.stroke();
  if (opts.key !== false) {
    capsule(ctx, 0, -14.5, 0, -18.5, 2, PALETTE.rustDark, PALETTE.ink, 1.5);
    const bw = 5.5 * Math.abs(Math.cos(t * (opts.keySpin || 1.6))) + 1.3;
    capsule(ctx, -bw, -19.5, bw, -19.5, 2.8, PALETTE.timber, PALETTE.ink, 1.5);
  }
  if (opts.dead) {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.4;
    for (const ex of [-3, 3]) {
      ctx.beginPath();
      ctx.moveTo(ex - 1.5, -9.5); ctx.lineTo(ex + 1.5, -6.5);
      ctx.moveTo(ex + 1.5, -9.5); ctx.lineTo(ex - 1.5, -6.5);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = PALETTE.hotOrange;
    ctx.beginPath(); ctx.arc(-2.6, -8, 1.7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(2.6, -8, 1.7, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// Loose hardware, hand-placed around the vanquished beetle.
function drawPart(ctx, shape, x, y, rot, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.strokeStyle = PALETTE.rustDark;
  ctx.lineCap = 'round';
  if (shape === 'spring') {
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      i === 0 ? ctx.moveTo(-3.5, 0) : ctx.lineTo(-3.5 + u * 7, Math.sin(u * Math.PI * 5) * 2.2);
    }
    ctx.stroke();
  } else if (shape === 'bolt') {
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-2.5, 0); ctx.lineTo(2.2, 0); ctx.stroke();
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-2.5, -1.6); ctx.lineTo(-2.5, 1.6); ctx.stroke();
  } else if (shape === 'nut') {
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

// Hand lettering with a seeded wobble — fx.js's trick at poster scale.
function letterRow(ctx, text, x, y, size, fill, seed, arch = 8) {
  ctx.font = `900 ${size}px 'Chalkboard SE','Comic Sans MS',sans-serif`;
  const rnd = mulberry32(seed);
  const widths = [...text].map(ch => ctx.measureText(ch).width);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  let cx = x;
  for (let i = 0; i < text.length; i++) {
    const u = text.length > 1 ? i / (text.length - 1) : 0.5;
    const jy = -Math.sin(u * Math.PI) * arch + (rnd() - 0.5) * 4;
    const jr = (rnd() - 0.5) * 0.11;
    ctx.save();
    ctx.translate(cx + widths[i] / 2, y + jy);
    ctx.rotate(jr);
    // Halftone drop shadow, then fat ink, then the color plate.
    ctx.fillStyle = halftone(ctx, 'shade');
    ctx.fillText(text[i], -widths[i] / 2 + 5, 6);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = size * 0.15;
    ctx.strokeText(text[i], -widths[i] / 2, 0);
    ctx.fillStyle = fill;
    ctx.fillText(text[i], -widths[i] / 2, 0);
    ctx.restore();
    cx += widths[i] + 2;
  }
  return cx - x;
}

function drawLogo(ctx, t) {
  ctx.save();
  ctx.translate(66, 96);
  ctx.rotate(-0.055 + Math.sin(t * 0.7) * 0.004);
  // A halftone cloud bed behind the letters.
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = halftone(ctx, 'shade');
  ctx.beginPath();
  ctx.ellipse(180, 34, 218, 66, -0.04, 0, TAU);
  ctx.fill();
  ctx.restore();
  letterRow(ctx, 'TOOTS', 0, 28, 76, PALETTE.orange, 11);
  letterRow(ctx, 'QUEST', 54, 94, 66, PALETTE.cream, 23);
  ctx.restore();
}

// THOK! — the fx.js burst, pinned at poster scale.
function drawThok(ctx, x, y, t) {
  const size = 30;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(0.14);
  const pulse = 1 + Math.sin(t * 2.2) * 0.02;
  ctx.scale(pulse, pulse);
  ctx.font = `bold ${size}px 'Chalkboard SE','Comic Sans MS',sans-serif`;
  const text = 'THOK!';
  const widths = [...text].map(ch => ctx.measureText(ch).width);
  const textW = widths.reduce((a, b) => a + b, 0) + 1.5 * (text.length - 1);
  const rnd = mulberry32(777);
  const spikes = 11;
  const radX = textW * 0.64 + 6;
  const radY = size * 1.32;
  const rot = rnd() * TAU;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = rot + (i / (spikes * 2)) * TAU;
    const f = (i % 2 === 0 ? 1 : 0.52) * (0.86 + rnd() * 0.24);
    const px = Math.cos(a) * radX * f;
    const py = Math.sin(a) * radY * f;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = PALETTE.cream;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();
  let lx = -textW / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < text.length; i++) {
    const jr = (rnd() - 0.5) * 0.16;
    const jy = (rnd() - 0.5) * 4;
    ctx.save();
    ctx.translate(lx + widths[i] / 2, jy);
    ctx.rotate(jr);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 5;
    ctx.strokeText(text[i], -widths[i] / 2, 0);
    ctx.fillStyle = PALETTE.hotOrange;
    ctx.fillText(text[i], -widths[i] / 2, 0);
    ctx.restore();
    lx += widths[i] + 1.5;
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

// Toots, mid-lunge east, at poster scale — the keeper's pose in primitives.
function drawToots(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  // Airborne: the shadow floats detached beneath him.
  inkEllipse(ctx, 2, 6, 12, 4, 0, 'rgba(34,26,86,0.20)', null);

  // The arc: a neon crescent sweeping overhead to the blade. Drawn
  // source-over — 'lighter' bleaches to white on cream paper; on the page
  // the arc must be TEAL (the keeper's one accent).
  const shimmer = 0.85 + Math.sin(t * 3.2) * 0.15;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(0,247,194,${0.8 * shimmer})`;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(4, -18, 34, -2.75, -0.32);
  ctx.stroke();
  ctx.strokeStyle = `rgba(248,233,210,${0.9 * shimmer})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(4, -18, 34, -1.15, -0.32);
  ctx.stroke();
  ctx.strokeStyle = `rgba(0,247,194,${0.3 * shimmer})`;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(4, -18, 26, -2.5, -0.5);
  ctx.stroke();
  ctx.restore();

  // Legs stretched into the lunge, feet off the ground.
  capsule(ctx, -2, -9, -12, -1, 3.4, PALETTE.ink, null);
  capsule(ctx, 3, -9, 11, -4, 3.4, PALETTE.ink, null);
  inkEllipse(ctx, -13, -1, 3.6, 2.7, -0.3, PALETTE.ink, null);
  inkEllipse(ctx, 12.5, -4, 3.6, 2.7, 0.25, PALETTE.ink, null);

  // Torso.
  capsule(ctx, 0, -10, 1.5, -20, 11, PALETTE.ink, null);

  // Poncho, whipping back hard — the motion instrument at full song.
  const hem = Math.sin(t * 2.1) * 0.8;
  inkShape(ctx, (c) => {
    c.beginPath();
    c.moveTo(-1, -21.5);
    c.quadraticCurveTo(-13, -20.5, -19 + hem, -13.5);
    c.lineTo(-15.5 + hem, -12);
    c.lineTo(-13 + hem * 0.8, -15.2);
    c.lineTo(-9.5 + hem * 0.8, -10.8);
    c.lineTo(-6 + hem * 0.6, -13.8);
    c.lineTo(-2 + hem * 0.6, -9.6);
    c.lineTo(2 + hem * 0.4, -12.6);
    c.lineTo(5.5, -10.4);
    c.quadraticCurveTo(8.5, -16.5, 5.5, -21);
    c.quadraticCurveTo(2, -23, -1, -21.5);
    c.closePath();
  }, PALETTE.orange, PALETTE.ink, 2);
  // Chest X stitch.
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0.4, -16.6); ctx.lineTo(3.4, -13.6);
  ctx.moveTo(3.4, -16.6); ctx.lineTo(0.4, -13.6);
  ctx.stroke();

  // Sword arm and the neon blade, reaching for the beetle.
  capsule(ctx, 4, -18, 11, -15, 3, PALETTE.ink, null);
  capsule(ctx, 11.5, -16.5, 13.5, -13, 2.6, PALETTE.cream, PALETTE.ink, 1.4);
  capsule(ctx, 13, -15.5, 26, -25, 3.2, PALETTE.neon, PALETTE.ink, 1.6);

  // Head, thrown forward.
  inkCircle(ctx, 5, -28, 9, PALETTE.ink, null);
  // Uneven googly eyes, pupils locked on the beetle (up-right).
  inkCircle(ctx, 2.6, -29, 4.2, PALETTE.cream, null);
  inkCircle(ctx, 8.8, -28.2, 3.6, PALETTE.cream, null);
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath(); ctx.arc(3.9, -29.7, 1.7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -28.9, 1.5, 0, TAU); ctx.fill();
  // Tuft, streaming back.
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(1.5, -35.5); ctx.lineTo(-2.5, -40 + Math.sin(t * 2.5) * 0.6);
  ctx.moveTo(4.5, -36.5); ctx.lineTo(3, -42 + Math.sin(t * 2.9) * 0.6);
  ctx.moveTo(7.5, -35.8); ctx.lineTo(9.5, -40.5);
  ctx.stroke();

  // Dust kicked off the launch.
  ctx.fillStyle = 'rgba(248,233,210,0.6)';
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.8 + i / 3) % 1;
    ctx.globalAlpha = (1 - u) * 0.6;
    ctx.beginPath();
    ctx.arc(-16 - u * 8, 2 - u * 4, 2.5 + u * 2, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Doc, committed: jaw clamped on a beetle twice his courage class.
function drawDoc(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const wag = Math.sin(t * 6) * 1.2;

  inkEllipse(ctx, 2, 1.5, 15, 5, 0, 'rgba(34,26,86,0.2)', null);
  // His victim first, so the jaw overlaps it.
  drawBeetle(ctx, 15, 0, 0.9, 0.12, t, { flail: true, keySpin: 9 });
  // Spring popping loose overhead.
  drawPart(ctx, 'spring', 12, -20 + Math.sin(t * 3) * 1.2, 0.6 + t * 0.0, 1);

  // Low lunge: rump up, chest down, the bean at full commitment.
  capsule(ctx, -10, -9, -16, -16, 4, PALETTE.dogDoc, PALETTE.ink, 1.8);   // tail base
  ctx.save();
  ctx.rotate(0.14);
  inkEllipse(ctx, -4, -9.5, 10.5, 6.8, 0, PALETTE.dogDoc, PALETTE.ink, 2.2);
  ctx.restore();
  // The curl plume, sweeping over the back.
  capsule(ctx, -12, -12, -17 + wag, -19, 3.6, PALETTE.dogDoc, PALETTE.ink, 1.8);
  // Legs braced wide.
  capsule(ctx, -8, -6, -10, 0, 3, PALETTE.dogDoc, PALETTE.ink, 1.8);
  capsule(ctx, -2, -6, -1, 0, 3, PALETTE.dogDoc, PALETTE.ink, 1.8);
  capsule(ctx, 4, -7, 6, 0, 3, PALETTE.dogDoc, PALETTE.ink, 1.8);
  // Head down at the beetle, jaw open around its shell.
  inkCircle(ctx, 8, -8, 6.5, PALETTE.dogDoc, PALETTE.ink, 2.2);
  capsule(ctx, 5, -13, 1, -8, 3.8, PALETTE.dogDoc, PALETTE.ink, 1.8);   // ear flying
  // Upper snout biting down; lower jaw beneath the shell edge.
  inkEllipse(ctx, 13, -8.5, 4.5, 2.8, 0.5, PALETTE.dogDocChest, PALETTE.ink, 1.6);
  inkEllipse(ctx, 12.5, -3.5, 3.6, 2, 0.2, PALETTE.dogDocChest, PALETTE.ink, 1.6);
  inkCircle(ctx, 15.5, -10.5, 1.5, PALETTE.ink, null);   // nose
  // The underbite tooth, mid-bite.
  inkShape(ctx, (c) => {
    c.beginPath();
    c.moveTo(13.6, -4.6);
    c.lineTo(15.4, -4.6);
    c.lineTo(14.5, -6.8);
    c.closePath();
  }, PALETTE.cream, PALETTE.ink, 1);
  // Furrowed brow + furious eye.
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(5, -12); ctx.lineTo(10, -10.4);
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath(); ctx.arc(8.6, -9.6, 1.3, 0, TAU); ctx.fill();
  ctx.restore();
}

// Astro, conscientious objector: butt up, head in the dig, bliss.
function drawAstro(ctx, x, y, s, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(-s, s);   // faces left, into the hole
  const wag = Math.sin(t * 13) * 2.4;

  inkEllipse(ctx, 0, 1.5, 15, 5, 0, 'rgba(34,26,86,0.2)', null);
  // Rear high on the long poodle legs.
  capsule(ctx, -8, -14, -8.5, 0, 2.6, PALETTE.dogAstro, PALETTE.ink, 1.8);
  capsule(ctx, -4, -14, -3.5, 0, 2.6, PALETTE.dogAstro, PALETTE.ink, 1.8);
  // Tail straight up, wagging hard.
  capsule(ctx, -9, -16, -12 + wag, -26, 3.4, PALETTE.dogAstro, PALETTE.ink, 1.8);
  // Body diving forward-down.
  ctx.save();
  ctx.rotate(0.34);
  inkEllipse(ctx, 1, -10, 11, 6, 0, PALETTE.dogAstro, PALETTE.ink, 2.2);
  ctx.restore();
  // Front legs plunged into the dig.
  capsule(ctx, 7, -6, 9, 2, 2.6, PALETTE.dogAstro, PALETTE.ink, 1.8);
  capsule(ctx, 11, -5, 13, 2.5, 2.6, PALETTE.dogAstro, PALETTE.ink, 1.8);
  // Head down at the ground, ears flopped forward.
  inkCircle(ctx, 13, -6, 6.5, PALETTE.dogAstro, PALETTE.ink, 2.2);
  capsule(ctx, 11, -11, 16, -13, 4, PALETTE.dogAstro, PALETTE.ink, 1.8);
  inkEllipse(ctx, 17.5, -3.5, 4, 2.6, 0.5, PALETTE.dogAstroChest, PALETTE.ink, 1.6);
  inkCircle(ctx, 19.5, -5.5, 1.4, PALETTE.ink, null);
  // The bliss arc, cream on charcoal.
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(12.5, -6.5, 2, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  // Tongue lolling out of the dig.
  inkEllipse(ctx, 17, -0.5, 1.6, 2.2, 0.3, PALETTE.hotOrange, null);
  ctx.restore();

  // Dig site (unmirrored space): hole, dirt arcs, the unearthed glint.
  const hx = x - 17 * s;
  inkEllipse(ctx, hx, y + 1, 8 * s, 3.4 * s, 0, '#6b4a2e', PALETTE.ink, 1.8);
  ctx.fillStyle = '#7c5836';
  for (let i = 0; i < 5; i++) {
    const u = (t * 1.1 + i / 5) % 1;
    ctx.globalAlpha = (1 - u) * 0.9;
    ctx.beginPath();
    ctx.arc(x + (6 + u * 26) * s, y - (14 * u - 16 * u * u) * s - 4, (2.2 - u * 1.2) * s, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // The trinket: a stitched medallion, glinting neon. Magic means neon.
  const gx = hx - 11 * s;
  const gy = y - 1;
  inkCircle(ctx, gx, gy, 4 * s, PALETTE.timber, PALETTE.ink, 1.6);
  inkCircle(ctx, gx, gy, 2.2 * s, PALETTE.neon, null);
  const glint = 0.5 + Math.sin(t * 2.6) * 0.5;
  ctx.strokeStyle = `rgba(0,247,194,${glint})`;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(gx - 6 * s, gy - 6 * s); ctx.lineTo(gx - 9 * s, gy - 9 * s);
  ctx.moveTo(gx - 9 * s, gy - 6 * s); ctx.lineTo(gx - 6 * s, gy - 9 * s);
  ctx.stroke();
}

function drawPrompt(ctx, t) {
  const bounce = Math.sin(t * 2.6) * 2;
  ctx.textAlign = 'center';
  ctx.font = "bold 17px 'Chalkboard SE','Comic Sans MS',sans-serif";
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 5;
  ctx.strokeText('PRESS ANY KEY', WORLD_W / 2, WORLD_H - 34 + bounce);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText('PRESS ANY KEY', WORLD_W / 2, WORLD_H - 34 + bounce);
  if (title.hasSave) {
    ctx.font = "bold 10px 'Chalkboard SE','Comic Sans MS',sans-serif";
    ctx.strokeLineWidth = 3;
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 3;
    ctx.strokeText('YOUR STITCHES HELD · RESUMING', WORLD_W / 2, WORLD_H - 18);
    ctx.fillStyle = 'rgba(34,26,86,0.75)';
    ctx.fillText('YOUR STITCHES HELD · RESUMING', WORLD_W / 2, WORLD_H - 18);
  }
  ctx.textAlign = 'left';
}

// --- The whole cover ---------------------------------------------------------

export function drawTitle(ctx, time) {
  const t = title.t + time * 0;   // title keeps its own clock (pause-proof)

  ctx.save();
  // Paper behind everything (visible at the canted corners and during the
  // page lift).
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // The canted scene.
  ctx.save();
  ctx.translate(WORLD_W / 2, WORLD_H / 2);
  ctx.rotate(CANT);
  ctx.scale(1.12, 1.12);
  ctx.translate(-WORLD_W / 2, -WORLD_H / 2);

  drawSky(ctx, t);
  drawStatic(ctx, t);
  drawTower(ctx);
  drawGround(ctx, t);
  drawFlora(ctx, t);

  // The cast.
  drawDoc(ctx, 175, 470, 2.7, t);
  drawAstro(ctx, 800, 462, 2.6, t);
  drawToots(ctx, 400, 380, 3, t);
  // The vanquished beetle at the top of the arc, parts flying.
  drawBeetle(ctx, 570, 268, 2.3, -0.55 + Math.sin(t * 1.7) * 0.05, t,
    { flail: true, dead: true, key: false });
  drawPart(ctx, 'spring', 610, 238, 0.8 + Math.sin(t) * 0.15, 1.9);
  drawPart(ctx, 'bolt', 535, 232, -0.5, 1.9);
  drawPart(ctx, 'nut', 626, 292, 0.3, 1.9);
  // Its key, flung free, still lazily turning.
  ctx.save();
  ctx.translate(538, 305);
  ctx.rotate(t * 0.9);
  capsule(ctx, 0, 0, 0, -8, 3.4, PALETTE.rustDark, PALETTE.ink, 1.6);
  capsule(ctx, -7, -10.5, 7, -10.5, 4.6, PALETTE.timber, PALETTE.ink, 1.6);
  ctx.restore();
  drawThok(ctx, 636, 200, t);

  ctx.restore();   // un-cant

  // Screen-space dressing: logo, prompt, panel frame.
  drawLogo(ctx, t);
  drawPrompt(ctx, t);
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, WORLD_W - 12, WORLD_H - 12);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, WORLD_W - 24, WORLD_H - 24);
  ctx.restore();
}
