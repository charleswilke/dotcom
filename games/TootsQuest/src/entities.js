// Entities — every character is a shape grammar animated by math.
// No frames anywhere: walk cycles, telegraphs, and damage states are all
// parameters driving the same draw code.

import {
  TAU, PALETTE, PRINT, lerp, clamp, dist, easeOutCubic, capsule, curvedCapsule,
  inkCircle, inkEllipse, inkShape,
} from './ink.js';
import { moveCircle, circleBlocked } from './terrain.js';
import { spawnWord } from './fx.js';
import { setFlag } from './state.js';

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------

export const particles = [];

export function spawnParticle(p) {
  particles.push({
    vx: 0, vy: 0, g: 0, size: 2, color: PALETTE.cream, add: false, ...p,
    max: p.life,
  });
}

export function burst(x, y, n, opts = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const sp = (opts.speed || 90) * (0.4 + Math.random() * 0.8);
    spawnParticle({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp * 0.7,
      g: opts.g ?? 160,
      life: (opts.life || 0.5) * (0.6 + Math.random() * 0.7),
      size: (opts.size || 2.5) * (0.6 + Math.random() * 0.8),
      color: Array.isArray(opts.color)
        ? opts.color[Math.floor(Math.random() * opts.color.length)]
        : (opts.color || PALETTE.cream),
      add: opts.add || false,
    });
  }
}

export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.97;
  }
}

export function drawParticles(ctx) {
  for (const p of particles) {
    const a = clamp(p.life / p.max, 0, 1);
    ctx.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, TAU);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

// ---------------------------------------------------------------------------
// Player — Toots himself. Warm orange, headphones on, sword in hand.
// ---------------------------------------------------------------------------

const WALK_SPEED = 175;
const DASH_SPEED = 470;
const COMBO = [
  { dur: 0.30, range: 46, sweep: 1.7, width: 4.5 },
  { dur: 0.30, range: 46, sweep: 1.7, width: 4.5 },
  { dur: 0.46, range: 54, sweep: 2.5, width: 6 },
];

// A swing is not a wiper blade: it pulls back, whips through, and settles.
// p = attack time / duration; returns arc progress (0=start angle, 1=end;
// briefly negative during the windup as the blade cocks behind the start).
const SWING_WIND = 0.16;    // anticipation ends
const SWING_STRIKE = 0.52;  // whip ends; follow-through after

function swingProgress(p) {
  if (p < SWING_WIND) return -0.10 * easeOutCubic(p / SWING_WIND);
  if (p < SWING_STRIKE) {
    const u = (p - SWING_WIND) / (SWING_STRIKE - SWING_WIND);
    return -0.10 + 1.10 * (1 - Math.pow(1 - u, 4));   // violent, then settling
  }
  return 1;
}

// The whole slash lives in the ground plane of the 3/4 view: the same
// vertical squash the shadows use. An unflattened arc pivots like a wheel
// and reads as an uppercut; a flattened one reads as a cut *across*.
const SWING_FLAT = 0.55;

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.face = 0;
    this.r = 9;
    this.moving = false;
    this.walkPhase = 0;
    this.idleT = 0;
    this.attack = null;          // {combo, t, dir, sign, hitSet}
    this.attackQueued = false;
    this.dashT = 0;
    this.dashDir = 0;
    this.invuln = 0;
    this.kvx = 0; this.kvy = 0;  // knockback
    this.ghosts = [];            // dash afterimages
    this.ghostClock = 0;
  }

  bufferAttack() { this.attackQueued = true; }

  tryDash() {
    if (this.dashT > 0 || this.attack) return;
    this.dashT = 0.16;
    this.dashDir = this.face;
    this.invuln = Math.max(this.invuln, 0.28);
  }

  hurt(dx, dy, game) {
    if (this.invuln > 0 || this.dashT > 0) return;
    const m = Math.hypot(dx, dy) || 1;
    this.kvx = (dx / m) * 320;
    this.kvy = (dy / m) * 320;
    this.invuln = 0.9;
    this.attack = null;
    game.shake(4, 0.18);
    game.hitstop(0.06);
    burst(this.x, this.y - 12, 10, { color: [PALETTE.hotOrange, PALETTE.cream], speed: 130 });
    spawnWord(this.x, this.y - 38, 'OOF!', { color: PALETTE.hotOrange });
  }

  update(dt, input, game) {
    this.invuln = Math.max(0, this.invuln - dt);
    this.ghostClock -= dt;
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      this.ghosts[i].t -= dt;
      if (this.ghosts[i].t <= 0) this.ghosts.splice(i, 1);
    }

    // Knockback decays on top of everything else.
    this.kvx *= Math.pow(0.0001, dt);
    this.kvy *= Math.pow(0.0001, dt);
    moveCircle(this, this.kvx * dt, this.kvy * dt, this.r);

    if (this.dashT > 0) {
      this.dashT -= dt;
      moveCircle(this, Math.cos(this.dashDir) * DASH_SPEED * dt,
        Math.sin(this.dashDir) * DASH_SPEED * dt, this.r);
      if (this.ghostClock <= 0) {
        this.ghosts.push({ x: this.x, y: this.y, face: this.face, t: 0.22 });
        this.ghostClock = 0.028;
        // Dust kicked out behind the dash (render-style pass, session 4).
        spawnParticle({
          x: this.x - Math.cos(this.dashDir) * 9 + (Math.random() - 0.5) * 5,
          y: this.y + (Math.random() - 0.5) * 3,
          vx: -Math.cos(this.dashDir) * 24,
          vy: -8 - Math.random() * 10,
          g: -26, life: 0.4, size: 2.6, color: 'rgba(248,233,210,0.75)',
        });
      }
      this.moving = true;
      this.walkPhase += dt * 18;
      this.idleT = 0;
      return;
    }

    if (this.attack) {
      const c = COMBO[this.attack.combo];
      this.attack.t += dt;
      // Forward push synced to the whip, not the windup — the step and the
      // cut land together.
      const pp = this.attack.t / c.dur;
      const push = (pp >= SWING_WIND && pp < SWING_WIND + 0.16) ? 130 : 0;
      moveCircle(this, Math.cos(this.attack.dir) * push * dt,
        Math.sin(this.attack.dir) * push * dt, this.r);
      if (this.attackQueued && this.attack.t > c.dur * 0.55 && this.attack.combo < 2) {
        const next = this.attack.combo + 1;
        this.attack = {
          combo: next, t: 0, dir: this.face,
          sign: -this.attack.sign, hitSet: new Set(),
        };
        this.attackQueued = false;
      } else if (this.attack.t >= c.dur) {
        this.attack = null;
        this.attackQueued = false;
      }
      this.moving = false;
      return;
    }

    let mx = (input.has('KeyD') || input.has('ArrowRight') ? 1 : 0) -
             (input.has('KeyA') || input.has('ArrowLeft') ? 1 : 0);
    let my = (input.has('KeyS') || input.has('ArrowDown') ? 1 : 0) -
             (input.has('KeyW') || input.has('ArrowUp') ? 1 : 0);
    const m = Math.hypot(mx, my);
    this.moving = m > 0;
    if (this.moving) {
      mx /= m; my /= m;
      this.face = Math.atan2(my, mx);
      moveCircle(this, mx * WALK_SPEED * dt, my * WALK_SPEED * dt, this.r);
      this.walkPhase += dt * 11;
      // A footfall puff each time the stride sine crosses zero.
      const stride = Math.sin(this.walkPhase);
      if (this._lastStride !== undefined && Math.sign(stride) !== Math.sign(this._lastStride)) {
        spawnParticle({
          x: this.x - mx * 6 + (Math.random() - 0.5) * 4,
          y: this.y + 1,
          vx: -mx * 10, vy: -10 - Math.random() * 6,
          g: -22, life: 0.28, size: 1.8, color: 'rgba(248,233,210,0.55)',
        });
      }
      this._lastStride = stride;
      this.idleT = 0;
    } else {
      this.idleT += dt;
    }

    if (this.attackQueued) {
      this.attackQueued = false;
      this.attack = { combo: 0, t: 0, dir: this.face, sign: 1, hitSet: new Set() };
    }
  }

  // Current swing state for combat checks: {dir, range, progress} or null.
  // Active only while the blade is actually whipping (not windup/recovery).
  swing() {
    if (!this.attack) return null;
    const c = COMBO[this.attack.combo];
    const p = this.attack.t / c.dur;
    if (p < SWING_WIND || p > SWING_STRIKE + 0.06) return null;
    return { dir: this.attack.dir, range: c.range, combo: this.attack.combo, hitSet: this.attack.hitSet };
  }

  draw(ctx, t) {
    // Dash afterimages, neon-tinted, roughly the new silhouette.
    for (const g of this.ghosts) {
      ctx.globalAlpha = (g.t / 0.22) * 0.3;
      capsule(ctx, g.x, g.y - 8, g.x, g.y - 19, 14, PALETTE.neon, null);
      inkCircle(ctx, g.x, g.y - 28.5, 9, PALETTE.neon, null);
      ctx.globalAlpha = 1;
    }

    // Invulnerability flicker.
    if (this.invuln > 0 && Math.floor(t * 18) % 2 === 0 && this.dashT <= 0) return;

    const bob = this.moving
      ? Math.abs(Math.sin(this.walkPhase)) * 2.4
      : Math.sin(t * 2.1) * 0.8;
    const fx = Math.cos(this.face), fy = Math.sin(this.face);

    inkEllipse(ctx, this.x, this.y + 1, 12, 5, 0, 'rgba(34,26,86,0.22)', null);

    // Feet alternate along the movement direction.
    const step = this.moving ? Math.sin(this.walkPhase) * 4.5 : 0;
    inkEllipse(ctx, this.x - 5 + fx * step, this.y - 2 + fy * step * 0.5, 4, 3, 0, PALETTE.ink, null);
    inkEllipse(ctx, this.x + 5 - fx * step, this.y - 2 - fy * step * 0.5, 4, 3, 0, PALETTE.ink, null);

    ctx.save();
    ctx.translate(this.x, this.y - bob);
    const lean = this.moving ? 0.09 : 0;
    // Body English: cock back during the windup, throw the torso through
    // the whip, settle during follow-through. This is most of the "swing".
    let twist = 0;
    if (this.attack) {
      const c = COMBO[this.attack.combo];
      const ap = clamp(this.attack.t / c.dur, 0, 1);
      const s = this.attack.sign;
      if (ap < SWING_WIND) {
        twist = -0.18 * s * easeOutCubic(ap / SWING_WIND);
      } else if (ap < SWING_STRIKE) {
        twist = lerp(-0.18, 0.26, (ap - SWING_WIND) / (SWING_STRIKE - SWING_WIND)) * s;
      } else {
        twist = 0.26 * s * (1 - (ap - SWING_STRIKE) / (1 - SWING_STRIKE));
      }
    }
    ctx.rotate(fx * lean + twist);

    // Sword on back when not swinging: neon blade, cream grip. Neon means
    // magic/interactable in both worlds — the blade is the player's magic.
    if (!this.attack) {
      capsule(ctx, -7.5, -27, 4, -14, 3.6, PALETTE.neon, PALETTE.ink, 1.8);
      capsule(ctx, -11, -30.5, -8, -27.5, 3, PALETTE.cream, PALETTE.ink, 1.6);
    }

    // --- The cover-art Toots (redesigned session 4): an ink-black figure
    // in an orange poncho with a ragged hem, big cream eyes, chunky cream
    // headphones. The black IS the ink plate, so in print mode the figure
    // stays registered while his poncho and eye-whites drift (gotcha 6,
    // working for us on purpose).
    const breathe = this.moving ? 0 : Math.sin(t * 2.1) * 0.4;
    const neckY = -22 - breathe;
    const hemSway = this.moving ? Math.sin(this.walkPhase * 0.5) * 1.3 : Math.sin(t * 1.3) * 0.5;

    // Arm nubs peeking from under the poncho, swinging opposite the feet.
    const armSwing = this.moving ? Math.sin(this.walkPhase) * 2.5 : 0;
    inkCircle(ctx, -10, -11 + armSwing, 2.6, PALETTE.ink, null);
    inkCircle(ctx, 10, -11 - armSwing, 2.6, PALETTE.ink, null);

    // Poncho: flares from the neck, hem torn into notches that sway.
    const poncho = (c) => {
      c.beginPath();
      c.moveTo(-4.5, neckY);
      c.quadraticCurveTo(-11.5, neckY + 5, -10.5, -8.5);
      c.lineTo(-9.5 + hemSway * 0.4, -5.5);
      c.lineTo(-5.5 + hemSway * 0.6, -7.8);
      c.lineTo(-2 + hemSway * 0.8, -5);
      c.lineTo(2 + hemSway * 0.8, -7.5);
      c.lineTo(5.5 + hemSway * 0.6, -5.2);
      c.lineTo(9.5 + hemSway * 0.4, -7);
      c.lineTo(10.5, -8.5);
      c.quadraticCurveTo(11.5, neckY + 5, 4.5, neckY);
      c.quadraticCurveTo(0, neckY - 2.5, -4.5, neckY);
      c.closePath();
    };
    inkShape(ctx, poncho, PALETTE.orange, PALETTE.ink, 2.4);
    // Chest stitch (the Haus of Toots charm), cream on orange.
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-1.6, neckY + 5); ctx.lineTo(1.6, neckY + 8.2);
    ctx.moveTo(1.6, neckY + 5); ctx.lineTo(-1.6, neckY + 8.2);
    ctx.stroke();

    // Ink-black head. The tuft draws AFTER the headphones so it pokes
    // over the band, like the cover.
    const hy = neckY - 6.5;
    inkCircle(ctx, 0, hy, 10, PALETTE.ink, null);

    // Big cover-art eyes: cream whites nearly half the face, tiny ink
    // pupils chasing the facing direction.
    const ex = fx * 1.6, ey = fy * 1.1;
    inkCircle(ctx, -3.8 + ex * 0.5, hy - 0.5 + ey * 0.5, 4.2, PALETTE.cream, null);
    inkCircle(ctx, 3.8 + ex * 0.5, hy - 0.5 + ey * 0.5, 4.2, PALETTE.cream, null);
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath(); ctx.arc(-3.8 + ex, hy - 0.5 + ey, 1.7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(3.8 + ex, hy - 0.5 + ey, 1.7, 0, TAU); ctx.fill();

    // Chunky cream headphones — the signature, now sized like the cover.
    ctx.lineCap = 'round';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, hy, 11.5, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 4.4;
    ctx.beginPath();
    ctx.arc(0, hy, 11.5, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    inkCircle(ctx, -11, hy + 2.5, 4.2, PALETTE.cream, PALETTE.ink, 2.2);
    inkCircle(ctx, 11, hy + 2.5, 4.2, PALETTE.cream, PALETTE.ink, 2.2);
    ctx.fillStyle = PALETTE.neon;
    ctx.beginPath(); ctx.arc(-11, hy + 2.5, 1.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(11, hy + 2.5, 1.5, 0, TAU); ctx.fill();

    // Hair tuft poking over the band.
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2.5, hy - 11); ctx.lineTo(-4, hy - 16);
    ctx.moveTo(0.8, hy - 12); ctx.lineTo(0.8, hy - 17);
    ctx.moveTo(3.8, hy - 11); ctx.lineTo(5.3, hy - 15.5);
    ctx.stroke();

    ctx.restore();

    // Active swing: windup → whip (crescent smear + ghost blades) → settle.
    if (this.attack) {
      const c = COMBO[this.attack.combo];
      const sign = this.attack.sign;
      const p = clamp(this.attack.t / c.dur, 0, 1);
      const prog = swingProgress(p);
      const start = this.attack.dir - c.sweep * sign;
      const total = 2 * c.sweep * sign;
      const cur = start + total * prog;
      const cx = this.x, cy = this.y - 12;
      const whipping = p >= SWING_WIND && p <= SWING_STRIKE + 0.14;

      if (whipping) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, SWING_FLAT);   // the slash lives in the ground plane

        // Crescent smear from a trailing angle to the blade.
        const a0 = start + total * Math.max(-0.1, prog - 0.55);
        const fade = p > SWING_STRIKE ? Math.max(0, 1 - (p - SWING_STRIKE) / 0.14) : 1;
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(0, 0, c.range * 0.3, 0, 0, c.range);
        grad.addColorStop(0, 'rgba(0,247,194,0)');
        grad.addColorStop(0.7, `rgba(0,247,194,${0.35 * fade})`);
        grad.addColorStop(1, `rgba(248,233,210,${0.45 * fade})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, c.range, a0, cur, sign < 0);
        ctx.arc(0, 0, c.range * 0.45, cur, a0, sign > 0);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Sunday Ink: comic action lines chasing the blade.
        if (PRINT.on) {
          ctx.strokeStyle = `rgba(34,26,86,${0.55 * fade})`;
          ctx.lineWidth = 1.7;
          for (const rr of [0.76, 0.93]) {
            ctx.beginPath();
            ctx.arc(0, 0, c.range * rr, cur - sign * 0.85, cur - sign * 0.28, sign < 0);
            ctx.stroke();
          }
        }
        ctx.restore();

        // Ghost blades — the motion smear of the blade itself.
        for (const [d, a] of [[0.30, 0.30], [0.58, 0.14]]) {
          const ga = cur - sign * d;
          ctx.globalAlpha = a * fade;
          capsule(ctx,
            cx + Math.cos(ga) * 12, cy + Math.sin(ga) * 12 * SWING_FLAT,
            cx + Math.cos(ga) * c.range * 0.92, cy + Math.sin(ga) * c.range * 0.92 * SWING_FLAT,
            c.width, PALETTE.neon, null);
          ctx.globalAlpha = 1;
        }
      }

      // The blade, tip tracing the flattened arc — neon, like the cover.
      capsule(ctx,
        cx + Math.cos(cur) * 10, cy + Math.sin(cur) * 10 * SWING_FLAT,
        cx + Math.cos(cur) * c.range * 0.95, cy + Math.sin(cur) * c.range * 0.95 * SWING_FLAT,
        c.width, PALETTE.neon, PALETTE.ink, 1.8);
    }
  }
}

// ---------------------------------------------------------------------------
// Dog — one grammar, any dog (canon). Two personalities ride the params:
// behavior 'heel' (Doc: sticks behind Toots, sits early and often, scowls)
// and 'scout' (Astro: orbits wide, wanders off to investigate, finds the
// secret and points it out with the "!"). Session 4 migrated secret-finding
// from Doc to Astro per the corrected dog canon (PRD §2.5) — the real Doc
// points at food and naps, not treasure.
// ---------------------------------------------------------------------------

export class Dog {
  constructor(x, y, params = {}) {
    this.x = x; this.y = y;
    this.r = 7;
    this.face = 0;
    this.trot = 0;
    this.moving = false;
    this.sitting = false;
    this.sitT = 0;
    this.pointing = false;
    this.sniffing = false;
    this.target = null;        // scout wander target
    this.wanderClock = 0;
    this.p = {
      body: PALETTE.dogBody, chest: PALETTE.dogChest, collar: null,
      earLen: 9, tailFreq: 9, size: 1,
      mood: 'happy',           // 'happy' | 'grumpy' — the face
      behavior: 'heel',        // 'heel' | 'scout' — the brain
      // Body type dials (the real dogs differ): lift raises the barrel off
      // the ground on longer legs (poodle), bodyW is barrel thickness,
      // legW leg thickness, topknot adds the poodle head-pouf, bean sags
      // the midline into the shih tzu curved-bean silhouette (belly rounds
      // down, chest and rump ride up).
      lift: 0, bodyW: 12, legW: 3.5, topknot: false, bean: 0,
      ...params,
    };
  }

  // Move toward a point with wall-shove detection. When a dog has been
  // pushing a wall for ~half a second he swerves perpendicular for a beat
  // (whichever side is open) — no pathfinding, just wiggling, and chained
  // swerves walk him around boulder corners. Returns true on a stuck event.
  seek(tx, ty, sp, dt) {
    if (this.detourT > 0) {
      this.detourT -= dt;
      tx = this.detour.x;
      ty = this.detour.y;
    }
    const a = Math.atan2(ty - this.y, tx - this.x);
    const px = this.x, py = this.y;
    moveCircle(this, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt, this.r);
    this.face = a;
    this.trot += dt * (sp / 15);
    this.moving = true;
    this.sitting = false;
    this.sitT = 0;
    const moved = dist(px, py, this.x, this.y);
    this.stuckT = moved < sp * dt * 0.3 ? (this.stuckT || 0) + dt : 0;
    if (this.stuckT > 0.45) {
      this.stuckT = 0;
      for (const da of [a + Math.PI / 2, a - Math.PI / 2]) {
        const wx = this.x + Math.cos(da) * 55;
        const wy = this.y + Math.sin(da) * 55;
        if (!circleBlocked(wx, wy, this.r)) {
          this.detour = { x: wx, y: wy };
          this.detourT = 0.55;
          break;
        }
      }
      return true;
    }
    return false;
  }

  update(dt, player, secret) {
    if (this.p.behavior === 'scout') return this.updateScout(dt, player, secret);

    // Heel: stay behind Toots; sit as soon as he settles.
    const behind = 32;
    const tx = player.x - Math.cos(player.face) * behind;
    const ty = player.y - Math.sin(player.face) * behind * 0.6;
    const d = dist(this.x, this.y, tx, ty);

    if (d > 26) {
      this.seek(tx, ty, clamp((d - 20) * 4, 60, 230), dt);
    } else {
      this.moving = false;
      this.sitT += dt;
      // Doc sits sooner than old-Doc did — resting is his whole thing.
      this.sitting = player.idleT > 0.9 && this.sitT > 0.6;
    }
  }

  // Scout: orbit Toots loosely, pick things to go look at, and if the
  // room's secret is anywhere near, beeline to it, sniff, and point.
  // No pathfinding — instead, a dog-honest unstick: if he's been shoving
  // into a wall for half a second he loses interest for a few seconds and
  // goes back to orbiting (the hearth secret sits behind boulders, which
  // pinned him permanently before this).
  updateScout(dt, player, secret) {
    this.sniffing = false;
    this.pointing = false;
    this.secretCooldown = Math.max(0, (this.secretCooldown || 0) - dt);
    const dp = dist(this.x, this.y, player.x, player.y);
    let tx, ty, arrive = 14;

    const nearSecret = secret && this.secretCooldown <= 0 &&
      dist(this.x, this.y, secret.x, secret.y) < 170 && dp < 260;
    if (nearSecret) {
      // Sniff from whichever side he's coming from.
      const sa = Math.atan2(this.y - secret.y, this.x - secret.x);
      tx = secret.x + Math.cos(sa) * 16;
      ty = secret.y + Math.sin(sa) * 10;
      arrive = 5;
      if (dist(this.x, this.y, secret.x, secret.y) < 30) {
        this.face = Math.atan2(secret.y - this.y, secret.x - this.x);
        this.sniffing = true;
        this.pointing = true;
      }
    } else if (dp > 175) {
      tx = player.x; ty = player.y;   // don't lose the pack
      this.target = null;
    } else {
      this.wanderClock -= dt;
      // Stop inventing new adventures once Toots has settled — otherwise
      // the wander clock re-targets every ~1.5s and Astro can never rest
      // long enough to sit.
      if ((this.wanderClock <= 0 && player.idleT < 2.5) || !this.target) {
        this.wanderClock = 1 + Math.random() * 1.6;
        const a = Math.random() * TAU;
        this.target = {
          x: player.x + Math.cos(a) * (50 + Math.random() * 70),
          y: player.y + Math.sin(a) * (35 + Math.random() * 45),
        };
      }
      tx = this.target.x; ty = this.target.y;
    }

    const d = dist(this.x, this.y, tx, ty);
    if (d > arrive && !this.sniffing) {
      const sp = clamp(dp > 175 ? 240 : d * 2.4, 70, 240);
      if (this.seek(tx, ty, sp, dt) && nearSecret) {
        // Shoved a wall on the way to the secret: lose interest for a few
        // seconds and go back to orbiting; he'll re-catch the scent from an
        // open angle later.
        this.secretCooldown = 4;
        this.target = null;
        this.wanderClock = 0;
      }
    } else {
      this.moving = false;
      this.sitT += dt;
      // Even the explorer flops down eventually — but it takes longer.
      this.sitting = !this.sniffing && player.idleT > 3 && this.sitT > 2;
    }
  }

  draw(ctx, t) {
    const p = this.p;
    const sx = Math.cos(this.face) >= 0 ? 1 : -1;
    // Doc's tail barely bothers; Astro's never stops.
    const wagAmp = this.sitting ? (p.mood === 'grumpy' ? 1 : 2.5) : 3.5;
    const wag = Math.sin(t * p.tailFreq) * wagAmp;
    const bob = this.moving ? Math.abs(Math.sin(this.trot)) * 1.6 : 0;

    inkEllipse(ctx, this.x, this.y + 1, 11, 4.5, 0, 'rgba(34,26,86,0.22)', null);

    ctx.save();
    ctx.translate(this.x, this.y - bob);
    ctx.scale(sx * p.size, p.size);

    const L = p.lift;              // barrel height off the ground
    const bw = p.bodyW;
    const lw = p.legW;

    if (this.sitting) {
      // Haunches down, chest up, tail sweeping the grass. A lanky dog sits
      // tall — the torso stretches with the lift; haunches stay grounded.
      capsule(ctx, -9, -7, -16 + wag, -3, 4, p.body, PALETTE.ink, 1.8);
      inkEllipse(ctx, -7, -7, 8 - L * 0.2, 7, 0, p.body, PALETTE.ink, 2.2);
      // Bean dogs sit with the chest puffed out on that curved front.
      if (p.bean) {
        curvedCapsule(ctx, -6, -8, 2 + p.bean * 0.4, -9.5, 4, -15 - L * 0.8, bw - 1, p.body, PALETTE.ink, 2.2);
      } else {
        capsule(ctx, -6, -8, 4, -15 - L * 0.8, bw - 1, p.body, PALETTE.ink, 2.2);
      }
      capsule(ctx, 2, -10 - L * 0.8, 2, -2, lw, p.body, PALETTE.ink, 1.8);
      capsule(ctx, 6, -10 - L * 0.8, 6, -2, lw, p.body, PALETTE.ink, 1.8);
      inkEllipse(ctx, 4, -12 - L * 0.5, 4, 5, 0, p.chest, null);
      this.drawScruff(ctx, -6, -19 - L * 0.7, 4, -19 - L * 0.7, t);
      this.drawHead(ctx, 7, -22 - L, t);
    } else {
      const l1 = this.moving ? Math.sin(this.trot) * 3 : 0;
      const l2 = this.moving ? Math.sin(this.trot + Math.PI) * 3 : 0;
      // Nose-to-the-ground sniffing drops the whole front half.
      const sniff = this.sniffing ? 3 + Math.sin(t * 9) * 1.5 : 0;
      const by = -10 - L;          // barrel centerline
      capsule(ctx, -11, by + 1, -17 + wag, by - 4, 4, p.body, PALETTE.ink, 1.8);
      capsule(ctx, -8 + l1, by + 2, -8 + l1 * 1.4, -1, lw, p.body, PALETTE.ink, 1.8);
      capsule(ctx, 6 + l2, by + 2, 6 + l2 * 1.4, -1, lw, p.body, PALETTE.ink, 1.8);
      // The barrel: straight, or the shih tzu bean — rump and chest up a
      // touch, belly sagging through the middle.
      if (p.bean) {
        curvedCapsule(ctx,
          -10, by - p.bean * 0.5,
          -1.5, by + p.bean,
          7, by - p.bean * 0.4 + sniff * 0.4,
          bw, p.body, PALETTE.ink, 2.2);
      } else {
        capsule(ctx, -10, by, 7, by + sniff * 0.4, bw, p.body, PALETTE.ink, 2.2);
      }
      capsule(ctx, -8 + l2, by + 2, -8 + l2 * 1.4, -1, lw, p.body, PALETTE.ink, 1.8);
      capsule(ctx, 6 + l1, by + 2, 6 + l1 * 1.4, -1, lw, p.body, PALETTE.ink, 1.8);
      inkEllipse(ctx, 6, by + 2, 4, 4.5, 0, p.chest, null);
      // Scruff rides the back — which dips with the bean.
      this.drawScruff(ctx, -8, by - bw / 2 + p.bean * 0.5, 4, by - bw / 2 + p.bean * 0.5, t);
      // A leggy dog carries its head high; a bean dog's chest-up adds a bit.
      this.drawHead(ctx, 12, -16 - L * 1.3 - p.bean * 0.35 + sniff, t);
    }

    ctx.restore();

    // The explorer's "!" when he's found something worth digging at.
    if (this.pointing && Math.sin(t * 2.5) > 0.3) {
      ctx.fillStyle = PALETTE.neon;
      ctx.font = 'bold 11px monospace';
      ctx.fillText('!', this.x - 2, this.y - 34);
    }
  }

  // A few fur ticks along the back — both real dogs are scruffy.
  drawScruff(ctx, x0, y0, x1, y1, t) {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const u = i / 2;
      const x = x0 + (x1 - x0) * u;
      const y = y0 + (y1 - y0) * u;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 1.5, y - 2.5 - Math.sin(t * 2 + i) * 0.4);
      ctx.stroke();
    }
  }

  drawHead(ctx, hx, hy, t) {
    const p = this.p;
    const earSwing = this.moving ? Math.sin(this.trot) * 1.6 : Math.sin(t * 1.4) * 0.6;
    // The poodle topknot goes on first so the head overlaps its base.
    if (p.topknot) {
      inkCircle(ctx, hx - 1, hy - 8, 3.6, p.body, PALETTE.ink, 1.8);
    }
    inkCircle(ctx, hx, hy, 7, p.body, PALETTE.ink, 2.2);
    // Floppy ears.
    capsule(ctx, hx - 3, hy - 6, hx - 6 - earSwing, hy - 6 + p.earLen, 4.5, p.body, PALETTE.ink, 1.8);
    capsule(ctx, hx + 3, hy - 6, hx + 1 - earSwing, hy - 6 + p.earLen * 0.8, 4, p.body, PALETTE.ink, 1.8);
    // Snout and nose.
    inkEllipse(ctx, hx + 6, hy + 2, 4.5, 3.2, 0, p.chest, PALETTE.ink, 1.6);
    inkCircle(ctx, hx + 8.5, hy + 1.5, 1.6, PALETTE.ink, null);
    // Collar peeking at the neck.
    if (p.collar) {
      capsule(ctx, hx - 6.5, hy + 5.5, hx - 2, hy + 6.5, 2.4, p.collar, null);
    }
    // The face is the personality.
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(hx + 1.5, hy - 1, 1.4, 0, TAU);
    ctx.fill();
    if (p.mood === 'grumpy') {
      // Doc: a furrowed brow slanting down at the world, and a dour little
      // downturn behind the snout.
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx - 1.5, hy - 4.5);
      ctx.lineTo(hx + 3.8, hy - 3);
      ctx.moveTo(hx + 7.5, hy + 4.4);
      ctx.lineTo(hx + 4.8, hy + 5.4);
      ctx.stroke();
    } else {
      // Astro: mouth open, tongue out, forever delighted.
      inkEllipse(ctx, hx + 4.6, hy + 4.8, 2.8, 2, 0.2, PALETTE.ink, null);
      inkEllipse(ctx, hx + 4.4, hy + 5.6, 1.6, 1.2, 0.2, PALETTE.hotOrange, null);
    }
  }
}

// ---------------------------------------------------------------------------
// Junk Mite — a scuttling knot of rusted salvage. Telegraphs by inflating.
// ---------------------------------------------------------------------------

export class Mite {
  constructor(x, y) {
    this.home = { x, y };
    this.reset();
  }

  reset() {
    this.x = this.home.x;
    this.y = this.home.y;
    this.r = 10;
    this.hp = 3;
    this.state = 'wander';
    this.face = Math.random() * TAU;
    this.stateT = 0;
    this.wanderDir = Math.random() * TAU;
    this.wanderClock = 0;
    this.scuttle = 0;
    this.flash = 0;
    this.kvx = 0; this.kvy = 0;
    this.dead = false;
    this.respawnT = 0;
  }

  hurt(dx, dy, game) {
    const m = Math.hypot(dx, dy) || 1;
    this.kvx = (dx / m) * 260;
    this.kvy = (dy / m) * 260;
    this.flash = 0.14;
    this.hp--;
    burst(this.x, this.y - 6, 8, {
      color: [PALETTE.rust, PALETTE.cream, PALETTE.neon], speed: 120, life: 0.4,
    });
    if (this.hp <= 0) {
      this.dead = true;
      this.respawnT = 6;
      this.state = 'wander';
      setFlag('slain_mite');   // NPCs notice (PRD §2.5)
      burst(this.x, this.y - 6, 18, {
        color: [PALETTE.rust, PALETTE.rustDark, PALETTE.hotOrange, PALETTE.cream],
        speed: 170, life: 0.6, size: 3,
      });
      game.shake(2.5, 0.12);
    }
  }

  update(dt, player, game) {
    if (this.dead) {
      this.respawnT -= dt;
      if (this.respawnT <= 0) {
        this.reset();
        burst(this.x, this.y - 6, 10, { color: PALETTE.rust, speed: 80, life: 0.4 });
      }
      return;
    }

    this.flash = Math.max(0, this.flash - dt);
    this.kvx *= Math.pow(0.0001, dt);
    this.kvy *= Math.pow(0.0001, dt);
    moveCircle(this, this.kvx * dt, this.kvy * dt, this.r);
    this.stateT -= dt;

    const dp = dist(this.x, this.y, player.x, player.y);

    if (this.state === 'wander') {
      this.wanderClock -= dt;
      if (this.wanderClock <= 0) {
        this.wanderClock = 0.8 + Math.random() * 1.4;
        const home = Math.atan2(this.home.y - this.y, this.home.x - this.x);
        this.wanderDir = dist(this.x, this.y, this.home.x, this.home.y) > 90
          ? home
          : Math.random() * TAU;
      }
      moveCircle(this, Math.cos(this.wanderDir) * 28 * dt, Math.sin(this.wanderDir) * 28 * dt, this.r);
      this.face = this.wanderDir;
      this.scuttle += dt * 7;
      if (dp < 135 && this.stateT <= 0) {
        this.state = 'telegraph';
        this.stateT = 0.42;
        this.face = Math.atan2(player.y - this.y, player.x - this.x);
      }
    } else if (this.state === 'telegraph') {
      this.face = Math.atan2(player.y - this.y, player.x - this.x);
      if (this.stateT <= 0) {
        this.state = 'lunge';
        this.stateT = 0.4;
        this.lungeDir = this.face;
      }
    } else if (this.state === 'lunge') {
      const sp = 250 * clamp(this.stateT / 0.4, 0.2, 1);
      moveCircle(this, Math.cos(this.lungeDir) * sp * dt, Math.sin(this.lungeDir) * sp * dt, this.r);
      this.scuttle += dt * 22;
      if (dp < this.r + player.r + 4) {
        player.hurt(player.x - this.x, player.y - this.y, game);
        this.kvx = -Math.cos(this.lungeDir) * 180;
        this.kvy = -Math.sin(this.lungeDir) * 180;
        this.state = 'wander';
        this.stateT = 1.1;
      } else if (this.stateT <= 0) {
        this.state = 'wander';
        this.stateT = 0.9;
      }
    }
  }

  draw(ctx, t) {
    if (this.dead) return;
    const tele = this.state === 'telegraph';
    const teleP = tele ? 1 - this.stateT / 0.42 : 0;
    const inflate = tele ? 1 + teleP * 0.3 : 1;
    const shiver = tele ? Math.sin(t * 60) * 1.2 * teleP : 0;
    const fx = Math.cos(this.face), fy = Math.sin(this.face);

    inkEllipse(ctx, this.x, this.y + 1, 10, 4, 0, 'rgba(34,26,86,0.22)', null);

    ctx.save();
    ctx.translate(this.x + shiver - (tele ? fx * teleP * 4 : 0), this.y - (tele ? fy * teleP * 2 : 0));
    ctx.scale(inflate, inflate);

    // Six scuttling legs.
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1;
      const k = i % 3;
      const lift = Math.sin(this.scuttle + i * 1.1) * 2;
      ctx.beginPath();
      ctx.moveTo(side * 6, -6 + k * 2.5);
      ctx.lineTo(side * 12, -2 + k * 2.5 + lift);
      ctx.stroke();
    }

    // Rusted dome with plate seams and a rivet.
    const body = this.flash > 0 ? PALETTE.cream : PALETTE.rust;
    inkEllipse(ctx, 0, -7, 10, 8, 0, body, PALETTE.ink, 2.4);
    if (this.flash <= 0) {
      ctx.strokeStyle = PALETTE.rustDark;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -4, 8, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      inkCircle(ctx, -2, -10, 1.4, PALETTE.rustDark, null);
    }

    // Eyes go hot when it means business.
    const eye = tele || this.state === 'lunge' ? PALETTE.hotOrange : PALETTE.cream;
    ctx.fillStyle = eye;
    ctx.beginPath(); ctx.arc(fx * 5 - 2.6, -8 + fy * 2, 1.7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(fx * 5 + 2.6, -8 + fy * 2, 1.7, 0, TAU); ctx.fill();

    ctx.restore();
  }
}
