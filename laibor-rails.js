// The radio scales flanking the wordmark are live wire. The pilot lights
// brighten as a mouse nears them; over a scale the ticks run white-hot under
// the cursor, sparks spit off the baseline, and now and then an arc jumps to
// the nearest major tick or the whole rail pops. One canvas draws it all and
// only ticks while something is happening. Touch gets a single pop per tap;
// reduced motion keeps the hot spot and the lights but no sparks or arcs.
function initLaiborRails(section = document.getElementById('l.ai.bor')) {
    const line = section?.querySelector('.rss-title-line');
    if (!line || line.dataset.railsReady) return;
    line.dataset.railsReady = 'true';
    const finePointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wordmark = line.querySelector('.rss-title-main');
    const GRAVITY = 1100;
    const MAX_SPARKS = 260;

    // Tick geometry comes straight from the SVG paths ("Mx y1Vy2" segments in
    // the 320x84 viewBox). A major tick is one longer than both neighbours.
    const parseTicks = path => {
        const ticks = (path?.getAttribute('d') || '').match(/M[\d.]+ [\d.]+V[\d.]+/g) || [];
        const parsed = ticks.map(segment => {
            const [x, y1, y2] = segment.match(/[\d.]+/g).map(Number);
            return { x, y1, y2, length: y2 - y1 };
        });
        return parsed.filter((tick, i) =>
            (!parsed[i - 1] || tick.length > parsed[i - 1].length)
            && (!parsed[i + 1] || tick.length > parsed[i + 1].length));
    };

    const rails = [...line.querySelectorAll('.rss-title-rail')].map(el => {
        const scale = el.querySelector('.rss-title-scale');
        const hot = scale.cloneNode(true);
        hot.classList.add('rss-title-scale-hot');
        el.appendChild(hot);
        return {
            el,
            scale,
            left: el.classList.contains('rss-title-rail-left'),
            fullPath: scale.querySelector('.rss-scale-ticks'),
            full: parseTicks(scale.querySelector('.rss-scale-ticks')),
            compact: parseTicks(scale.querySelector('.rss-scale-compact')),
            heat: 0,
            surge: 0,
            emit: 0,
            over: false,
            nextStrike: 0,
            nextPop: 0,
        };
    });

    const canvas = document.createElement('canvas');
    canvas.className = 'rss-title-sparks';
    canvas.setAttribute('aria-hidden', 'true');
    line.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const sparks = [];
    let arc = null;
    let pointer = null;
    let frame = 0;
    let last = 0;

    const spawn = (x, y, count, force, drift = 0) => {
        for (let i = 0; i < count && sparks.length < MAX_SPARKS; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
            const speed = force * (70 + Math.random() * 230);
            sparks.push({
                x,
                y,
                vx: Math.cos(angle) * speed + drift,
                vy: Math.sin(angle) * speed,
                age: 0,
                life: 0.3 + Math.random() * 0.6,
            });
        }
    };

    const hitRail = (x, y) => rails.find(rail => {
        const svg = rail.scale.getBoundingClientRect();
        const rect = rail.el.getBoundingClientRect();
        return x >= svg.left && x <= svg.right && Math.abs(y - (rect.top + rect.height / 2)) <= rect.height / 2 + 8;
    });

    const pop = (rail, x, y, box) => {
        spawn(x - box.left, y - box.top, 26, 1.35);
        rail.surge = 1;
        if (wordmark && !wordmark.classList.contains('glitch')) {
            wordmark.classList.add('glitch');
            setTimeout(() => wordmark.classList.remove('glitch'), 160);
        }
    };

    const strike = (rail, px, midY, box, now) => {
        const svg = rail.scale.getBoundingClientRect();
        const compact = rail.fullPath && getComputedStyle(rail.fullPath).display === 'none';
        const toScreen = (vx, vy) => ({ x: svg.left + (vx / 320) * svg.width, y: svg.top + (vy / 84) * svg.height });
        const near = (compact ? rail.compact : rail.full)
            .map(tick => ({ tick, x: toScreen(tick.x, 0).x }))
            .filter(({ x }) => Math.abs(x - px) > 4 && Math.abs(x - px) < 90)
            .sort((a, b) => Math.abs(a.x - px) - Math.abs(b.x - px))[0];
        if (!near) return;
        const tip = toScreen(near.tick.x, Math.random() < 0.5 ? near.tick.y1 : near.tick.y2);
        arc = {
            x1: px - box.left,
            y1: midY - box.top,
            x2: tip.x - box.left,
            y2: tip.y - box.top,
            until: now + 70 + Math.random() * 110,
        };
        spawn(arc.x2, arc.y2, 8, 0.8);
        rail.surge = Math.max(rail.surge, 0.6);
    };

    const drawArc = ({ x1, y1, x2, y2 }) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.hypot(dx, dy) || 1;
        const nx = -dy / length;
        const ny = dx / length;
        const points = [[x1, y1]];
        const segments = 7;
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const jitter = (Math.random() - 0.5) * Math.min(18, length * 0.35) * (1 - Math.abs(2 * t - 1) * 0.6);
            points.push([x1 + dx * t + nx * jitter, y1 + dy * t + ny * jitter]);
        }
        points.push([x2, y2]);
        const trace = () => {
            ctx.beginPath();
            points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.stroke();
        };
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0, 247, 194, 0.95)';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = 'rgba(170, 255, 240, 0.85)';
        ctx.lineWidth = 2;
        trace();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.9;
        trace();
        ctx.restore();
    };

    const setLamp = (rail, level) => {
        if (level === null) {
            ['--lamp-halo', '--lamp-bloom', '--lamp-brightness', '--hot'].forEach(name => rail.el.style.removeProperty(name));
            rail.el.classList.remove('is-live');
            return;
        }
        rail.el.style.setProperty('--lamp-halo', `${(6 + level * 12).toFixed(1)}px`);
        rail.el.style.setProperty('--lamp-bloom', `${(12 + level * 24).toFixed(1)}px`);
        rail.el.style.setProperty('--lamp-brightness', (0.85 + level * 0.8).toFixed(3));
    };

    const tick = now => {
        frame = 0;
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        const reduced = reducedMotion.matches;
        const box = canvas.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const width = Math.round(box.width * dpr);
        const height = Math.round(box.height * dpr);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, box.width, box.height);
        ctx.globalCompositeOperation = 'lighter';

        if (pointer) {
            const decay = Math.max(0, 1 - dt * 8);
            pointer.vx *= decay;
            pointer.vy *= decay;
        }
        const overRail = pointer ? hitRail(pointer.x, pointer.y) : null;
        let busy = !!pointer || sparks.length > 0;

        rails.forEach(rail => {
            const rect = rail.el.getBoundingClientRect();
            const svg = rail.scale.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            const over = rail === overRail;
            if (over && !rail.over) {
                // Contact: the first touch of the wire always spits.
                if (!reduced) spawn(pointer.x - box.left, midY - box.top, 7, 0.9);
                rail.nextStrike = now + 120 + Math.random() * 300;
                rail.nextPop = now + 900 + Math.random() * 1600;
            }
            rail.over = over;
            rail.heat += ((over ? 1 : 0) - rail.heat) * Math.min(1, dt * (over ? 14 : 4));
            rail.surge = Math.max(0, rail.surge - dt * 4);

            const lampX = rail.left ? rect.right : rect.left;
            const proximity = pointer ? Math.max(0, 1 - Math.hypot(pointer.x - lampX, pointer.y - midY) / 180) : 0;
            const flicker = !reduced && rail.heat > 0.05 ? (Math.random() - 0.5) * 0.6 * rail.heat : 0;
            const live = rail.heat > 0.01 || rail.surge > 0.01;
            if (!pointer && !live) {
                setLamp(rail, null);
                return;
            }
            busy = true;
            rail.el.classList.toggle('is-live', live);
            setLamp(rail, Math.min(1.6, proximity + rail.heat * 0.35 + rail.surge * 0.9 + flicker));
            if (over) rail.el.style.setProperty('--hot-x', `${(pointer.x - svg.left).toFixed(1)}px`);
            rail.el.style.setProperty('--hot', Math.max(0, Math.min(1, rail.heat * 0.8 + rail.surge * 0.4 + flicker * 0.4)).toFixed(3));

            if (!over || reduced) return;
            const px = pointer.x - box.left;
            const py = midY - box.top;
            const speed = Math.hypot(pointer.vx, pointer.vy);
            rail.emit += dt * (9 + Math.min(80, speed * 0.07));
            const burst = Math.floor(rail.emit);
            rail.emit -= burst;
            spawn(px, py, burst, 0.75, pointer.vx * 0.12);

            // Contact glow where the cursor grinds the baseline.
            const glow = ctx.createRadialGradient(px, py, 0, px, py, 14);
            glow.addColorStop(0, `rgba(255, 250, 230, ${0.55 + Math.random() * 0.3})`);
            glow.addColorStop(0.4, 'rgba(255, 170, 60, 0.35)');
            glow.addColorStop(1, 'rgba(255, 120, 30, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(px - 14, py - 14, 28, 28);

            if (now >= rail.nextStrike) {
                strike(rail, pointer.x, midY, box, now);
                rail.nextStrike = now + 260 + Math.random() * 900;
            }
            if (now >= rail.nextPop) {
                pop(rail, pointer.x, midY, box);
                rail.nextPop = now + 1400 + Math.random() * 2600;
            }
        });

        if (arc) {
            if (now > arc.until || reduced) arc = null;
            else {
                drawArc(arc);
                busy = true;
            }
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
            const spark = sparks[i];
            spark.age += dt;
            if (spark.age >= spark.life) {
                sparks.splice(i, 1);
                continue;
            }
            spark.vy += GRAVITY * dt;
            spark.vx *= 1 - 1.4 * dt;
            spark.x += spark.vx * dt;
            spark.y += spark.vy * dt;
            const remaining = 1 - spark.age / spark.life;
            const color = remaining > 0.65 ? '255, 250, 228' : remaining > 0.35 ? '255, 196, 92' : '255, 108, 36';
            ctx.strokeStyle = `rgba(${color}, ${Math.min(1, remaining * 1.6).toFixed(3)})`;
            ctx.lineWidth = remaining > 0.65 ? 1.5 : 1.1;
            ctx.beginPath();
            ctx.moveTo(spark.x, spark.y);
            ctx.lineTo(spark.x - spark.vx * 0.028, spark.y - spark.vy * 0.028);
            ctx.stroke();
        }

        // Fade all canvas effects at the same outer edges as the SVG scales.
        // Mask after drawing so moving sparks and arcs fade at each pixel.
        ctx.globalCompositeOperation = 'destination-in';
        rails.forEach(rail => {
            const svg = rail.scale.getBoundingClientRect();
            const fade = parseFloat(getComputedStyle(rail.el).getPropertyValue('--rail-fade-end')) / 100;
            if (!svg.width || !fade) return;
            const outer = (rail.left ? svg.left : svg.right) - box.left;
            const inner = outer + (rail.left ? 1 : -1) * svg.width * fade;
            const mask = ctx.createLinearGradient(outer, 0, inner, 0);
            mask.addColorStop(0, 'transparent');
            mask.addColorStop(1, '#000');
            ctx.fillStyle = mask;
            ctx.fillRect(0, 0, box.width, box.height);
        });

        if (busy) frame = requestAnimationFrame(tick);
        else last = 0;
    };

    const wake = () => {
        if (!frame) frame = requestAnimationFrame(tick);
    };
    const release = () => {
        pointer = null;
        wake();
    };

    section.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse' || !finePointer.matches) return;
        const previous = pointer;
        let vx = 0;
        let vy = 0;
        if (previous) {
            const elapsed = event.timeStamp - previous.t;
            vx = previous.vx;
            vy = previous.vy;
            if (elapsed > 4) {
                vx = vx * 0.6 + ((event.clientX - previous.x) / elapsed) * 1000 * 0.4;
                vy = vy * 0.6 + ((event.clientY - previous.y) / elapsed) * 1000 * 0.4;
            }
        }
        pointer = { x: event.clientX, y: event.clientY, vx, vy, t: event.timeStamp };
        wake();
    }, { passive: true });

    section.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' || reducedMotion.matches) return;
        const rail = hitRail(event.clientX, event.clientY);
        if (!rail) return;
        const rect = rail.el.getBoundingClientRect();
        pop(rail, event.clientX, rect.top + rect.height / 2, canvas.getBoundingClientRect());
        wake();
    }, { passive: true });

    section.addEventListener('pointerleave', release);
    section.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    window.addEventListener('scroll', () => { if (pointer) release(); }, { passive: true });
    finePointer.addEventListener('change', release);
}

