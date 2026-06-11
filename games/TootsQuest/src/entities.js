// Entities — every character is a shape grammar animated by math.
// No frames anywhere: walk cycles, telegraphs, and damage states are all
// parameters driving the same draw code.

import {
  TAU, PALETTE, lerp, clamp, dist, easeOutCubic, capsule, inkCircle, inkEllipse,
} from './ink.js';
import { moveCircle, circleBlocked } from './terrain.js';

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
      }
      this.moving = true;
      this.walkPhase += dt * 18;
      this.idleT = 0;
      return;
    }

    if (this.attack) {
      const c = COMBO[this.attack.combo];
      this.attack.t += dt;
      // Small forward push at the start of each swing.
      const push = this.attack.t < 0.12 ? 90 : 0;
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
  swing() {
    if (!this.attack) return null;
    const c = COMBO[this.attack.combo];
    const p = this.attack.t / c.dur;
    if (p < 0.1 || p > 0.62) return null;
    return { dir: this.attack.dir, range: c.range, combo: this.attack.combo, hitSet: this.attack.hitSet };
  }

  draw(ctx, t) {
    // Dash afterimages, neon-tinted.
    for (const g of this.ghosts) {
      ctx.globalAlpha = (g.t / 0.22) * 0.3;
      capsule(ctx, g.x, g.y - 9, g.x, g.y - 20, 13, PALETTE.neon, null);
      inkCircle(ctx, g.x, g.y - 27, 8, PALETTE.neon, null);
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
    ctx.rotate(fx * lean);

    // Sword on back when not swinging.
    if (!this.attack) {
      capsule(ctx, -8, -26, 5, -13, 4, PALETTE.cream, PALETTE.ink, 1.8);
      inkCircle(ctx, -9, -27, 2.4, PALETTE.neon, PALETTE.ink, 1.5);
    }

    // Body — the warm orange tunic.
    const breathe = this.moving ? 0 : Math.sin(t * 2.1) * 0.4;
    capsule(ctx, 0, -9, 0, -20 - breathe, 14, PALETTE.orange, PALETTE.ink, 2.4);
    // Chest stitch detail (a tiny Haus of Toots charm).
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2.5, -15.5); ctx.lineTo(0.5, -12.5);
    ctx.moveTo(0.5, -15.5); ctx.lineTo(-2.5, -12.5);
    ctx.stroke();

    // Head, eyes follow facing.
    const hy = -28 - breathe;
    inkCircle(ctx, 0, hy, 8.5, PALETTE.skin, PALETTE.ink, 2.4);
    const ex = fx * 3, ey = fy * 1.8;
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath(); ctx.arc(-2.6 + ex, hy - 0.5 + ey, 1.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(2.6 + ex, hy - 0.5 + ey, 1.3, 0, TAU); ctx.fill();

    // Headphones — Toots' signature.
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, hy, 9.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    inkCircle(ctx, -8.5, hy + 1, 3.2, PALETTE.ink, null);
    inkCircle(ctx, 8.5, hy + 1, 3.2, PALETTE.ink, null);
    ctx.fillStyle = PALETTE.neon;
    ctx.beginPath(); ctx.arc(-8.5, hy + 1, 1.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(8.5, hy + 1, 1.2, 0, TAU); ctx.fill();

    ctx.restore();

    // Active swing: glowing trail sector plus the blade.
    if (this.attack) {
      const c = COMBO[this.attack.combo];
      const p = clamp(this.attack.t / c.dur / 0.7, 0, 1);
      const ease = easeOutCubic(p);
      const start = this.attack.dir - c.sweep * this.attack.sign;
      const cur = start + 2 * c.sweep * this.attack.sign * ease;
      const cx = this.x, cy = this.y - 12;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, c.range);
      grad.addColorStop(0, 'rgba(0,247,194,0)');
      grad.addColorStop(0.75, `rgba(0,247,194,${0.30 * (1 - p * 0.6)})`);
      grad.addColorStop(1, 'rgba(0,247,194,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      this.attack.sign > 0
        ? ctx.arc(cx, cy, c.range, start, cur)
        : ctx.arc(cx, cy, c.range, start, cur, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const bx = cx + Math.cos(cur) * c.range * 0.9;
      const by = cy + Math.sin(cur) * c.range * 0.8;
      capsule(ctx, cx + Math.cos(cur) * 8, cy + Math.sin(cur) * 7, bx, by,
        c.width, PALETTE.cream, PALETTE.ink, 1.8);
    }
  }
}

// ---------------------------------------------------------------------------
// Dog — one grammar, any dog. Doc points at secrets; Astro (later) digs.
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
    this.p = {
      body: PALETTE.dogBody, chest: PALETTE.dogChest,
      earLen: 9, tailFreq: 9, size: 1, ...params,
    };
  }

  update(dt, player, secret) {
    const behind = 32;
    const tx = player.x - Math.cos(player.face) * behind;
    const ty = player.y - Math.sin(player.face) * behind * 0.6;
    const d = dist(this.x, this.y, tx, ty);

    if (d > 26) {
      const sp = clamp((d - 20) * 4, 60, 230);
      const a = Math.atan2(ty - this.y, tx - this.x);
      moveCircle(this, Math.cos(a) * sp * dt, Math.sin(a) * sp * dt, this.r);
      this.face = a;
      this.trot += dt * (sp / 16);
      this.moving = true;
      this.sitting = false;
      this.sitT = 0;
    } else {
      this.moving = false;
      this.sitT += dt;
      if (player.idleT > 1.2 && this.sitT > 0.8) {
        this.sitting = true;
        // Doc's nose knows: when sitting near a secret, he stares at it.
        if (secret && dist(this.x, this.y, secret.x, secret.y) < 190) {
          this.face = Math.atan2(secret.y - this.y, secret.x - this.x);
          this.pointing = true;
        } else {
          this.pointing = false;
        }
      } else {
        this.sitting = false;
        this.pointing = false;
      }
    }
  }

  draw(ctx, t) {
    const p = this.p;
    const sx = Math.cos(this.face) >= 0 ? 1 : -1;
    const wag = Math.sin(t * p.tailFreq) * (this.sitting ? 2 : 3.5);
    const bob = this.moving ? Math.abs(Math.sin(this.trot)) * 1.6 : 0;

    inkEllipse(ctx, this.x, this.y + 1, 11, 4.5, 0, 'rgba(34,26,86,0.22)', null);

    ctx.save();
    ctx.translate(this.x, this.y - bob);
    ctx.scale(sx * p.size, p.size);

    if (this.sitting) {
      // Haunches down, chest up, tail sweeping the grass.
      capsule(ctx, -9, -7, -16 + wag, -3, 4, p.body, PALETTE.ink, 1.8);
      inkEllipse(ctx, -7, -7, 8, 7, 0, p.body, PALETTE.ink, 2.2);
      capsule(ctx, -6, -8, 4, -15, 11, p.body, PALETTE.ink, 2.2);
      capsule(ctx, 2, -10, 2, -2, 3.5, p.body, PALETTE.ink, 1.8);
      capsule(ctx, 6, -10, 6, -2, 3.5, p.body, PALETTE.ink, 1.8);
      inkEllipse(ctx, 4, -12, 4, 5, 0, p.chest, null);
      this.drawHead(ctx, 7, -22, t);
    } else {
      const l1 = this.moving ? Math.sin(this.trot) * 3 : 0;
      const l2 = this.moving ? Math.sin(this.trot + Math.PI) * 3 : 0;
      capsule(ctx, -11, -9, -17 + wag, -14, 4, p.body, PALETTE.ink, 1.8);
      capsule(ctx, -8 + l1, -8, -8 + l1 * 1.4, -1, 3.5, p.body, PALETTE.ink, 1.8);
      capsule(ctx, 6 + l2, -8, 6 + l2 * 1.4, -1, 3.5, p.body, PALETTE.ink, 1.8);
      capsule(ctx, -10, -10, 7, -10, 12, p.body, PALETTE.ink, 2.2);
      capsule(ctx, -8 + l2, -8, -8 + l2 * 1.4, -1, 3.5, p.body, PALETTE.ink, 1.8);
      capsule(ctx, 6 + l1, -8, 6 + l1 * 1.4, -1, 3.5, p.body, PALETTE.ink, 1.8);
      inkEllipse(ctx, 6, -8, 4, 4.5, 0, p.chest, null);
      this.drawHead(ctx, 12, -16, t);
    }

    ctx.restore();

    // A puzzled, attentive "?" of pure love when pointing at a secret.
    if (this.pointing && Math.sin(t * 2.5) > 0.3) {
      ctx.fillStyle = PALETTE.neon;
      ctx.font = 'bold 11px monospace';
      ctx.fillText('!', this.x - 2, this.y - 34);
    }
  }

  drawHead(ctx, hx, hy, t) {
    const p = this.p;
    const earSwing = this.moving ? Math.sin(this.trot) * 1.6 : Math.sin(t * 1.4) * 0.6;
    inkCircle(ctx, hx, hy, 7, p.body, PALETTE.ink, 2.2);
    // Floppy ears.
    capsule(ctx, hx - 3, hy - 6, hx - 6 - earSwing, hy - 6 + p.earLen, 4.5, p.body, PALETTE.ink, 1.8);
    capsule(ctx, hx + 3, hy - 6, hx + 1 - earSwing, hy - 6 + p.earLen * 0.8, 4, p.body, PALETTE.ink, 1.8);
    // Snout and nose.
    inkEllipse(ctx, hx + 6, hy + 2, 4.5, 3.2, 0, p.chest, PALETTE.ink, 1.6);
    inkCircle(ctx, hx + 8.5, hy + 1.5, 1.6, PALETTE.ink, null);
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(hx + 1.5, hy - 1, 1.4, 0, TAU);
    ctx.fill();
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
