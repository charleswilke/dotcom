/**
 * CSS minification fidelity harness.
 *
 * Proves a minified stylesheet renders identically to its source by diffing
 * computed styles for every element on a *live* page — main.js already run, its
 * classes applied, lightboxes open if you opened them. That "live" part matters:
 * an earlier version of this check stripped main.js to get a deterministic DOM
 * and, in doing so, silently missed a real bug. `styles.css:1660` has a
 * descendant `:is()` that only applies once main.js has added `.is-masonry`, so
 * against static HTML the broken and correct sheets looked identical.
 *
 * Load it into a page and call it:
 *
 *   <script src="/tools/css-fidelity-check.js"></script>
 *   await __cssFidelity({ minHref: '/_fidelity/styles.css' })
 *
 * THE CONTROL. A live page drifts on its own — lazy init, IntersectionObserver
 * reveals, scroll effects — so "snapshot, swap, snapshot" alone cannot tell a
 * stylesheet difference from a page that simply moved on. This takes a third
 * snapshot after swapping back and requires it to match the first. If
 * `controlDrift` is non-zero the run is void, not passing: fix the drift (or
 * hold the page stiller) before believing `differences`.
 */

(function () {
  'use strict';

  const PROPS = [
    'display', 'position', 'width', 'height', 'boxSizing',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'color', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition',
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing',
    'textTransform', 'textAlign', 'textDecorationLine', 'whiteSpace',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderTopColor', 'borderTopStyle', 'borderRadius',
    'boxShadow', 'textShadow', 'opacity', 'zIndex', 'visibility',
    'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignSelf', 'flexGrow', 'flexBasis',
    'gridTemplateColumns', 'gridTemplateRows', 'gridColumn', 'gridRow', 'gap',
    'overflowX', 'overflowY', 'top', 'left', 'right', 'bottom', 'inset',
    'transform', 'transformOrigin', 'filter', 'backdropFilter', 'clipPath',
    'mixBlendMode', 'isolation', 'objectFit', 'order', 'pointerEvents', 'content'
  ];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function killAnimations() {
    if (document.getElementById('__fidelity-freeze')) return;
    const s = document.createElement('style');
    s.id = '__fidelity-freeze';
    // Not part of the comparison: both snapshots see the same frozen state, and
    // animated values would otherwise register as drift on every run.
    s.textContent =
      '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(s);
  }

  function snapshot() {
    void document.body.offsetHeight; // force layout before reading
    const els = Array.prototype.slice.call(document.querySelectorAll('*'))
      .filter((e) => e.id !== '__fidelity-freeze' && e.tagName !== 'SCRIPT');
    return els.map((e) => {
      const c = getComputedStyle(e);
      const vals = new Array(PROPS.length);
      for (let i = 0; i < PROPS.length; i++) vals[i] = c[PROPS[i]];
      let label = e.tagName.toLowerCase();
      if (e.id) label += '#' + e.id;
      const cls = (e.getAttribute && e.getAttribute('class')) || '';
      if (cls) label += '.' + cls.trim().split(/\s+/).slice(0, 3).join('.');
      return [label, vals.join('')];
    });
  }

  function swap(link, href) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      link.addEventListener('load', finish, { once: true });
      link.addEventListener('error', finish, { once: true });
      link.setAttribute('href', href);
      setTimeout(finish, 6000); // never hang the run on a sheet that won't fire
    });
  }

  function diff(a, b, limit) {
    const out = [];
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i][1] === b[i][1]) continue;
      const av = a[i][1].split('');
      const bv = b[i][1].split('');
      const changed = [];
      for (let j = 0; j < PROPS.length; j++) {
        if (av[j] !== bv[j]) changed.push(PROPS[j] + ': "' + av[j] + '" vs "' + bv[j] + '"');
      }
      if (out.length < limit) out.push({ el: a[i][0].slice(0, 70), changed: changed });
      else out.push(null);
    }
    return out;
  }

  window.__cssFidelity = async function (opts) {
    const o = opts || {};
    const minHref = o.minHref;
    const settle = o.settle || 250;
    const limit = o.limit || 12;
    const selector = o.selector || 'link[rel="stylesheet"][href*=".css"]:not([href*="fonts.g"])';

    const link = document.querySelector(selector);
    if (!link) return { error: 'no stylesheet link matched: ' + selector };
    if (!minHref) return { error: 'minHref is required' };
    const origHref = link.getAttribute('href');

    killAnimations();
    window.scrollTo(0, 0);
    await sleep(settle);

    const a1 = snapshot();
    await swap(link, minHref);
    await sleep(settle);
    const b = snapshot();
    await swap(link, origHref);
    await sleep(settle);
    const a2 = snapshot();

    if (a1.length !== b.length || a1.length !== a2.length) {
      return {
        error: 'element count changed mid-run — DOM is not stable',
        counts: [a1.length, b.length, a2.length]
      };
    }

    const control = diff(a1, a2, limit).filter(Boolean);
    const real = diff(a1, b, limit).filter(Boolean);

    return {
      page: location.pathname,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      sheet: origHref,
      minSheet: minHref,
      elementsCompared: a1.length,
      propsPerElement: PROPS.length,
      totalComparisons: a1.length * PROPS.length,
      controlDrift: control.length,
      controlSample: control.slice(0, 4),
      differences: real.length,
      sample: real.slice(0, limit),
      verdict: control.length
        ? 'VOID — page drifted, rerun'
        : (real.length ? 'FAIL — minified sheet renders differently' : 'PASS')
    };
  };
})();
