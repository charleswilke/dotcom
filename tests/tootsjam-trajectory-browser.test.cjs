'use strict';
const {test, before, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const origin = 'https://tootsjam.test';
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function openGame(width = 1100) {
    const page = await browser.newPage({viewport: {width, height: 1000}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Advance gameplay explicitly to compare every predicted frame with a real shot.
    await page.addInitScript(() => {
        window.testNow = 5000;
        performance.now = () => window.testNow;
        window.requestAnimationFrame = () => 0;
    });
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin || route.request().resourceType() === 'media') return route.abort();
        const file = path.resolve(root, '.' + url.pathname);
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({status: 404, body: ''});
        const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp'};
        return route.fulfill({path: file, contentType: types[path.extname(file)] || 'application/octet-stream'});
    });
    await page.goto(origin + '/games/TootsJam/tootsjam.html');
    await page.waitForFunction(() => !document.getElementById('startBtn').disabled, {}, {polling: 50});
    await page.evaluate(() => { muteAllAudio = true; });
    return {page, errors};
}

test('moving obstacle previews match released shots at 30, 60 and 120 fps', async () => {
    const {page, errors} = await openGame();
    try {
        await page.locator('#freeThrowModeBtn').dispatchEvent('click');
        await page.locator('#startBtn').dispatchEvent('click');
        const checks = await page.evaluate(() => {
            const results = [];
            Math.random = () => 0.5; // Match the preview's mean random kick.
            for (const frameMs of [1000 / 30, 1000 / 60, 1000 / 120]) {
                for (const scenario of ['gull', 'helicopter', 'balloon', 'ufo', 'laser']) {
                    level = {gull: 2, helicopter: 3, balloon: 4, ufo: 6, laser: 6}[scenario];
                    resetBall();
                    window.testNow = 5000;
                    lastTimerTickAt = window.testNow;
                    nextAlienLaserSpawnAt = Infinity; // Future random spawns are intentionally not predicted.
                    alienLasers.length = 0;
                    for (const obstacle of [...gulls, helicopter, ...balloons, ...alienBaseUfos]) obstacle.cooldown = 0;
                    if (scenario === 'laser') alienLasers.push({x: 160, y: 480, length: 150, speed: 0.8, thickness: 5, cooldown: 0});
                    // Choose a charge that hits each actual moving obstacle, with room to see its rebound.
                    let predicted;
                    for (let c = 0.35; c < 1.2; c += 0.01) {
                        charge = c;
                        const preview = getTrajectoryPreview(window.testNow, frameMs);
                        if (preview.impacts.some(impact => impact.obstacle && impact.index < preview.points.length - 8)) {
                            predicted = preview;
                            break;
                        }
                    }
                    if (!predicted) throw new Error(`No ricochet for ${scenario} at ${frameMs}ms`);
                    charging = true;
                    releaseShot();
                    let maxError = 0;
                    // The last point terminates at court geometry, where live rim/floor handling takes over.
                    for (let i = 1; i < predicted.points.length - 1; i++) {
                        window.testNow = 5000 + i * frameMs;
                        physicsStep();
                        maxError = Math.max(maxError, Math.hypot(ball.x - predicted.points[i].x, ball.y - predicted.points[i].y));
                    }
                    const touched = {gull: touchedGullThisShot, helicopter: touchedHeliThisShot,
                        balloon: touchedBalloonThisShot, ufo: touchedAlienUfoThisShot, laser: touchedLaserThisShot}[scenario];
                    results.push({scenario, frameMs, maxError, touched, impacts: predicted.impacts.length});
                }
            }
            return results;
        });
        for (const check of checks) {
            assert.ok(check.maxError < 1e-7, JSON.stringify(check));
            assert.ok(check.touched, JSON.stringify(check));
            assert.ok(check.impacts > 0);
        }
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('drawing previews never changes live shot, obstacles, effects, cooldowns or random state', async () => {
    const {page, errors} = await openGame();
    try {
        await page.locator('#startBtn').dispatchEvent('click');
        const results = await page.evaluate(() => {
            const results = [];
            function snapshot() {
                return JSON.stringify({ball, gulls, helicopter, balloons, alienBaseUfos, alienLasers, score,
                    comboStreak, particles, floatTexts, touchedGullThisShot, touchedHeliThisShot,
                    touchedBalloonThisShot, touchedLaserThisShot, touchedAlienUfoThisShot,
                    touchedRim, touchedBackboard, touchedHoopSupport, structureRestFrames, rimSoundCooldown, floorSoundCooldown, spaceBeamMode, spaceBeamPhaseStartedAt,
                    spaceBeamPhaseDurationMs, nextAlienLaserSpawnAt});
            }
            Math.random = () => { throw new Error('Preview consumed live randomness'); };
            playSfx = () => { throw new Error('Preview played a collision sound'); };
            for (let l = 1; l <= 6; l++) {
                level = l;
                resetBall();
                charge = 0.75;
                charging = true;
                spaceBeamPhaseStartedAt = window.testNow;
                const before = snapshot();
                for (let i = 0; i < 5; i++) drawTrajectory();
                results.push({level: l, unchanged: before === snapshot()});
            }
            return results;
        });
        assert.ok(results.every(r => r.unchanged), JSON.stringify(results));
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

for (const width of [390, 1100]) {
    test(`charge/release/reset controls and guide rendering work at ${width}px`, async () => {
        const {page, errors} = await openGame(width);
        try {
            await page.selectOption('#startLevel', '2');
            await page.locator('#startBtn').dispatchEvent('click');
            await page.locator('#chargeBtn').dispatchEvent('pointerdown');
            assert.equal(await page.evaluate(() => charging), true);
            await page.evaluate(() => { for (let i = 0; i < 45; i++) physicsStep(); drawTrajectory(); });
            await page.locator('#chargeBtn').dispatchEvent('pointerup');
            assert.equal(await page.evaluate(() => ball.inFlight && !charging), true);
            await page.keyboard.press('r');
            assert.equal(await page.evaluate(() => !ball.inFlight && !charging), true);
            await page.keyboard.down('Space');
            assert.equal(await page.evaluate(() => charging), true);
            await page.keyboard.up('Space');
            assert.equal(await page.evaluate(() => ball.inFlight && !charging), true);
            assert.deepEqual(errors, []);
        } finally { await page.close(); }
    });
}

test('gulls circle slowly enough to follow while lining up a bank shot', async () => {
    const {page} = await openGame();
    try {
        const periods = await page.evaluate(() => gulls.map(g => 2 * Math.PI / g.speed));
        assert.ok(periods.every(ms => ms >= 8000 && ms <= 10000), JSON.stringify(periods));
    } finally { await page.close(); }
});

test('rendering follows native refresh while simulation and the timer stay consistent across displays', async () => {
    const {page, errors} = await openGame();
    try {
        await page.locator('#startBtn').dispatchEvent('click');
        const results = await page.evaluate(() => {
            const originalPhysics = physicsStep;
            const originalDraw = drawCourt;
            const results = [];
            for (const hz of [30, 60, 90, 120, 144, 165, 240]) {
                window.testNow = 5000;
                lastFrameAt = 5000;
                simulationAccumulator = 0;
                lastTimerTickAt = 5000;
                levelTimeRemainingMs = levelDurationMs;
                resetBall();
                frame(5000);
                let updates = 0;
                let renders = 0;
                physicsStep = now => { updates++; originalPhysics(now); };
                drawCourt = () => { renders++; originalDraw(); };
                for (let i = 1; i <= hz * 2; i++) {
                    window.testNow = 5000 + i * 1000 / hz;
                    frame(window.testNow);
                }
                results.push({hz, updates, renders, elapsed: levelDurationMs - levelTimeRemainingMs});
                physicsStep = originalPhysics;
                drawCourt = originalDraw;
            }
            return results;
        });
        for (const result of results) {
            assert.equal(result.renders, result.hz * 2, JSON.stringify(result));
            assert.equal(result.updates, 120, JSON.stringify(result));
            assert.ok(Math.abs(result.elapsed - 2000) < 1e-6, JSON.stringify(result));
        }
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('returning from a paused tab bounds catch-up and still counts real elapsed time', async () => {
    const {page} = await openGame();
    try {
        await page.locator('#startBtn').dispatchEvent('click');
        const result = await page.evaluate(() => {
            const originalPhysics = physicsStep;
            let updates = 0;
            physicsStep = now => { updates++; originalPhysics(now); };
            window.testNow = 15000;
            frame(window.testNow);
            return {updates, remaining: levelTimeRemainingMs};
        });
        assert.equal(result.updates, 6);
        assert.ok(Math.abs(result.remaining - 110000) < 1e-6, JSON.stringify(result));
    } finally { await page.close(); }
});

test('slower flight preserves the original arc and still allows baskets', async () => {
    const {page, errors} = await openGame();
    try {
        await page.locator('#freeThrowModeBtn').dispatchEvent('click');
        await page.locator('#startBtn').dispatchEvent('click');
        const result = await page.evaluate(() => {
            level = 1;
            charge = 0.8;
            charging = true;
            releaseShot();
            const original = {...ball};
            let maxArcError = 0;
            // Five new ticks cover the same arc as three original ticks:
            // same gravity/drag trajectory, with 40% less progress per second.
            for (let group = 0; group < 10; group++) {
                for (let i = 0; i < 3; i++) {
                    original.vy = (original.vy + 0.29) * 0.998;
                    original.vx *= 0.998;
                    original.x += original.vx;
                    original.y += original.vy;
                }
                for (let i = 0; i < 5; i++) {
                    window.testNow += 1000 / 60;
                    physicsStep();
                }
                maxArcError = Math.max(maxArcError, Math.hypot(ball.x - original.x, ball.y - original.y));
            }
            let made = false;
            for (let c = 0.65; c <= 1.1 && !made; c += 0.005) {
                resetBall();
                charge = c;
                charging = true;
                releaseShot();
                for (let i = 0; i < 240 && ball.inFlight; i++) {
                    window.testNow += 1000 / 60;
                    physicsStep();
                    if (ball.scoredOnThisShot) { made = true; break; }
                }
            }
            return {maxArcError, made};
        });
        assert.ok(result.maxArcError < 1e-7, JSON.stringify(result));
        assert.equal(result.made, true);
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('normal 60 Hz timestamp jitter does not drop draws or freeze the ball', async () => {
    const {page} = await openGame();
    try {
        await page.locator('#startBtn').dispatchEvent('click');
        const result = await page.evaluate(() => {
            level = 1;
            resetBall();
            charge = 0.8;
            charging = true;
            releaseShot();
            const samples = [];
            drawBall = (rendered = ball) => samples.push({now: window.testNow, x: rendered.x});
            for (let i = 1; i <= 120; i++) {
                window.testNow = 5000 + i * 1000 / 60 + Math.sin(i * 1.7) * 0.8;
                frame(window.testNow);
            }
            const deltas = samples.slice(1).map((s, i) => s.x - samples[i].x);
            const gaps = samples.slice(1).map((s, i) => s.now - samples[i].now);
            return {renders: samples.length, maxGap: Math.max(...gaps),
                minDelta: Math.min(...deltas), maxDelta: Math.max(...deltas)};
        });
        assert.equal(result.renders, 120, JSON.stringify(result));
        assert.ok(result.maxGap < 19, JSON.stringify(result));
        assert.ok(result.minDelta > 0, JSON.stringify(result));
        assert.ok(result.maxDelta / result.minDelta < 1.5, JSON.stringify(result));
    } finally { await page.close(); }
});

test('unchanged HUD text does not trigger layout work every physics tick', async () => {
    const {page} = await openGame();
    try {
        await page.locator('#startBtn').dispatchEvent('click');
        const mutations = await page.evaluate(() => {
            const observer = new MutationObserver(() => {});
            observer.observe(document.querySelector('.hud'), {subtree: true, childList: true, characterData: true});
            for (let i = 1; i <= 60; i++) {
                window.testNow = 5000 + i * 1000 / 60;
                physicsStep();
            }
            const count = observer.takeRecords().length;
            observer.disconnect();
            return count;
        });
        assert.ok(mutations <= 2, `${mutations} text mutations during one idle second`);
    } finally { await page.close(); }
});

test('backboard and support collisions follow faces/corners and never add bounce energy', async () => {
    const {page} = await openGame();
    try {
        const cases = await page.evaluate(() => {
            const {board, post, base} = hoopStructure;
            const fixtures = [
                ['board front', board.x - 12, board.y + 30, 10, 2, -1, 0],
                ['board rear', board.x + board.w + 12, board.y + 30, -10, 2, 1, 0],
                ['board top', board.x + 8, board.y - 12, 1, 10, 0, -1],
                ['board underside', board.x + 8, board.y + board.h + 12, 1, -10, 0, 1],
                ['board corner', board.x - 10, board.y - 10, 8, 8, -1, -1],
                ['arm top', 830, 384, 1, 10, 0, -1],
                ['arm underside', 830, 424, 1, -10, 0, 1],
                ['post left', post.x - 12, 500, 10, 1, -1, 0],
                ['post right', post.x + post.w + 12, 500, -10, 1, 1, 0],
                ['post cap', post.x + 7, post.y - 12, 0, 10, 0, -1],
                ['base left', base.x - 12, 605, 10, 0, -1, 0],
                ['base top', base.x + 7, base.y - 12, 0, 10, 0, -1],
                ['inside board', board.x + 8, board.y + 30, -5, 1, 0, 0],
                ['arm/post seam', post.x - 13, post.y + 1, 8, 10, 0, 0]
            ];
            return fixtures.map(([name, x, y, vx, vy, nx, ny]) => {
                const target = {x, y, vx, vy, r: 16, spin: 0};
                const beforeEnergy = vx * vx + vy * vy;
                const hit = resolveHoopStructureCollision(target, true);
                const stillOverlapping = resolveHoopStructureCollision({...target}, true);
                return {name, hit, stillOverlapping, outward: target.vx * nx + target.vy * ny,
                    energy: target.vx ** 2 + target.vy ** 2, beforeEnergy, target};
            });
        });
        for (const sample of cases) {
            assert.ok(sample.hit, JSON.stringify(sample));
            assert.equal(sample.stillOverlapping, false, JSON.stringify(sample));
            assert.ok(sample.outward >= 0, JSON.stringify(sample));
            assert.ok(sample.energy <= sample.beforeEnergy + 1e-7, JSON.stringify(sample));
            assert.ok(Object.values(sample.target).every(Number.isFinite), JSON.stringify(sample));
        }
        const clearance = await page.evaluate(() => {
            const {board} = hoopStructure;
            const nearCorner = {x: board.x - 14, y: board.y - 14, r: 16, vx: 5, vy: 5};
            const movingAway = {x: board.x - 12, y: board.y + 30, r: 16, vx: -5, vy: 0};
            return {cornerHit: resolveHoopStructureCollision(nearCorner, true),
                separatingHit: resolveHoopStructureCollision(movingAway, true), vx: movingAway.vx};
        });
        assert.equal(clearance.cornerHit, false, 'nearby corner must not use a rectangular ball hitbox');
        assert.equal(clearance.separatingHit, true);
        assert.equal(clearance.vx, -5, 'separating contacts must not reverse direction again');
    } finally { await page.close(); }
});

test('structure previews are silent and support banks are neither swishes nor airballs', async () => {
    const {page, errors} = await openGame();
    try {
        await page.locator('#freeThrowModeBtn').dispatchEvent('click');
        await page.locator('#startBtn').dispatchEvent('click');
        const result = await page.evaluate(() => {
            level = 1;
            resetBall();
            const supportHit = {x: hoopStructure.post.x - 12, y: 500, r: 16, vx: 10, vy: 0};
            const originalSfx = playSfx;
            playSfx = () => { throw new Error('Preview played audio'); };
            resolveHoopStructureCollision({...supportHit}, true);
            const previewClean = !touchedBackboard && !touchedHoopSupport && rimSoundCooldown === 0;
            playSfx = originalSfx;
            Object.assign(ball, supportHit, {inFlight: true, scoredOnThisShot: false});
            resolveHoopStructureCollision();
            const supportTracked = touchedHoopSupport && !touchedBackboard;
            Object.assign(ball, {x: hoop.x + hoop.rimGap / 2, y: hoop.y - 10, vx: 0, vy: 5});
            for (let i = 0; i < 12 && !ball.scoredOnThisShot; i++) physicsStep();
            const bank = {made: ball.scoredOnThisShot, swish: lastShotWasSwish, score};
            resetBall();
            const resetCleared = !touchedHoopSupport;
            Object.assign(ball, supportHit, {inFlight: true});
            resolveHoopStructureCollision();
            Object.assign(ball, {x: 300, y: floorY - ball.r, vx: 0, vy: 0});
            physicsStep();
            return {previewClean, supportTracked, bank, resetCleared, miss: stateEl.textContent};
        });
        assert.equal(result.previewClean, true);
        assert.equal(result.supportTracked, true);
        assert.equal(result.bank.made, true);
        assert.equal(result.bank.swish, false);
        assert.equal(result.bank.score, 2);
        assert.equal(result.resetCleared, true);
        assert.equal(result.miss, 'Brick');
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('guide and live flight share backboard, arm, post and base rebounds', async () => {
    const {page, errors} = await openGame();
    try {
        await page.locator('#freeThrowModeBtn').dispatchEvent('click');
        await page.locator('#startBtn').dispatchEvent('click');
        const cases = await page.evaluate(() => {
            level = 1;
            const results = [];
            for (const fixture of [
                {name: 'backboard', x: handBall.x, y: handBall.y, min: 0.7, max: 0.95},
                {name: 'arm', x: 820, y: 450, min: 0.35, max: 0.5},
                {name: 'post', x: 820, y: 500, min: 0.4, max: 0.6},
                {name: 'base', x: 802, y: 595, min: 0.05, max: 0.2}
            ]) {
                resetBall();
                ball.x = fixture.x;
                ball.y = fixture.y;
                window.testNow = 5000;
                lastTimerTickAt = 5000;
                let predicted;
                for (let c = fixture.min; c < fixture.max; c += 0.005) {
                    charge = c;
                    const preview = getTrajectoryPreview(window.testNow);
                    if (preview.impacts.some(impact => impact.parts.some(part =>
                        fixture.name === 'backboard' ? part.startsWith('board') : part === fixture.name
                    ) && impact.index < preview.points.length - 4)) {
                        predicted = preview;
                        break;
                    }
                }
                if (!predicted) throw new Error(`No bank preview for ${fixture.name}`);
                charging = true;
                releaseShot();
                let maxError = 0;
                for (let i = 1; i < predicted.points.length - 1; i++) {
                    window.testNow = 5000 + i * trajectoryFrameMs;
                    physicsStep();
                    maxError = Math.max(maxError, Math.hypot(ball.x - predicted.points[i].x, ball.y - predicted.points[i].y));
                }
                results.push({name: fixture.name, maxError, bank: touchedBackboard, support: touchedHoopSupport});
            }
            return results;
        });
        for (const sample of cases) {
            assert.ok(sample.maxError < 1e-7, JSON.stringify(sample));
            assert.equal(sample.name === 'backboard' ? sample.bank : sample.support, true, JSON.stringify(sample));
        }
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('a ball resting on the support base still settles and resets', async () => {
    const {page} = await openGame();
    try {
        await page.locator('#freeThrowModeBtn').dispatchEvent('click');
        await page.locator('#startBtn').dispatchEvent('click');
        const result = await page.evaluate(() => {
            level = 1;
            resetBall();
            Object.assign(ball, {x: hoopStructure.base.x + 7, y: hoopStructure.base.y - 18,
                vx: 0, vy: 2, inFlight: true});
            let ticks = 0;
            while (ball.inFlight && ticks < 300) {
                window.testNow += trajectoryFrameMs;
                physicsStep();
                ticks++;
            }
            return {ticks, queued: resetCountdown > 0, inFlight: ball.inFlight,
                state: stateEl.textContent, touched: touchedHoopSupport};
        });
        assert.ok(result.ticks < 300, JSON.stringify(result));
        assert.equal(result.queued, true);
        assert.equal(result.inFlight, false);
        assert.equal(result.state, 'Brick');
        assert.equal(result.touched, true);
    } finally { await page.close(); }
});

test('high refresh flight moves smoothly between physics ticks without speeding up', async () => {
    const {page} = await openGame();
    try {
        await page.locator('#startBtn').dispatchEvent('click');
        const results = await page.evaluate(() => {
            const results = [];
            for (const hz of [60, 120, 144, 240]) {
                level = 1;
                resetBall();
                window.testNow = 5000;
                lastFrameAt = 5000;
                lastTimerTickAt = 5000;
                simulationAccumulator = 0;
                charge = 0.8;
                charging = true;
                releaseShot();
                const samples = [];
                drawBall = rendered => samples.push({x: rendered.x, liveX: ball.x});
                for (let i = 1; i <= hz / 2; i++) {
                    window.testNow = 5000 + i * 1000 / hz;
                    frame(window.testNow);
                }
                // Allow the initial one-tick interpolation delay before checking motion.
                const moving = samples.slice(4);
                const deltas = moving.slice(1).map((sample, i) => sample.x - moving[i].x);
                const betweenTicks = moving.slice(1).filter((sample, i) =>
                    sample.liveX === moving[i].liveX && sample.x > moving[i].x).length;
                results.push({hz, draws: samples.length, minDelta: Math.min(...deltas),
                    maxDelta: Math.max(...deltas), betweenTicks, finalX: ball.x, renderedX: samples.at(-1).x});
            }
            return results;
        });
        for (const sample of results) {
            assert.equal(sample.draws, sample.hz / 2);
            assert.ok(sample.minDelta > 0, JSON.stringify(sample));
            assert.ok(sample.maxDelta / sample.minDelta < 1.1, JSON.stringify(sample));
            if (sample.hz > 60) assert.ok(sample.betweenTicks > 0, JSON.stringify(sample));
            assert.ok(Math.abs(sample.finalX - results[0].finalX) < 1e-7, JSON.stringify(results));
            assert.ok(Math.abs(sample.renderedX - results[0].renderedX) < 1e-7, JSON.stringify(results));
        }
    } finally { await page.close(); }
});

test('poster SVG art loads for every level and renders idle, charge and dribble poses', async () => {
    const {page, errors} = await openGame();
    try {
        const result = await page.evaluate(async () => {
            const loaded = await posterArt.readyPromise;
            if (!loaded) return {loaded, error: posterArt.error};
            const courts = [];
            for (let l = 1; l <= 6; l++) {
                level = l;
                for (const pose of ['idle', 'charge', 'dribble']) {
                    charging = pose === 'charge';
                    charge = charging ? 0.8 : 0;
                    dribbleHeld = pose === 'dribble';
                    dribblePhase = 0.7;
                    drawCourt();drawPlayer();drawHoop();
                }
                courts.push({width: posterArt.courts[l].width, height: posterArt.courts[l].height});
            }
            return {loaded, courts, body: Boolean(posterArt.body), hoop: Boolean(posterArt.hoop)};
        });
        assert.equal(result.loaded, true, JSON.stringify(result));
        assert.equal(result.courts.length, 6);
        assert.ok(result.courts.every(court => court.width === 960 && court.height === 720));
        assert.equal(result.body, true);assert.equal(result.hoop, true);
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});
