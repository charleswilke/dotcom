const { test } = require('node:test');
const assert = require('node:assert/strict');
const P = require('./physics.js');
function run(position, angle, power, bypass = null, course = P.level) {
  const body = P.launch(position, angle, power);
  while (body.status === 'moving') P.step(body, course, bypass);
  return body;
}
test('preview and actual shot reach identical outcomes, including a wall bounce', () => {
  for (const [angle, power] of [[-.25, .1], [-.25, .25], [-.25, .4], [-.14, .42]]) {
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
  const well = P.level.wells[0];
  const body = P.launch({ x: well.x - 50, y: well.y }, 0, 1);
  let crossed = false;
  while (body.x < well.x + 25 && body.status === 'moving') {
    P.step(body);
    if (Math.abs(body.x - well.x) < well.core) crossed = true;
  }
  assert.ok(crossed);
  assert.equal(body.status, 'moving');
});
test('bypass removes gravity for the whole escape shot, including after bounces', () => {
  const escape = run(P.level.wells[0], -.25, .35, 'violet');
  const noWells = run(P.level.wells[0], -.25, .35, null, { ...P.level, wells: [] });
  assert.deepEqual(escape, noWells);
  assert.equal(escape.status, 'stopped');
  assert.ok(escape.bounces >= 1);
  assert.ok(Math.hypot(escape.x - P.level.wells[0].x, escape.y - P.level.wells[0].y) > P.level.wells[0].influence);
});
test('bypass affects only the captured well; other wells still pull', () => {
  const course = { ...P.level, wells: [...P.level.wells, { ...P.level.wells[0], id: 'other', x: 580 }] };
  assert.deepEqual(P.gravity({ x: 590, y: P.level.wells[0].y }, course, 'violet'),
    P.gravity({ x: 590, y: P.level.wells[0].y }, { ...course, wells: [course.wells[1]] }));
});
test('a gravity swing can ace without a wall bounce, with room to fine-tune power', () => {
  for (const power of [.41, .415, .42, .425]) {
    const body = run(P.level.tee, -.14, power);
    assert.equal(body.status, 'sunk');
    assert.equal(body.bounces, 0);
    assert.equal(body.x, P.level.cup.x);
    assert.equal(body.y, P.level.cup.y);
    assert.ok(body.age > 4 && body.age < 6, 'The swing should have time to unfold');
    const straight = run(P.level.tee, -.14, power, null, { ...P.level, wells: [] });
    assert.notEqual(straight.status, 'sunk', 'Gravity should be what carries this shot to the cup');
  }
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
  const preview = P.predict(P.level.tee, .4, .7);
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

test('new holes have gravity-only aces that depend on every well', () => {
  for (const [index, angle, power] of [[1, -.05, .44], [2, -.05, .46]]) {
    const course = P.levels[index], body = P.launch(course.tee, angle, power);
    const closest = course.wells.map(() => Infinity);
    while (body.status === 'moving') {
      P.step(body, course);
      course.wells.forEach((well, i) => {
        closest[i] = Math.min(closest[i], Math.hypot(body.x - well.x, body.y - well.y));
      });
    }
    assert.equal(body.status, 'sunk', course.hole);
    assert.equal(body.bounces, 0, course.hole);
    assert.ok(body.age > 4 && body.age < 6);
    assert.deepEqual(P.predict(course.tee, angle, power, course).body, body);
    course.wells.forEach((well, i) => {
      assert.ok(closest[i] < well.influence && closest[i] > well.core + P.RADIUS, `Skim safely past ${well.id}`);
      const missingWell = { ...course, wells: course.wells.filter(w => w !== well) };
      assert.notEqual(run(course.tee, angle, power, null, missingWell).status, 'sunk', `${well.id} must matter to the ace`);
    });
  }
});

test('bypassing one well on the new holes leaves all other fields active', () => {
  for (const course of P.levels.slice(1)) {
    for (const well of course.wells) {
      const position = { x: well.x + 30, y: well.y + 30 };
      assert.deepEqual(P.gravity(position, course, well.id),
        P.gravity(position, { ...course, wells: course.wells.filter(w => w.id !== well.id) }));
    }
  }
});

test('new hole boundaries contain full shots through settling and capture', () => {
  function inside(body, points) {
    let value = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j];
      if ((a[1] > body.y) !== (b[1] > body.y) && body.x < (b[0] - a[0]) * (body.y - a[1]) / (b[1] - a[1]) + a[0]) value = !value;
    }
    return value;
  }
  for (const course of P.levels.slice(1)) {
    for (let angle = -Math.PI; angle < Math.PI; angle += .15) {
      for (const power of [.05, .35, .7, 1]) {
        const body = P.launch(course.tee, angle, power);
        while (body.status === 'moving') {
          P.step(body, course);
          assert.ok(inside(body, course.boundary), `${course.hole}: angle ${angle}, power ${power}`);
        }
        assert.ok(body.age <= 24 / .9 + P.DT);
      }
    }
  }
});

test('the long hole links both pairs of wells into a clean ace', () => {
  const course = P.levels[3];
  for (const power of [.8, .81, .82, .83]) {
    const body = P.launch(course.tee, -.05, power), seen = new Set();
    while (body.status === 'moving') {
      P.step(body, course);
      course.wells.forEach(well => { if (Math.hypot(body.x - well.x, body.y - well.y) < well.influence) seen.add(well.id); });
    }
    assert.equal(body.status, 'sunk'); assert.equal(body.bounces, 0);
    assert.equal(seen.size, 4); assert.ok(body.age > 6 && body.age < 8);
    assert.deepEqual(P.predict(course.tee, -.05, power, course).body, body);
  }
});

test('hairpin offers a wormhole ace and a gravity-assisted route around the bend', () => {
  const course = P.levels[4];
  const shortcut = run(course.tee, -.16, .465, null, course);
  assert.equal(shortcut.status, 'sunk');
  assert.equal(shortcut.teleports, 1);
  assert.equal(shortcut.bounces, 0);
  const preview = P.predict(course.tee, -.16, .465, course);
  assert.deepEqual(preview.body, shortcut);
  assert.equal(preview.points.filter(p => p.break).length, 1);
  const bend = run(course.tee, -.07, .97, null, course);
  assert.equal(bend.status, 'sunk');
  assert.equal(bend.teleports || 0, 0);
  assert.notEqual(run(course.tee, -.07, .97, null, { ...course, wells: [] }).status, 'sunk');
});

test('wormholes rotate velocity without changing speed, lock until clear, and work in reverse', () => {
  const base = P.levels[4], start = { x: 600, y: 425 };
  const course = { ...base, wells: [] };
  const body = P.launch(start, -Math.PI / 2, .8), control = P.launch(start, -Math.PI / 2, .8);
  while (!body.teleport && body.status === 'moving') { P.step(body, course); P.step(control, { ...course, portals: [] }); }
  assert.ok(Math.abs(body.vx + control.vx) < 1e-8);
  assert.ok(Math.abs(body.vy + control.vy) < 1e-8);
  assert.equal(body.portalLock, 'fold');
  body.x = 600; body.y = 100; P.step(body, course);
  assert.equal(body.teleports, 1, 'cannot immediately re-enter the exit');
  body.x = 600; body.y = 140; body.vx = 0; body.vy = -200;
  P.step(body, course);
  assert.equal(body.portalLock, null);
  while (body.teleports === 1 && body.status === 'moving') P.step(body, course);
  assert.equal(body.teleports, 2);
  assert.ok(body.y > 400 && body.vy > 0, 'reverse transit exits toward the bend');
});

test('swept portal entry catches a fast ball that crosses an entire mouth in one step', () => {
  const course = { width: 5000, height: 1000, wells: [], cup: { x: 4500, y: 800, radius: 13 },
    boundary: [[0,0],[5000,0],[5000,1000],[0,1000]], portals: [
      { id: 'a', pair: 'p', x: 500, y: 500, radius: 10, angle: 0, target: 'b' },
      { id: 'b', pair: 'p', x: 3000, y: 500, radius: 10, angle: Math.PI / 2, target: 'a' }
    ] };
  const body = { ...P.launch({ x: 470, y: 500 }, 0, 1), vx: 12000 };
  P.step(body, course);
  assert.equal(body.teleports, 1);
  assert.ok(Math.abs(body.x - 3000) < 1e-8 && body.y > 500);
  assert.ok(body.vy > 11000);
});
