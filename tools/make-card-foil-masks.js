#!/usr/bin/env node
/*
 * Generates the alpha masks that confine the foil sheen on the four "Recently"
 * cards. Companion to make-foil-mask.js, which does the same job for the single
 * about-card portrait; this one carries a recipe per card because the four
 * images are not one problem.
 *
 * Three keying modes, one per regime:
 *
 *   key    — distance to a sampled flat color, with a connected-component
 *            filter. For art where the cream is a real plate: the Junkyard
 *            Cabaret spotlight wedge, the Before Times title lettering.
 *
 *   warm   — lightness predicate under a hue/saturation gate, then blurred.
 *            Spectator's ground is textured intaglio print, so the cream is a
 *            continuum rather than a plate and a hard key returns speckle. The
 *            blur turns per-pixel grain into a field the foil can ride, which
 *            is also how foil actually behaves on toothy stock.
 *
 *   chroma  — alpha tracks saturation, gated by radius from center. This is the
 *            Toast card, where the foil rides the arcs and NOT the cream: the
 *            ground there is 77% of the image, and foiling it left nothing
 *            matte to read against. Saturated pixels fall into two clean
 *            clusters — the wordmark inside r<0.40 and the arc ring outside
 *            r>0.60, with a dead band between — so a ramp across that gap
 *            separates them without a hand-drawn mask. Alpha following chroma
 *            means each arc's own soft edge becomes the mask's feather.
 *
 * Masks ship at half resolution. They're soft fields sampled with
 * `mask-size: 100% 100%`, so the downscale is invisible and roughly quarters
 * the bytes.
 *
 * Usage: node tools/make-card-foil-masks.js [name ...]   (default: all)
 * Requires dwebp + cwebp (libwebp), already a dependency of the image pipeline.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = 'images/foil';

const RECIPES = {
  /* Arcs only. clo sits just above the ground's own chroma (~7) so the pale
     blue and peach arcs still register; any lower and the cream keys in. */
  toast: {
    src: 'images/ToastIQ-card.webp',
    out: 'toast-arcs-foil-mask.webp',
    mode: 'chroma',
    clo: 9, chi: 45, rIn: 0.50, rOut: 0.58, blur: 1,
    resize: [350, 197],
  },
  /* Spotlight wedge + the JUNKYARD lettering. tIn is wide because the poster
     carries a printed grain over the flat sand. The blob floor is low so
     individual letters survive; the wedge alone is ~11% of the image and each
     letter only a fraction of a percent. */
  jc: {
    src: 'audio/junkyard-cabaret/junkyard-cabaret-cover-card.webp',
    out: 'jc-foil-mask.webp',
    mode: 'key',
    key: [215, 175, 120], tIn: 30, tOut: 80, minBlob: 0.0002, dilate: 1,
    resize: [430, 430],
  },
  /* The paper ground. Luminance-led with a wide saturation gate: the paper
     reads s~0.45, so the tight gate that suits flat art excluded it entirely. */
  s2i: {
    src: 'images/s2i-title2-card.webp',
    out: 's2i-foil-mask.webp',
    mode: 'warm',
    lIn: 0.86, lOut: 0.70, sMax: 0.75, hLo: 0, hHi: 95, blur: 3,
    resize: [350, 228],
  },
  /* Title lettering, the open ledger, the desk lip. Smallest coverage of the
     four (~8%), which is why it reads as jewelry rather than a wash. */
  bt: {
    src: 'images/before-times-card.webp',
    out: 'bt-foil-mask.webp',
    mode: 'key',
    key: [205, 165, 118], tIn: 40, tOut: 95, minBlob: 0.0001, dilate: 1,
    resize: [350, 184],
  },
};

// --- PAM plumbing -----------------------------------------------------------

function readPAM(file) {
  const b = fs.readFileSync(file);
  let i = 0, hdr = '';
  for (;;) {
    const nl = b.indexOf(10, i);
    const line = b.slice(i, nl).toString();
    hdr += line + '\n';
    i = nl + 1;
    if (line.trim() === 'ENDHDR') break;
  }
  return {
    w: +/WIDTH (\d+)/.exec(hdr)[1],
    h: +/HEIGHT (\d+)/.exec(hdr)[1],
    depth: +/DEPTH (\d+)/.exec(hdr)[1],
    data: b.slice(i),
  };
}

function writePAM(file, w, h, rgba) {
  const hdr = Buffer.from(
    `P7\nWIDTH ${w}\nHEIGHT ${h}\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n`
  );
  fs.writeFileSync(file, Buffer.concat([hdr, rgba]));
}

const smooth = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

/* Keep every 8-connected blob covering at least `minFraction` of the image. */
function significantComponents(flags, w, h, minFraction) {
  const N = w * h;
  const label = new Int32Array(N).fill(-1);
  const queue = new Int32Array(N);
  const sizes = [];

  for (let start = 0; start < N; start++) {
    if (!flags[start] || label[start] !== -1) continue;
    const id = sizes.length;
    let head = 0, tail = 0, size = 0;
    queue[tail++] = start;
    label[start] = id;
    while (head < tail) {
      const p = queue[head++];
      size++;
      const px = p % w, py = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (flags[q] && label[q] === -1) { label[q] = id; queue[tail++] = q; }
        }
      }
    }
    sizes.push(size);
  }

  const floor = minFraction * N;
  const keep = sizes.map((s) => s >= floor);
  const out = new Uint8Array(N);
  for (let p = 0; p < N; p++) out[p] = label[p] !== -1 && keep[label[p]] ? 1 : 0;
  return { mask: out, total: sizes.length, kept: sizes.filter((_, i) => keep[i]).length };
}

function dilate(mask, w, h, iterations) {
  let cur = mask;
  for (let it = 0; it < iterations; it++) {
    const next = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (cur[p]) { next[p] = 1; continue; }
        for (let dy = -1; dy <= 1 && !next[p]; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (cur[ny * w + nx]) { next[p] = 1; break; }
          }
        }
      }
    }
    cur = next;
  }
  return cur;
}

/* Separable box blur over the alpha ramp. */
function boxBlur(a, w, h, r) {
  if (!r) return a;
  const mid = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, n = 0;
      for (let d = -r; d <= r; d++) {
        const nx = x + d;
        if (nx < 0 || nx >= w) continue;
        sum += a[y * w + nx]; n++;
      }
      mid[y * w + x] = sum / n;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, n = 0;
      for (let d = -r; d <= r; d++) {
        const ny = y + d;
        if (ny < 0 || ny >= h) continue;
        sum += mid[ny * w + x]; n++;
      }
      out[y * w + x] = sum / n;
    }
  }
  return out;
}

// --- keying -----------------------------------------------------------------

function keyMask(r, { w, h, depth, data }) {
  const N = w * h;
  const alpha = new Float32Array(N);
  const dist = new Float32Array(N);
  const core = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    const o = p * depth;
    const dr = data[o] - r.key[0], dg = data[o + 1] - r.key[1], db = data[o + 2] - r.key[2];
    const d = Math.sqrt(dr * dr + dg * dg + db * db);
    dist[p] = d;
    if (d <= r.tIn) core[p] = 1;
  }
  const { mask: plate, total, kept } = significantComponents(core, w, h, r.minBlob);
  const gate = dilate(plate, w, h, r.dilate);
  for (let p = 0; p < N; p++) {
    if (!gate[p]) continue;
    const d = dist[p];
    alpha[p] = d <= r.tIn ? 1 : d < r.tOut ? smooth(1 - (d - r.tIn) / (r.tOut - r.tIn)) : 0;
  }
  return { alpha, note: `${total} blobs keyed, ${kept} kept` };
}

function warmMask(r, { w, h, depth, data }) {
  const N = w * h;
  const alpha = new Float32Array(N);
  for (let p = 0; p < N; p++) {
    const o = p * depth;
    const [hh, s, l] = rgbToHsl(data[o], data[o + 1], data[o + 2]);
    if (hh < r.hLo || hh > r.hHi || s > r.sMax) continue;
    alpha[p] = smooth((l - r.lOut) / (r.lIn - r.lOut));
  }
  return { alpha, note: `lightness ${r.lOut}..${r.lIn}` };
}

function chromaMask(r, { w, h, depth, data }) {
  const N = w * h;
  const alpha = new Float32Array(N);
  const cx = w / 2, cy = h / 2, maxR = Math.hypot(cx, cy);
  for (let p = 0; p < N; p++) {
    const o = p * depth;
    const c = Math.max(data[o], data[o + 1], data[o + 2])
            - Math.min(data[o], data[o + 1], data[o + 2]);
    if (c <= r.clo) continue;
    const x = p % w, y = (p / w) | 0;
    const rad = Math.hypot(x - cx, y - cy) / maxR;
    const gate = smooth((rad - r.rIn) / (r.rOut - r.rIn));
    if (!gate) continue;
    alpha[p] = smooth((c - r.clo) / (r.chi - r.clo)) * gate;
  }
  return { alpha, note: `chroma ${r.clo}..${r.chi}, radial gate ${r.rIn}..${r.rOut}` };
}

const MODES = { key: keyMask, warm: warmMask, chroma: chromaMask };

// --- run --------------------------------------------------------------------

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(RECIPES);
fs.mkdirSync(OUT_DIR, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cardfoil-'));

try {
  for (const name of names) {
    const r = RECIPES[name];
    if (!r) {
      console.error(`unknown card "${name}" — known: ${Object.keys(RECIPES).join(', ')}`);
      process.exitCode = 1;
      continue;
    }
    const srcPam = path.join(tmp, 'src.pam');
    execFileSync('dwebp', ['-pam', r.src, '-o', srcPam], { stdio: 'pipe' });
    const img = readPAM(srcPam);
    const { w, h } = img;

    let { alpha, note } = MODES[r.mode](r, img);
    alpha = boxBlur(alpha, w, h, r.blur || 0);

    const rgba = Buffer.alloc(w * h * 4);
    let covered = 0;
    for (let p = 0; p < w * h; p++) {
      const a = Math.round(255 * Math.max(0, Math.min(1, alpha[p])));
      const o = p * 4;
      rgba[o] = 255; rgba[o + 1] = 255; rgba[o + 2] = 255; rgba[o + 3] = a;
      covered += a / 255;
    }

    const maskPam = path.join(tmp, 'mask.pam');
    writePAM(maskPam, w, h, rgba);
    const out = path.join(OUT_DIR, r.out);
    execFileSync('cwebp',
      ['-lossless', '-exact', '-resize', String(r.resize[0]), String(r.resize[1]), maskPam, '-o', out],
      { stdio: 'pipe' });

    console.log(`${name.padEnd(6)} ${path.basename(r.src)} ${w}x${h} [${r.mode}] ${note}`);
    console.log(`       coverage ${(100 * covered / (w * h)).toFixed(1)}%  ->  ${r.out} `
              + `${r.resize.join('x')} ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
