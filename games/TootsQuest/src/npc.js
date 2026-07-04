// NPCs and dialogue — townsfolk as shape grammars, speech as comic balloons.
//
// Placement lives in room decor data (terrain.js); who they ARE lives here.
// Balloons are the renderer's native tongue: a rounded blob with a tail,
// drawn with the fill–fat-stroke–refill trick (M0 technique 2), so the seam
// where the tail meets the bubble vanishes under the refill. In print mode
// the balloon's color plate drifts like everything else; the lettering is
// ink, so it stays registered (gotcha 6).
//
// Dialogue deliberately does NOT pause the world (pillar 1: the world keeps
// living). The player is input-locked while talking; if something hurts him
// mid-sentence, the conversation breaks off (main.js closes it on hurt).

import {
  TAU, PALETTE, PRINT, clamp, dist, capsule, inkCircle, inkEllipse,
} from './ink.js';
import { worldState, setFlag } from './state.js';

export const TALK_RADIUS = 52;

const BALLOON_FONT = "bold 12.5px 'Chalkboard SE','Comic Sans MS',sans-serif";
const NAME_FONT = "bold 9px 'Chalkboard SE','Comic Sans MS',sans-serif";
const CHARS_PER_SEC = 45;
const MAX_TEXT_W = 240;
const LINE_H = 17;

// ---------------------------------------------------------------------------
// The cast. `lines(flags)` returns this NPC's pages for the current world
// state — flag-reactive dialogue per PRD §2.5 (one flag, one alternate line).
// ---------------------------------------------------------------------------

const NPC_DEFS = {
  jessie: {
    name: 'Jessie',
    lines: (f) => f.slain_mite
      ? [
        "Rust flecks on your tunic. You've been scrapping with the junk mites, haven't you?",
        "Careful out there. Even little things come apart when the static gets in them.",
        "See the standing hoops around town? They hold your place in the pattern. Rest by one when the road's been rough.",
        "Bring me a lost pattern from your travels and I'll stitch you something with a little luck in it.",
      ]
      : [
        "Welcome to the Haus of Toots! Every stitch remembers something.",
        "The world's gone a bit fuzzy at the edges lately... so I stitch harder.",
        "See the standing hoops around town? They hold your place in the pattern. Rest by one when the road's been rough.",
        "If you find a lost pattern out there, bring it home to me.",
      ],
    draw(ctx, n, t) {
      const breathe = Math.sin(t * 1.8 + 1) * 0.6;
      const [ex, ey] = n.look();
      inkEllipse(ctx, n.x, n.y + 1, 11, 4.5, 0, 'rgba(34,26,86,0.22)', null);
      // Slate dress with a cream apron.
      capsule(ctx, n.x, n.y - 8, n.x, n.y - 19 - breathe, 15, PALETTE.slate, PALETTE.ink, 2.4);
      inkEllipse(ctx, n.x, n.y - 10, 5, 6.5, 0, PALETTE.cream, null);
      // A row of tiny orange stitches across the apron hem.
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      for (const sx of [-3, 0, 3]) {
        ctx.beginPath();
        ctx.moveTo(n.x + sx - 1.2, n.y - 7); ctx.lineTo(n.x + sx + 1.2, n.y - 4.6);
        ctx.moveTo(n.x + sx + 1.2, n.y - 7); ctx.lineTo(n.x + sx - 1.2, n.y - 4.6);
        ctx.stroke();
      }
      // Head, bun, eyes that find Toots.
      const hy = n.y - 27 - breathe;
      inkCircle(ctx, n.x, hy, 8, PALETTE.skin, PALETTE.ink, 2.4);
      inkCircle(ctx, n.x - 6, hy - 6, 4.5, PALETTE.ink, null);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(n.x, hy, 8.5, Math.PI * 1.05, Math.PI * 1.7);
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath(); ctx.arc(n.x - 2.6 + ex, hy - 0.5 + ey, 1.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(n.x + 2.6 + ex, hy - 0.5 + ey, 1.3, 0, TAU); ctx.fill();
      // Her embroidery hoop, mid-project, bobbing with the breath.
      const hx = n.x + 11, hyy = n.y - 12 - breathe * 0.5;
      inkCircle(ctx, hx, hyy, 4.8, PALETTE.cream, PALETTE.ink, 2);
      ctx.strokeStyle = PALETTE.orange;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx - 1.7, hyy - 1.7); ctx.lineTo(hx + 1.7, hyy + 1.7);
      ctx.moveTo(hx + 1.7, hyy - 1.7); ctx.lineTo(hx - 1.7, hyy + 1.7);
      ctx.stroke();
    },
  },

  wren: {
    name: 'Old Wren',
    lines: (f) => {
      const pages = [
        "Shh. Hear that? The pond used to hum a low B flat. Now it just... hisses.",
        "The towers east of here keep dropping their signal. That's not weather, kid. That's the Static.",
      ];
      pages.push(f.talked_jessie
        ? "You've met Jessie? Good. Somebody in this hollow still keeps the pattern."
        : "If your ears ring out there, that's not you. That's the world going out of tune.");
      return pages;
    },
    draw(ctx, n, t) {
      const breathe = Math.sin(t * 1.5) * 0.5;
      const tilt = Math.sin(t * 0.6) * 0.05;   // always listening
      const [ex, ey] = n.look();
      inkEllipse(ctx, n.x, n.y + 1, 11, 4.5, 0, 'rgba(34,26,86,0.22)', null);
      // Rust coat.
      capsule(ctx, n.x, n.y - 8, n.x, n.y - 18 - breathe, 14, PALETTE.rust, PALETTE.ink, 2.4);
      ctx.save();
      ctx.translate(n.x, n.y - 26 - breathe);
      ctx.rotate(tilt);
      // Beard first, head on top, flat cap over it all.
      inkEllipse(ctx, 0, 3.5, 6, 5, 0, PALETTE.cream, PALETTE.ink, 2);
      inkCircle(ctx, 0, -1, 7.5, PALETTE.skin, PALETTE.ink, 2.4);
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath(); ctx.arc(-2.6 + ex, -2 + ey, 1.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(2.6 + ex, -2 + ey, 1.3, 0, TAU); ctx.fill();
      inkEllipse(ctx, 0, -6.5, 8, 3.2, 0, PALETTE.ink, null);
      inkEllipse(ctx, 3.5, -5.5, 5.5, 1.8, 0.15, PALETTE.ink, null);
      ctx.restore();
      // His portable radio: slate box, antenna, neon standby blink. Neon
      // means "tuned/alive" in both worlds — his still works. For now.
      const rx = n.x - 12, ry = n.y - 11;
      ctx.fillStyle = PALETTE.slate;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(rx - 4.5, ry - 6, 9, 8, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rx + 3, ry - 6);
      ctx.lineTo(rx + 7, ry - 15);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.globalAlpha = 0.55 + Math.sin(t * 2.4) * 0.45;
      ctx.fillStyle = PALETTE.neon;
      ctx.beginPath(); ctx.arc(rx + 7, ry - 15, 1.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    },
  },
};

// ---------------------------------------------------------------------------
// NPC entity — stands its ground, breathes, turns to face Toots when close.
// ---------------------------------------------------------------------------

export class NPC {
  constructor(id, x, y) {
    this.id = id;
    this.def = NPC_DEFS[id];
    this.x = x; this.y = y;
    this.r = 8;
    this.face = Math.PI / 2;   // toward the camera by default
    this.near = false;
  }

  update(dt, player) {
    const d = dist(this.x, this.y, player.x, player.y);
    this.near = d < 140;
    if (this.near) this.face = Math.atan2(player.y - this.y, player.x - this.x);
  }

  // Eye offset toward whoever they're looking at.
  look() {
    return [Math.cos(this.face) * 2.6, Math.sin(this.face) * 1.6];
  }

  draw(ctx, t) { this.def.draw(ctx, this, t); }
}

// ---------------------------------------------------------------------------
// Dialogue — one conversation at a time, typewriter reveal, comic balloon.
// ---------------------------------------------------------------------------

export const dialogue = { active: null };  // {npc, pages, page, chars}

export function startDialogue(npc, player) {
  dialogue.active = {
    npc,
    pages: npc.def.lines(worldState.flags),
    page: 0,
    chars: 0,
  };
  npc.face = Math.atan2(player.y - npc.y, player.x - npc.x);
  player.face = Math.atan2(npc.y - player.y, npc.x - player.x);
  player.attack = null;
  player.attackQueued = false;
}

// One press: finish the typewriter if it's mid-page, else turn the page,
// else end the conversation (and remember it happened).
export function advanceDialogue() {
  const d = dialogue.active;
  if (!d) return;
  if (d.chars < d.pages[d.page].length) { d.chars = d.pages[d.page].length; return; }
  if (d.page < d.pages.length - 1) { d.page++; d.chars = 0; return; }
  setFlag(`talked_${d.npc.id}`);
  dialogue.active = null;
}

export function closeDialogue() { dialogue.active = null; }

export function updateDialogue(dt) {
  const d = dialogue.active;
  if (d) d.chars = Math.min(d.chars + dt * CHARS_PER_SEC, d.pages[d.page].length);
}

function wrapText(ctx, text, maxW) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const probe = line ? `${line} ${word}` : word;
    if (ctx.measureText(probe).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawDialogue(ctx, worldW, time) {
  const d = dialogue.active;
  if (!d) return;
  const npc = d.npc;
  const text = d.pages[d.page].toUpperCase();   // comic lettering is caps
  const shown = Math.floor(d.chars);

  ctx.font = BALLOON_FONT;
  const lines = wrapText(ctx, text, MAX_TEXT_W);
  const textW = Math.max(48, ...lines.map(l => ctx.measureText(l).width));
  const w = textW + 30;
  const h = lines.length * LINE_H + 22;
  const bx = clamp(npc.x, w / 2 + 18, worldW - w / 2 - 18);
  const by = Math.max(18, npc.y - 62 - h);
  const tailX = clamp(npc.x, bx - w / 2 + 18, bx + w / 2 - 18);

  // Balloon: fill, fat stroke, refill — the refill swallows the seam where
  // the tail triangle joins the bubble. Print mode drifts the refill plate.
  const path = () => {
    ctx.beginPath();
    ctx.roundRect(bx - w / 2, by, w, h, 13);
    ctx.moveTo(tailX - 8, by + h - 2);
    ctx.lineTo(npc.x, npc.y - 42);
    ctx.lineTo(tailX + 8, by + h - 2);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = PALETTE.cream;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.stroke();
  if (PRINT.on) {
    ctx.save();
    ctx.translate(PRINT.mx, PRINT.my);
    path();
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fill();
  }

  // Name tag riding the balloon's top edge, like a tiny caption box.
  ctx.font = NAME_FONT;
  const name = npc.def.name.toUpperCase();
  const nw = ctx.measureText(name).width + 10;
  ctx.fillStyle = PALETTE.orange;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bx - w / 2 + 10, by - 7, nw, 13, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.textAlign = 'left';
  ctx.fillText(name, bx - w / 2 + 15, by + 3);

  // The lettering — ink, revealed by the typewriter.
  ctx.font = BALLOON_FONT;
  ctx.fillStyle = PALETTE.ink;
  let remaining = shown;
  for (let i = 0; i < lines.length && remaining > 0; i++) {
    ctx.fillText(lines[i].slice(0, remaining), bx - w / 2 + 15, by + 24 + i * LINE_H);
    remaining -= lines[i].length + 1;   // +1 for the swallowed space
  }

  // Page-turn cue once the line has fully landed.
  if (shown >= text.length) {
    const ay = by + h - 8 + Math.sin(time * 5) * 1.5;
    const ax = bx + w / 2 - 14;
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.moveTo(ax - 4, ay - 4);
    ctx.lineTo(ax + 4, ay - 4);
    ctx.lineTo(ax, ay + 2);
    ctx.closePath();
    ctx.fill();
  }
}

// A "…" thought-mote above an NPC in talk range: the comic-native prompt.
export function drawTalkHint(ctx, npc, time) {
  const y = npc.y - 52 + Math.sin(time * 2.4) * 1.5;
  inkEllipse(ctx, npc.x, y, 13, 9, 0, PALETTE.cream, PALETTE.ink, 2.2);
  inkCircle(ctx, npc.x - 6, y + 11, 2.6, PALETTE.cream, PALETTE.ink, 1.8);
  inkCircle(ctx, npc.x - 10, y + 16, 1.5, PALETTE.cream, PALETTE.ink, 1.4);
  ctx.fillStyle = PALETTE.ink;
  for (const dx of [-5, 0, 5]) {
    ctx.beginPath();
    ctx.arc(npc.x + dx, y, 1.6, 0, TAU);
    ctx.fill();
  }
}
