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
# ALWAYS SANITY-CHECK WITH THE NEGATIVE CONTROL, at a viewport >= 1000px:
#
#   await __cssFidelity({ minHref: '/_fid-styles-broken.css' })   // must FAIL
#
# It seeds the descendant :is() bug from styles.css:1660, which only applies once
# main.js has added .is-masonry and only inside @media (min-width: 1000px). If it
# reports PASS you are testing something that cannot see that class of breakage —
# most likely main.js did not run, or the viewport is too narrow.

set -euo pipefail
cd "$(dirname "$0")/.."

SHEETS=(styles.css subpages.css before-times.css)

echo "Minifying for fidelity comparison:"
for s in "${SHEETS[@]}"; do
  node tools/minify-css.js --out "_fid-${s}" "$s"
done

# Negative control: retighten the one space that must not be tightened.
python3 - <<'EOF'
src = open('_fid-styles.css').read()
broken = src.replace('[data-layout="columns"] :is(', '[data-layout="columns"]:is(')
if broken == src:
    raise SystemExit('  ! could not seed the negative control — has styles.css:1660 changed?')
open('_fid-styles-broken.css', 'w').write(broken)
print('  _fid-styles-broken.css: negative control seeded (descendant :is() tightened)')
EOF

echo ""
echo "Ready. Files are gitignored; delete with: rm -f _fid-*.css"
