// FX — onomatopoeia word bursts, the Sunday-strip combat language.
// "THOK!" on a normal hit, "KRAK!" on a starburst for the finisher.
//
// Two rules make these feel right:
// 1. Words spawn at FULL impact size and settle down slightly — never grow
//    in. Hitstop freezes the update loop (not rendering), so a word spawned
//    on the same tick as the hit holds its impact frame for free.
// 2. All letter jitter is seeded per word (mulberry32) and re-derived each
//    draw, so the hand-lettering is crooked but perfectly stable.

import { TAU, PALETTE, PRINT, clamp, lerp, easeOutCubic, mulberry32 } from './ink.js';

const WORD_FONT = "'Chalkboard SE','Comic Sans MS',sans-serif";

const words = [];

export function spawnWord(x, y, text, opts = {}) {
  words.push({
    x, y, text,
    t: 0,
    life: opts.life ?? (opts.big ? 0.55 : 0.4),
    big: opts.big || false,
    color: opts.color || PALETTE.cream,
    seed: (Math.random() * 0xffffffff) >>> 0,
    rot: (Math.random() - 0.5) * 0.22,
  });
}

export function updateWords(dt) {
  for (let i = words.length - 1; i >= 0; i--) {
    words[i].t += dt;
    if (words[i].t >= words[i].life) words.splice(i, 1);
  }
}

export function clearWords() { words.length = 0; }

// The starburst behind a big word: two rings of seeded spike points,
// stretched wider than tall to hug the lettering.
function starburst(ctx, rnd, textW, size) {
  const spikes = 11;
  const radX = textW * 0.64 + 6;
  const radY = size * 1.32;
  const rot = rnd() * TAU;
  const path = () => {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = rot + (i / (spikes * 2)) * TAU;
      const f = (i % 2 === 0 ? 1 : 0.52) * (0.86 + rnd() * 0.24);
      const px = Math.cos(a) * radX * f;
      const py = Math.sin(a) * radY * f;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
  };
  path();
  ctx.fillStyle = PALETTE.cream;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // Print mode: the burst's color plate drifts like everything else.
  if (PRINT.on) {
    ctx.save();
    ctx.translate(PRINT.mx, PRINT.my);
    path();
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fill();
  }
}

export function drawWords(ctx) {
  for (const w of words) {
    const p = w.t / w.life;
    // Impact frame first: born oversized, settles to rest scale fast.
    const scale = lerp(1.18, 1, easeOutCubic(clamp(w.t / 0.12, 0, 1)));
    const alpha = p > 0.72 ? 1 - (p - 0.72) / 0.28 : 1;
    const rise = w.big ? 0 : p * 12;
    const size = w.big ? 27 : 15;
    const rnd = mulberry32(w.seed);   // same jitter stream every frame

    ctx.save();
    ctx.translate(w.x, w.y - rise);
    ctx.rotate(w.rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    ctx.font = `bold ${size}px ${WORD_FONT}`;
    const widths = [...w.text].map(ch => ctx.measureText(ch).width);
    const gap = w.big ? 1.5 : 0.8;
    const textW = widths.reduce((a, b) => a + b, 0) + gap * (w.text.length - 1);

    if (w.big) starburst(ctx, rnd, textW, size);

    // Hand lettering: each glyph gets its own seeded tilt and drop.
    let x = -textW / 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (let i = 0; i < w.text.length; i++) {
      const jr = (rnd() - 0.5) * 0.16;
      const jy = (rnd() - 0.5) * (w.big ? 4 : 2.4);
      ctx.save();
      ctx.translate(x + widths[i] / 2, jy);
      ctx.rotate(jr);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = w.big ? 5 : 3.5;
      ctx.strokeText(w.text[i], -widths[i] / 2, 0);
      ctx.fillStyle = w.big ? PALETTE.hotOrange : w.color;
      ctx.fillText(w.text[i], -widths[i] / 2, 0);
      ctx.restore();
      x += widths[i] + gap;
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
}
