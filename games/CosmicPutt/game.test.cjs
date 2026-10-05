const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const P = require('./physics.js'), S = require('./scoring.js'), V = require('./view.js'), M = require('./motion.js');

// Exercise the actual game loop and controls with a silent Canvas and deterministic RAF.
function game(reduced = false) {
  const ballScales = [], putterFaces = [], properties = {}; let lastScale, path = [];
  const context = new Proxy({}, { get: (_, key) => {
    if (key === 'beginPath') return () => { path = []; };
    if (key === 'moveTo' || key === 'lineTo') return (x, y) => { path.push({ x, y }); };
    if (key === 'stroke') return () => {
      if (properties.strokeStyle === '#e1f4ff' && properties.lineWidth === 5 && path.length === 2) {
        putterFaces.push({ setback: 1 - path[0].x, opacity: properties.globalAlpha });
      }
    };
    if (key === 'scale') return (x, y) => { lastScale = { x, y }; };
    if (key === 'createRadialGradient') return () => { ballScales.push(lastScale); return { addColorStop() {} }; };
    if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
    return () => {};
  }, set: (_, key, value) => { properties[key] = value; return true; } });
  function element() {
    return { children: [], handlers: {}, attributes: {}, dataset: {}, style: { setProperty() {} }, hidden: true,
      classList: { toggle() {} }, addEventListener(name, handler) { this.handlers[name] = handler; },
      append(...children) { this.children.push(...children); }, replaceChildren() { this.children = []; },
      setAttribute(name, value) { this.attributes[name] = value; }, getAttribute(name) { return this.attributes[name]; },
      getBoundingClientRect() { return { left: 0, top: 0, width: 1100, height: 650 }; },
      getContext() { return context; }, querySelector() { return this.stars ??= element(); },
      focus() {}, closest() { return null; }, hasPointerCapture() { return false; } };
  }
  const elements = new Map(), get = id => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  const handlers = {};
  const document = { hidden: false, getElementById: get, createElement: element,
    querySelector: get, querySelectorAll: () => get('hole-navigation').children,
    addEventListener: (name, fn) => { handlers[name] = fn; } };
  let nextFrame, stamp = 0;
  const steps = [];
  const physics = { ...P, step(...args) { const result = P.step(...args); steps.push({ ...result }); return result; } };
  const window = { CosmicPhysics: physics, CosmicScoring: S, CosmicView: V, CosmicMotion: M,
    devicePixelRatio: 1, addEventListener() {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('./game.js'), 'utf8'), {
    window, document, matchMedia: query => ({ matches: query.includes('reduced-motion') && reduced }),
    Path2D: class { lineTo() {} moveTo() {} closePath() {} },
    requestAnimationFrame: fn => { nextFrame = fn; }
  });
  return { get, steps, ballScales, putterFaces,
    frame() { stamp += 1000 / 120; nextFrame(stamp); },
    key(key, shiftKey = false) { handlers.keydown({ key, shiftKey, target: get('course'), preventDefault() {} }); },
    click(id) { get(id).handlers.click(); },
    until(predicate) { for (let i = 0; i < 4000 && !predicate(); i++) this.frame(); assert.ok(predicate()); },
    hole(index) { get('hole-navigation').children[index].handlers.click(); }
  };
}
test('the hit compresses at the tee before movement, counts once, and restart cancels it', () => {
  const g = game(); g.frame(); g.key(' '); g.key(' ');
  for (let i = 0; i < 7; i++) {
    const before = g.putterFaces.length; g.frame();
    assert.equal(g.putterFaces.length, before + 1, 'the club stays visible while approaching');
    assert.equal(g.ballScales.at(-1).x, 1, 'no squash before the face arrives');
  }
  for (let i = 0; i < 7; i++) {
    const before = g.putterFaces.length; g.frame();
    assert.equal(g.putterFaces.length, before + 1, 'the club stays visible through compression');
  }
  assert.equal(g.steps.length, 0);
  assert.equal(g.get('strokes').textContent, 1);
  assert.ok(g.ballScales.some(s => s.x < .65 && s.y > 1.5), 'the marble renderer compresses the ball itself');
  g.frame(); g.frame(); assert.ok(g.steps.length > 0);
  assert.ok(g.steps[0].x > P.level.tee.x);
  for (let i = 0; i < 20; i++) g.frame();
  assert.ok(g.ballScales.some(s => s.x > 1.5 && s.y < .67), 'the moving marble becomes visibly elongated');
  const cancelled = game(); cancelled.frame(); cancelled.key(' '); cancelled.click('reset');
  for (let i = 0; i < 120; i++) cancelled.frame();
  assert.equal(cancelled.steps.length, 0);
  assert.equal(cancelled.get('strokes').textContent, 0);
  const reduced = game(true); reduced.frame(); reduced.key(' '); reduced.frame();
  assert.ok(reduced.steps.length > 0);
});
function ace(g) {
  g.hole(2); g.key('ArrowLeft'); g.key('ArrowUp'); g.key(' ');
  g.until(() => g.get('message').textContent === 'In the cup. Beautiful orbit.');
}
test('cup cam stays hidden for visible cups and overview, then hides as the long shot brings the cup into view', () => {
  const g = game();
  for (let i = 0; i < 3; i++) {
    g.hole(i); g.frame();
    assert.equal(g.get('cup-inset').hidden, true);
  }
  g.hole(3); g.frame();
  assert.equal(g.get('cup-inset').hidden, false, 'offscreen long-hole approach gets a preview');
  g.click('overview'); g.frame();
  assert.equal(g.get('cup-inset').hidden, true, 'overview already shows the cup');
  g.click('overview'); g.frame();
  assert.equal(g.get('cup-inset').hidden, false, 'returning to the tee restores the preview');
  g.key('ArrowLeft'); g.key('ArrowUp'); g.key(' ');
  g.until(() => g.get('course').dataset.cupCamera === 'live');
  g.until(() => g.steps.at(-1)?.x > 1600);
  assert.equal(g.get('cup-inset').hidden, true, 'follow camera now shows the cup');
});
test('successful putt sinks before results and scores exactly once with the visible cup inset hidden', () => {
  for (const reduced of [false, true]) {
    const g = game(reduced); ace(g);
    assert.equal(g.get('result').hidden, true);
    assert.equal(g.get('round-stars').textContent, '0 / 15');
    g.key(' '); // Input during sinking cannot add a stroke.
    g.frame(); assert.equal(g.get('cup-inset').hidden, true);
    const duration = reduced ? .045 : M.SINK_DURATION;
    for (let i = 0; i < Math.floor(duration * 120) - 2; i++) {
      g.frame(); assert.equal(g.get('result').hidden, true);
    }
    g.until(() => !g.get('result').hidden);
    assert.equal(g.get('strokes').textContent, 1);
    assert.equal(g.get('round-stars').textContent, '3 / 15');
    for (let i = 0; i < 60; i++) g.frame();
    assert.equal(g.get('round-stars').textContent, '3 / 15');
  }
});
test('restart and hole changes during sinking cancel pending results', () => {
  for (const action of [g => g.click('reset'), g => g.hole(1)]) {
    const g = game(); ace(g); action(g);
    for (let i = 0; i < 120; i++) g.frame();
    assert.equal(g.get('result').hidden, true);
    assert.equal(g.get('strokes').textContent, 0);
    assert.equal(g.get('round-stars').textContent, '0 / 15');
    assert.match(g.get('course').attributes['aria-label'], /Ready to aim/);
  }
});
test('capture becomes ready, escape retains bypass until settling, and restart clears it', () => {
  const g = game();
  for (let i = 0; i < 8; i++) { g.key('ArrowLeft'); g.key('ArrowDown'); }
  g.key(' '); g.until(() => g.get('message').textContent.startsWith('Well bypassed.'));
  assert.equal(g.get('strokes').textContent, 1);
  assert.match(g.get('well-status').innerHTML, /BYPASS/);
  g.key(' '); g.frame();
  assert.match(g.get('well-status').innerHTML, /BYPASS/);
  g.until(() => g.get('message').textContent.startsWith('Ball settled.'));
  assert.match(g.get('well-status').innerHTML, /ACTIVE/);
  assert.equal(g.get('strokes').textContent, 2);
  g.click('reset');
  assert.equal(g.get('strokes').textContent, 0);
  assert.match(g.get('course').attributes['aria-label'], /Ready to aim/);
});

test('wormhole shortcut completes the new hole and adds its score once', () => {
  const g = game(); g.hole(4); g.frame(); g.key('ArrowUp'); g.key(' ');
  g.until(() => !g.get('result').hidden);
  assert.equal(g.get('strokes').textContent, 1);
  assert.equal(g.get('round-stars').textContent, '3 / 15');
  assert.ok(g.steps.some(b => b.teleports === 1));
  g.click('reset'); g.frame();
  assert.equal(g.get('strokes').textContent, 0);
  assert.equal(g.get('round-stars').textContent, '3 / 15');
});
