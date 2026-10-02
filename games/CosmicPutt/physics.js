/* Deterministic simulation shared by live play, prediction, and Node tests. */
(function (root) {
  'use strict';
  const DT = 1 / 120;
  // Slow the full motion model together so gravity arcs unfold without losing reach.
  const PACE = 0.9;
  const RADIUS = 7;
  const FRICTION = 32 * PACE * PACE;
  // Sample rounded corners once; rendering and collisions use the same outline.
  function roundedBoundary(vertices) {
    const points = [];
    vertices.forEach((v, i) => {
      const prev = vertices[(i + vertices.length - 1) % vertices.length];
      const next = vertices[(i + 1) % vertices.length];
      const start = v.map((n, axis) => n + (prev[axis] - n) * .3);
      const end = v.map((n, axis) => n + (next[axis] - n) * .3);
      for (let j = 0; j <= 6; j++) {
        const t = j / 6;
        points.push(v.map((n, axis) => (1 - t) ** 2 * start[axis] + 2 * (1 - t) * t * n + t * t * end[axis]));
      }
    });
    return points;
  }
  const level = {
    name: 'Blueprint Course', hole: 'First orbit', par: 3,
    width: 1100, height: 650,
    tee: { x: 230, y: 440 }, cup: { x: 885, y: 200, radius: 13 },
    boundary: roundedBoundary([
      [112, 330], [155, 285], [310, 280], [420, 290], [560, 265],
      [665, 205], [735, 120], [865, 100], [970, 140], [1000, 225],
      [965, 310], [850, 340], [745, 355], [645, 435], [550, 495],
      [385, 490], [300, 545], [180, 545], [110, 485], [90, 400]
    ]),
    wells: [{ id: 'violet', x: 550, y: 310, influence: 230, core: 18, strength: 900000 }]
  };
  const levels = [level, {
    name: 'Blueprint Course', hole: 'Double swing', par: 3,
    width: 1100, height: 650,
    tee: { x: 160, y: 420 }, cup: { x: 900, y: 330, radius: 13 },
    aim: { angle: -.02, power: .42 },
    hint: 'Swing beneath well A, then above well B. Let the second pull bring you home.',
    boundary: roundedBoundary([
      [90, 340], [180, 290], [310, 265], [420, 235], [540, 255],
      [650, 230], [820, 220], [965, 245], [1010, 330], [990, 415],
      [915, 470], [790, 470], [700, 510], [580, 480], [450, 490],
      [300, 535], [170, 535], [100, 490], [80, 420]
    ]),
    wells: [
      { id: 'swing-a', label: 'A', x: 410, y: 310, influence: 200, core: 18, strength: 1400000 },
      { id: 'swing-b', label: 'B', x: 710, y: 390, influence: 205, core: 18, strength: 900000 }
    ]
  }, {
    name: 'Blueprint Course', hole: 'Triple relay', par: 3,
    width: 1100, height: 650,
    tee: { x: 150, y: 440 }, cup: { x: 950, y: 300, radius: 13 },
    aim: { angle: -.025, power: .44 },
    hint: 'Thread A and B, then let well C turn the final approach toward the cup.',
    boundary: roundedBoundary([
      [90, 340], [200, 290], [400, 240], [560, 240], [680, 270],
      [760, 150], [850, 100], [990, 145], [1030, 260], [1010, 380],
      [920, 450], [820, 470], [700, 500], [560, 490], [420, 490],
      [260, 540], [110, 520], [75, 440]
    ]),
    wells: [
      { id: 'relay-a', label: 'A', x: 380, y: 330, influence: 180, core: 18, strength: 1200000 },
      { id: 'relay-b', label: 'B', x: 640, y: 430, influence: 180, core: 18, strength: 800000 },
      { id: 'relay-c', label: 'C', x: 860, y: 240, influence: 190, core: 18, strength: 1200000 }
    ]
  }, {
    name: 'Blueprint Course', hole: 'Long orbit', par: 3,
    width: 2200, height: 800,
    tee: { x: 160, y: 440 }, cup: { x: 1870, y: 400, radius: 13 },
    aim: { angle: -.025, power: .78 },
    hint: 'Link A–B, cross the quiet stretch, then swing through C–D. Overview shows the whole route.',
    sections: [{ x: 590, y: 580, label: '01 / OPENING SWING' }, { x: 1440, y: 570, label: '02 / HOME SWING' }],
    boundary: roundedBoundary([
      [90, 340], [180, 285], [430, 240], [680, 275], [880, 275],
      [1010, 320], [1110, 250], [1280, 180], [1450, 230], [1640, 240],
      [1880, 270], [2070, 330], [2100, 450], [2030, 520], [1810, 530],
      [1620, 520], [1480, 530], [1280, 500], [1060, 490], [970, 495],
      [840, 540], [720, 545], [600, 520], [420, 510], [270, 550], [120, 530], [75, 440]
    ]),
    wells: [
      { id: 'long-a', label: 'A', x: 420, y: 320, influence: 210, core: 18, strength: 1600000 },
      { id: 'long-b', label: 'B', x: 760, y: 460, influence: 210, core: 18, strength: 1400000 },
      { id: 'long-c', label: 'C', x: 1250, y: 250, influence: 220, core: 18, strength: 1200000 },
      { id: 'long-d', label: 'D', x: 1590, y: 420, influence: 210, core: 18, strength: 900000 }
    ]
  }];
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
  const api = { DT, RADIUS, level, levels, gravity, step, launch, predict };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CosmicPhysics = api;
})(typeof window !== 'undefined' ? window : globalThis);
