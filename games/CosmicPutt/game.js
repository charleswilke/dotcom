(() => {
  'use strict';
  const P = window.CosmicPhysics, S = window.CosmicScoring, V = window.CosmicView;
  let holeIndex = 0, L = P.levels[holeIndex];
  let scores = P.levels.map(() => null);
  const holeNumber = () => String(holeIndex + 1).padStart(2, '0');
  const canvas = document.getElementById('course'), ctx = canvas.getContext('2d');
  const cupCanvas = document.getElementById('cup-camera'), cupCtx = cupCanvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const ui = { strokes: $('strokes'), status: $('well-status'), description: $('well-description'),
    output: $('power-output'), fill: $('power-fill'),
    message: $('message'), result: $('result') };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ball, phase, strokes, angle, power, pendingBypass, shotBypass;
  let prediction, drag = null, trail = [], capture = null, shotTime = 0, shotOrigin = null;
  let accumulator = 0, lastTime = 0, time = 0;
  let coursePath, camera, overview = false, displayScale = 1, compactView = false;
  const touches = new Map();
  let panGesture = false, panCenter = null, manualPan = false;
  let cupPreview = false, cupShot = false, cupHoldUntil = 0, cupCamera;
  const terrain = document.createElement('canvas'); terrain.width = L.width; terrain.height = L.height;
  const terrainCtx = terrain.getContext('2d');
  function circle(c, x, y, r, fill, stroke, width = 1) {
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function text(c, value, x, y, color = '#d7efff', size = 10, align = 'left') {
    c.font = `${size}px ui-monospace, monospace`; c.fillStyle = color;
    c.textAlign = align; c.fillText(value, x, y);
  }
  function line(c, points, color, width = 1) {
    c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  function buildTerrain() {
    terrain.width = L.width; terrain.height = L.height;
    coursePath = new Path2D();
    L.boundary.forEach(([x, y], i) => i ? coursePath.lineTo(x, y) : coursePath.moveTo(x, y));
    coursePath.closePath();
    const c = terrainCtx;
    c.clearRect(0, 0, terrain.width, terrain.height);
    c.save(); c.lineJoin = 'round';
    c.fillStyle = '#17436e'; c.fill(coursePath);
    c.save(); c.clip(coursePath);
    for (let x = 0; x <= L.width; x += 25) line(c, [[x, 0], [x, L.height]], x % 100 === 0 ? '#a1d8ff22' : '#a1d8ff0d');
    for (let y = 0; y <= L.height; y += 25) line(c, [[0, y], [L.width, y]], y % 100 === 0 ? '#a1d8ff22' : '#a1d8ff0d');
    c.restore();
    c.strokeStyle = '#91cdef44'; c.lineWidth = 15; c.stroke(coursePath);
    c.strokeStyle = '#e1f4ff'; c.lineWidth = 2; c.stroke(coursePath);
    c.save(); c.clip(coursePath);
    c.strokeStyle = '#91cdef66'; c.lineWidth = 12; c.setLineDash([1, 9]); c.stroke(coursePath);
    c.restore(); c.restore();
    circle(c, L.tee.x, L.tee.y, 18, null, '#b6e3ff88');
    line(c, [[L.tee.x - 26, L.tee.y], [L.tee.x + 26, L.tee.y]], '#b6e3ff66');
    line(c, [[L.tee.x, L.tee.y - 26], [L.tee.x, L.tee.y + 26]], '#b6e3ff66');
    text(c, `TEE / ${holeNumber()}`, L.tee.x, L.tee.y - 37, '#c4e7ff', 10, 'center');
  }
  function updatePrediction() {
    prediction = P.predict(ball, angle, power, L, pendingBypass);
    cupPreview = V.approachesCup(prediction.points, L.cup); cupHoldUntil = 0;
    ui.output.textContent = `${Math.round(power * 100)}%`;
    ui.fill.style.width = `${power * 100}%`;
    document.querySelector('.power-control').style.setProperty('--power-angle', `${-80 + power * 160}deg`);
  }
  function updateUI(message) {
    const bypass = pendingBypass || shotBypass;
    ui.strokes.textContent = strokes;
    ui.status.className = bypass ? 'bypass' : '';
    ui.status.innerHTML = `<i></i> ${bypass ? 'BYPASS' : 'ACTIVE'}`;
    const well = L.wells.find(w => w.id === bypass);
    ui.description.textContent = bypass ? `${well.label ? `Well ${well.label}` : 'This well'} ignores your next stroke.${L.wells.length > 1 ? ' Other wells stay active.' : ''}` :
      L.wells.length > 1 ? `${L.wells.length} wells active. Link their pulls.` : 'Use its pull. Mind the center.';
    if (shotBypass && phase === 'moving') ui.description.textContent = `${well.label ? `Well ${well.label}` : 'The well'} bypassed for this entire shot.${L.wells.length > 1 ? ' Others still pull.' : ''}`;
    canvas.setAttribute('aria-label', `Hole ${holeIndex + 1}: ${L.hole}. ${strokes} strokes. ${L.wells.length} gravity ${L.wells.length === 1 ? 'well' : 'wells'}. ${bypass ? 'Captured well bypassed.' : 'All wells active.'} ${phase === 'ready' ? 'Ready to aim.' : phase === 'sunk' ? 'Hole complete.' : 'Ball in motion.'}`);
    if (message) ui.message.textContent = message;
  }
  function reset() {
    clearInput(); manualPan = false;
    ball = { ...L.tee }; phase = 'ready'; strokes = 0; power = L.aim?.power ?? .4; angle = L.aim?.angle ?? -.08;
    pendingBypass = null; shotBypass = null; drag = null; trail = []; capture = null; shotOrigin = null;
    accumulator = 0; releaseStretch = 0; ui.result.hidden = true;
    cupShot = false; cupHoldUntil = 0; cupCamera = V.cupView(L.cup);
    camera = V.create(L, overview, ball); updateViewControl();
    updatePrediction(); updateUI(L.hint ?? 'Drag back from the ball. Find your curve.');
  }
  function renderStars(element, count) {
    element.replaceChildren();
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.textContent = i < count ? '★' : '☆';
      star.className = i < count ? 'earned' : '';
      star.setAttribute('aria-hidden', 'true'); element.append(star);
    }
    element.setAttribute('aria-label', `${count} of 3 stars`);
  }
  function updateRound() {
    document.querySelectorAll('.hole-choice').forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === holeIndex));
      renderStars(button.querySelector('.hole-stars'), S.starsForStrokes(scores[i]));
      button.setAttribute('aria-label', `Hole ${i + 1}: ${P.levels[i].hole}. ${scores[i] === null ? 'Unplayed' : `${S.starsForStrokes(scores[i])} of 3 stars, best ${scores[i]} ${scores[i] === 1 ? 'putt' : 'putts'}`}`);
    });
    $('round-stars').textContent = `${S.totalStars(scores)} / ${P.levels.length * 3}`;
  }
  function loadHole(index) {
    cancelDrag(); holeIndex = index; L = P.levels[index];
    overview = false; buildTerrain(); reset(); updateRound();
    document.querySelector('.viewport').classList.toggle('long-hole', L.width > V.WIDTH);
    $('hole-badge').textContent = holeNumber();
    $('hole-title').textContent = L.hole;
    $('par').textContent = L.par;
    $('blueprint-number').textContent = `BLUEPRINT ${holeNumber()}`;
    $('study-label').textContent = `${L.wells.length} GRAVITY ${L.wells.length === 1 ? 'WELL' : 'WELLS'} · COURSE STUDY`;
    canvas.focus({ preventScroll: true });
  }
  function showResult() {
    scores = S.recordBest(scores, holeIndex, strokes); updateRound();
    const stars = S.starsForStrokes(strokes), complete = scores.every(score => score !== null);
    ui.result.hidden = false;
    $('result-course').textContent = `BLUEPRINT COURSE / ${holeNumber()}`;
    $('result-title').textContent = strokes === 1 ? 'A perfect orbit.' : stars === 2 ? 'Stellar putting.' : stars === 1 ? 'Right on course.' : 'Home among the stars.';
    renderStars($('result-stars'), stars);
    $('result-description').textContent = `${strokes} ${strokes === 1 ? 'putt. Hole in one!' : 'putts.'} ${stars} of 3 stars earned.`;
    $('round-summary').textContent = complete ? `Round complete · ${S.totalStars(scores)} of ${P.levels.length * 3} stars. Replay any hole to improve your score.` :
      `${scores.filter(score => score !== null).length} of ${P.levels.length} holes complete · ${S.totalStars(scores)} stars collected.`;
    $('next-hole').textContent = complete ? 'Play a new round ↗' : 'Next hole ↗';
    updateUI(complete ? 'Round complete. Every star earned its orbit.' : 'Hole complete. Your stars are on the scorecard.');
    $('next-hole').focus();
  }
  function shoot() {
    if (phase !== 'ready' || drag || panGesture) return;
    cupShot = cupPreview; cupHoldUntil = 0;
    shotOrigin = { x: ball.x, y: ball.y, stretch: releaseStretch };
    ball = P.launch(ball, angle, power); shotBypass = pendingBypass; pendingBypass = null;
    if (overview || manualPan) { overview = false; manualPan = false; camera = V.create(L, false, ball); updateViewControl(); }
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
      phase = 'sunk'; shotBypass = null; showResult();
    } else {
      phase = 'ready'; shotBypass = null; updatePrediction();
      if (cupShot) cupHoldUntil = time + 1.5;
      updateUI('Ball settled. Line up your next orbit.');
    }
  }
  function updateViewControl() {
    const button = $('overview'), label = overview || manualPan ? 'Return to ball ↙' : 'Course overview ↗';
    if (button.getAttribute('aria-pressed') !== String(overview)) button.setAttribute('aria-pressed', String(overview));
    if (button.textContent !== label) button.textContent = label;
    button.disabled = Boolean(drag) || panGesture || phase === 'moving' || phase === 'capturing' || phase === 'sunk';
    canvas.dataset.view = overview ? 'overview' : manualPan ? 'panned' : 'local';
    canvas.dataset.gesture = panGesture ? 'pan' : drag ? 'aim' : 'idle';
  }
  function drawSpace(c = ctx) {
    // Grid belongs to the course plane, so it moves naturally with the camera.
    c.fillStyle = '#103866'; c.fillRect(-600, -600, L.width + 1200, L.height + 1200);
    for (let x = -500; x <= L.width + 500; x += 25) {
      line(c, [[x, -500], [x, L.height + 500]], x % 100 === 0 ? '#a1d8ff22' : '#a1d8ff0c');
    }
    for (let y = -500; y <= L.height + 500; y += 25) {
      line(c, [[-500, y], [L.width + 500, y]], y % 100 === 0 ? '#a1d8ff22' : '#a1d8ff0c');
    }
    // Offset slab and upright sides give the blueprint a small model's depth.
    c.save(); c.translate(0, 18); c.fillStyle = '#071e38'; c.fill(coursePath);
    c.strokeStyle = '#071e38'; c.lineWidth = 16; c.stroke(coursePath); c.restore();
    c.drawImage(terrain, 0, 0);
    for (const section of L.sections ?? []) {
      text(c, section.label, section.x, section.y, '#b6e3ff99', 13, 'center');
    }
  }
  function drawWalls(c = ctx, view = camera) {
    const points = L.boundary.map(([x, y]) => V.toScreen({ x, y }, view));
    const height = 12 * view.zoom;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y);
      c.lineTo(b.x, b.y - height); c.lineTo(a.x, a.y - height); c.closePath();
      c.fillStyle = b.x < a.x ? '#619bc9' : '#2d6594'; c.fill();
    }
    line(c, [...points, points[0]].map(p => [p.x, p.y - height]), '#d7efff', 2 * view.zoom);
  }
  function drawWellLabels() {
    for (const well of L.wells) {
      const p = V.toScreen({ x: well.x, y: Math.max(70, well.y - well.influence - 12) }, camera);
      const bypass = well.id === (pendingBypass || shotBypass);
      const center = V.toScreen(well, camera);
      if (p.x < 50 || p.x > V.WIDTH - 50 || center.y < -40 || center.y > V.HEIGHT + 40) continue;
      p.y = Math.max(92, Math.min(V.HEIGHT - 70, p.y));
      ctx.fillStyle = bypass ? '#10284c' : '#271c40'; ctx.strokeStyle = bypass ? '#6488bc' : '#9f7acb';
      const font = Math.max(10, 8 / displayScale), width = font * 6.4 + 16, height = font + 12;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(p.x - width / 2, p.y - height / 2, width, height, 4); ctx.fill(); ctx.stroke();
      text(ctx, `${bypass ? 'BYPASS' : 'GRAVITY'}${well.label ? ` ${well.label}` : ''}`, p.x, p.y + font * .32, '#cfb6f1', font, 'center');
    }
  }
  function drawMap() {
    if (L.width <= V.WIDTH) return;
    const x = 838, y = 514, width = 230, height = 104;
    const scale = Math.min((width - 20) / L.width, (height - 20) / L.height);
    const ox = x + (width - L.width * scale) / 2, oy = y + (height - L.height * scale) / 2;
    ctx.fillStyle = '#071e38ee'; ctx.strokeStyle = '#91cfff66'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, width, height, 4); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 2, width - 4, height - 4); ctx.clip();
    ctx.translate(ox, oy); ctx.scale(scale, scale);
    ctx.fillStyle = '#285782'; ctx.fill(coursePath); ctx.strokeStyle = '#b6e3ff'; ctx.lineWidth = 1 / scale; ctx.stroke(coursePath);
    for (const well of L.wells) circle(ctx, well.x, well.y, 3 / scale, '#bc9ff5');
    circle(ctx, L.cup.x, L.cup.y, 3 / scale, '#fff');
    circle(ctx, ball.x, ball.y, Math.max(4, 2 / displayScale) / scale, '#8ce4d9');
    const corners = [[0, 0], [V.WIDTH, 0], [V.WIDTH, V.HEIGHT], [0, V.HEIGHT], [0, 0]]
      .map(([sx, sy]) => V.toWorld({ x: sx, y: sy }, camera));
    line(ctx, corners.map(p => [p.x, p.y]), '#8ce4d966', 1 / scale);
    ctx.restore();
    text(ctx, 'ROUTE / 01 → 02', x + 10, y + 14, '#b6e3ff', 9);
  }
  function drawCupCamera() {
    const arriving = phase === 'moving' && Math.hypot(ball.x - L.cup.x, ball.y - L.cup.y) < 220;
    if (arriving) cupShot = true;
    const live = phase === 'moving' && cupShot || phase === 'ready' && !drag && time < cupHoldUntil;
    const preview = phase === 'ready' && !live && cupPreview;
    const visible = live || preview;
    $('cup-inset').hidden = !visible;
    document.querySelector('.viewport').classList.toggle('cup-camera-active', visible);
    canvas.dataset.cupCamera = visible ? live ? 'live' : 'preview' : 'hidden';
    if (!visible) return false;
    const mode = live ? 'LIVE APPROACH' : 'APPROACH PREVIEW';
    if ($('cup-camera-mode').textContent !== mode) $('cup-camera-mode').textContent = mode;
    cupCanvas.setAttribute('aria-label', `${live ? 'Live' : 'Predicted'} close-up of the approach to hole ${holeIndex + 1}, at the same three-quarter angle.`);
    const c = cupCtx;
    c.fillStyle = '#103866'; c.fillRect(0, 0, 360, 240);
    c.save(); c.transform(...V.matrix(cupCamera));
    drawSpace(c); L.wells.forEach(well => drawWell(well, c)); drawCup(c);
    if (preview) {
      c.setLineDash([3, 5]);
      line(c, prediction.points.map(p => [p.x, p.y]), '#dcf2ffcc', 1.5);
      c.setLineDash([]);
      const end = prediction.body;
      if (end.status === 'sunk') circle(c, L.cup.x, L.cup.y, 21, null, '#8ce4d9', 1.5);
      else if (!prediction.truncated) circle(c, end.x, end.y, 7, null, '#dcf2ff99', 1.5);
    } else {
      if (trail.length > 1) line(c, trail.map(p => [p.x, p.y]), '#8ce4d9bb', 2);
      circle(c, ball.x + 2, ball.y + 4, 9, '#061b2799');
    }
    c.restore(); drawWalls(c, cupCamera); drawFlag(c, cupCamera);
    if (live) drawBallSphere(c, cupCamera, cupCanvas.getBoundingClientRect().width / 360 || 1);
    return true;
  }
  function drawHUD() {
    text(ctx, `${holeNumber()} / ${L.hole.toUpperCase()}`, 36, V.HEIGHT - 38, '#d7efff', 12);
    text(ctx, overview ? 'FULL COURSE · RELEASE RETURNS TO BALL' : L.width > V.WIDTH ? 'CAMERA FOLLOWS YOUR PUTT' : 'THREE-QUARTER COURSE STUDY', 36, V.HEIGHT - 20, '#8fbee0', 9);
    const insetVisible = drawCupCamera();
    if (!insetVisible || !compactView) drawMap();
    canvas.dataset.cameraX = camera.x.toFixed(2); canvas.dataset.cameraY = camera.y.toFixed(2);
    canvas.dataset.cameraZoom = camera.zoom.toFixed(4);
  }
  function drawWell(well, c = ctx) {
    const bypass = well.id === (pendingBypass || shotBypass);
    const t = reduced ? 0 : time;
    const x = well.x, y = well.y;
    circle(c, x, y, well.influence, bypass ? '#15315a22' : '#bca1ff0a');
    for (const r of [well.influence, well.influence * .7, well.influence * .45, well.core + 21]) {
      c.setLineDash(r === well.influence ? [5, 7] : []);
      circle(c, x, y, r, null, bypass ? '#7395bf55' : r === well.influence ? '#cdbaff77' : '#cdbaff55');
    }
    c.setLineDash([]);
    if (!bypass) {
      // One orbital arc replaces the overlapping ellipse decoration.
      c.beginPath(); c.arc(x, y, 73, t * -.3, t * -.3 + Math.PI * .65);
      c.strokeStyle = '#d7b8ff'; c.lineWidth = 2; c.stroke();
      for (let i = 0; i < 6; i++) {
        const f = (i / 6 + t * .1) % 1, a = i * 2.399 + t * .6;
        const r = well.core + (1 - f) * 97;
        circle(c, x + Math.cos(a) * r, y + Math.sin(a) * r, 1.5, `rgba(227,207,255,${f * .7})`);
      }
    }
    circle(c, x, y, well.core + 3, '#15233f', bypass ? '#5279b5' : '#c49ef3', 2);
    circle(c, x, y, well.core, '#060e1b');
    circle(c, x + 2, y + 3, well.core - 5, '#030810');
  }
  function drawCup(c = ctx) {
    const { x, y, radius } = L.cup;
    circle(c, x, y + 2, radius + 5, '#102b30');
    circle(c, x, y, radius + 3, '#b6e3ff', '#e1f4ff', 1);
    circle(c, x, y, radius, '#06141d');
  }
  function drawFlag(c = ctx, view = camera) {
    const p = V.toScreen(L.cup, view), z = view.zoom;
    if (p.x < -20 || p.x > V.WIDTH + 20 || p.y < -20 || p.y > V.HEIGHT + 60) return;
    line(c, [[p.x + 2 * z, p.y], [p.x + 2 * z, p.y - 49 * z]], '#e1f4ff', 2 * z);
    c.beginPath(); c.moveTo(p.x + 3 * z, p.y - 49 * z); c.lineTo(p.x + 27 * z, p.y - 39 * z);
    c.lineTo(p.x + 3 * z, p.y - 30 * z); c.closePath(); c.fillStyle = '#c4afff'; c.fill();
    text(c, holeNumber(), p.x + 8 * z, p.y - 37 * z, '#342c2f', 7 * z);
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
      circle(ctx, b.x, b.y, Math.max(1.6, 1 / displayScale / camera.zoom), `rgba(220,242,255,${.8 - i / points.length * .5})`);
    }
    const end = prediction.body;
    if (end.status === 'captured') {
      line(ctx, [[end.x - 5, end.y - 5], [end.x + 5, end.y + 5]], '#e7a4d8', 1.5);
      line(ctx, [[end.x + 5, end.y - 5], [end.x - 5, end.y + 5]], '#e7a4d8', 1.5);
    } else if (end.status === 'sunk') {
      circle(ctx, L.cup.x, L.cup.y, 21, null, '#dcf2ff88', 1.5);
    } else if (!prediction.truncated) {
      circle(ctx, end.x, end.y, 7, null, '#dcf2ff88');
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
    line(ctx, [[-setback + 1, -8], [-setback + 1, 8]], '#e1f4ff', 5);
    line(ctx, [[-setback - 7, 24], [-setback - 8, 36]], '#66c9c2', 4);
    ctx.restore();
  }
  function drawBall() {
    if (phase === 'sunk') {
      const r = 20 + Math.min(1, (time - shotTime) / 8) * 70;
      circle(ctx, L.cup.x, L.cup.y, r, null, '#b6e3ff44'); return;
    }
    if (trail.length > 1) {
      for (let i = 1; i < trail.length; i++) {
        line(ctx, [[trail[i - 1].x, trail[i - 1].y], [trail[i].x, trail[i].y]], `rgba(101,238,228,${i / trail.length * .55})`, i / trail.length * 3);
      }
    }
    circle(ctx, ball.x + 2, ball.y + 4, 9, '#061b2799');
    if (phase === 'ready' && strokes === 0) {
      text(ctx, 'DRAG TO AIM', ball.x, ball.y + 54, '#e1f4ff', 10, 'center');
      line(ctx, [[ball.x, ball.y + 22], [ball.x, ball.y + 35]], '#b6e3ff77');
    }
  }
  function drawBallSphere(c = ctx, view = camera, screenScale = displayScale) {
    if (phase === 'sunk') return;
    const p = V.toScreen(ball, view), r = Math.max(5, 4 / screenScale, P.RADIUS * view.zoom);
    c.save(); c.shadowColor = '#a3ede6'; c.shadowBlur = phase === 'moving' ? 12 : 4;
    const marble = c.createRadialGradient(p.x - r * .3, p.y - r * .5, 1, p.x, p.y - 2, r);
    marble.addColorStop(0, '#ffffff'); marble.addColorStop(.55, '#e1f4ff'); marble.addColorStop(1, '#8bb9da');
    circle(c, p.x, p.y - 2, r, marble); c.restore();
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
          if (Math.hypot(ball.x - L.cup.x, ball.y - L.cup.y) < 220) cupShot = true;
          if (Math.round(ball.age / P.DT) % 3 === 0) {
            trail.push({ x: ball.x, y: ball.y }); if (trail.length > 48) trail.shift();
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
          updatePrediction(); updateUI(`Well bypassed. Aim your escape shot.${L.wells.length > 1 ? ' The other wells still pull.' : ''}`);
        }
      } else if (trail.length) trail.shift();
    }
    if (!document.hidden && !overview && L.width > V.WIDTH && (phase === 'moving' || phase === 'capturing')) {
      V.follow(camera, L, ball, elapsed, reduced);
    }
    ctx.fillStyle = '#103866'; ctx.fillRect(0, 0, V.WIDTH, V.HEIGHT);
    ctx.save(); ctx.transform(...V.matrix(camera));
    drawSpace(); L.wells.forEach(well => drawWell(well)); drawCup(); drawPrediction(); drawBall(); ctx.restore();
    drawWalls(); drawWellLabels(); drawFlag(); drawBallSphere(); drawHUD(); updateViewControl();
    requestAnimationFrame(frame);
  }
  function position(event) {
    const rect = canvas.getBoundingClientRect();
    return V.toWorld({ x: (event.clientX - rect.left) / rect.width * V.WIDTH,
      y: (event.clientY - rect.top) / rect.height * V.HEIGHT }, camera);
  }
  function cancelDrag(retainCapture = false) {
    if (!drag) return;
    angle = drag.angle; power = drag.power; const id = drag.id; drag = null; releaseStretch = 0;
    if (!retainCapture && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    updatePrediction(); updateUI('Aim canceled. Find another curve.');
  }
  function touchCenter() {
    const points = [...touches.values()];
    return { x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
  }
  function clearInput() {
    const ids = [...touches.keys()]; touches.clear(); panGesture = false; panCenter = null;
    cancelDrag();
    ids.forEach(id => { if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id); });
  }
  canvas.addEventListener('pointerdown', event => {
    if (phase !== 'ready' || event.button !== 0) return;
    if (event.pointerType === 'touch') {
      event.preventDefault(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.size >= 2) {
        cancelDrag(true); panGesture = true; panCenter = touchCenter();
        updateUI('Two fingers move the course. Return to ball when you’re ready to putt.');
        return;
      }
      if (panGesture) return;
    }
    if (drag || panGesture) return;
    const point = position(event), hitRadius = Math.max(28, 28 * V.WIDTH / canvas.getBoundingClientRect().width);
    const screenPoint = V.toScreen(point, camera), screenBall = V.toScreen(ball, camera);
    if (Math.hypot(screenPoint.x - screenBall.x, screenPoint.y - screenBall.y) > hitRadius) {
      updateUI('Start on the ball to aim, or use two fingers to move the course.'); return;
    }
    event.preventDefault(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, angle, power, point, distance: 0 };
    updateUI('Pull opposite your shot. Release to putt; return to the ball to cancel.');
  });
  canvas.addEventListener('pointermove', event => {
    if (touches.has(event.pointerId)) {
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (panGesture) {
        event.preventDefault();
        if (touches.size >= 2) {
          const next = touchCenter(), rect = canvas.getBoundingClientRect();
          const oldX = camera.x, oldY = camera.y;
          V.pan(camera, L, (next.x - panCenter.x) * V.WIDTH / rect.width,
            (next.y - panCenter.y) * V.HEIGHT / rect.height);
          if (camera.x !== oldX || camera.y !== oldY) manualPan = true;
          panCenter = next;
        }
        return;
      }
    }
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
    touches.delete(event.pointerId);
    if (panGesture) {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (touches.size >= 2) panCenter = touchCenter();
      else if (!touches.size) {
        panGesture = false; panCenter = null;
        updateUI('Camera placed. Return to ball for your next putt.');
      }
      return;
    }
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.distance < 10) { cancelDrag(); return; }
    releaseStretch = elasticStretch(drag.distance);
    drag = null; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    shoot(); releaseStretch = 0;
  });
  canvas.addEventListener('wheel', event => {
    if (phase !== 'ready' || drag || panGesture || touches.size || event.ctrlKey) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
    const oldX = camera.x, oldY = camera.y;
    V.pan(camera, L, -event.deltaX * unit * V.WIDTH / rect.width,
      -event.deltaY * unit * V.HEIGHT / rect.height);
    if (camera.x !== oldX || camera.y !== oldY) {
      if (!manualPan) updateUI('Camera placed. Return to ball when you’re ready to putt.');
      manualPan = true;
    }
  }, { passive: false });
  canvas.addEventListener('pointercancel', clearInput);
  canvas.addEventListener('lostpointercapture', event => {
    if (touches.has(event.pointerId) || drag?.id === event.pointerId) clearInput();
  });
  window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', () => { lastTime = 0; accumulator = 0; if (document.hidden) clearInput(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { clearInput(); return; }
    if (phase !== 'ready' || drag || panGesture || touches.size || event.target.closest('button,input')) return;
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
  P.levels.forEach((course, i) => {
    const button = document.createElement('button');
    button.className = 'hole-choice';
    const number = document.createElement('span'); number.className = 'choice-number'; number.textContent = String(i + 1).padStart(2, '0');
    const title = document.createElement('span'); title.className = 'choice-title'; title.textContent = course.hole;
    const stars = document.createElement('span'); stars.className = 'hole-stars';
    button.append(number, title, stars);
    button.addEventListener('click', () => loadHole(i));
    $('hole-navigation').append(button);
  });
  $('next-hole').addEventListener('click', () => {
    if (scores.every(score => score !== null)) {
      scores = P.levels.map(() => null); loadHole(0);
    } else {
      let next = (holeIndex + 1) % P.levels.length;
      while (scores[next] !== null) next = (next + 1) % P.levels.length;
      loadHole(next);
    }
  });
  $('overview').addEventListener('click', () => {
    if (drag || panGesture || phase !== 'ready') return;
    overview = manualPan || overview ? false : true; manualPan = false; camera = V.create(L, overview, ball); updateViewControl();
    updateUI(overview ? 'Inspect the whole route. Return to ball for a closer aim.' : 'Back at the ball. The camera stays still while you aim.');
    canvas.focus({ preventScroll: true });
  });
  $('reset').addEventListener('click', () => { cancelDrag(); reset(); });
  $('play-again').addEventListener('click', () => { reset(); canvas.focus(); });
  $('help').addEventListener('click', () => {
    const visible = $('instructions').hidden; $('instructions').hidden = !visible;
    $('help').setAttribute('aria-expanded', String(visible));
  });
  // Keep canvas sharp on retina displays without changing world coordinates.
  function resize() {
    compactView = matchMedia('(max-width:760px)').matches;
    displayScale = canvas.getBoundingClientRect().width / V.WIDTH || 1;
    const scale = Math.min(2, window.devicePixelRatio || 1);
    cupCanvas.width = Math.round(360 * scale); cupCanvas.height = Math.round(240 * scale);
    cupCtx.setTransform(scale, 0, 0, scale, 0, 0);
    canvas.width = Math.round(V.WIDTH * scale); canvas.height = Math.round(V.HEIGHT * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  window.addEventListener('resize', resize); resize(); loadHole(0); requestAnimationFrame(frame);
})();
