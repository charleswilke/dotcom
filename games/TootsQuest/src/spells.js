// Spells — the Frequency Dial (PRD §4.3), seeded with its first frequency:
// 88.3 · Clear as Day. Spell visuals are pure composite-op light; the
// renderer and the magic system are the same technology, which is the whole
// bet of §4.3.
//
// The look is crisp on purpose: no soft additive blobs. The cast is a
// hard-edged oscilloscope wavefront — a sine wave bent into a ring — that
// expands in the ground plane (gotcha 9: anything cast or swung lives in
// the flattened plane, same squash as the shadows). As the front crosses an
// interactive thing (secret, hoop, door) it rim-lights it in neon: the
// palette law ("neon = magic/interactive") made briefly visible, which is
// exactly what a revealing spell should be. At night the front carries
// daylight with it — main.js feeds the pulse into the darkness pass, so
// Clear as Day literally clears the dark.

import { TAU, PALETTE, PRINT, clamp, lerp, easeOutCubic, dist } from './ink.js';

export const SPELL = {
  freq: '88.3',
  name: 'CLEAR AS DAY',
  cooldown: 5,
};

export const spellState = { cooldownT: 0 };

const GROUND_FLAT = 0.55;   // the shadows' squash; the sword arc uses it too

const pulses = [];   // {x, y, t, dur, maxR, targets:[{x, y, kind, d, pinged}]}
const pings = [];    // {x, y, t, dur, kind}

export function spellReady() { return spellState.cooldownT <= 0; }

// Cast from (x, y). `targets` is the room's interactive set — the wavefront
// pings each one the moment it sweeps past its distance, sonar-style.
export function castClearAsDay(x, y, targets = []) {
  if (!spellReady()) return false;
  spellState.cooldownT = SPELL.cooldown;
  pulses.push({
    x, y, t: 0, dur: 1.15, maxR: 300,
    targets: targets.map(tg => ({ ...tg, d: dist(x, y, tg.x, tg.y), pinged: false })),
  });
  return true;
}

function frontR(p) { return easeOutCubic(clamp(p.t / p.dur, 0, 1)) * p.maxR; }

export function updateSpells(dt) {
  spellState.cooldownT = Math.max(0, spellState.cooldownT - dt);
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i];
    p.t += dt;
    const r = frontR(p);
    for (const tg of p.targets) {
      if (!tg.pinged && tg.d <= r) {
        tg.pinged = true;
        // Secrets get the long reveal — the spell's actual job. Everything
        // else gets a quick courtesy flash.
        pings.push({
          x: tg.x, y: tg.y, t: 0,
          dur: tg.kind === 'secret' ? 3.2 : 1.4,
          kind: tg.kind,
        });
      }
    }
    if (p.t >= p.dur) pulses.splice(i, 1);
  }
  for (let i = pings.length - 1; i >= 0; i--) {
    pings[i].t += dt;
    if (pings[i].t >= pings[i].dur) pings.splice(i, 1);
  }
}

// Pulses and pings are positioned in room space — stale after a crossing.
export function clearSpells() { pulses.length = 0; pings.length = 0; }

export function spellsActive() { return pulses.length > 0 || pings.length > 0; }

// Light-punch entries for the darkness pass (light.js understands sy —
// the spell's holes are ground-plane ellipses, not wheels).
export function spellLights() {
  const lights = [];
  for (const p of pulses) {
    lights.push({ x: p.x, y: p.y, r: frontR(p) * 1.08 + 26, sy: GROUND_FLAT, flicker: false });
  }
  for (const g of pings) {
    lights.push({ x: g.x, y: g.y, r: g.kind === 'secret' ? 52 : 36, flicker: false });
  }
  return lights;
}

// One waveform ring: a sine wave wrapped around a circle, drawn flattened.
function waveRing(ctx, R, amp, cycles, phase) {
  const steps = 96;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * TAU;
    const r = R + Math.sin(a * cycles + phase) * amp;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function drawSpells(ctx, time) {
  for (const p of pulses) {
    const p01 = clamp(p.t / p.dur, 0, 1);
    const R = frontR(p);
    if (R < 4) continue;
    const fade = 1 - p01 * p01;             // holds bright, dies fast
    const amp = 7.5 * (1 - p01);            // the waveform settles as it lands
    const phase = p.t * 26;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1, GROUND_FLAT);
    ctx.globalCompositeOperation = 'lighter';

    // The front: a neon waveform with a cream filament core. Two strokes,
    // hard edges, zero gradient — this is a signal, not a glow.
    waveRing(ctx, R, amp, 24, phase);
    ctx.strokeStyle = `rgba(0,247,194,${0.85 * fade})`;
    ctx.lineWidth = 4.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.strokeStyle = `rgba(248,233,210,${0.9 * fade})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Echo ring trailing the front — the same signal, one breath behind.
    const echoR = R * 0.72;
    if (echoR > 8) {
      waveRing(ctx, echoR, amp * 0.5, 24, phase + 1.2);
      ctx.strokeStyle = `rgba(0,247,194,${0.3 * fade})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // Calibration rings left standing where the front has passed — crisp
    // hairlines, like tick marks on a dial the size of the world.
    for (const f of [0.45, 0.22]) {
      const cr = R * f;
      if (cr < 8) continue;
      ctx.beginPath();
      ctx.arc(0, 0, cr, 0, TAU);
      ctx.strokeStyle = `rgba(0,247,194,${0.16 * fade})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Sunday Ink: radial ink dashes chasing the front — the comic's way of
    // saying PING. Ink is not light, so it draws outside the lighter block.
    if (PRINT.on) {
      ctx.strokeStyle = `rgba(34,26,86,${0.5 * fade})`;
      ctx.lineWidth = 1.7;
      ctx.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU + 0.12;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (R + 7), Math.sin(a) * (R + 7));
        ctx.lineTo(Math.cos(a) * (R + 15), Math.sin(a) * (R + 15));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Pings: a contracting rim on everything interactive; secrets also get
  // the cross-stitch X — the needlepoint motif doubling as "X marks the
  // spot", because of course it does.
  for (const g of pings) {
    const p01 = clamp(g.t / g.dur, 0, 1);
    const fade = 1 - p01;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.globalCompositeOperation = 'lighter';
    const rim = lerp(18, 9, easeOutCubic(clamp(g.t / 0.35, 0, 1)));
    ctx.beginPath();
    ctx.ellipse(0, 0, rim, rim * GROUND_FLAT, 0, 0, TAU);
    ctx.strokeStyle = `rgba(0,247,194,${0.8 * fade})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (g.kind === 'secret') {
      const blink = 0.55 + Math.sin(g.t * 6) * 0.45;
      ctx.strokeStyle = `rgba(0,247,194,${blink * fade})`;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.5, -4.5 - 10); ctx.lineTo(4.5, 4.5 - 10);
      ctx.moveTo(4.5, -4.5 - 10); ctx.lineTo(-4.5, 4.5 - 10);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }
}

// --- The Frequency Dial HUD (bottom-left, PRD §4.3) ------------------------
// A sliver of the Time Dial's family: a band of frequencies, one attuned
// station, a needle. Casting throws the needle up the band; the cooldown IS
// the needle tuning back down to 88.3. When it lands, the station dot burns
// neon: ready is a lit dial, not a filled bar.

export function drawFreqDial(ctx, x, y, time, interior) {
  const W = 128, H = 30;
  const ink = 'rgba(34,26,86,0.85)';
  const paper = interior ? 'rgba(34,26,86,0.08)' : 'rgba(34,26,86,0.45)';
  const face = interior ? ink : 'rgba(248,233,210,0.85)';

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 6);
  ctx.fill();
  ctx.strokeStyle = interior ? 'rgba(34,26,86,0.5)' : 'rgba(248,233,210,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // The band: 88 → 108, ticks every 4, the attuned station at 88.3.
  const bx0 = 10, bx1 = W - 10, by = 12;
  ctx.strokeStyle = face;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(bx0, by);
  ctx.lineTo(bx1, by);
  ctx.stroke();
  for (let i = 0; i <= 5; i++) {
    const tx = lerp(bx0, bx1, i / 5);
    ctx.beginPath();
    ctx.moveTo(tx, by - (i % 5 === 0 ? 4 : 2.5));
    ctx.lineTo(tx, by + (i % 5 === 0 ? 4 : 2.5));
    ctx.stroke();
  }

  // Needle: at rest on 88.3; a cast slings it to the top of the band and
  // it eases back home as the spell recharges.
  const cd = clamp(spellState.cooldownT / SPELL.cooldown, 0, 1);
  const nx = lerp(bx0 + 2, bx1 - 2, 0.015 + cd * cd * 0.97);
  ctx.strokeStyle = PALETTE.neon;
  ctx.globalAlpha = cd > 0 ? 0.45 : 1;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(nx, by - 6);
  ctx.lineTo(nx, by + 6);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Station dot + label. The dot breathes neon when the frequency is ready.
  if (cd <= 0) {
    ctx.globalAlpha = 0.55 + Math.sin(time * 2.2) * 0.45;
    ctx.fillStyle = PALETTE.neon;
    ctx.beginPath();
    ctx.arc(bx0 + 2, by - 7, 1.6, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = face;
  ctx.fillText(`${SPELL.freq} ${SPELL.name} · F`, bx0, H - 5);

  ctx.restore();
}
