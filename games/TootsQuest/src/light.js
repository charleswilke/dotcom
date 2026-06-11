// Painted light — day/night tinting plus a darkness-first lighting pass.
// Darkness fills a layer, then visibility is punched out with
// destination-out radial gradients. This same pass, tuned harder, becomes
// the Archive's phosphor look.

import { lerp, TAU } from './ink.js';

// Keyframes across one day (t in 0..1, 0 = midnight).
// tint: [r, g, b, alpha] multiplied over the scene. dark: darkness layer strength.
const STOPS = [
  { t: 0.00, tint: [40, 32, 110, 0.42], dark: 0.80 },
  { t: 0.22, tint: [150, 96, 150, 0.28], dark: 0.42 },
  { t: 0.32, tint: [255, 218, 160, 0.10], dark: 0.00 },
  { t: 0.50, tint: [255, 246, 225, 0.04], dark: 0.00 },
  { t: 0.68, tint: [255, 172, 92, 0.16], dark: 0.00 },
  { t: 0.80, tint: [165, 80, 130, 0.30], dark: 0.32 },
  { t: 0.90, tint: [40, 32, 110, 0.42], dark: 0.76 },
  { t: 1.00, tint: [40, 32, 110, 0.42], dark: 0.80 },
];

export function skyState(t01) {
  const t = ((t01 % 1) + 1) % 1;
  let a = STOPS[0], b = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (t >= STOPS[i].t && t <= STOPS[i + 1].t) {
      a = STOPS[i];
      b = STOPS[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const f = (t - a.t) / span;
  return {
    tint: [
      lerp(a.tint[0], b.tint[0], f),
      lerp(a.tint[1], b.tint[1], f),
      lerp(a.tint[2], b.tint[2], f),
      lerp(a.tint[3], b.tint[3], f),
    ],
    dark: lerp(a.dark, b.dark, f),
  };
}

export function timeLabel(t01) {
  const t = ((t01 % 1) + 1) % 1;
  if (t < 0.20) return 'Night';
  if (t < 0.30) return 'Dawn';
  if (t < 0.62) return 'Day';
  if (t < 0.76) return 'Golden Hour';
  if (t < 0.86) return 'Dusk';
  return 'Night';
}

// lights: [{x, y, r, flicker}] — returns false when no darkness was drawn.
export function drawLighting(lctx, w, h, dark, lights, time) {
  lctx.clearRect(0, 0, w, h);
  if (dark <= 0.01) return false;
  lctx.fillStyle = `rgba(8, 8, 30, ${dark})`;
  lctx.fillRect(0, 0, w, h);
  lctx.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    const flick = l.flicker
      ? 1 + Math.sin(time * 11 + l.x) * 0.05 + Math.sin(time * 23 + l.y) * 0.04
      : 1;
    const r = l.r * flick;
    const grad = lctx.createRadialGradient(l.x, l.y, r * 0.15, l.x, l.y, r);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    lctx.fillStyle = grad;
    lctx.beginPath();
    lctx.arc(l.x, l.y, r, 0, TAU);
    lctx.fill();
  }
  lctx.globalCompositeOperation = 'source-over';
  return true;
}
