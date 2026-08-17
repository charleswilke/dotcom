#!/usr/bin/env node
/**
 * Zero-dependency, deliberately conservative CSS minifier.
 *
 * Used by the Vercel build step (see `buildCommand` in vercel.json) to minify
 * stylesheets in the build container. Source files in git stay authored-as-is,
 * and the local server keeps serving them unminified, so "no build step" still
 * holds everywhere you actually work.
 *
 *   node tools/minify-css.js styles.css subpages.css before-times.css   # in place
 *   node tools/minify-css.js --check styles.css                         # report only
 *   node tools/minify-css.js --out min.css styles.css                   # to a file
 *
 * WHAT IT DOES
 *   - strips comments
 *   - collapses each whitespace run to at most one space
 *   - removes whitespace adjacent to { } ; ,
 *   - drops the redundant ; before }
 *
 * WHAT IT REFUSES TO DO, AND WHY
 *   It never touches whitespace around ':'. In a declaration `a: b` the space is
 *   noise, but in a *selector* it is meaning:
 *
 *       .showcase-grid[data-layout="columns"] :is(.showcase-kicker, ...)
 *
 *   is a descendant :is(). Tighten that space and it becomes
 *   `[data-layout="columns"]:is(...)`, which matches the grid itself instead of
 *   its children — the kicker/meta/CTA silently lose `font-size: 0.76rem`. That
 *   bug is invisible unless main.js has added `.is-masonry`, so it is exactly
 *   the kind of thing a test run against static HTML will not catch. Telling
 *   selector context from declaration context needs a real parser; skipping ':'
 *   costs about one byte per declaration and removes the entire failure class.
 *
 *   That selector was real (it lived at styles.css:1660) but no longer exists —
 *   the caption type it sized folded back into the base values when the Recently
 *   cards shrank 20%. It is kept here as the worked example because the hazard
 *   is a property of CSS, not of that one rule: the next descendant `:is()`,
 *   `:where()` or `:not()` anyone writes reintroduces it silently. Do not
 *   "simplify" this rule away just because grep finds no current victim.
 *
 *   It also leaves '>' '+' '~' alone (cheap, and '+'/'-' inside calc() must keep
 *   their spaces), and copies strings and url() contents through verbatim so
 *   nothing inside them is ever rewritten.
 *
 * Output is deterministic: same input bytes always produce the same output
 * bytes, which is what lets stamp-code.sh hash the *source* and still describe
 * the deployed file uniquely.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const DELIMS = '{};,';

function minify(css) {
  const n = css.length;
  let out = '';
  let i = 0;
  let pendingWS = false;

  const flushWS = (nextChar) => {
    if (!pendingWS) return;
    pendingWS = false;
    const prev = out[out.length - 1];
    // A space is only droppable next to a delimiter; anywhere else it may be a
    // descendant combinator, or separate two values, so it has to survive.
    if (prev === undefined) return;
    if (DELIMS.includes(prev)) return;
    if (nextChar !== undefined && DELIMS.includes(nextChar)) return;
    out += ' ';
  };

  while (i < n) {
    const c = css[i];

    // Comment. Treated as whitespace: `margin:0/**/10px` must not become
    // `margin:010px`.
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      pendingWS = true;
      continue;
    }

    // Quoted string: copied verbatim, including any whitespace inside it.
    if (c === '"' || c === "'") {
      flushWS(c);
      const quote = c;
      let j = i + 1;
      while (j < n) {
        if (css[j] === '\\') { j += 2; continue; }
        if (css[j] === quote) { j++; break; }
        j++;
      }
      out += css.slice(i, j);
      i = j;
      continue;
    }

    // url(...) — may be unquoted and may contain ':' ';' ',' (data URIs do).
    if ((c === 'u' || c === 'U') && /^url\(/i.test(css.substr(i, 4))) {
      flushWS(c);
      out += css.substr(i, 4);
      let j = i + 4;
      while (j < n && css[j] !== ')') {
        if (css[j] === '"' || css[j] === "'") {
          const quote = css[j];
          let k = j + 1;
          while (k < n) {
            if (css[k] === '\\') { k += 2; continue; }
            if (css[k] === quote) { k++; break; }
            k++;
          }
          out += css.slice(j, k);
          j = k;
          continue;
        }
        out += css[j];
        j++;
      }
      if (j < n) { out += ')'; j++; }
      i = j;
      continue;
    }

    if (/\s/.test(c)) {
      let j = i;
      while (j < n && /\s/.test(css[j])) j++;
      pendingWS = true;
      i = j;
      continue;
    }

    if (DELIMS.includes(c)) {
      pendingWS = false;
      while (out.length && out[out.length - 1] === ' ') out = out.slice(0, -1);
      if (c === '}') {
        while (out.length && out[out.length - 1] === ';') out = out.slice(0, -1);
      }
      out += c;
      i++;
      continue;
    }

    flushWS(c);
    out += c;
    i++;
  }

  return out.trim();
}

// --- sanity checks, run on every invocation (cheap, and this file has no tests)
const SELF_TESTS = [
  ['a{color:red}', 'a{color:red}'],
  ['a { color : red ; }', 'a{color : red}'],
  ['a/*c*/b{x:1}', 'a b{x:1}'],
  ['a{margin:0/*c*/10px}', 'a{margin:0 10px}'],
  ['.a :is(.b, .c){x:1}', '.a :is(.b,.c){x:1}'],          // descendant space kept
  ['.a:hover{x:1}', '.a:hover{x:1}'],
  ['a{width:calc(100% + 4px)}', 'a{width:calc(100% + 4px)}'], // calc spacing kept
  ['a{content:"  x  "}', 'a{content:"  x  "}'],            // string preserved
  ['a{background:url(data:image/svg+xml;base64,AA==)}', 'a{background:url(data:image/svg+xml;base64,AA==)}'],
  ['@media (min-width: 768px) and (max-width: 999px){a{x:1}}',
   '@media (min-width: 768px) and (max-width: 999px){a{x:1}}'],
  ['a{x:1;}\n\nb{y:2;}', 'a{x:1}b{y:2}'],
];
for (const [input, want] of SELF_TESTS) {
  const got = minify(input);
  if (got !== want) {
    console.error('minify-css.js self-test FAILED');
    console.error('  input: ' + JSON.stringify(input));
    console.error('  want : ' + JSON.stringify(want));
    console.error('  got  : ' + JSON.stringify(got));
    process.exit(2);
  }
}

const argv = process.argv.slice(2);
let checkOnly = false;
let outFile = null;
const files = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--check') checkOnly = true;
  else if (argv[i] === '--out') outFile = argv[++i];
  else files.push(argv[i]);
}

if (!files.length) {
  console.error('Usage: node tools/minify-css.js [--check] [--out FILE] <file.css...>');
  process.exit(1);
}
if (outFile && files.length > 1) {
  console.error('--out takes a single input file.');
  process.exit(1);
}

const kb = (b) => (b / 1024).toFixed(1) + 'K';
let totalIn = 0;
let totalOut = 0;

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error('  ! ' + f + ' not found');
    process.exit(1);
  }
  const src = fs.readFileSync(f, 'utf8');
  const min = minify(src);
  totalIn += Buffer.byteLength(src);
  totalOut += Buffer.byteLength(min);

  // Structural guard: minifying must never change the brace balance.
  const braces = (s) => [(s.match(/\{/g) || []).length, (s.match(/\}/g) || []).length];
  const [bo, bc] = braces(src);
  const [mo, mc] = braces(min);
  if (bo !== mo || bc !== mc) {
    console.error(`  ! ${f}: brace count changed (${bo}/${bc} -> ${mo}/${mc}) — refusing to write`);
    process.exit(3);
  }

  const pct = ((1 - Buffer.byteLength(min) / Buffer.byteLength(src)) * 100).toFixed(1);
  console.log(`  ${path.basename(f)}: ${kb(Buffer.byteLength(src))} -> ${kb(Buffer.byteLength(min))}  (-${pct}%)`);

  if (checkOnly) continue;
  fs.writeFileSync(outFile || f, min);
}

if (files.length > 1) {
  console.log(`  total: ${kb(totalIn)} -> ${kb(totalOut)}  (-${((1 - totalOut / totalIn) * 100).toFixed(1)}%)`);
}
if (checkOnly) console.log('  (--check: nothing written)');
