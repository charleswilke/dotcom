/* Affine three-quarter projection and camera; physics stays in world coordinates. */
(function (root) {
  'use strict';
  const WIDTH = 1100, HEIGHT = 650;
  const A = 1, B = -.1, C = .24, D = .72, DET = A * D - B * C;
  const project = p => ({ x: A * p.x + C * p.y, y: B * p.x + D * p.y });
  const unproject = p => ({ x: (D * p.x - C * p.y) / DET, y: (-B * p.x + A * p.y) / DET });
  function bounds(course) {
    const corners = [{ x: 0, y: 0 }, { x: course.width, y: 0 },
      { x: 0, y: course.height }, { x: course.width, y: course.height }].map(project);
    return { left: Math.min(...corners.map(p => p.x)), right: Math.max(...corners.map(p => p.x)),
      top: Math.min(...corners.map(p => p.y)), bottom: Math.max(...corners.map(p => p.y)) };
  }
  function fit(course) {
    const points = course.boundary.map(([x, y]) => project({ x, y }));
    const b = { left: Math.min(...points.map(p => p.x)) - 25, right: Math.max(...points.map(p => p.x)) + 25,
      top: Math.min(...points.map(p => p.y)) - 50, bottom: Math.max(...points.map(p => p.y)) + 35 };
    return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2,
      zoom: Math.min((WIDTH - 70) / (b.right - b.left), (HEIGHT - 115) / (b.bottom - b.top)) };
  }
  function target(course, position, zoom) {
    const b = bounds(course), p = project(position);
    const clampAxis = (value, low, high, half) => high - low <= half * 2 ? (low + high) / 2 :
      Math.max(low + half, Math.min(high - half, value));
    return { x: clampAxis(p.x, b.left, b.right, WIDTH / (2 * zoom)),
      y: clampAxis(p.y, b.top, b.bottom, (HEIGHT - 90) / (2 * zoom)), zoom };
  }
  function create(course, overview, ball) {
    return overview || course.width <= WIDTH ? fit(course) : target(course, { x: ball.x + 210, y: ball.y }, 1.15);
  }
  function follow(view, course, ball, elapsed, reduced = false) {
    const lookX = Math.max(-140, Math.min(140, (ball.vx || 0) * .4));
    const lookY = Math.max(-75, Math.min(75, (ball.vy || 0) * .3));
    const next = target(course, { x: ball.x + lookX, y: ball.y + lookY }, view.zoom);
    const blend = reduced ? 1 : 1 - Math.exp(-5 * elapsed);
    view.x += (next.x - view.x) * blend; view.y += (next.y - view.y) * blend;
    return view;
  }
  function toScreen(point, view) {
    const p = project(point);
    return { x: WIDTH / 2 + (p.x - view.x) * view.zoom, y: HEIGHT / 2 + (p.y - view.y) * view.zoom };
  }
  function toWorld(point, view) {
    return unproject({ x: (point.x - WIDTH / 2) / view.zoom + view.x,
      y: (point.y - HEIGHT / 2) / view.zoom + view.y });
  }
  function cupVisible(cup, view) {
    const p = toScreen(cup, view), radius = (cup.radius || 13) * view.zoom;
    const rx = radius * Math.hypot(A, C), ry = radius * Math.hypot(B, D);
    return p.x >= rx && p.x <= WIDTH - rx && p.y >= ry && p.y <= HEIGHT - ry;
  }
  function matrix(view) {
    return [A * view.zoom, B * view.zoom, C * view.zoom, D * view.zoom,
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
      const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
      const t = length2 ? Math.max(0, Math.min(1, ((cup.x - a.x) * dx + (cup.y - a.y) * dy) / length2)) : 0;
      if (Math.hypot(a.x + dx * t - cup.x, a.y + dy * t - cup.y) <= radius) return true;
    }
    return false;
  }
  function cupView(cup) {
    const p = project(cup), zoom = 1.6;
    // Cup sits right of center, leaving room for the incoming approach and flag.
    return { x: p.x + (WIDTH / 2 - 230) / zoom, y: p.y + (HEIGHT / 2 - 155) / zoom, zoom };
  }
  const api = { WIDTH, HEIGHT, project, unproject, fit, create, follow, toScreen, toWorld, cupVisible, matrix, pan, approachesCup, cupView };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CosmicView = api;
})(typeof window !== 'undefined' ? window : globalThis);
