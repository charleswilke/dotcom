const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('./physics.js');
function run(position, angle, power, bypass = null, course = P.level) {
  const body = P.launch(position, angle, power);
  while (body.status === 'moving') P.step(body, course, bypass);
  return body;
}
test('preview and actual shot reach identical outcomes, including a wall bounce', () => {
  for (const [angle, power] of [[-.25, .1], [-.25, .25], [-.25, .4], [.17, .425]]) {
    const preview = P.predict(P.level.tee, angle, power);
    assert.equal(preview.truncated, false);
    assert.deepEqual(preview.body, run(P.level.tee, angle, power));
  }
});
test('slow core entry captures and records the well responsible', () => {
  const body = run(P.level.tee, -.25, .25);
  assert.equal(body.status, 'captured');
  assert.equal(body.capturedBy, 'violet');
});
test('fast balls pass through the core without immediate capture', () => {
  const body = P.launch({ x: 500, y: 367 }, 0, 1);
  let crossed = false;
  while (body.x < 575 && body.status === 'moving') {
    P.step(body);
    if (Math.abs(body.x - 550) < 18) crossed = true;
  }
  assert.ok(crossed);
  assert.equal(body.status, 'moving');
});
test('bypass removes gravity for the whole escape shot, including after bounces', () => {
  const escape = run(P.level.wells[0], -.25, .45, 'violet');
  const noWells = run(P.level.wells[0], -.25, .45, null, { ...P.level, wells: [] });
  assert.deepEqual(escape, noWells);
  assert.equal(escape.status, 'stopped');
  assert.ok(escape.bounces >= 1);
  assert.ok(Math.hypot(escape.x - 550, escape.y - 367) > 160);
});
test('bypass affects only the captured well; other wells still pull', () => {
  const course = { ...P.level, wells: [...P.level.wells, { ...P.level.wells[0], id: 'other', x: 580 }] };
  assert.deepEqual(P.gravity({ x: 590, y: 367 }, course, 'violet'),
    P.gravity({ x: 590, y: 367 }, { ...course, wells: [course.wells[1]] }));
});
test('a skill shot can ace the test hole', () => {
  const body = run(P.level.tee, .17, .425);
  assert.equal(body.status, 'sunk');
  assert.equal(body.x, P.level.cup.x);
  assert.equal(body.y, P.level.cup.y);
});
test('cup accepts soft putts and lets fast putts overshoot', () => {
  const start = { x: P.level.cup.x - 25, y: P.level.cup.y };
  const soft = P.launch(start, 0, .05), hard = P.launch(start, 0, 1);
  for (let i = 0; i < 40; i++) P.step(soft);
  for (let i = 0; i < 10; i++) P.step(hard);
  assert.equal(soft.status, 'sunk');
  assert.equal(hard.status, 'moving');
  assert.ok(hard.x > P.level.cup.x + P.level.cup.radius);
});
test('preview stops at a second bounce rather than promising hidden later motion', () => {
  const preview = P.predict(P.level.tee, -.25, .75);
  assert.equal(preview.truncated, true);
  assert.equal(preview.body.bounces, 2);
});
test('a range of full shots stays inside the course and always resolves', () => {
  function inside(x, y) {
    let value = false; const points = P.level.boundary;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) value = !value;
    }
    return value;
  }
  for (let a = -Math.PI; a < Math.PI; a += .15) {
    for (const power of [.05, .35, .7, 1]) {
      const body = P.launch(P.level.tee, a, power);
      while (body.status === 'moving') {
        P.step(body);
        assert.ok(inside(body.x, body.y), `Ball left course at angle ${a}, power ${power}`);
      }
      assert.ok(body.age <= 24 + P.DT);
    }
  }
});
