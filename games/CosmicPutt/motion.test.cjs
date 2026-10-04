const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('./motion.js');
const P = require('./physics.js');
const V = require('./view.js');
const identity = [1, 0, 0, 1, 0, 0];
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);

test('motion scales with power, conserves area, stays bounded and finishes round', () => {
  for (const power of [0, .08, .4, 1]) {
    const m = M.create(0, 0, power);
    assert.equal(M.sample(m, 0, identity).scaleX, 1);
    assert.equal(M.sample(m, M.CONTACT_TIME, identity).scaleX, 1);
    assert.ok(M.sample(m, .115, identity).scaleX < .65);
    assert.ok(M.sample(m, m.launchTime + m.releaseRise, identity).scaleX >= 1.5);
    for (let time = 0; time <= .85; time += .001) {
      const p = M.sample(m, time, identity);
      assert.ok(p.scaleX >= .52 && p.scaleX <= 1.95);
      near(p.scaleX * p.scaleY, 1);
      assert.equal(p.opacity, 1);
    }
    assert.equal(M.sample(m, .85, identity).scaleX, 1);
  }
  const hard = M.create(0, 0, 1), soft = M.create(0, 0, .08);
  assert.ok(M.sample(hard, hard.launchTime + hard.releaseRise, identity).scaleX > M.sample(soft, soft.launchTime + soft.releaseRise, identity).scaleX);
});

test('the club arrives before squash and continues through contact without a position or visibility jump', () => {
  for (const power of [.01, .08, .4, 1]) {
    const body = P.launch({ x: 0, y: 0 }, 0, power);
    const m = M.create(0, 0, power, false, Math.hypot(body.vx, body.vy));
    for (const initial of [23, 85]) {
      assert.equal(M.putter(m, 0, initial, P.RADIUS).setback, initial);
      assert.equal(M.putter(m, 0, initial, P.RADIUS).tether, 1);
      for (let t = 0; t < M.CONTACT_TIME; t += .001) {
        assert.equal(M.sample(m, t, identity).scaleX, 1, 'the ball cannot squash before contact');
        assert.equal(M.putter(m, t, initial, P.RADIUS).opacity, 1);
      }
      for (let t = M.CONTACT_TIME; t < m.launchTime; t += .001) {
        const pose = M.sample(m, t, identity), club = M.putter(m, t, initial, P.RADIUS);
        near(club.setback - 3.5, P.RADIUS * pose.scaleX);
        assert.equal(club.tether, 0);
        assert.equal(club.opacity, 1);
      }
      for (const boundary of [M.CONTACT_TIME, m.launchTime]) {
        const before = M.putter(m, boundary - .000001, initial, P.RADIUS);
        const after = M.putter(m, boundary + .000001, initial, P.RADIUS);
        assert.ok(Math.abs(before.setback - after.setback) < .01);
        assert.ok(Math.abs(before.opacity - after.opacity) < .001);
      }
      assert.equal(M.putter(m, m.launchTime + .181, initial, P.RADIUS), null);
    }
  }
});

test('wall compression uses the projected normal in both main view and cup cam', () => {
  const m = M.create();
  M.hit(m, 2, { x: 10, y: 10, nx: 0, ny: 1, speed: 420 });
  for (const view of [V.fit(P.level), V.cupView(P.level.cup)]) {
    const p = M.sample(m, 2, V.matrix(view));
    near(p.angle, Math.atan2(.72, .24));
    near(p.scaleX, .8);
    near(p.scaleX * p.scaleY, 1);
  }
  assert.equal(M.sample(m, 2.2, identity).scaleX, 1);
});

test('speed and gravity response is smooth, bounded and independent of frame subdivision', () => {
  const m1 = M.create(), m2 = M.create();
  const body = { status: 'moving', vx: 500, vy: 0 }, force = { x: 300, y: 0 };
  M.update(m1, body, force, .1);
  for (let i = 0; i < 12; i++) M.update(m2, body, force, .1 / 12);
  near(m1.stretch, m2.stretch);
  assert.ok(m1.stretch > .1 && m1.stretch < .16);
  M.update(m1, { status: 'stopped' }, force, 2);
  assert.ok(m1.stretch < 1e-10);
});

test('friction slows the launch impulse and the visible rolling stretch relaxes with it', () => {
  const course = { boundary: [[-10000, -10000], [10000, -10000], [10000, 10000], [-10000, 10000]],
    wells: [], cup: { x: 9000, y: 9000, radius: 13 } };
  const body = P.launch({ x: 0, y: 0 }, 0, .4), m = M.create(0, 0, .4);
  const initialSpeed = Math.hypot(body.vx, body.vy);
  let earlySpeed, earlyStretch;
  for (let i = 1; i <= 240; i++) {
    P.step(body, course); M.update(m, body, { x: 0, y: 0 }, P.DT);
    if (i === 96) {
      earlySpeed = Math.hypot(body.vx, body.vy);
      earlyStretch = M.sample(m, M.STRIKE_DURATION + .8, identity).scaleX;
    }
  }
  const lateSpeed = Math.hypot(body.vx, body.vy);
  assert.ok(initialSpeed > earlySpeed && earlySpeed > lateSpeed && lateSpeed > 0);
  assert.ok(lateSpeed < initialSpeed * .65);
  assert.ok(earlyStretch > M.sample(m, M.STRIKE_DURATION + 2, identity).scaleX);
});

test('capture and settling pulses finish at rest; a fresh stroke clears all cues', () => {
  const m = M.create(); m.captureTime = 0;
  assert.ok(M.sample(m, .09, identity).size < 1);
  assert.equal(M.sample(m, .2, identity).size, 1);
  m.settleTime = 1;
  for (let time = 1; time < 1.2; time += .001) {
    const p = M.sample(m, time, identity);
    assert.ok(p.size >= .96 && p.size <= 1.04);
  }
  assert.equal(M.sample(m, 1.2, identity).size, 1);
  assert.deepEqual(M.sample(M.create(), 2, identity), { angle: 0, scaleX: 1, scaleY: 1, size: 1, opacity: 1, drop: 0 });
});

test('sink pauses at the rim then accelerates into the cup, with a stationary fade for reduced motion', () => {
  const m = M.create(0, 0, 1); m.sinkTime = 1;
  const rim = M.sample(m, 1.04, identity);
  assert.ok(rim.size > 1); assert.equal(rim.drop, 0); assert.equal(rim.opacity, 1);
  const halfway = M.sample(m, 1 + M.SINK_DURATION / 2, identity);
  assert.ok(halfway.size < 1 && halfway.size > 0 && halfway.opacity < 1);
  assert.ok(M.sample(m, 1 + M.SINK_DURATION * .65, identity).drop > halfway.drop);
  const finished = M.sample(m, 1 + M.SINK_DURATION + .001, identity);
  assert.equal(finished.size, 0); assert.equal(finished.opacity, 0);
  M.hit(m, 1, { nx: 1, ny: 0, speed: 420 }); m.captureTime = 1; m.settleTime = 1;
  const reduced = M.sample(m, 1.02, identity, true);
  assert.equal(reduced.scaleX, 1); assert.equal(reduced.scaleY, 1);
  assert.equal(reduced.size, 1); assert.equal(reduced.drop, 0);
  assert.ok(reduced.opacity > 0 && reduced.opacity < 1);
  assert.equal(M.sample(m, 1.046, identity, true).opacity, 0);
});

test('cup rattle stays inside the rim, reverses direction, and settles before the drop', () => {
  let positive = false, negative = false;
  for (let progress = 0; progress <= 1; progress += .001) {
    const p = M.cupRattle(progress, 6.5);
    assert.ok(Math.hypot(p.x, p.y) <= 6.5);
    positive ||= p.x > 1; negative ||= p.x < -1;
  }
  assert.ok(positive && negative);
  assert.deepEqual(M.cupRattle(.4, 6.5), { x: 0, y: 0 });
  assert.deepEqual(M.cupRattle(.15, 6.5, true), { x: 0, y: 0 });
});
test('observing every collision leaves entire shot outcomes identical on every hole', () => {
  let contacts = 0;
  for (const course of P.levels) {
    for (const [angle, power] of [[Math.PI, .62], [-.28, .24], [-.05, .82], [.4, 1]]) {
      const plain = P.launch(course.tee, angle, power), observed = P.launch(course.tee, angle, power);
      while (plain.status === 'moving') {
        P.step(plain, course);
        P.step(observed, course, null, contact => {
          contacts++;
          near(Math.hypot(contact.nx, contact.ny), 1);
          assert.ok(contact.speed > 0);
        });
        assert.deepEqual(observed, plain);
      }
    }
  }
  assert.ok(contacts > 0);
});
