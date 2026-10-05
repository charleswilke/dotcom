/* Affine three-quarter projection and camera; physics stays in world coordinates. */
(function (root) {
  'use strict';
  const WIDTH = 1100, HEIGHT = 650;
  const A = 1, B = -.1, C = .24, D = .72, DET = A * D - B * C;
  // Rotate only the drawing plane: the long hole's launch axis points up-screen.
  function coefficients(view = {}) {
    if (!view.vertical) return [A, B, C, D];
    const norm = Math.hypot(A, C), cos = C / norm, sin = -A / norm;
    return [A * cos + C * sin, B * cos + D * sin,
      -A * sin + C * cos, -B * sin + D * cos];
  }
  function project(p, view) {
    const [a, b, c, d] = coefficients(view);
    return { x: a * p.x + c * p.y, y: b * p.x + d * p.y };
  }
  function unproject(p, view) {
    const [a, b, c, d] = coefficients(view);
    return { x: (d * p.x - c * p.y) / DET, y: (-b * p.x + a * p.y) / DET };
  }
  function bounds(course) {
    const corners = [{ x: 0, y: 0 }, { x: course.width, y: 0 },
      { x: 0, y: course.height }, { x: course.width, y: course.height }].map(p => project(p, course));
    return { left: Math.min(...corners.map(p => p.x)), right: Math.max(...corners.map(p => p.x)),
      top: Math.min(...corners.map(p => p.y)), bottom: Math.max(...corners.map(p => p.y)) };
  }
  function fit(course) {
    const points = course.boundary.map(([x, y]) => project({ x, y }, course));
    const b = { left: Math.min(...points.map(p => p.x)) - 25, right: Math.max(...points.map(p => p.x)) + 25,
      top: Math.min(...points.map(p => p.y)) - 50, bottom: Math.max(...points.map(p => p.y)) + 35 };
    return { vertical: Boolean(course.vertical), x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2,
      zoom: Math.min((WIDTH - 70) / (b.right - b.left), (HEIGHT - 115) / (b.bottom - b.top)) };
  }
  function target(course, position, zoom) {
    const b = bounds(course), p = project(position, course);
    const clampAxis = (value, low, high, half) => high - low <= half * 2 ? (low + high) / 2 :
      Math.max(low + half, Math.min(high - half, value));
    return { vertical: Boolean(course.vertical), x: clampAxis(p.x, b.left, b.right, WIDTH / (2 * zoom)),
      y: clampAxis(p.y, b.top, b.bottom, (HEIGHT - 90) / (2 * zoom)), zoom };
  }
  function create(course, overview, ball) {
    if (overview || course.width <= WIDTH) return fit(course);
    const zoom = 1.15;
    if (!course.vertical) return target(course, { x: ball.x + 210, y: ball.y }, zoom);
    const p = project(ball, course);
    return target(course, unproject({ x: p.x, y: p.y - HEIGHT / (6 * zoom) }, course), zoom);
  }
  function follow(view, course, ball, elapsed, reduced = false) {
    const lookX = Math.max(-140, Math.min(140, (ball.vx || 0) * .4));
    const lookY = Math.max(-75, Math.min(75, (ball.vy || 0) * .3));
    let position = { x: ball.x + lookX, y: ball.y + lookY };
    if (course.vertical) {
      const p = project(ball, view), velocity = project({ x: ball.vx || 0, y: ball.vy || 0 }, view);
      position = unproject({ x: p.x + Math.max(-100, Math.min(100, velocity.x * .3)),
        y: p.y - HEIGHT / (6 * view.zoom) + Math.max(-75, Math.min(75, velocity.y * .3)) }, view);
    }
    const next = target(course, position, view.zoom);
    const blend = reduced ? 1 : 1 - Math.exp(-5 * elapsed);
    view.x += (next.x - view.x) * blend; view.y += (next.y - view.y) * blend;
    return view;
  }
  function toScreen(point, view) {
    const p = project(point, view);
    return { x: WIDTH / 2 + (p.x - view.x) * view.zoom, y: HEIGHT / 2 + (p.y - view.y) * view.zoom };
  }
  function toWorld(point, view) {
    return unproject({ x: (point.x - WIDTH / 2) / view.zoom + view.x,
      y: (point.y - HEIGHT / 2) / view.zoom + view.y }, view);
  }
  function cupVisible(cup, view) {
    const p = toScreen(cup, view), radius = (cup.radius || 13) * view.zoom;
    const [a, b, c, d] = coefficients(view);
    const rx = radius * Math.hypot(a, c), ry = radius * Math.hypot(b, d);
    return p.x >= rx && p.x <= WIDTH - rx && p.y >= ry && p.y <= HEIGHT - ry;
  }
  function matrix(view) {
    const [a, b, c, d] = coefficients(view);
    return [a * view.zoom, b * view.zoom, c * view.zoom, d * view.zoom,
      WIDTH / 2 - view.x * view.zoom, HEIGHT / 2 - view.y * view.zoom];
  }
  function pan(view, course, deltaX, deltaY) {
    // Camera centers are projected coordinates, so screen-space dragging is direct.
    const b = bounds(course);
    const clampAxis = (value, low, high, half) => high - low <= half * 2 ? (low + high) / 2 :
      Math.max(low + half, Math.min(high - half, value));
    view.x = clampAxis(view.x - deltaX / view.zoom, b.left, b.right, WIDTH / (2 * view.zoom));
    view.y = clampAxis(view.y - deltaY / view.zoom, b.top, b.bottom, (HEIGHT - 90) / (2 * view.zoom));
    return view;
  }
  function approachesCup(points, cup, radius = 180) {
    // Test segments as well as samples, so fast overshoots still qualify.
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[i + 1] ?? a;
      if (b.break) continue;
      const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
      const t = length2 ? Math.max(0, Math.min(1, ((cup.x - a.x) * dx + (cup.y - a.y) * dy) / length2)) : 0;
      if (Math.hypot(a.x + dx * t - cup.x, a.y + dy * t - cup.y) <= radius) return true;
    }
    return false;
  }
  function cupView(cup, course = {}) {
    const p = project(cup, course), zoom = 1.6;
    // Leave approach space below vertical cups, or left of horizontal cups.
    return { vertical: Boolean(course.vertical), x: p.x + (WIDTH / 2 - (course.vertical ? 180 : 230)) / zoom,
      y: p.y + (HEIGHT / 2 - (course.vertical ? 85 : 155)) / zoom, zoom };
  }
  const api = { WIDTH, HEIGHT, project, unproject, fit, create, follow, toScreen, toWorld, cupVisible, matrix, pan, approachesCup, cupView };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CosmicView = api;
})(typeof window !== 'undefined' ? window : globalThis);
