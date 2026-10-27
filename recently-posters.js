(() => {
  const wall = document.querySelector('.poster-wall');
  const beam = wall?.querySelector('.spotlight-beam');
  const pool = wall?.querySelector('.spotlight-pool');
  if (!wall || !beam || !pool) return;
  if (wall.dataset.spotlightInitialized) return;
  wall.dataset.spotlightInitialized = 'true';

  const finePointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const dust = document.createElement('div');
  dust.className = 'spotlight-dust';
  dust.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 32; i++) {
    const mote = document.createElement('span');
    mote.className = 'dust-mote';
    // Place each speck inside the widening cone. Position, size and drift are
    // fixed once; CSS animates only its small transform and opacity thereafter.
    const depth = .25 + Math.random() * .68;
    const spread = .02 + depth * .46;
    mote.style.left = `${( .5 + (Math.random() * 2 - 1) * spread * .8) * 100}%`;
    mote.style.top = `${depth * 100}%`;
    mote.style.setProperty('--dust-size', `${.65 + Math.random() * .75}px`);
    mote.style.setProperty('--dust-alpha', (.24 + Math.random() * .36).toFixed(2));
    mote.style.setProperty('--dust-dx', `${-16 + Math.random() * 32}px`);
    mote.style.setProperty('--dust-dy', `${i % 4 === 0 ? 22 + Math.random() * 15 : -28 - Math.random() * 34}px`);
    mote.style.setProperty('--dust-time', `${8 + Math.random() * 9}s`);
    mote.style.setProperty('--dust-delay', `${-Math.random() * 18}s`);
    dust.append(mote);
  }
  beam.append(dust);

  let dustInView = true;
  function syncDust() {
    wall.classList.toggle('is-dust-visible', dustInView && !document.hidden);
  }
  const dustObserver = new IntersectionObserver(([entry]) => {
    dustInView = entry.isIntersecting;
    syncDust();
  });
  dustObserver.observe(wall);
  syncDust();
  const cards = [...wall.querySelectorAll('.pasted-poster')];
  for (const card of cards) {
    const dimmer = document.createElement('span');
    dimmer.className = 'poster-dimmer';
    dimmer.setAttribute('aria-hidden', 'true');
    card.querySelector('.poster-paper').append(dimmer);
  }

  let hovered = null;
  let focused = null;
  let active = null;
  let frame = 0;
  let lastTime = 0;
  let originX = 0;
  const originY = -180;
  let beamWidth = 640;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let initialized = false;

  function draw() {
    const dx = x - originX;
    const dy = y - originY;
    const angle = -Math.atan2(dx, dy);
    const distance = Math.hypot(dx, dy);
    beam.style.transform = `translate3d(${originX - beamWidth / 2}px, ${originY}px, 0) rotate(${angle}rad) scaleY(${distance / 1000})`;
    pool.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function animate(time) {
    // A damped spring gives the lamp a little weight. It stops completely once
    // settled; there is no idle animation, pointer polling, or per-frame layout.
    const dt = Math.min((time - (lastTime || time - 16)) / 1000, .032);
    lastTime = time;
    const damping = Math.exp(-14 * dt);
    velocityX = (velocityX + (targetX - x) * 105 * dt) * damping;
    velocityY = (velocityY + (targetY - y) * 105 * dt) * damping;
    x += velocityX * dt;
    y += velocityY * dt;
    if (Math.hypot(targetX - x, targetY - y) < .4 && Math.hypot(velocityX, velocityY) < 2) {
      x = targetX;
      y = targetY;
      velocityX = velocityY = 0;
      draw();
      frame = 0;
      lastTime = 0;
      return;
    }
    draw();
    frame = requestAnimationFrame(animate);
  }

  function aim(card) {
    const wallRect = wall.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    originX = wallRect.width * .5;
    targetX = cardRect.left - wallRect.left + cardRect.width * .5;
    targetY = cardRect.top - wallRect.top + cardRect.height * .46;
    beamWidth = cardRect.width * 1.85;
    beam.style.width = `${beamWidth}px`;
    pool.style.width = `${cardRect.width * 1.9}px`;
    pool.style.height = `${cardRect.height * 1.7}px`;
    card.style.setProperty('--lamp-shadow-x', `${(targetX - originX) / wallRect.width * 8}px`);
    if (!initialized) {
      // The first sweep starts beneath the overhead light, then finds the print.
      x = originX;
      y = 20;
      initialized = true;
    }
    if (reducedMotion.matches || document.hidden) {
      stop();
      x = targetX;
      y = targetY;
      velocityX = velocityY = 0;
      draw();
    } else if (!frame) {
      frame = requestAnimationFrame(animate);
    }
  }

  function choose(card) {
    if (active === card) return;
    active?.classList.remove('is-spotlit');
    active = card;
    wall.classList.toggle('is-spotlighting', Boolean(card));
    if (card) {
      card.classList.add('is-spotlit');
      aim(card);
    } else {
      stop();
      velocityX = velocityY = 0;
    }
  }

  function cardFrom(element) {
    const card = element instanceof Element ? element.closest('.pasted-poster') : null;
    return card && wall.contains(card) ? card : null;
  }

  wall.addEventListener('pointerover', event => {
    if (!finePointer.matches || event.pointerType === 'touch') return;
    hovered = cardFrom(event.target);
    if (hovered) choose(hovered);
  });
  wall.addEventListener('pointerleave', () => {
    hovered = null;
    choose(focused);
  });
  wall.addEventListener('focusin', event => {
    focused = event.target.matches(':focus-visible') ? cardFrom(event.target) : null;
    if (focused) choose(focused);
  });
  wall.addEventListener('focusout', event => {
    focused = cardFrom(event.relatedTarget);
    if (!focused) choose(hovered);
  });
  addEventListener('blur', () => {
    hovered = null;
    focused = null;
    choose(null);
  });
  finePointer.addEventListener('change', () => {
    if (!finePointer.matches) {
      hovered = null;
      choose(focused);
    }
  });
  reducedMotion.addEventListener('change', () => { if (active) aim(active); });
  addEventListener('resize', () => { if (active) aim(active); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    syncDust();
    if (document.hidden) stop();
    else if (active) aim(active);
  });
})();
