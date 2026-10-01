(() => {
  'use strict';
  const P = window.CosmicPhysics, L = P.level;
  const canvas = document.getElementById('course'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const ui = { strokes: $('strokes'), status: $('well-status'), description: $('well-description'),
    output: $('power-output'), fill: $('power-fill'),
    message: $('message'), result: $('result') };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ball, phase, strokes, angle, power, pendingBypass, shotBypass;
  let prediction, drag = null, trail = [], capture = null, shotTime = 0, shotOrigin = null;
  let accumulator = 0, lastTime = 0, time = 0;
  let seed = 1729;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const stars = Array.from({ length: 180 }, () => ({ x: random() * L.width,
    y: random() * L.height, r: random() * 1.3 + .2, a: random() * .6 + .1 }));
  const coursePath = new Path2D();
  L.boundary.forEach(([x, y], i) => i ? coursePath.lineTo(x, y) : coursePath.moveTo(x, y));
  coursePath.closePath();
  const terrain = document.createElement('canvas'); terrain.width = L.width; terrain.height = L.height;
  const terrainCtx = terrain.getContext('2d');
  function circle(c, x, y, r, fill, stroke, width = 1) {
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function text(c, value, x, y, color = '#e9d4b2', size = 10, align = 'left') {
    c.font = `${size}px ui-monospace, monospace`; c.fillStyle = color;
    c.textAlign = align; c.fillText(value, x, y);
  }
  function line(c, points, color, width = 1) {
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  function buildTerrain() {
    const c = terrainCtx;
    // Broad, flat shapes keep the playable surface legible at small sizes.
    c.save(); c.translate(0, 10); c.shadowColor = '#0006'; c.shadowBlur = 20;
    c.shadowOffsetY = 8; c.fillStyle = '#3c4d60'; c.fill(coursePath);
    c.strokeStyle = '#3c4d60'; c.lineWidth = 26; c.lineJoin = 'round'; c.stroke(coursePath); c.restore();
    c.save(); c.lineJoin = 'round';
    c.strokeStyle = '#d8d2be'; c.lineWidth = 26; c.stroke(coursePath);
    const turf = c.createLinearGradient(0, 100, 0, 550);
    turf.addColorStop(0, '#266d6a'); turf.addColorStop(1, '#20575c');
    c.fillStyle = turf; c.fill(coursePath);
    c.save(); c.clip(coursePath);
    c.lineWidth = 7; c.strokeStyle = '#102f3e55'; c.stroke(coursePath);
    c.restore(); c.restore();
    // A single quiet moon replaces the tiny scenery and its many small details.
    circle(c, 245, 195, 38, '#9fadaf');
    c.save(); c.beginPath(); c.arc(245, 195, 38, 0, Math.PI * 2); c.clip();
    circle(c, 261, 180, 38, '#1a2b3e'); c.restore();
    c.save(); c.translate(245, 195); c.rotate(-.3);
    c.beginPath(); c.ellipse(0, 0, 68, 23, 0, .15, Math.PI * 1.1);
    c.strokeStyle = '#a5b4bd35'; c.lineWidth = 1; c.stroke(); c.restore();
  }
  buildTerrain();
  function updatePrediction() {
    prediction = P.predict(ball, angle, power, L, pendingBypass);
    ui.output.textContent = `${Math.round(power * 100)}%`;
    ui.fill.style.width = `${power * 100}%`;
    document.querySelector('.power-control').style.setProperty('--power-angle', `${-80 + power * 160}deg`);
  }
  function updateUI(message) {
    const bypass = pendingBypass || shotBypass;
    ui.strokes.textContent = strokes;
    ui.status.className = bypass ? 'bypass' : '';
    ui.status.innerHTML = `<i></i> ${bypass ? 'BYPASS' : 'ACTIVE'}`;
    ui.description.textContent = bypass ? 'This well ignores your next stroke.' : 'Use its pull. Mind the center.';
    if (shotBypass && phase === 'moving') ui.description.textContent = 'Gravity bypassed for this entire shot.';
    canvas.setAttribute('aria-label', `Golf course. ${strokes} strokes. Gravity well ${bypass ? 'bypassed' : 'active'}. ${phase === 'ready' ? 'Ready to aim.' : phase === 'sunk' ? 'Hole complete.' : 'Ball in motion.'}`);
    if (message) ui.message.textContent = message;
  }
  function reset() {
    ball = { ...L.tee }; phase = 'ready'; strokes = 0; power = .55; angle = -.25;
    pendingBypass = null; shotBypass = null; drag = null; trail = []; capture = null; shotOrigin = null;
    accumulator = 0; ui.result.hidden = true;
    updatePrediction(); updateUI('Drag back from the ball. Find your curve.');
  }
  function shoot() {
    if (phase !== 'ready' || drag) return;
    shotOrigin = { x: ball.x, y: ball.y, stretch: releaseStretch };
    ball = P.launch(ball, angle, power); shotBypass = pendingBypass; pendingBypass = null;
    phase = 'moving'; strokes++; trail = []; accumulator = 0; shotTime = time;
    updateUI(shotBypass ? 'A free orbit. This well is bypassed until the ball stops.' : 'Off into orbit…');
  }
  function resolveShot() {
    if (ball.status === 'captured') {
      pendingBypass = ball.capturedBy; shotBypass = null; phase = 'capturing';
      const well = L.wells.find(w => w.id === pendingBypass);
      capture = { from: { x: ball.x, y: ball.y }, well, started: time };
      updateUI('Captured! No extra penalty. The well will ignore your next shot.');
    } else if (ball.status === 'sunk') {
      phase = 'sunk'; shotBypass = null; ui.result.hidden = false;
      const title = strokes === 1 ? 'A perfect orbit.' : strokes < L.par ? 'Stellar putting.' : strokes === L.par ? 'Right on course.' : 'Home among the stars.';
      $('result-title').textContent = title;
      const score = strokes === 1 ? 'Hole in one!' : strokes === L.par ? 'Par.' : strokes < L.par ? `${L.par - strokes} under par.` : `${strokes - L.par} over par.`;
      $('result-description').textContent = `${strokes} ${strokes === 1 ? 'stroke' : 'strokes'}. ${score} Try another route through the garden.`;
      updateUI('Hole complete. Every orbit is a little different.');
      $('play-again').focus();
    } else {
      phase = 'ready'; shotBypass = null; updatePrediction();
      updateUI('Ball settled. Line up your next orbit.');
    }
  }
  function drawSpace() {
    ctx.fillStyle = '#080f1d'; ctx.fillRect(0, 0, L.width, L.height);
    const glow = ctx.createRadialGradient(540, 310, 50, 540, 310, 650);
    glow.addColorStop(0, '#152336'); glow.addColorStop(1, '#080f1d');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, L.width, L.height);
    for (const star of stars) circle(ctx, star.x, star.y, star.r, `rgba(196,215,238,${star.a})`);
    // Observatory compass and orbital marks, restrained and static.
    circle(ctx, 82, 142, 32, null, '#b3905950'); circle(ctx, 82, 142, 21, null, '#b3905925');
    line(ctx, [[50, 142], [114, 142]], '#b3905930'); line(ctx, [[82, 110], [82, 174]], '#b3905930');
    circle(ctx, 82, 142, 3, '#d9b87e');
    line(ctx, [[1035, 80], [1035, 104]], '#d9b87e88');
    line(ctx, [[1026, 94], [1035, 80], [1044, 94]], '#d9b87e88'); text(ctx, 'N', 1035, 70, '#b39975', 9, 'center');
    circle(ctx, 1035, 557, 40, null, '#64778933'); circle(ctx, 1035, 557, 27, null, '#64778922');
    ctx.drawImage(terrain, 0, 0);
    circle(ctx, L.tee.x, L.tee.y, 15, null, '#95c6b54a');
  }
  function drawWell(well) {
    const bypass = well.id === (pendingBypass || shotBypass);
    const t = reduced ? 0 : time;
    const x = well.x, y = well.y;
    const glow = ctx.createRadialGradient(x, y, 3, x, y, well.influence);
    glow.addColorStop(0, bypass ? '#18336366' : '#b282ec66');
    glow.addColorStop(.5, bypass ? '#18336322' : '#9e6fe71f'); glow.addColorStop(1, '#9162d500');
    circle(ctx, x, y, well.influence, glow);
    for (const r of [well.influence, 112, 73, 39]) {
      ctx.setLineDash(r === well.influence ? [3, 9] : []);
      circle(ctx, x, y, r, null, bypass ? '#5e80bd44' : r === well.influence ? '#c3a1ed33' : '#c3a1ed77');
    }
    ctx.setLineDash([]);
    if (!bypass) {
      // One orbital arc replaces the overlapping ellipse decoration.
      ctx.beginPath(); ctx.arc(x, y, 73, t * -.3, t * -.3 + Math.PI * .65);
      ctx.strokeStyle = '#d7b8ff'; ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const f = (i / 6 + t * .1) % 1, a = i * 2.399 + t * .6;
        const r = well.core + (1 - f) * 97;
        circle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 1.5, `rgba(227,207,255,${f * .7})`);
      }
    }
    circle(ctx, x, y, well.core + 3, '#15233f', bypass ? '#5279b5' : '#c49ef3', 2);
    circle(ctx, x, y, well.core, '#060e1b');
    circle(ctx, x + 2, y + 3, well.core - 5, '#030810');
    const labelY = y - 118;
    ctx.fillStyle = bypass ? '#10284c' : '#271c40'; ctx.strokeStyle = bypass ? '#6488bc' : '#9f7acb';
    ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x - 43, labelY - 14, 86, 24, 4); ctx.fill(); ctx.stroke();
    text(ctx, bypass ? 'BYPASS' : 'GRAVITY', x, labelY + 2, bypass ? '#a9c4ec' : '#cfb6f1', 10, 'center');
    line(ctx, [[x, labelY + 10], [x, labelY + 24]], bypass ? '#6488bc' : '#9f7acb');
  }
  function drawCup() {
    const { x, y, radius } = L.cup;
    circle(ctx, x, y + 2, radius + 5, '#102b30');
    circle(ctx, x, y, radius + 3, '#ddc398', '#f4e3bf', 1);
    circle(ctx, x, y, radius, '#06141d');
    line(ctx, [[x + 2, y], [x + 2, y - 49]], '#e3d5ba', 2);
    ctx.beginPath(); ctx.moveTo(x + 3, y - 49); ctx.lineTo(x + 27, y - 39);
    ctx.lineTo(x + 3, y - 30); ctx.closePath(); ctx.fillStyle = '#dc8c72'; ctx.fill();
    text(ctx, '01', x + 8, y - 37, '#342c2f', 7);
    text(ctx, 'PAR 3', x, y + 32, '#b7d1ba99', 9, 'center');
  }
  function drawPrediction() {
    if (phase !== 'ready' || !prediction) {
      // A quick follow-through makes the release feel like a physical tap.
      const progress = (time - shotTime) / .18;
      if (phase === 'moving' && shotOrigin && progress < 1 && !reduced) {
        const recoil = (1 - progress) ** 3;
        drawPutter(shotOrigin, 5 + (18 + shotOrigin.stretch * .45) * recoil, 1 - progress);
        if (shotOrigin.stretch > 0) drawTether(shotOrigin, shotOrigin.stretch * recoil, power, 1 - progress);
      }
      return;
    }
    const points = prediction.points;
    // Space dots by distance so slow portions don't become a solid bright knot.
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i]; distance += Math.hypot(b.x - a.x, b.y - a.y);
      if (distance < 9) continue;
      distance = 0;
      circle(ctx, b.x, b.y, 1.6, `rgba(252,233,190,${.8 - i / points.length * .5})`);
    }
    const end = prediction.body;
    if (end.status === 'captured') {
      line(ctx, [[end.x - 5, end.y - 5], [end.x + 5, end.y + 5]], '#e7a4d8', 1.5);
      line(ctx, [[end.x + 5, end.y - 5], [end.x - 5, end.y + 5]], '#e7a4d8', 1.5);
    } else if (end.status === 'sunk') {
      circle(ctx, L.cup.x, L.cup.y, 21, null, '#ead3a388', 1.5);
    } else if (!prediction.truncated) {
      circle(ctx, end.x, end.y, 7, null, '#f2deae88');
    }
    // Pull-back putter points in the same direction as the shot.
    const stretch = drag ? elasticStretch(drag.distance) : 0;
    const setback = 23 + stretch * .45;
    drawPutter(ball, setback);
    if (drag && drag.distance > 5) drawTether(ball, stretch, power);
  }
  // The handle yields less as the band stretches, giving visible resistance.
  const elasticStretch = distance => 180 * (1 - Math.exp(-distance / 180));
  let releaseStretch = 0;
  function drawTether(origin, stretch, tension, opacity = 1) {
    ctx.save(); ctx.translate(origin.x, origin.y); ctx.rotate(angle); ctx.globalAlpha = opacity;
    const color = tension > .8 ? '#f4c482' : '#8ce4d9';
    const rootWidth = 6 - tension * 2;
    const neckWidth = 8 / (1 + stretch * .07);
    const tipWidth = 5 - tension * 2;
    const fill = ctx.createLinearGradient(-stretch - tipWidth, 0, 0, 0);
    fill.addColorStop(0, color); fill.addColorStop(.5, tension > .8 ? '#dba968' : '#53bfb8');
    fill.addColorStop(1, '#c6f7e9');
    ctx.fillStyle = fill; ctx.shadowColor = color; ctx.shadowBlur = 4 + tension * 5;
    // One solid, soft shape: a plump short pull becomes a narrow stretched neck.
    ctx.beginPath(); ctx.moveTo(-4, -rootWidth);
    ctx.bezierCurveTo(-stretch * .3, -neckWidth, -stretch * .8, -neckWidth, -stretch, -tipWidth);
    ctx.bezierCurveTo(-stretch - tipWidth * 1.4, -tipWidth, -stretch - tipWidth * 1.4, tipWidth, -stretch, tipWidth);
    ctx.bezierCurveTo(-stretch * .8, neckWidth, -stretch * .3, neckWidth, -4, rootWidth);
    ctx.quadraticCurveTo(-1, 0, -4, -rootWidth); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawPutter(origin, setback, opacity = 1) {
    ctx.save(); ctx.translate(origin.x, origin.y); ctx.rotate(angle); ctx.globalAlpha = opacity;
    line(ctx, [[-setback, 0], [-setback - 7, 31]], '#a7b9c4', 3);
    line(ctx, [[-setback + 1, -8], [-setback + 1, 8]], '#e4d5b7', 5);
    line(ctx, [[-setback - 7, 24], [-setback - 8, 36]], '#66c9c2', 4);
    ctx.restore();
  }
  function drawBall() {
    if (phase === 'sunk') {
      const r = 20 + Math.min(1, (time - shotTime) / 8) * 70;
      circle(ctx, L.cup.x, L.cup.y, r, null, '#e5c58d44'); return;
    }
    if (trail.length > 1) {
      for (let i = 1; i < trail.length; i++) {
        line(ctx, [[trail[i - 1].x, trail[i - 1].y], [trail[i].x, trail[i].y]], `rgba(101,238,228,${i / trail.length * .55})`, i / trail.length * 3);
      }
    }
    circle(ctx, ball.x + 2, ball.y + 4, 8, '#061b2788');
    ctx.save(); ctx.shadowColor = '#a3ede6'; ctx.shadowBlur = phase === 'moving' ? 15 : 5;
    const marble = ctx.createRadialGradient(ball.x - 2, ball.y - 3, 1, ball.x, ball.y, 8);
    marble.addColorStop(0, '#fff9df'); marble.addColorStop(.55, '#eae9d8'); marble.addColorStop(1, '#9cbcbf');
    circle(ctx, ball.x, ball.y, P.RADIUS, marble); ctx.restore();
    if (phase === 'ready' && strokes === 0) {
      text(ctx, 'DRAG TO AIM', ball.x, ball.y + 54, '#eed6ac', 10, 'center');
      line(ctx, [[ball.x, ball.y + 22], [ball.x, ball.y + 35]], '#e2c69a77');
    }
  }
  function frame(stamp) {
    const elapsed = lastTime ? Math.min(.1, (stamp - lastTime) / 1000) : 0;
    lastTime = stamp;
    if (!document.hidden) {
      time += elapsed;
      if (phase === 'moving') {
        accumulator += elapsed;
        while (accumulator >= P.DT && phase === 'moving') {
          P.step(ball, L, shotBypass); accumulator -= P.DT;
          if (Math.round(ball.age / P.DT) % 3 === 0) {
            trail.push({ x: ball.x, y: ball.y }); if (trail.length > 28) trail.shift();
          }
          if (ball.status !== 'moving') resolveShot();
        }
      } else if (phase === 'capturing') {
        const p = Math.min(1, (time - capture.started) / (reduced ? .15 : .65));
        const a = p * Math.PI * 2, radius = (1 - p) * Math.hypot(capture.from.x - capture.well.x, capture.from.y - capture.well.y);
        const startAngle = Math.atan2(capture.from.y - capture.well.y, capture.from.x - capture.well.x);
        ball.x = capture.well.x + Math.cos(a + startAngle) * radius;
        ball.y = capture.well.y + Math.sin(a + startAngle) * radius;
        if (p === 1) {
          ball = { x: capture.well.x, y: capture.well.y }; phase = 'ready'; trail = [];
          updatePrediction(); updateUI('Well bypassed. Aim your escape shot—no gravity from this well.');
        }
      } else if (trail.length) trail.shift();
    }
    drawSpace(); L.wells.forEach(drawWell); drawCup(); drawPrediction(); drawBall();
    requestAnimationFrame(frame);
  }
  function position(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * L.width,
      y: (event.clientY - rect.top) / rect.height * L.height };
  }
  function cancelDrag() {
    if (!drag) return;
    angle = drag.angle; power = drag.power; const id = drag.id; drag = null; releaseStretch = 0;
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    updatePrediction(); updateUI('Aim canceled. Find another curve.');
  }
  canvas.addEventListener('pointerdown', event => {
    if (phase !== 'ready' || drag || event.button !== 0) return;
    const point = position(event), hitRadius = Math.max(36, 28 * L.width / canvas.getBoundingClientRect().width);
    if (Math.hypot(point.x - ball.x, point.y - ball.y) > hitRadius) {
      updateUI('Start your drag on the ball, then pull back to aim.'); return;
    }
    event.preventDefault(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, angle, power, point, distance: 0 };
    updateUI('Pull opposite your shot. Release to putt; return to the ball to cancel.');
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    drag.point = position(event);
    const dx = ball.x - drag.point.x, dy = ball.y - drag.point.y;
    drag.distance = Math.hypot(dx, dy);
    if (drag.distance > 5) {
      angle = Math.atan2(dy, dx);
      power = Math.max(.01, Math.min(1, drag.distance / 190) ** 1.3);
      updatePrediction();
    }
  });
  canvas.addEventListener('pointerup', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.distance < 10) { cancelDrag(); return; }
    releaseStretch = elasticStretch(drag.distance);
    drag = null; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    shoot();
    releaseStretch = 0;
  });
  canvas.addEventListener('pointercancel', cancelDrag);
  canvas.addEventListener('lostpointercapture', cancelDrag);
  window.addEventListener('blur', cancelDrag);
  document.addEventListener('visibilitychange', () => { lastTime = 0; accumulator = 0; if (document.hidden) cancelDrag(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { cancelDrag(); return; }
    if (phase !== 'ready' || drag || event.target.closest('button,input')) return;
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === ' ' || event.key === 'Enter') { shoot(); return; }
    const step = event.shiftKey ? .006 : .025;
    if (event.key === 'ArrowLeft') angle -= step;
    if (event.key === 'ArrowRight') angle += step;
    if (event.key === 'ArrowUp') power = Math.min(1, power + .02);
    if (event.key === 'ArrowDown') power = Math.max(.01, power - .02);
    updatePrediction(); updateUI('Fine-tune the curve. Space to putt.');
  });
  $('reset').addEventListener('click', () => { cancelDrag(); reset(); });
  $('play-again').addEventListener('click', () => { reset(); canvas.focus(); });
  $('help').addEventListener('click', () => {
    const visible = $('instructions').hidden; $('instructions').hidden = !visible;
    $('help').setAttribute('aria-expanded', String(visible));
  });
  // Keep canvas sharp on retina displays without changing world coordinates.
  function resize() {
    const scale = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(L.width * scale); canvas.height = Math.round(L.height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  window.addEventListener('resize', resize); resize(); reset(); requestAnimationFrame(frame);
})();
