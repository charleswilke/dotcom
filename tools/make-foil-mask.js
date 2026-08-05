#!/usr/bin/env node
/*
 * Generates the alpha mask that confines the about-card's foil sheen to the
 * orange hexagon plate behind Charles, so the shimmer never crosses his face,
 * hair, or shirt.
 *
 * The source illustration is flat-colored, so the hexagon color-keys cleanly:
 * 16.4% of pixels land within 10 units of the orange, and the next occupied
 * band doesn't start until ~100. Everything between is anti-aliased edge, which
 * becomes a soft alpha ramp instead of a stair-stepped border.
 *
 * His head and shoulders split the plate into two lobes (~8.7% and ~8.0%), so
 * the blob filter keeps everything above a size floor rather than just the
 * largest. The floor is generous: the real lobes are ~60k px each and the next
 * biggest blob is 12 px of anti-alias speckle along his hair.
 *
 * Usage: node tools/make-foil-mask.js [src.webp] [out.webp]
 * Requires dwebp + cwebp (libwebp), already a dependency of the image pipeline.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = process.argv[2] || 'images/cw4-card.webp';
const OUT = process.argv[3] || 'images/cw4-card-foil-mask.webp';

const KEY = [237, 127, 60]; // sampled flat orange of the hexagon plate
const T_IN = 20;   // at or below this distance: fully foil
const T_OUT = 90;  // at or above this distance: no foil (ramp between)
const GATE_DILATE = 3; // px of growth on the core blob, so the ramp isn't clipped
const MIN_BLOB = 0.005; // fraction of the image a blob must cover to count as plate

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

/* Keep every 8-connected blob of `flags` covering at least `minFraction`. */
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
          if (flags[q] && label[q] === -1) {
            label[q] = id;
            queue[tail++] = q;
          }
        }
      }
    }
    sizes.push(size);
  }

  const floor = minFraction * N;
  const keep = sizes.map((s) => s >= floor);
  const out = new Uint8Array(N);
  for (let p = 0; p < N; p++) out[p] = label[p] !== -1 && keep[label[p]] ? 1 : 0;

  return {
    mask: out,
    total: sizes.length,
    kept: sizes.filter((_, i) => keep[i]).sort((a, b) => b - a),
  };
}

function dilate(mask, w, h, iterations) {
  let cur = mask;
  for (let it = 0; it < iterations; it++) {
    const nextMask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (cur[p]) { nextMask[p] = 1; continue; }
        for (let dy = -1; dy <= 1 && !nextMask[p]; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (cur[ny * w + nx]) { nextMask[p] = 1; break; }
          }
        }
      }
    }
    cur = nextMask;
  }
  return cur;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'foilmask-'));
const srcPam = path.join(tmp, 'src.pam');
const outPam = path.join(tmp, 'mask.pam');

try {
  execFileSync('dwebp', ['-pam', SRC, '-o', srcPam], { stdio: 'pipe' });
  const { w, h, depth, data } = readPAM(srcPam);
  const N = w * h;

  // Distance to the key color, plus the hard core used for blob detection.
  const dist = new Float32Array(N);
  const core = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    const o = p * depth;
    const dr = data[o] - KEY[0], dg = data[o + 1] - KEY[1], db = data[o + 2] - KEY[2];
    const d = Math.sqrt(dr * dr + dg * dg + db * db);
    dist[p] = d;
    if (d <= T_IN) core[p] = 1;
  }

  const { mask: plate, total, kept } = significantComponents(core, w, h, MIN_BLOB);
  const gate = dilate(plate, w, h, GATE_DILATE);

  const rgba = Buffer.alloc(N * 4);
  let covered = 0;
  for (let p = 0; p < N; p++) {
    let a = 0;
    if (gate[p]) {
      const d = dist[p];
      if (d <= T_IN) a = 255;
      else if (d < T_OUT) {
        // smoothstep so the hexagon edge and the silhouette of his hair and
        // shoulder feather instead of aliasing.
        const t = 1 - (d - T_IN) / (T_OUT - T_IN);
        a = Math.round(255 * t * t * (3 - 2 * t));
      }
    }
    const o = p * 4;
    rgba[o] = 255; rgba[o + 1] = 255; rgba[o + 2] = 255; rgba[o + 3] = a;
    covered += a / 255;
  }

  writePAM(outPam, w, h, rgba);
  execFileSync('cwebp', ['-lossless', '-exact', outPam, '-o', OUT], { stdio: 'pipe' });

  const bytes = fs.statSync(OUT).size;
  console.log(`source      ${SRC} (${w}x${h})`);
  console.log(`blobs       ${total} keyed, ${kept.length} kept: ${kept.map((s) => (100 * s / N).toFixed(2) + '%').join(' + ')}`);
  console.log(`coverage    ${(100 * covered / N).toFixed(2)}% of the card carries foil`);
  console.log(`wrote       ${OUT} (${(bytes / 1024).toFixed(1)} KB)`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
