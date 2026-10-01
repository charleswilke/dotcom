/* Deterministic simulation shared by live play, prediction, and Node tests. */
(function (root) {
  'use strict';
  const DT = 1 / 120;
  // Speed up the whole motion model together, preserving familiar shot ranges.
  const PACE = 1.45;
  const RADIUS = 7;
  const FRICTION = 32 * PACE * PACE;
  const level = {
    name: 'Lunar Gardens', hole: 'First orbit', par: 3,
    width: 1100, height: 650,
    tee: { x: 230, y: 440 }, cup: { x: 885, y: 200, radius: 13 },
    boundary: [
      [112, 330], [155, 270], [310, 260], [420, 300], [570, 300],
      [665, 240], [735, 120], [865, 100], [970, 140], [1000, 225],
      [965, 310], [850, 340], [745, 345], [645, 420], [550, 470],
      [385, 490], [300, 545], [180, 545], [110, 485], [90, 400]
    ],
    wells: [{ id: 'violet', x: 550, y: 367, influence: 160, core: 18, strength: 550000 }]
  };
  const length = (x, y) => Math.hypot(x, y);
  function gravity(body, course, bypass) {
    let x = 0, y = 0;
    for (const well of course.wells) {
      if (well.id === bypass) continue;
      const dx = well.x - body.x, dy = well.y - body.y, d = length(dx, dy);
      if (d >= well.influence || d < 0.001) continue;
      const falloff = Math.min(1, (well.influence - d) / 40);
      const pull = well.strength * PACE * PACE / (d * d + 2400) * falloff;
      x += dx / d * pull; y += dy / d * pull;
    }
    return { x, y };
  }
  function step(body, course = level, bypass = null) {
    if (body.status !== 'moving') return body;
    const force = gravity(body, course, bypass);
    body.vx += force.x * DT; body.vy += force.y * DT;
    let speed = length(body.vx, body.vy);
    const nextSpeed = Math.max(0, speed * Math.exp(-0.14 * PACE * DT) - FRICTION * DT);
    if (speed) { body.vx *= nextSpeed / speed; body.vy *= nextSpeed / speed; }
    body.x += body.vx * DT; body.y += body.vy * DT;
    body.age += DT;
    // Boundary vertices run clockwise on screen; left-hand normals point inward.
    const points = course.boundary;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const dx = b[0] - a[0], dy = b[1] - a[1], len2 = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((body.x - a[0]) * dx + (body.y - a[1]) * dy) / len2));
      const px = a[0] + t * dx, py = a[1] + t * dy;
      const distance = length(body.x - px, body.y - py);
      if (distance >= RADIUS) continue;
      const len = Math.sqrt(len2), nx = -dy / len, ny = dx / len;
      const signedDistance = (body.x - px) * nx + (body.y - py) * ny;
      body.x += nx * (RADIUS - signedDistance + 0.02);
      body.y += ny * (RADIUS - signedDistance + 0.02);
      const dot = body.vx * nx + body.vy * ny;
      if (dot < 0) {
        body.vx -= 1.78 * dot * nx; body.vy -= 1.78 * dot * ny;
        body.bounces++;
      }
    }
    speed = length(body.vx, body.vy);
    if (length(body.x - course.cup.x, body.y - course.cup.y) < course.cup.radius && speed < 160 * PACE) {
      body.status = 'sunk'; body.x = course.cup.x; body.y = course.cup.y;
    } else {
      for (const well of course.wells) {
        if (well.id !== bypass && length(body.x - well.x, body.y - well.y) < well.core && speed < 145 * PACE) {
          body.status = 'captured'; body.capturedBy = well.id;
          break;
        }
      }
      if (body.status === 'moving' && speed < 6 * PACE && length(force.x, force.y) < FRICTION) body.status = 'stopped';
      // Friction normally resolves shots quickly. This bounds pathological wall/orbit cases.
      if (body.status === 'moving' && body.age > 24 / PACE) body.status = 'stopped';
    }
    if (body.status !== 'moving') { body.vx = 0; body.vy = 0; }
    return body;
  }
  function launch(position, angle, power) {
    const speed = (45 + Math.max(0, Math.min(1, power)) * 595) * PACE;
    return { x: position.x, y: position.y, vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed, age: 0, bounces: 0, status: 'moving', capturedBy: null };
  }
  function predict(position, angle, power, course = level, bypass = null) {
    const body = launch(position, angle, power), points = [{ x: body.x, y: body.y }];
    let bounce = 0;
    while (body.status === 'moving') {
      step(body, course, bypass);
      if (Math.round(body.age / DT) % 5 === 0) points.push({ x: body.x, y: body.y });
      if (body.bounces > 1) { bounce = body.bounces; break; }
    }
    points.push({ x: body.x, y: body.y });
    return { points, body, truncated: bounce > 1 };
  }
  const api = { DT, RADIUS, level, gravity, step, launch, predict };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CosmicPhysics = api;
})(typeof window !== 'undefined' ? window : globalThis);
