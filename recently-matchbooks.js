(() => {
  const activeSparks = new WeakMap();
  const lastSparkStyle = new WeakMap();
  const sparkStyles = {
    fine: {
      count: 26, life: 220, lifeRange: 200,
      vx: .16, vxRange: .24, vy: -.4, vyRange: .52,
      size: .6, sizeRange: .65, tail: .018, trail: 30, line: 1.4, glow: 7,
      colors: ['#fff2c2', '#ffce72', '#ff9142'],
    },
    crackle: {
      count: 54, life: 240, lifeRange: 290,
      vx: .2, vxRange: .45, vy: -.8, vyRange: 1,
      size: 1, sizeRange: 1, tail: .016, trail: 23, line: 2.6, glow: 11,
      colors: ['#fffbe4', '#ffe99a', '#ffa84d'],
    },
    streak: {
      count: 30, life: 320, lifeRange: 260,
      vx: .36, vxRange: .35, vy: -.35, vyRange: .47,
      size: .8, sizeRange: .65, tail: .065, trail: 64, line: 2, glow: 9,
      colors: ['#fff1c0', '#ffc06b', '#ff813b'],
    },
  };

  function drawSmoke(context, x, y, bookHeight, age, lifetime, swipeVelocity) {
    const size = Math.min(1.2, Math.max(.85, bookHeight / 280));
    context.save();
    context.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 3; i++) {
      const puffAge = age - i * 55;
      if (puffAge <= 0) continue;
      const t = puffAge / 1000;
      const envelope = (1 - Math.exp(-puffAge / 75)) * (1 - age / lifetime) ** 1.4;
      // Keep a little swipe momentum, then let the smoke curl upward.
      const drift = swipeVelocity / 16 * (1 - Math.exp(-16 * t));
      const px = x + drift + Math.sin(t * 6 + i) * 2 * size;
      const py = y - (3 + i * 3 + 22 * t + 8 * t * t) * size;
      const radius = (3 + t * 8) * size;
      context.globalAlpha = envelope * .22 * (1 - i * .18);
      const puff = context.createRadialGradient(px, py, 0, px, py, radius);
      puff.addColorStop(0, '#c4c0b9b3');
      puff.addColorStop(.5, '#b6b4b140');
      puff.addColorStop(1, '#b6b4b100');
      context.fillStyle = puff;
      context.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    }
    context.restore();
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const activeRenderers = new Set();
  const gestureReleases = new Set();
  const lastGlint = new WeakMap();
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  function showStrikeGlint(book) {
    const now = performance.now();
    if (now - (lastGlint.get(book) ?? -Infinity) < 240) return;
    lastGlint.set(book, now);
    activeSparks.get(book)?.clear();
    const glint = document.createElement('span');
    glint.className = 'matchbook-strike-glint';
    book.append(glint);
    const animation = glint.animate([{ opacity: .7 }, { opacity: 0 }], 160);
    const effect = { clear() {
      animation.cancel();
      glint.remove();
      activeRenderers.delete(effect);
      if (activeSparks.get(book) === effect) activeSparks.delete(book);
    } };
    activeSparks.set(book, effect);
    activeRenderers.add(effect);
    animation.finished.then(effect.clear, effect.clear);
  }

  function createStrikeRenderer(book) {
    const choices = Object.keys(sparkStyles).filter(name => name !== lastSparkStyle.get(book));
    const styleName = choices[Math.floor(Math.random() * choices.length)];
    lastSparkStyle.set(book, styleName);
    const style = sparkStyles[styleName];
    const width = book.clientWidth;
    const height = book.clientHeight;
    if (!width || !height) return null;
    const canvas = document.createElement('canvas');
    canvas.className = 'matchbook-sparks';
    canvas.dataset.sparkStyle = styleName;
    canvas.setAttribute('aria-hidden', 'true');
    const bounds = book.getBoundingClientRect();
    const leftRoom = Math.min(width * .3, Math.max(0, bounds.left - 8));
    const rightRoom = Math.min(width * .3, Math.max(0, innerWidth - bounds.right - 8));
    const canvasWidth = width + leftRoom + rightRoom;
    canvas.style.left = `${-leftRoom}px`;
    canvas.style.right = 'auto';
    canvas.style.width = `${canvasWidth}px`;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvasWidth * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.scale(scale, scale);
    context.translate(leftRoom, 0);
    book.append(canvas);
    let frame = 0;
    let particles = [];
    let contact = null;
    let smoke = null;
    let lastEmission = performance.now();
    const smokeLife = 850;

    function finish() {
      if (contact && !smoke) smoke = { x: contact.x, velocity: contact.velocity, start: performance.now() };
    }
    function clear() {
      cancelAnimationFrame(frame);
      canvas.remove();
      activeRenderers.delete(renderer);
      if (activeSparks.get(book) === renderer) activeSparks.delete(book);
    }
    function emit(from, to, velocity, verticalVelocity) {
      const now = performance.now();
      const distance = Math.abs(to - from);
      const direction = Math.sign(to - from);
      const intensity = clamp(Math.abs(velocity) / 800, .45, 1.6);
      const count = Math.min(16, Math.max(1, Math.ceil(distance * style.count / 240 * intensity)));
      contact = { x: to, from, direction, velocity, intensity };
      smoke = null;
      lastEmission = now;
      canvas.dataset.strikeDirection = direction > 0 ? 'right' : 'left';
      canvas.dataset.strikeSpeed = String(Math.round(Math.abs(velocity)));
      for (let i = 0; i < count; i++) {
        particles.push({
          born: now,
          life: style.life + Math.random() * style.lifeRange,
          x: from + (to - from) * (i + .5) / count,
          y: height * .941 + (Math.random() - .5) * 3,
          vx: velocity * .18 + direction * width * (style.vx * .1 + Math.random() * style.vxRange * .2),
          vy: height * (style.vy + Math.random() * style.vyRange) + clamp(verticalVelocity * .1, -60, 60),
          size: (style.size + Math.random() * style.sizeRange) * Math.sqrt(intensity),
          color: style.colors[i % style.colors.length],
          phase: Math.random() * Math.PI * 2,
        });
      }
      if (particles.length > 140) particles.splice(0, particles.length - 140);
      if (!frame) frame = requestAnimationFrame(draw);
    }
    function draw(now) {
      frame = 0;
      if (now - lastEmission > 100) finish();
      particles = particles.filter(p => now - p.born < p.life);
      const contactAge = now - lastEmission;
      const smokeAge = smoke ? now - smoke.start : 0;
      const smokeVisible = smoke && smokeAge < smokeLife;
      if (!particles.length && contactAge > 100 && !smokeVisible) {
        clear();
        return;
      }
      context.clearRect(-leftRoom, 0, canvasWidth, height);
      context.globalCompositeOperation = 'lighter';
      if (contact && contactAge < 85) {
        const x = contact.x;
        const y = height * .941;
        const trailStart = x - Math.min(style.trail, Math.max(6, Math.abs(x - contact.from))) * contact.direction;
        const trail = context.createLinearGradient(trailStart, y, x + 2 * contact.direction, y);
        trail.addColorStop(0, '#ff7c2400');
        trail.addColorStop(.8, '#ffb54ac0');
        trail.addColorStop(1, '#fff5d9');
        context.globalAlpha = Math.max(0, 1 - contactAge / 85);
        context.strokeStyle = trail;
        context.lineWidth = style.line;
        context.beginPath();
        context.moveTo(trailStart, y + 1);
        context.lineTo(x, y);
        context.stroke();
        const glow = context.createRadialGradient(x, y, 0, x, y, style.glow);
        glow.addColorStop(0, '#ffe9a6b0');
        glow.addColorStop(1, '#ff8c2900');
        context.fillStyle = glow;
        context.fillRect(x - style.glow, y - style.glow, style.glow * 2, style.glow * 2);
      }
      for (const p of particles) {
        const age = now - p.born;
        const t = age / 1000;
        const tail = Math.max(0, t - style.tail);
        const flicker = styleName === 'crackle' ? .7 + .3 * Math.sin(age * .075 + p.phase) : 1;
        context.globalAlpha = (1 - age / p.life) ** 1.6 * flicker;
        context.strokeStyle = p.color;
        context.lineWidth = p.size;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(p.x + p.vx * tail, p.y + p.vy * tail + 100 * tail * tail);
        context.lineTo(p.x + p.vx * t, p.y + p.vy * t + 100 * t * t);
        context.stroke();
      }
      if (smokeVisible) drawSmoke(context, smoke.x, height * .941, height, smokeAge, smokeLife, smoke.velocity);
      frame = requestAnimationFrame(draw);
    }
    const renderer = { emit, finish, clear, get lastEmission() { return lastEmission; } };
    activeSparks.set(book, renderer);
    activeRenderers.add(renderer);
    return renderer;
  }

  function brushStriker(book, from, to, velocity, verticalVelocity = 0) {
    if (Math.abs(to - from) < .5) return;
    if (reducedMotion.matches) {
      showStrikeGlint(book);
      return;
    }
    let renderer = activeSparks.get(book);
    if (!renderer?.emit || performance.now() - renderer.lastEmission > 140) {
      renderer?.clear();
      renderer = createStrikeRenderer(book);
    }
    renderer?.emit(from, to, velocity, verticalVelocity);
  }

  function bindStrikerGestures(card, book) {
    let previous = null;
    let press = null;
    let suppressClick = false;
    function point(event) {
      const rect = book.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y, t: event.timeStamp, vx: 0, vy: 0,
        onPad: x >= rect.width * .03 && x <= rect.width * .97 && y >= rect.height * .9 && y <= rect.height * .995 };
    }
    function release(cancelled = false) {
      const ended = press;
      if (ended?.intent) suppressClick = true;
      press = null;
      previous = null;
      card.classList.remove('is-striking');
      if (ended && card.hasPointerCapture(ended.id)) card.releasePointerCapture(ended.id);
      if (cancelled) activeSparks.get(book)?.clear();
      else activeSparks.get(book)?.finish?.();
    }
    card.addEventListener('pointerdown', event => {
      if (event.isPrimary === false || event.button !== 0) return;
      suppressClick = false;
      previous = point(event);
      press = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
        onPad: previous.onPad, intent: false, vertical: false };
    }, { passive: true });
    card.addEventListener('pointermove', event => {
      if (event.isPrimary === false) return;
      if (press && event.pointerId !== press.id) return;
      if (!press && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const current = point(event);
      const last = previous;
      previous = current;
      if (press) {
        if (!press.onPad || press.vertical) return;
        const dx = Math.abs(event.clientX - press.startX);
        const dy = Math.abs(event.clientY - press.startY);
        if (!press.intent && dy > 8 && dy > dx * 1.2) {
          press.vertical = true;
          return;
        }
        if (!press.intent && dx > 8 && dx > dy * 1.3) {
          press.intent = true;
          card.classList.add('is-striking');
          card.setPointerCapture(event.pointerId);
        }
        if (!press.intent) return;
      }
      if (!last || current.t - last.t > 120 || current.t <= last.t) return;
      if (!current.onPad) {
        activeSparks.get(book)?.finish?.();
        return;
      }
      const dx = current.x - last.x;
      const dy = current.y - last.y;
      if (Math.abs(dx) < .8 || Math.abs(dx) < Math.abs(dy) * .75) return;
      const dt = Math.max(8, current.t - last.t) / 1000;
      const rawVx = clamp(dx / dt, -2400, 2400);
      current.vx = Math.sign(rawVx) === Math.sign(last.vx) ? last.vx * .6 + rawVx * .4 : rawVx;
      current.vy = clamp(dy / dt, -1200, 1200);
      const width = book.clientWidth;
      brushStriker(book, clamp(last.x, width * .03, width * .97), clamp(current.x, width * .03, width * .97), current.vx, current.vy);
    }, { passive: true });
    card.addEventListener('pointerup', event => { if (press?.id === event.pointerId) release(); });
    card.addEventListener('pointercancel', () => release(true));
    card.addEventListener('lostpointercapture', () => { if (press) release(true); });
    card.addEventListener('pointerleave', () => {
      if (!press?.intent) release();
    });
    card.addEventListener('dragstart', event => { if (press?.onPad) event.preventDefault(); });
    // This ancestor capture runs before the album/deck handlers on the link.
    // Only a deliberate swipe consumes its compatibility click; a fresh tap or
    // keyboard activation always follows the existing project link immediately.
    card.addEventListener('click', event => {
      const swallow = suppressClick && event.detail !== 0;
      suppressClick = false;
      if (swallow) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, { capture: true });
    gestureReleases.add(() => release(true));
  }

  function releaseGestures() {
    gestureReleases.forEach(release => release());
    activeRenderers.forEach(effect => effect.clear());
  }
  window.addEventListener('blur', releaseGestures);
  window.addEventListener('resize', releaseGestures, { passive: true });
  window.addEventListener('scroll', releaseGestures, { passive: true });
  reducedMotion.addEventListener('change', releaseGestures);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseGestures(); });

  function initRecentlyMatchbooks(root = document) {
    root.querySelectorAll('.matchbook').forEach(book => {
      if (book.dataset.matchbookReady) return;
      const base = book.querySelector('.matchbook-base');
      const source = base?.querySelector('.matchbook-image');
      const card = book.closest('.matchbook-item');
      if (!source || !card) return;
      book.dataset.matchbookReady = 'true';
      const inside = document.createElement('span');
      inside.className = 'matchbook-inside';
      const interior = document.createElement('img');
      interior.className = 'matchbook-interior-image';
      interior.src = '/images/recently-matchbooks/paper-match-interior-v1.webp';
      interior.alt = '';
      interior.decoding = 'sync';
      interior.draggable = false;
      inside.append(interior);
      base.append(inside);
      for (const layer of ['cover', 'flap']) {
        const wrapper = document.createElement('span');
        wrapper.className = `matchbook-${layer}`;
        wrapper.append(source.cloneNode(true));
        book.append(wrapper);
      }
      bindStrikerGestures(card, book);
      card.dataset.matchbookReady = 'true';
    });
  }
  window.initRecentlyMatchbooks = initRecentlyMatchbooks;
  initRecentlyMatchbooks();
})();
