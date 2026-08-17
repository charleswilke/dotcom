#!/bin/bash
# Generate the minified stylesheets the CSS fidelity harness compares against,
# plus a deliberately-broken sheet to prove the harness can still see a bug.
#
#   ./tools/css-fidelity-check.sh
#
# Then, with the local server running (node .claude/static-server.js), open a
# page and run the harness in the browser console:
#
#   var s=document.createElement('script');
#   s.src='/tools/css-fidelity-check.js';
#   document.head.appendChild(s);
#
#   await __cssFidelity({ minHref: '/_fid-styles.css' })          // index.html
#   await __cssFidelity({ minHref: '/_fid-subpages.css' })        // faq / aiw / jb
#   await __cssFidelity({ minHref: '/_fid-before-times.css' })    // before-times
#
# Expect { verdict: 'PASS', controlDrift: 0, differences: 0 }. A non-zero
# controlDrift voids the run rather than failing it — the page moved under the
# test — so rerun before drawing any conclusion.
#
# WHY THE FILES LAND IN THE REPO ROOT (and are gitignored) rather than a
# subdirectory: relative url() inside a stylesheet resolves against the
# stylesheet's own location. Served from /_fidelity/styles.css, every
# `url(images/…)` would resolve to /_fidelity/images/… and the harness would
# report background-image differences that minification did not cause. Root-level
# names keep the resolution identical to the original.
#
# ALWAYS SANITY-CHECK WITH THE NEGATIVE CONTROL, at a viewport >= 768px:
#
#   await __cssFidelity({ minHref: '/_fid-styles-broken.css' })   // must FAIL
#
# It tightens a descendant combinator so the Recently card titles lose their
# 1.05rem, which only applies once main.js has laid the grid out and only inside
# @media (min-width: 768px). If it reports PASS you are testing something that
# cannot see that class of breakage — most likely main.js did not run, or the
# viewport is too narrow. (The threshold was >= 1000px while the control seeded
# the descendant :is() at styles.css:1660; that selector no longer exists.)

set -euo pipefail
cd "$(dirname "$0")/.."

SHEETS=(styles.css subpages.css before-times.css)

echo "Minifying for fidelity comparison:"
for s in "${SHEETS[@]}"; do
  node tools/minify-css.js --out "_fid-${s}" "$s"
done

# Negative control: retighten a space that must not be tightened.
#
# This used to seed the descendant :is() at styles.css:1660, which was the
# minifier's whole reason for skipping ':'. That selector is gone — the caption
# type it sized got folded back into the base values when the Recently cards
# came down 20% — and the guard below is what caught its absence rather than
# letting the control go quietly inert. The hazard class is unchanged, so the
# minifier still skips ':'; only the anchor moved.
#
# The replacement tightens the descendant space in the Recently h3 sizing rule,
# which collapses `.showcase-grid[data-layout="columns"] .showcase-caption h3`
# into a compound selector matching nothing. Both selectors in that rule carry
# the same needle, so a global replace breaks the featured card too, and the
# titles fall from 1.05rem back to 1.15rem. Same failure shape as the :is() bug
# — a rule that silently stops applying — and it needs main.js for the layout,
# so a static-HTML run still cannot see it.
python3 - <<'EOF'
NEEDLE = '[data-layout="columns"] '
src = open('_fid-styles.css').read()
if src.count(NEEDLE) < 2:
    raise SystemExit(
        '  ! could not seed the negative control — the descendant '
        '[data-layout="columns"] selectors in styles.css have changed. '
        'Pick a live descendant selector whose tightening changes computed '
        'style on index.html, and update NEEDLE.')
broken = src.replace(NEEDLE, NEEDLE.rstrip())
open('_fid-styles-broken.css', 'w').write(broken)
print('  _fid-styles-broken.css: negative control seeded '
      '(descendant combinator tightened in the Recently h3 rule)')
EOF

echo ""
echo "Ready. Files are gitignored; delete with: rm -f _fid-*.css"
