const { test } = require('node:test');
const assert = require('node:assert/strict');
const V = require('./view.js');
const P = require('./physics.js');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('aiming converts screen positions back to the same world point in local and overview views', () => {
  for (const course of P.levels) for (const overview of [false, true]) {
    const view = V.create(course, overview, course.tee);
    for (const point of [course.tee, course.cup, ...course.wells, { x: -30, y: 200 }]) {
      const result = V.toWorld(V.toScreen(point, view), view);
      near(result.x, point.x); near(result.y, point.y);
    }
    const origin = course.tee, angle = -.05, distance = 180;
    const pull = { x: origin.x - Math.cos(angle) * distance, y: origin.y - Math.sin(angle) * distance };
    const translated = V.toWorld(V.toScreen(pull, view), view);
    near(Math.atan2(origin.y - translated.y, origin.x - translated.x), angle);
    near(Math.hypot(origin.x - translated.x, origin.y - translated.y), distance);
  }
});
test('overview fits the complete playable outline while the long hole retains local magnification', () => {
  for (const course of P.levels) {
    const view = V.fit(course);
    for (const [x, y] of course.boundary) {
      const p = { x, y };
      const screen = V.toScreen(p, view);
      assert.ok(screen.x >= 30 && screen.x <= V.WIDTH - 30);
      assert.ok(screen.y >= 50 && screen.y <= V.HEIGHT - 50);
    }
  }
  const course = P.levels[3];
  assert.ok(V.create(course, false, course.tee).zoom > V.fit(course).zoom * 2);
});
test('follow camera keeps the full long ace on screen without altering its trajectory', () => {
  const course = P.levels[3], body = P.launch(course.tee, -.05, .82);
  const camera = V.create(course, false, course.tee), start = camera.y;
  while (body.status === 'moving') {
    P.step(body, course); V.follow(camera, course, body, P.DT);
    const screen = V.toScreen(body, camera);
    assert.ok(screen.x > 35 && screen.x < V.WIDTH - 35, `x=${screen.x}`);
    assert.ok(screen.y > 65 && screen.y < V.HEIGHT - 40, `y=${screen.y}`);
  }
  assert.equal(body.status, 'sunk'); assert.equal(body.bounces, 0);
  assert.ok(camera.y < start - 900, 'Follow through both sections');
});

test('cup camera triggers on near misses and fast crossings, not only predicted sinks', () => {
  const cup = { x: 500, y: 300 };
  assert.equal(V.approachesCup([{x:100,y:300},{x:900,y:300}], cup), true, 'A fast overshoot crosses between samples');
  assert.equal(V.approachesCup([{x:100,y:400},{x:900,y:400}], cup), true, 'A nearby miss still earns a close-up');
  assert.equal(V.approachesCup([{x:100,y:550},{x:900,y:550}], cup), false, 'Distant shots leave the screen clear');
  assert.equal(V.approachesCup([{x:450,y:300}], cup), true, 'A short putt starts close to the cup');
  assert.equal(V.approachesCup([], cup), false);
});
test('cup close-up preserves the main projection angle and stays fixed on the cup', () => {
  for (const course of P.levels) {
    const view = V.cupView(course.cup, course), center = V.toScreen(course.cup, view);
    near(center.x, course.vertical ? 180 : 230); near(center.y, course.vertical ? 85 : 155);
    const main = V.create(course, false, course.tee);
    const mainMatrix = V.matrix(main), insetMatrix = V.matrix(view);
    for (let i = 0; i < 4; i++) near(mainMatrix[i] / main.zoom, insetMatrix[i] / view.zoom);
    assert.ok(view.zoom > main.zoom);
    const ace = course === P.levels[4] ? [-.16,.465] : course === P.levels[3] ? [-.05,.82] : course === P.levels[0] ? [-.14,.42] : course === P.levels[1] ? [-.05,.44] : [-.05,.46];
    assert.equal(V.approachesCup(P.predict(course.tee, ...ace, course).points, course.cup), true);
  }
});

test('two-finger pan moves the course with the swipe and preserves projection and zoom', () => {
  const course = P.levels[3], view = V.create(course, false, course.tee);
  V.pan(view, course, 0, 500);
  const before = V.toScreen(course.wells[2], view), zoom = view.zoom;
  V.pan(view, course, 0, 120);
  const after = V.toScreen(course.wells[2], view);
  near(after.x - before.x, 0); near(after.y - before.y, 120);
  near(view.zoom, zoom);
  const world = V.toWorld(after, view);
  near(world.x, course.wells[2].x); near(world.y, course.wells[2].y);
});
test('panning cannot leave the long course behind and recentering restores the tee view', () => {
  const course = P.levels[3], view = V.create(course, false, course.tee), original = { ...view };
  V.pan(view, course, -100000, -100000);
  const far = { ...view };
  V.pan(view, course, -100000, -100000);
  assert.deepEqual(view, far);
  V.pan(view, course, 100000, 100000);
  const nearEnd = { ...view };
  V.pan(view, course, 100000, 100000);
  assert.deepEqual(view, nearEnd);
  assert.ok(far.y > nearEnd.y + 900);
  assert.deepEqual(V.create(course, false, course.tee), original);
});

test('long-hole launch heads up-screen with pull-back space and a fixed aiming view', () => {
  const course = P.levels[3], view = V.create(course, false, course.tee);
  const tee = V.toScreen(course.tee, view);
  const ahead = V.toScreen({ x: course.tee.x + 200, y: course.tee.y }, view);
  near(ahead.x, tee.x);
  assert.ok(ahead.y < tee.y - 150);
  assert.ok(tee.y >= V.HEIGHT * .6 && tee.y <= V.HEIGHT * .7);
  const pull = V.toScreen({ x: course.tee.x - 190, y: course.tee.y }, view);
  assert.ok(pull.y < V.HEIGHT - 35, 'full-power pull stays inside the canvas');
  const original = { ...view };
  V.toWorld(pull, view);
  assert.deepEqual(view, original, 'aim conversion does not move the camera');
});

test('teleport gaps do not count as predicted approaches to a cup between the mouths', () => {
  assert.equal(V.approachesCup([{ x: 0, y: 0 }, { x: 1000, y: 0, break: true }], { x: 500, y: 0 }, 100), false);
});
