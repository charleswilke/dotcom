// Toots Quest — M0.5 renderer proof: Living Ink + Sunday Ink.
// Two rooms of the Hollow joined like Sunday-strip panels: baked blob
// terrain, parametric characters, wind, day/night light, torches, mites,
// a 3-hit sword combo with hitstop — and a toggleable newsprint style
// (press P): misregistered color plates + halftone screens. Walking off
// the east/west edge slides the world to the next panel across a paper
// gutter, with Toots crossing the gutter himself.

import {
  TAU, PALETTE, PRINT, setPrintMode, clamp, lerp, dist, angleDiff,
  mulberry32, capsule, inkCircle, inkEllipse, inkShape,
} from './ink.js';
import {
  WORLD_W, WORLD_H, TILE, room, setRoom, getRoom, groundFor,
  invalidateGrounds, circleBlocked,
} from './terrain.js';
import { Player, Dog, Mite, particles, spawnParticle, burst, updateParticles, drawParticles } from './entities.js';
import { skyState, timeLabel, drawLighting } from './light.js';
import { halftone } from './print.js';
import { spawnWord, updateWords, drawWords, clearWords } from './fx.js';
import {
  NPC, TALK_RADIUS, dialogue, startDialogue, advanceDialogue, closeDialogue,
  updateDialogue, drawDialogue, drawTalkHint,
} from './npc.js';
import { worldState, saveGame, loadGame, wipeSave } from './state.js';
import {
  spellState, castClearAsDay, updateSpells, clearSpells,
  spellLights, drawSpells, drawFreqDial,
} from './spells.js';
import {
  title, TITLE_LEAVE, beginTitleLeave, skipTitle, updateTitle, drawTitle,
} from './title.js';

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

// Resume from the stitched save, if there is one (M1 item 4). loadGame has
// already merged the flags into worldState; the room switch must happen
// before anyone is constructed, and a saved position that no longer fits
// (future layout edits) falls back to the room's spawn point.
const saved = loadGame();
if (saved && getRoom(saved.roomId)) {
  setRoom(saved.roomId);
  if (typeof saved.tDay === 'number') tDay = ((saved.tDay % 1) + 1) % 1;
}
const spawnAt = (saved && getRoom(saved.roomId) &&
  Number.isFinite(saved.x) && Number.isFinite(saved.y) &&
  !circleBlocked(saved.x, saved.y, 9))
  ? { x: saved.x, y: saved.y }
  : room.decor.playerSpawn;
title.hasSave = !!saved;

const player = new Player(spawnAt.x, spawnAt.y);
// The real dogs (PRD §2.5, cover-art model sheets): Doc heels and scowls,
// Astro scouts and grins. Same grammar, different souls.
const doc = new Dog(player.x - 40, player.y + 10, {
  body: PALETTE.dogDoc, chest: PALETTE.dogDocChest, collar: PALETTE.slate,
  earLen: 11, tailFreq: 6, size: 1.05, mood: 'grumpy', behavior: 'heel',
  bean: 3.5,       // the shih tzu curved-bean midsection
  tailCurl: true,  // plume over the back — the other shih tzu signature
});
const astro = new Dog(player.x + 34, player.y + 22, {
  body: PALETTE.dogAstro, chest: PALETTE.dogAstroChest, collar: PALETTE.orange,
  earLen: 8.5, tailFreq: 13, size: 1, mood: 'happy', behavior: 'scout',
  // Shihpoo build (corrected July 2026 — he's a shih tzu/poodle mix, no
  // topknot): up on long thin legs, slim barrel, head carried high.
  lift: 4.5, bodyW: 9, legW: 2.5,
});
// Boot placement goes through the same clamp as gutter crossings (gotcha 5):
// a restored save can spawn against a world edge, and a dog constructed out
// of bounds is bricked forever. (placeDog is hoisted; player exists.)
placeDog(doc, doc.x, doc.y);
placeDog(astro, astro.x, astro.y);

function roomMites(r) {
  if (!r.mites) r.mites = (r.decor.miteSpawns || []).map(s => new Mite(s.x, s.y));
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

// Nearest standing hoop close enough to stitch at, or null (PRD §2.6).
const STITCH_RADIUS = 46;
function hoopInRange() {
  let best = null;
  let bd = STITCH_RADIUS;
  for (const h of room.decor.hoops || []) {
    const d = dist(player.x, player.y, h.x, h.y);
    if (d < bd) { bd = d; best = h; }
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

// The stitch ceremony (PRD §2.6): saving at a hoop sews a ring of
// cross-stitches around Toots. The save itself lands on the first frame —
// the animation is the fiction, so a mite interrupting the ceremony costs
// the moment, never the progress.
let stitch = null;            // {t, dur, x, y, hoop}
let saveCue = 0;              // HUD "STITCHED" fade timer

function doSave() {
  saveGame(room.id, player.x, player.y, tDay);
  saveCue = 1.8;
}

function startStitch(hoop) {
  stitch = { t: 0, dur: 1.25, x: player.x, y: player.y, hoop };
  player.face = Math.atan2(hoop.y - player.y, hoop.x - player.x);
  player.attack = null;
  player.attackQueued = false;
  doSave();
}

// Cast Clear as Day from wherever Toots stands. The room's interactive set
// is gathered at cast time; the wavefront rim-lights whatever it crosses
// (hoop pings aim at the hoop's face, where the neon stitch already
// promises interactivity).
function castSpell() {
  const targets = [];
  if (room.decor.secret) targets.push({ ...room.decor.secret, kind: 'secret' });
  for (const h of room.decor.hoops || []) targets.push({ x: h.x, y: h.y - 44, kind: 'hoop' });
  for (const d of room.decor.doors || []) targets.push({ x: d.x, y: d.y, kind: 'door' });
  if (!castClearAsDay(player.x, player.y - 6, targets)) return false;
  burst(player.x, player.y - 14, 10, {
    color: [PALETTE.neon, PALETTE.cream], speed: 120, life: 0.35, add: true, g: -40,
  });
  return true;
}

// Seeded ambient detail: grass tufts, flowers, and water ripple anchors,
// per room.
let tufts = [];
let ripples = [];
let flowers = [];

function buildAmbient() {
  tufts = [];
  ripples = [];
  flowers = [];
  if (room.interior) return;   // no overgrowth on the floorboards
  const rnd = mulberry32(room.seed);
  let guard = 0;
  while (tufts.length < 95 && guard++ < 2000) {
    const x = rnd() * WORLD_W;
    const y = rnd() * WORLD_H;
    // Tufts on path edges read as overgrowth, so only skip water.
    if (room.waterCells.some(c => c.cx === Math.floor(x / TILE) && c.cy === Math.floor(y / TILE))) continue;
    tufts.push({ x, y, h: 5 + rnd() * 5, tone: rnd() });
  }
  // Flowers (key-art glean, session 7): little warm blooms in the grass.
  guard = 0;
  while (flowers.length < 11 && guard++ < 800) {
    const x = rnd() * WORLD_W;
    const y = rnd() * WORLD_H;
    if (room.tileAt(Math.floor(x / TILE), Math.floor(y / TILE)) !== 'G') continue;
    flowers.push({ x, y, tone: rnd(), ph: rnd() * TAU });
  }
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
let transition = null;        // {dir, t, dur, fromRoom, toRoom, exit:{x,y}, entry:{x,y}}

const DIRVEC = {
  E: { x: 1, y: 0 }, W: { x: -1, y: 0 },
  N: { x: 0, y: -1 }, S: { x: 0, y: 1 },
};

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// dir is the direction of travel; E/W slide horizontally, N/S vertically.
// Edge crossings derive their entry point from the exit; door crossings
// (into interiors) pass an explicit one.
function startTransition(dir, toId, entry) {
  const toRoom = getRoom(toId || room.neighbors[dir]);
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
    exit: { x: player.x, y: player.y },
    entry: entry || {
      x: dir === 'E' ? 22 : dir === 'W' ? WORLD_W - 22 : player.x,
      y: dir === 'S' ? 22 : dir === 'N' ? WORLD_H - 22 : player.y,
    },
  };
}

// Dogs arrive trailing behind the direction of travel, clamped inside the
// walkable bounds (gotcha 5) — and if the trailing spot is inside a wall
// (door crossings land right next to one), they pop in at Toots' feet and
// sort themselves out; heel/scout immediately walks them apart.
function placeDog(dog, px, py) {
  dog.x = clamp(px, 18, WORLD_W - 18);
  dog.y = clamp(py, 18, WORLD_H - 18);
  if (circleBlocked(dog.x, dog.y, dog.r)) {
    dog.x = player.x;
    dog.y = player.y;
  }
  dog.sitting = false;
  dog.pointing = false;
  dog.sniffing = false;
  dog.comfy = null;
  dog.target = null;   // stale wander targets point at the old room
  dog.detourT = 0;
  dog.stuckT = 0;
}

function finishTransition() {
  const tr = transition;
  transition = null;
  setRoom(tr.toRoom.id);
  player.x = tr.entry.x;
  player.y = tr.entry.y;
  const dv = DIRVEC[tr.dir];
  placeDog(doc, player.x - dv.x * 34 + dv.y * 8, player.y - dv.y * 34 + dv.x * 8);
  placeDog(astro, player.x - dv.x * 52 + dv.y * 20, player.y - dv.y * 52 + dv.x * 20);
  mites = roomMites(room);
  npcs = roomNpcs(room);
  particles.length = 0;
  clearWords();
  clearSpells();     // pulses/pings are room-space — stale after a crossing
  buildAmbient();
  // Crossings are the autosave safety net (PRD §2.6): the hoop is the
  // fiction, the gutter is the guarantee.
  doSave();
}

// --- Input -----------------------------------------------------------------

const keys = new Set();
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.repeat) return;
  // Any key lifts the cover page; game bindings wake up once it's gone.
  if (title.active) {
    beginTitleLeave();
    return;
  }
  keys.add(e.code);
  // Action routing: Space is contextual (talk when a townsperson is in
  // range, attack otherwise); E only talks; J always attacks — the escape
  // hatch if you want to swing right next to someone.
  if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyE') {
    if (dialogue.active) {
      advanceDialogue();
    } else if (!transition && !stitch) {
      // Contextual routing: townsfolk first, then hoops; J stays the pure
      // attack — the escape hatch keeps combat unhijackable.
      const n = e.code === 'KeyJ' ? null : npcInTalkRange();
      const h = e.code === 'KeyJ' || n ? null : hoopInRange();
      if (n) startDialogue(n, player);
      else if (h) startStitch(h);
      else if (e.code !== 'KeyE') player.bufferAttack();
    }
  }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyK') {
    if (!dialogue.active && !stitch) player.tryDash();
  }
  if (e.code === 'KeyF' && !dialogue.active && !transition && !stitch) {
    castSpell();
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
  saveCue = Math.max(0, saveCue - dt);

  if (transition) {
    transition.t += dt;
    if (transition.t >= transition.dur) finishTransition();
    return;
  }

  updateSpells(dt);
  if (stitch) {
    stitch.t += dt;
    if (stitch.t >= stitch.dur) stitch = null;
  }

  // Talking (or stitching) locks Toots' input but the world keeps living
  // (pillar 1): mites still wander, Doc still settles, torches still spit.
  player.update(dt, dialogue.active || stitch ? EMPTY_KEYS : keys, game);
  doc.update(dt, player, room.comfy);
  astro.update(dt, player, room.decor.secret);
  for (const n of npcs) n.update(dt, player);
  for (const m of mites) m.update(dt, player, game);
  // A lunge that lands mid-sentence breaks off the conversation — hurt()
  // just set invuln to 0.9 and it hasn't decayed yet this frame. Same for
  // the stitch ceremony (the save already landed; only the moment breaks).
  if (dialogue.active && player.invuln > 0.85) closeDialogue();
  if (stitch && player.invuln > 0.85) stitch = null;
  updateParticles(dt);
  updateWords(dt);
  updateDialogue(dt);

  // Walked off an open edge? Slide to the neighboring panel.
  if (player.x > WORLD_W - 12.5 && room.neighbors.E) { startTransition('E'); return; }
  if (player.x < 12.5 && room.neighbors.W) { startTransition('W'); return; }
  if (player.y > WORLD_H - 12.5 && room.neighbors.S) { startTransition('S'); return; }
  if (player.y < 12.5 && room.neighbors.N) { startTransition('N'); return; }
  // Stepped onto a door threshold? Cross into that panel instead.
  for (const dr of room.decor.doors || []) {
    if (dist(player.x, player.y, dr.x, dr.y) < 15) {
      startTransition(dr.dir, dr.to, { x: dr.entry.x, y: dr.entry.y });
      return;
    }
  }

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
    for (const t of room.decor.torches || []) {
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

  // Astro marks the secret with a glint while he's pointing at it.
  if (astro.pointing && room.decor.secret && Math.random() < dt * 1.5) {
    spawnParticle({
      x: room.decor.secret.x + (Math.random() - 0.5) * 10,
      y: room.decor.secret.y - 4,
      vy: -18, g: 0, life: 0.8, size: 1.8, color: PALETTE.neon, add: true,
    });
  }

  // Doc's stare gets a soft cue at the comfy spot he means — warm orange,
  // not neon: rest isn't magic, it's home. (PRD §2.5 comfy compass.)
  if (doc.comfy && Math.random() < dt * 1.2) {
    const cy = doc.comfy.kind === 'dogbed' ? -8 : -44;
    spawnParticle({
      x: doc.comfy.x + (Math.random() - 0.5) * 10,
      y: doc.comfy.y + cy,
      vy: -12, g: 0, life: 0.9, size: 1.8, color: PALETTE.orange, add: true,
    });
  }

  game.shakeT = Math.max(0, game.shakeT - dt);
  if (game.shakeT <= 0) game.shakeAmp = 0;
}

// --- Decor drawing ---------------------------------------------------------

// The depth pass (July 2026, from the Great Tuner previz render): one light
// direction for the whole world — sun from the upper right — so every
// static object casts a soft slate shadow down-left, anchored by a darker
// contact core at its base. Shadows draw on the ground BEFORE the y-sorted
// cast, so nothing ever shadows over a character. The moving cast keeps
// its shadows underfoot (the render does this too — it's what keeps
// combat positions readable).
function drawShadows(r, time) {
  const d = r.decor;
  if (r.interior) {
    // Indoors the lamps own the light — just anchor the standing hoop.
    ctx.fillStyle = 'rgba(34,26,86,0.18)';
    for (const h of d.hoops || []) {
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 1, 10, 4, 0, 0, TAU);
      ctx.fill();
    }
    return;
  }
  const soft = [];   // [x, y, rx, ry]
  const core = [];

  for (const tr of d.trees || []) {
    const p = treeParams(tr);
    const sway = (Math.sin(time * 1.4 + p.ph) * 2.6 +
                  Math.sin(time * 2.3 + p.ph * 1.7) * 1.1) * p.swayAmp;
    soft.push([tr.x - 13 * p.scale + sway * 0.4, tr.y + 5, 26 * p.scale, 9.5 * p.scale]);
    core.push([tr.x, tr.y + 2, 9 * p.scale, 3.2]);
  }
  for (const s of d.stones || []) {
    const p = stoneParams(s);
    soft.push([s.x - p.h * 0.30, s.y + 3, p.h * 0.46, 6.5]);
    core.push([s.x, s.y + 1, p.w * 0.55, 2.8]);
  }
  if (d.tuner) {
    soft.push([d.tuner.x - 52, d.tuner.y + 7, 80, 14]);
    core.push([d.tuner.x, d.tuner.y + 2, 32, 5.5]);
  }
  for (const t of d.torches || []) {
    soft.push([t.x - 7, t.y + 2, 9, 3.2]);
    core.push([t.x, t.y + 1, 4.5, 1.8]);
  }
  for (const h of d.hoops || []) {
    soft.push([h.x - 9, h.y + 2, 11, 3.8]);
    core.push([h.x, h.y + 1, 6.5, 2.4]);
  }
  if (d.banner) {
    soft.push([d.banner.x - 8, d.banner.y + 2, 12, 4]);
    core.push([d.banner.x, d.banner.y + 1, 5, 2]);
  }
  for (const b of d.buildings || []) {
    soft.push([b.x + b.w / 2 - 16, b.y + 5, b.w * 0.58, 9.5]);
    core.push([b.x + b.w / 2, b.y + 3, b.w * 0.5, 5.5]);
  }

  ctx.save();
  // Sunday Ink shades with the halftone screen, like the boulders do.
  if (PRINT.on) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = halftone(ctx, 'shade');
  } else {
    ctx.fillStyle = 'rgba(44,79,124,0.30)';
  }
  for (const [x, y, rx, ry] of soft) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, -0.12, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(34,26,86,0.22)';
  for (const [x, y, rx, ry] of core) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

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
    // Highlights live on the sunward (upper-right) side; the one sun is
    // canon now (session 9), and mixed-side highlights read flat.
    hl: [
      [(5 + rnd() * 5) * scale, topY - (5 + rnd() * 3) * scale, (6 + rnd() * 2) * scale],
      [(10 + rnd() * 4) * scale, topY + (1 + rnd() * 4) * scale, (4 + rnd() * 1.5) * scale],
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
  capsule(ctx, tree.x, tree.y, tree.x + p.leanX + sway * 0.5, tree.y - p.trunkH,
    p.trunkW, TRUNK_TINTS[p.tone], PALETTE.ink, 2.2);
  // The trunk turns away from the sun on its west edge — a slate edge
  // shade, same cylinder read as the stones' facets.
  capsule(ctx, tree.x - p.trunkW * 0.24, tree.y - 1,
    tree.x + p.leanX + sway * 0.5 - p.trunkW * 0.24, tree.y - p.trunkH + 3,
    p.trunkW * 0.36, 'rgba(44,79,124,0.30)', null);
  blobCircles(ctx, circles, CANOPY_TINTS[p.tone], p.inkW);
  // Canopy shade on the un-sunned lower-left: painted slate in Living
  // Ink, a halftone screen in Sunday Ink (page-anchored, so the canopy
  // sways through the dots).
  ctx.save();
  ctx.beginPath();
  for (const [x, y, r] of circles) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
  ctx.clip();
  if (PRINT.on) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = halftone(ctx, 'shade');
  } else {
    ctx.fillStyle = 'rgba(44,79,124,0.20)';
  }
  ctx.beginPath();
  ctx.ellipse(bx - 7 * p.scale, tree.y + p.topY + 10 * p.scale,
    24 * p.scale, 16 * p.scale, 0.25, 0, TAU);
  ctx.fill();
  ctx.restore();
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

function drawSecret(s, time, interior) {
  if (interior) {
    // Indoors the tell is a loose floorboard, not pebbles.
    ctx.strokeStyle = 'rgba(34,26,86,0.5)';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x - 7, s.y - 2); ctx.lineTo(s.x + 6, s.y - 3);
    ctx.moveTo(s.x - 5, s.y + 3); ctx.lineTo(s.x + 7, s.y + 2);
    ctx.stroke();
    inkCircle(ctx, s.x + 1, s.y, 1.6, PALETTE.timber, PALETTE.ink, 1);
    return;
  }
  inkCircle(ctx, s.x - 5, s.y, 2.5, PALETTE.rock, PALETTE.ink, 1.4);
  inkCircle(ctx, s.x + 4, s.y + 2, 2, PALETTE.rock, PALETTE.ink, 1.4);
  inkCircle(ctx, s.x, s.y - 3, 1.6, PALETTE.rockDark, null);
}

// A Hearthside building: timber-framed cream walls under a gabled roof.
// One grammar, two kinds — the shop wears orange and hangs a hoop sign,
// the house wears slate and smokes a chimney. Windows warm up after dark.
function drawBuilding(b, time) {
  const { x, y, w, h } = b;
  const shop = b.kind === 'shop';
  const dark = skyState(tDay).dark;

  // The west face — the building turns a shoulder to the sun. Extrusion,
  // not projection (same trick as the standing stones): an oblique side
  // wall in shade, drawn first so the front wall covers the seam.
  const E = 11, D = 15;
  const side = (c) => {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x - E, y - D);
    c.lineTo(x - E, y - h - D + 3);
    c.lineTo(x, y - h + 3);
    c.closePath();
  };
  inkShape(ctx, side, PALETTE.cream, PALETTE.ink, 3);
  side(ctx);
  if (PRINT.on) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = halftone(ctx, 'shade');
  } else {
    ctx.fillStyle = 'rgba(44,79,124,0.30)';
  }
  ctx.fill();
  ctx.globalAlpha = 1;

  // Wall + timber framing.
  inkShape(ctx, (c) => {
    c.beginPath();
    c.roundRect(x, y - h, w, h, 4);
  }, PALETTE.cream, PALETTE.ink, 3);
  ctx.strokeStyle = PALETTE.timber;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 4); ctx.lineTo(x + 6, y - h + 8);
  ctx.moveTo(x + w - 6, y - 4); ctx.lineTo(x + w - 6, y - h + 8);
  ctx.moveTo(x + 4, y - h + 9); ctx.lineTo(x + w - 4, y - h + 9);
  ctx.stroke();

  // Gabled roof with an overhang and a couple of shingle seams. The west
  // hip slope comes first — the roof's own shaded shoulder — then the
  // front slope covers the shared eave line.
  const ridgeY = y - h - 34;
  const rlx = x + w / 2 - 26;
  const rrx = x + w / 2 + 26;
  const RE = 10, RD = 9;
  const roofSide = (c) => {
    c.beginPath();
    c.moveTo(x - 12, y - h + 2);
    c.lineTo(rlx, ridgeY);
    c.lineTo(rlx - RE, ridgeY - RD);
    c.lineTo(x - 12 - RE, y - h + 2 - RD);
    c.closePath();
  };
  inkShape(ctx, roofSide, shop ? PALETTE.orange : PALETTE.slate, PALETTE.ink, 3);
  roofSide(ctx);
  if (PRINT.on) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = halftone(ctx, 'shade');
  } else {
    ctx.fillStyle = 'rgba(44,79,124,0.35)';
  }
  ctx.fill();
  ctx.globalAlpha = 1;
  inkShape(ctx, (c) => {
    c.beginPath();
    c.moveTo(x - 12, y - h + 2);
    c.lineTo(rlx, ridgeY);
    c.lineTo(rrx, ridgeY);
    c.lineTo(x + w + 12, y - h + 2);
    c.closePath();
  }, shop ? PALETTE.orange : PALETTE.slate, PALETTE.ink, 3.5);
  ctx.strokeStyle = 'rgba(34,26,86,0.45)';
  ctx.lineWidth = 1.6;
  for (const t2 of [0.38, 0.72]) {
    const yy = ridgeY + (y - h + 2 - ridgeY) * t2;
    ctx.beginPath();
    ctx.moveTo(lerp(rlx, x - 12, t2) + 4, yy);
    ctx.lineTo(lerp(rrx, x + w + 12, t2) - 4, yy);
    ctx.stroke();
  }
  // The overhang shades the top of the front wall — the under-eave band.
  ctx.fillStyle = 'rgba(34,26,86,0.10)';
  ctx.fillRect(x + 3, y - h + 11, w - 6, 6);
  if (!shop) {
    inkShape(ctx, (c) => {
      c.beginPath();
      c.roundRect(x + w - 46, ridgeY + 4, 15, 24, 2);
    }, PALETTE.rust, PALETTE.ink, 2.2);
  }

  // Windows — slate by day, lamplight after dark.
  for (const wx of [x + w * 0.22, x + w * 0.78]) {
    const wy = y - h * 0.52;
    inkShape(ctx, (c) => {
      c.beginPath();
      c.roundRect(wx - 9, wy - 8, 18, 16, 2);
    }, dark > 0.25 ? '#ffca7a' : PALETTE.slate, PALETTE.ink, 2.2);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(wx, wy - 7); ctx.lineTo(wx, wy + 7);
    ctx.moveTo(wx - 8, wy); ctx.lineTo(wx + 8, wy);
    ctx.stroke();
  }

  // The door, on its own x so it can meet the path.
  const dx = b.doorX ?? x + w / 2;
  inkShape(ctx, (c) => {
    c.beginPath();
    c.roundRect(dx - 12, y - 31, 24, 31, [10, 10, 0, 0]);
  }, PALETTE.timber, PALETTE.ink, 2.5);
  inkCircle(ctx, dx + 6, y - 14, 1.7, PALETTE.ink, null);

  // The shop hangs a little hoop sign over its door.
  if (shop) {
    const sway = Math.sin(time * 1.9 + 2) * 1.5;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(dx, y - h + 10);
    ctx.lineTo(dx + sway, y - h + 22);
    ctx.stroke();
    inkCircle(ctx, dx + sway, y - h + 30, 8.5, PALETTE.timber, PALETTE.ink, 2);
    inkCircle(ctx, dx + sway, y - h + 30, 6, PALETTE.cream, PALETTE.ink, 1.4);
    ctx.strokeStyle = PALETTE.orange;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(dx + sway - 2.5, y - h + 27.5); ctx.lineTo(dx + sway + 2.5, y - h + 32.5);
    ctx.moveTo(dx + sway + 2.5, y - h + 27.5); ctx.lineTo(dx + sway - 2.5, y - h + 32.5);
    ctx.stroke();
  }
}

// A standing embroidery hoop — the save point (PRD §2.6), waiting for the
// save system. The one neon stitch is the promise: neon = interactive.
function drawHoop(hp, time) {
  const { x, y } = hp;
  capsule(ctx, x - 7, y, x - 2, y - 22, 3, PALETTE.timber, PALETTE.ink, 1.8);
  capsule(ctx, x + 7, y, x + 2, y - 22, 3, PALETTE.timber, PALETTE.ink, 1.8);
  capsule(ctx, x, y - 20, x, y - 30, 3.5, PALETTE.timber, PALETTE.ink, 1.8);
  inkCircle(ctx, x, y - 44, 15, PALETTE.timber, PALETTE.ink, 2.4);
  inkCircle(ctx, x, y - 44, 11.5, PALETTE.cream, PALETTE.ink, 1.6);
  inkCircle(ctx, x, y - 60.5, 2.2, PALETTE.timber, PALETTE.ink, 1.6);
  const cell = 5;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  for (const [gx, gy, neon] of [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, 1]]) {
    const cx2 = x + gx * cell;
    const cy2 = y - 44 + gy * cell;
    if (neon) {
      ctx.globalAlpha = 0.55 + Math.sin(time * 2.2 + x) * 0.45;
      ctx.strokeStyle = PALETTE.neon;
    } else {
      ctx.strokeStyle = PALETTE.orange;
    }
    ctx.beginPath();
    ctx.moveTo(cx2 - 2, cy2 - 2); ctx.lineTo(cx2 + 2, cy2 + 2);
    ctx.moveTo(cx2 + 2, cy2 - 2); ctx.lineTo(cx2 - 2, cy2 + 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// --- Standing stones & the Great Tuner (the depth pass, July 2026) ----------
// Translated from the Tuning Stone previz render. The depth trick is
// extrusion, not projection: each stone is a front face with a shaded
// side facet and a lit rim, so it reads as a body with thickness while
// collision stays a circle at its base. Y-sorted — you can walk behind.

const STONE_TONES = ['#b7aa90', '#aa9d85', '#c0b49b'];

function stoneParams(s) {
  if (s._p) return s._p;
  const rnd = mulberry32(((s.x * 2654435761) ^ (s.y * 40503)) >>> 0);
  s._p = {
    h: 36 + rnd() * 26,
    w: 16 + rnd() * 9,
    lean: (rnd() - 0.5) * 0.24,       // no stone stands straight-on
    taper: 0.55 + rnd() * 0.25,
    tone: Math.floor(rnd() * 3),
    j: [rnd() * 4 - 2, rnd() * 5 - 2.5, rnd() * 4 - 2, rnd() * 5 - 2.5],
    inkW: 2.6 + rnd() * 0.9,
    cracks: Math.floor(rnd() * 2.4),
    crackSeed: rnd() * 1000,
    mossy: rnd() < 0.6,
  };
  return s._p;
}

// The stone's silhouette, built in local space (base center at 0,0).
function stonePath(c, p) {
  const hw = p.w / 2;
  const tw = hw * p.taper;
  const h = p.h;
  const [j0, j1, j2, j3] = p.j;
  c.beginPath();
  c.moveTo(-hw, 0);
  c.lineTo(-hw - 2 + j0, -h * 0.48);
  c.lineTo(-tw + j1 * 0.4, -h + 2);
  c.quadraticCurveTo(0 + j2 * 0.5, -h - 5, tw + j2 * 0.4, -h + 2.5);
  c.lineTo(hw + 2 + j3, -h * 0.52);
  c.lineTo(hw, 0);
  c.closePath();
}

function drawStone(s, time) {
  const p = stoneParams(s);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(p.lean);
  inkShape(ctx, (c) => stonePath(c, p), STONE_TONES[p.tone], PALETTE.ink, p.inkW);

  // Shaded side facet (away from the sun) — the extrusion read.
  const hw = p.w / 2, tw = hw * p.taper, h = p.h;
  const fw = 4 + p.w * 0.16;
  ctx.save();
  stonePath(ctx, p);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-hw - 4, 2);
  ctx.lineTo(-hw - 6 + p.j[0], -h * 0.48);
  ctx.lineTo(-tw + p.j[1] * 0.4, -h + 1);
  ctx.lineTo(-tw + p.j[1] * 0.4 + fw, -h + 3);
  ctx.lineTo(-hw - 2 + p.j[0] + fw, -h * 0.46);
  ctx.lineTo(-hw + fw * 0.8, 2);
  ctx.closePath();
  if (PRINT.on) {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = halftone(ctx, 'shade');
  } else {
    ctx.fillStyle = 'rgba(44,79,124,0.30)';
  }
  ctx.fill();
  ctx.restore();

  // Rim light along the sunward top edge.
  ctx.strokeStyle = 'rgba(248,233,210,0.55)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.j[2] * 0.5 + 1, -h - 2.4);
  ctx.quadraticCurveTo(tw * 0.8, -h - 0.5, tw + p.j[3] * 0.4 + 1, -h * 0.72);
  ctx.stroke();

  // Cracks and a little moss at the foot, off the same seeded stream.
  const rnd = mulberry32(p.crackSeed * 4096);
  ctx.strokeStyle = 'rgba(34,26,86,0.35)';
  ctx.lineWidth = 1.2;
  for (let k = 0; k < p.cracks; k++) {
    const sx = (rnd() - 0.5) * p.w * 0.6;
    const sy = -h * (0.35 + rnd() * 0.35);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (rnd() - 0.5) * 5, sy + h * 0.16);
    ctx.lineTo(sx + (rnd() - 0.5) * 6, sy + h * 0.3);
    ctx.stroke();
  }
  if (p.mossy) {
    inkCircle(ctx, hw * 0.5, -3, 3.2, PALETTE.grassDark, null);
    inkCircle(ctx, hw * 0.2, -1.5, 2.2, PALETTE.grassDark, null);
  }
  ctx.restore();
}

// The Great Tuner — the Tuning Stone previz, translated from the render:
// a monolith with a verdigris dial, a glowing neon needle (neon = the
// interactive promise), moss, and the cream cross-stitch band at its base
// (needlepoint holds the world together here).
const TUNER = {
  h: 168, baseW: 66, topW: 46,
  brass: '#7d9468', brassDark: '#5f7350', stone: '#cfc2a6',
};

function tunerPath(c) {
  const { h, baseW, topW } = TUNER;
  c.beginPath();
  c.moveTo(-baseW / 2, 0);
  c.lineTo(-baseW / 2 + 3, -h * 0.55);
  c.lineTo(-topW / 2, -h + 4);
  c.quadraticCurveTo(-topW / 2 + 2, -h, -topW / 2 + 7, -h);
  c.lineTo(topW / 2 - 7, -h);
  c.quadraticCurveTo(topW / 2 - 2, -h, topW / 2, -h + 4);
  c.lineTo(baseW / 2 - 2, -h * 0.55);
  c.lineTo(baseW / 2, 0);
  c.closePath();
}

function drawTuner(t, time) {
  const { h, baseW, topW, brass, brassDark, stone } = TUNER;
  ctx.save();
  ctx.translate(t.x, t.y);

  // Finial peg on top, like the render.
  inkShape(ctx, (c) => {
    c.beginPath();
    c.roundRect(-5, -h - 10, 10, 12, 2);
  }, brass, PALETTE.ink, 2);

  // The slab.
  inkShape(ctx, (c) => tunerPath(c), stone, PALETTE.ink, 3.5);

  // Shaded left facet — same extrusion trick as the standing stones.
  ctx.save();
  tunerPath(ctx);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(-baseW / 2 - 4, 2);
  ctx.lineTo(-baseW / 2 - 1, -h * 0.55);
  ctx.lineTo(-topW / 2 + 3, -h - 2);
  ctx.lineTo(-topW / 2 + 14, -h - 2);
  ctx.lineTo(-baseW / 2 + 12, -h * 0.53);
  ctx.lineTo(-baseW / 2 + 9, 2);
  ctx.closePath();
  if (PRINT.on) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = halftone(ctx, 'shade');
  } else {
    ctx.fillStyle = 'rgba(44,79,124,0.26)';
  }
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Rim light down the sunward edge.
  ctx.strokeStyle = 'rgba(248,233,210,0.6)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(topW / 2 - 6, -h + 1.5);
  ctx.quadraticCurveTo(topW / 2 + 1, -h + 3, topW / 2 + 1.5, -h + 10);
  ctx.lineTo(baseW / 2 - 0.5, -h * 0.55);
  ctx.stroke();

  // The dial: verdigris ring, cream face, ticks, hairlines, neon needle.
  const dy = -h * 0.62;
  inkCircle(ctx, 0, dy, 42, brass, PALETTE.ink, 3);
  inkCircle(ctx, 0, dy, 34, PALETTE.cream, PALETTE.ink, 1.8);
  ctx.strokeStyle = brassDark;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, dy, 38.5, 0, TAU);
  ctx.stroke();
  // Frequency ticks — heavier every third, like the render's dial.
  ctx.lineCap = 'round';
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * TAU;
    const major = i % 3 === 0;
    const r0 = major ? 26.5 : 29.5;
    ctx.strokeStyle = major ? 'rgba(34,26,86,0.75)' : 'rgba(34,26,86,0.45)';
    ctx.lineWidth = major ? 1.9 : 1.1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r0, dy + Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a) * 32.5, dy + Math.sin(a) * 32.5);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(34,26,86,0.30)';
  ctx.lineWidth = 1.2;
  for (const rr of [20, 13]) {
    ctx.beginPath();
    ctx.arc(0, dy, rr, 0, TAU);
    ctx.stroke();
  }
  // The needle: a two-pointed hand, alive — it breathes around its
  // station and trembles faintly, like something is still tuning.
  // Crisp strokes, no gradient blobs (spell-light law): the glow is a
  // wider low-alpha understroke, source-over so cream can't bleach it.
  const na = -1.92 + Math.sin(time * 0.6) * 0.05 + Math.sin(time * 7.3) * 0.012;
  const nx = Math.cos(na), ny = Math.sin(na);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,247,194,0.28)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-nx * 30, dy - ny * 30);
  ctx.lineTo(nx * 30, dy + ny * 30);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.neon;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-nx * 30, dy - ny * 30);
  ctx.lineTo(nx * 30, dy + ny * 30);
  ctx.stroke();
  inkCircle(ctx, 0, dy, 4.2, PALETTE.ink, null);
  inkCircle(ctx, 0, dy, 1.8, PALETTE.neon, null);

  // The cream cross-stitch band near the base (the render's lattice,
  // which is of course needlepoint).
  const bw = baseW - 8;
  inkShape(ctx, (c) => {
    c.beginPath();
    c.roundRect(-bw / 2, -36, bw, 19, 3);
  }, PALETTE.cream, PALETTE.ink, 2.2);
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const sx = -bw / 2 + 7 + i * (bw - 14) / 5;
    ctx.strokeStyle = i === 2 ? PALETTE.orange : 'rgba(34,26,86,0.42)';
    ctx.beginPath();
    ctx.moveTo(sx - 3, -30.5); ctx.lineTo(sx + 3, -24.5);
    ctx.moveTo(sx + 3, -30.5); ctx.lineTo(sx - 3, -24.5);
    ctx.stroke();
  }

  // Moss, hugging the shaded edges and pooling at the foot.
  for (const [mx, my, mr] of [
    [-baseW / 2 + 4, -h * 0.42, 5], [-baseW / 2 + 7, -h * 0.34, 3.6],
    [topW / 2 - 3, -h + 8, 4.2], [-baseW / 2 + 6, -6, 6], [baseW / 2 - 9, -4, 4.5],
  ]) {
    inkCircle(ctx, mx, my, mr, PALETTE.grassDark, PALETTE.ink, 1.4);
  }
  inkCircle(ctx, -baseW / 2 + 9, -8, 3, PALETTE.canopyLight, null);

  ctx.restore();
}

// Interior furniture — small shape grammars, one per kind. Collision
// footprints for the boxy ones live in terrain.js (FURN_COLLIDERS);
// keep the drawn sizes in sync.
function drawFurniture(f, time) {
  const { x, y } = f;
  if (f.kind === 'counter') {
    inkShape(ctx, (c) => {
      c.beginPath();
      c.roundRect(x - 85, y - 13, 170, 26, 5);
    }, PALETTE.timber, PALETTE.ink, 2.6);
    ctx.strokeStyle = 'rgba(248,233,210,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 80, y - 6); ctx.lineTo(x + 80, y - 6);
    ctx.stroke();
    // A folded canvas and a spool, mid-commission.
    inkShape(ctx, (c) => {
      c.beginPath();
      c.roundRect(x - 34, y - 10, 26, 13, 2);
    }, PALETTE.cream, PALETTE.ink, 1.8);
    inkCircle(ctx, x + 34, y - 7, 3.6, PALETTE.orange, PALETTE.ink, 1.6);
    ctx.strokeStyle = PALETTE.orange;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x + 31, y - 7);
    ctx.quadraticCurveTo(x + 8, y - 2, x - 12, y - 5);
    ctx.stroke();
  } else if (f.kind === 'gallery') {
    // The pattern gallery (PRD §2.6): one finished canvas, the rest
    // waiting for what Toots brings home. This wall fills in over the game.
    for (let i = 0; i < 4; i++) {
      const fx2 = x + i * 46;
      const fy2 = y - 24;
      inkShape(ctx, (c) => {
        c.beginPath();
        c.roundRect(fx2 - 13, fy2 - 11, 26, 22, 2);
      }, PALETTE.timber, PALETTE.ink, 2);
      inkShape(ctx, (c) => {
        c.beginPath();
        c.roundRect(fx2 - 10, fy2 - 8, 20, 16, 1);
      }, PALETTE.cream, null);
      if (i === 0) {
        inkCircle(ctx, fx2 - 3, fy2 - 3, 3.2, PALETTE.orange, null);
        inkCircle(ctx, fx2 + 3, fy2 - 3, 3.2, PALETTE.orange, null);
        inkShape(ctx, (c) => {
          c.beginPath();
          c.moveTo(fx2 - 5.5, fy2 - 1.5);
          c.lineTo(fx2 + 5.5, fy2 - 1.5);
          c.lineTo(fx2, fy2 + 5);
          c.closePath();
        }, PALETTE.orange, null);
      } else {
        ctx.strokeStyle = 'rgba(210,176,112,0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx2 - 8, fy2 - 3); ctx.lineTo(fx2 + 8, fy2 - 3);
        ctx.moveTo(fx2 - 8, fy2 + 3); ctx.lineTo(fx2 + 8, fy2 + 3);
        ctx.stroke();
      }
    }
  } else if (f.kind === 'shelf') {
    inkShape(ctx, (c) => {
      c.beginPath();
      c.roundRect(x - 55, y - 4, 110, 9, 2);
    }, PALETTE.timber, PALETTE.ink, 2);
    const spools = [PALETTE.orange, PALETTE.neon, PALETTE.slate, PALETTE.rust, PALETTE.cream];
    spools.forEach((col, i) => {
      const sx2 = x - 40 + i * 20;
      capsule(ctx, sx2, y - 14, sx2, y - 8, 7, col, PALETTE.ink, 1.6);
    });
  } else if (f.kind === 'rug') {
    // Braided oval rug, ring by ring.
    inkEllipse(ctx, x, y, 72, 36, 0, PALETTE.rust, PALETTE.ink, 2.4);
    inkEllipse(ctx, x, y, 56, 27, 0, PALETTE.cream, null);
    inkEllipse(ctx, x, y, 40, 19, 0, PALETTE.orange, null);
    inkEllipse(ctx, x, y, 24, 11, 0, PALETTE.cream, null);
    ctx.strokeStyle = 'rgba(34,26,86,0.3)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 64, y + Math.sin(a) * 31);
      ctx.lineTo(x + Math.cos(a) * 70, y + Math.sin(a) * 35);
      ctx.stroke();
    }
  } else if (f.kind === 'bed') {
    inkShape(ctx, (c) => {
      c.beginPath();
      c.roundRect(x - 32, y - 42, 64, 84, 6);
    }, PALETTE.timber, PALETTE.ink, 2.6);
    inkShape(ctx, (c) => {
      c.beginPath();
      c.roundRect(x - 27, y - 37, 54, 74, 5);
    }, PALETTE.cream, PALETTE.ink, 1.6);
    inkEllipse(ctx, x, y - 26, 19, 9, 0, PALETTE.cream, PALETTE.ink, 1.8);
    // The quilt — cross-stitched, of course.
    inkShape(ctx, (c) => {
      c.beginPath();
      c.roundRect(x - 27, y - 12, 54, 49, 5);
    }, PALETTE.orange, PALETTE.ink, 1.8);
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    for (let r2 = 0; r2 < 3; r2++) {
      for (let c2 = 0; c2 < 3; c2++) {
        const qx = x - 14 + c2 * 14;
        const qy = y - 2 + r2 * 13;
        ctx.beginPath();
        ctx.moveTo(qx - 2.5, qy - 2.5); ctx.lineTo(qx + 2.5, qy + 2.5);
        ctx.moveTo(qx + 2.5, qy - 2.5); ctx.lineTo(qx - 2.5, qy + 2.5);
        ctx.stroke();
      }
    }
  } else if (f.kind === 'table') {
    capsule(ctx, x, y - 10, x, y - 2, 5, PALETTE.timber, PALETTE.ink, 2);
    inkEllipse(ctx, x, y - 16, 23, 13, 0, PALETTE.timber, PALETTE.ink, 2.6);
    // The house radio — same family as Wren's. Still tuned. Still alive.
    inkShape(ctx, (c) => {
      c.beginPath();
      c.roundRect(x - 8, y - 33, 16, 12, 2);
    }, PALETTE.slate, PALETTE.ink, 2);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 5, y - 33);
    ctx.lineTo(x + 10, y - 43);
    ctx.stroke();
    ctx.globalAlpha = 0.55 + Math.sin(time * 2.4 + 1) * 0.45;
    ctx.fillStyle = PALETTE.neon;
    ctx.beginPath();
    ctx.arc(x + 10, y - 43, 1.5, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (f.kind === 'lamp') {
    capsule(ctx, x, y, x, y - 30, 3, PALETTE.timber, PALETTE.ink, 1.8);
    inkShape(ctx, (c) => {
      c.beginPath();
      c.moveTo(x - 11, y - 30);
      c.lineTo(x - 6, y - 42);
      c.lineTo(x + 6, y - 42);
      c.lineTo(x + 11, y - 30);
      c.closePath();
    }, PALETTE.orange, PALETTE.ink, 2);
  } else if (f.kind === 'dogbed') {
    inkEllipse(ctx, x, y, 19, 11, 0, PALETTE.rust, PALETTE.ink, 2.2);
    inkEllipse(ctx, x, y + 1, 14, 7.5, 0, PALETTE.cream, PALETTE.ink, 1.4);
    ctx.strokeStyle = 'rgba(34,26,86,0.35)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 15, y + Math.sin(a) * 8.5);
      ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 10.5);
      ctx.stroke();
    }
  }
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

// A flower is a bent stem and four petal dots, swaying on the same wind
// as the tufts. Orange, hot orange, or cream — the site's warm accents
// scattered into the grass (key-art glean, session 7).
function drawFlowers(time) {
  for (const fl of flowers) {
    const sway = Math.sin(time * 1.5 + fl.ph) * 1.2 +
                 Math.sin(time * 2.7 + fl.x * 0.01) * 0.5;
    const col = fl.tone < 0.55 ? PALETTE.orange
      : fl.tone < 0.8 ? PALETTE.hotOrange : PALETTE.cream;
    ctx.strokeStyle = PALETTE.grassDark;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fl.x, fl.y);
    ctx.quadraticCurveTo(fl.x + sway * 0.5, fl.y - 3.5, fl.x + sway, fl.y - 6);
    ctx.stroke();
    const cx2 = fl.x + sway;
    const cy2 = fl.y - 7;
    ctx.fillStyle = col;
    for (let k = 0; k < 4; k++) {
      const a = k * (TAU / 4) + 0.4;
      ctx.beginPath();
      ctx.arc(cx2 + Math.cos(a) * 1.7, cy2 + Math.sin(a) * 1.7, 1.4, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = col === PALETTE.cream ? PALETTE.orange : PALETTE.cream;
    ctx.beginPath();
    ctx.arc(cx2, cy2, 1, 0, TAU);
    ctx.fill();
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

// The stitch ceremony's visual: a ring of cross-stitches sews itself around
// Toots in the ground plane, one X per tick — each stitch pops in at full
// size and settles, same rule as the onomatopoeia words. The working stitch
// is neon (the needle is magic); finished stitches settle to thread-orange.
function drawStitch(time) {
  if (!stitch) return;
  const N = 12;
  const R = 26;
  const p = stitch.t / stitch.dur;
  const sewn = Math.min(N, Math.floor(p * (N + 2)));
  const fade = p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1;
  ctx.save();
  ctx.translate(stitch.x, stitch.y);
  ctx.lineCap = 'round';
  for (let i = 0; i < sewn; i++) {
    const a = -Math.PI / 2 + (i / N) * TAU;
    const sx = Math.cos(a) * R;
    const sy = Math.sin(a) * R * 0.55;   // ground plane, like the shadows
    const fresh = i === sewn - 1 && p < 0.88;
    const s = fresh ? 4.6 : 3.4;
    ctx.strokeStyle = fresh ? PALETTE.neon : PALETTE.orange;
    ctx.globalAlpha = fade;
    ctx.lineWidth = fresh ? 2.6 : 2;
    ctx.beginPath();
    ctx.moveTo(sx - s / 2, sy - s / 2); ctx.lineTo(sx + s / 2, sy + s / 2);
    ctx.moveTo(sx + s / 2, sy - s / 2); ctx.lineTo(sx - s / 2, sy + s / 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// --- Render ----------------------------------------------------------------

let fps = 60;
let frameMs = 0;

// A comic panel frame: paper margin + ink border. Drawn around each panel
// during transitions, and around the whole view in Sunday Ink mode.
function drawPanelFrame(px = 0, py = 0) {
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 10;
  ctx.strokeRect(px + 5, py + 5, WORLD_W - 10, WORLD_H - 10);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(px + 10, py + 10, WORLD_W - 20, WORLD_H - 20);
}

// Everything a room y-sorts: decor, buildings, hoops, furniture, NPCs,
// mites — shared by the live render and the transition panels.
function roomDrawList(r, time) {
  const list = [
    ...(r.decor.trees || []).map(tr => ({ y: tr.y, fn: () => drawTree(tr, time) })),
    ...(r.decor.torches || []).map(to => ({ y: to.y, fn: () => drawTorch(to, time) })),
    ...(r.decor.buildings || []).map(b => ({ y: b.y, fn: () => drawBuilding(b, time) })),
    ...(r.decor.hoops || []).map(h => ({ y: h.y, fn: () => drawHoop(h, time) })),
    ...(r.decor.furniture || []).map(f => ({ y: f.y, fn: () => drawFurniture(f, time) })),
    ...(r.decor.stones || []).map(s => ({ y: s.y, fn: () => drawStone(s, time) })),
  ];
  if (r.decor.tuner) list.push({ y: r.decor.tuner.y, fn: () => drawTuner(r.decor.tuner, time) });
  if (r.decor.banner) list.push({ y: r.decor.banner.y, fn: () => drawBanner(r.decor.banner, time) });
  if (r.npcs) for (const n of r.npcs) list.push({ y: n.y, fn: () => n.draw(ctx, time) });
  if (r.mites) for (const m of r.mites) list.push({ y: m.y, fn: () => m.draw(ctx, time) });
  return list;
}

// One room drawn as a comic panel at screen offset (px, py): ground, decor,
// its mites (and optionally the dogs), then the sky tint — all clipped to
// the panel so nothing bleeds into the gutter.
function drawRoomPanel(r, px, py, time, withDogs) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, WORLD_W, WORLD_H);
  ctx.clip();
  ctx.translate(px, py);
  ctx.drawImage(groundFor(r), 0, 0);
  drawShadows(r, time);
  if (r.decor.secret) drawSecret(r.decor.secret, time, r.interior);
  const list = roomDrawList(r, time);
  if (withDogs) {
    list.push({ y: doc.y, fn: () => doc.draw(ctx, time) });
    list.push({ y: astro.y, fn: () => astro.draw(ctx, time) });
  }
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
// walks across the gutter from the old panel to the new one. E/W slide
// sideways along the strip; N/S (and door crossings) slide between rows.
function renderTransition(time) {
  const tr = transition;
  const p = easeInOut(clamp(tr.t / tr.dur, 0, 1));
  const horiz = tr.dir === 'E' || tr.dir === 'W';
  const span = (horiz ? WORLD_W : WORLD_H) + GUTTER;
  const sgn = (tr.dir === 'E' || tr.dir === 'S') ? 1 : -1;
  const off = sgn * p * span;
  ctx.fillStyle = PALETTE.cream;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  const fx = horiz ? -off : 0;
  const fy = horiz ? 0 : -off;
  const tx = horiz ? sgn * span - off : 0;
  const ty = horiz ? 0 : sgn * span - off;
  drawRoomPanel(tr.fromRoom, fx, fy, time, true);
  drawRoomPanel(tr.toRoom, tx, ty, time, false);
  drawPanelFrame(fx, fy);
  drawPanelFrame(tx, ty);

  // Toots rides the exiting panel and lands at the entry point — which
  // means for a moment he is standing in the gutter. On purpose.
  const sx = lerp(tr.exit.x + fx, tr.entry.x + tx, p);
  const sy = lerp(tr.exit.y + fy, tr.entry.y + ty, p);
  const ox = player.x, oy = player.y;
  player.x = sx;
  player.y = sy;
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
  drawShadows(room, time);
  drawRipples(time);
  drawFlowers(time);
  drawTufts(time);
  if (room.decor.secret) drawSecret(room.decor.secret, time, room.interior);

  // Y-sorted world objects: the room's own list plus the moving cast.
  const drawList = roomDrawList(room, time);
  drawList.push(
    { y: player.y, fn: () => player.draw(ctx, time) },
    { y: doc.y, fn: () => doc.draw(ctx, time) },
    { y: astro.y, fn: () => astro.draw(ctx, time) },
  );
  drawList.sort((a, b) => a.y - b.y);
  for (const d of drawList) d.fn();

  drawParticles(ctx);
  drawWords(ctx);
  drawSpells(ctx, time);
  drawStitch(time);

  // Warm additive glow around every flame and lamp, day or night.
  const glows = [
    ...(room.decor.torches || []).map(t => ({ x: t.x, y: t.y - 36, r: 44 })),
    ...(room.decor.furniture || []).filter(f => f.kind === 'lamp')
      .map(f => ({ x: f.x, y: f.y - 38, r: 54 })),
  ];
  ctx.globalCompositeOperation = 'lighter';
  for (const t of glows) {
    const g = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, t.r);
    g.addColorStop(0, 'rgba(255,140,50,0.30)');
    g.addColorStop(1, 'rgba(255,140,50,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Darkness pass with punched-out light, then the day tint. Lamps keep
  // interiors livable at night; lit windows spill onto the street.
  const lights = [
    ...(room.decor.torches || []).map(t => ({ x: t.x, y: t.y - 34, r: 105, flicker: true })),
    ...(room.decor.furniture || []).filter(f => f.kind === 'lamp')
      .map(f => ({ x: f.x, y: f.y - 38, r: 165, flicker: true })),
    { x: player.x, y: player.y - 14, r: 135, flicker: false },
    // Clear as Day carries daylight with it: the wavefront and its pings
    // punch the darkness open (this is most of the spell at midnight).
    ...spellLights(),
  ];
  if (stitch) lights.push({ x: stitch.x, y: stitch.y, r: 120, flicker: false });
  // The Tuner's dial keeps its own faint vigil after dark.
  if (room.decor.tuner) {
    lights.push({ x: room.decor.tuner.x, y: room.decor.tuner.y - TUNER.h * 0.62, r: 85, flicker: false });
  }
  for (const b of room.decor.buildings || []) {
    for (const wx of [b.x + b.w * 0.22, b.x + b.w * 0.78]) {
      lights.push({ x: wx, y: b.y - b.h * 0.52, r: 70, flicker: false });
    }
  }
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
  // Interiors are mostly cream paper — the HUD flips to ink up there.
  const hud = room.interior ? 'rgba(34,26,86,0.85)' : 'rgba(248,233,210,0.9)';
  const hudDim = room.interior ? 'rgba(34,26,86,0.6)' : 'rgba(248,233,210,0.7)';
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = hud;
  ctx.fillText(`TOOTS QUEST · M1 ${PRINT.on ? 'SUNDAY INK' : 'LIVING INK'}`, 14, 22);

  // Perf readout — the frame budget is part of the M0 gate.
  ctx.textAlign = 'right';
  ctx.fillStyle = frameMs > 12 ? PALETTE.hotOrange : hudDim;
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
  ctx.fillStyle = hudDim;
  ctx.fillText(timeLabel(tDay), dx - 18, dy + 4);
  ctx.textAlign = 'left';

  // The Frequency Dial (PRD §4.3) seeds bottom-left, above the controls.
  drawFreqDial(ctx, 14, WORLD_H - 76, time, room.interior);

  // Save confirmation: one stitch and a word, then gone.
  if (saveCue > 0) {
    ctx.globalAlpha = Math.min(1, saveCue / 0.6);
    const sx = 152, sy = WORLD_H - 60;
    ctx.strokeStyle = PALETTE.neon;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx - 3, sy - 3); ctx.lineTo(sx + 3, sy + 3);
    ctx.moveTo(sx + 3, sy - 3); ctx.lineTo(sx - 3, sy + 3);
    ctx.stroke();
    ctx.fillStyle = hud;
    ctx.fillText('STITCHED', sx + 8, sy + 4);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = room.interior ? 'rgba(34,26,86,0.5)' : 'rgba(248,233,210,0.55)';
  ctx.fillText('WASD move · SPACE attack/talk/stitch · SHIFT dash · F spell · N time · P print', 14, WORLD_H - 18);
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

  // The cover page: the game holds its breath (no simulation) while the
  // title is up; leaving lifts the panel off the live first frame.
  if (title.active) {
    updateTitle(dt);
    if (title.leaving) {
      render(now / 1000);
      const p = easeInOut(clamp(title.leaveT / TITLE_LEAVE, 0, 1));
      ctx.save();
      ctx.translate(0, -p * (WORLD_H + 50));
      drawTitle(ctx, now / 1000);
      ctx.restore();
      if (title.leaveT >= TITLE_LEAVE) title.active = false;
    } else {
      drawTitle(ctx, now / 1000);
    }
    frameMs = frameMs * 0.9 + (performance.now() - t0) * 0.1;
    requestAnimationFrame(frame);
    return;
  }

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
  player, doc, astro, game,
  get mites() { return mites; },
  get npcs() { return npcs; },
  get room() { return room; },
  get transition() { return transition; },
  get dialogue() { return dialogue.active; },
  get flags() { return worldState.flags; },
  get stitch() { return stitch; },
  get spell() { return spellState; },
  get title() { return title; },
  skipTitle: () => skipTitle(),   // tests jump straight into the game
  cast: () => castSpell(),
  save: () => { doSave(); return JSON.parse(localStorage.getItem('tootsquest_save_v1')); },
  wipe: () => wipeSave(),
  // Force a conversation from the console: __TQ.talk('jessie').
  talk: (id) => {
    const n = npcs.find(x => x.id === id) || npcs[0];
    if (n) startDialogue(n, player);
    return n;
  },
  advance: () => advanceDialogue(),
  say: (x, y, text, opts) => spawnWord(x, y, text, opts),
  // Jump straight to a room's spawn point (testing): __TQ.goto('shopInterior').
  goto: (id) => {
    const r = getRoom(id);
    if (!r) return null;
    closeDialogue();
    transition = null;
    stitch = null;
    clearSpells();
    setRoom(id);
    player.x = r.decor.playerSpawn.x;
    player.y = r.decor.playerSpawn.y;
    placeDog(doc, player.x - 34, player.y + 8);
    placeDog(astro, player.x + 34, player.y + 20);
    mites = roomMites(room);
    npcs = roomNpcs(room);
    particles.length = 0;
    clearWords();
    buildAmbient();
    return room.id;
  },
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
