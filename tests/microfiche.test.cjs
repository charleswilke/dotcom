'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
let browser, server, origin;
before(async () => {
    server = http.createServer((request, response) => {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
        if (!file.startsWith(`${root}${path.sep}`)) { response.writeHead(403).end(); return; }
        fs.readFile(file, (error, content) => {
            if (error) { response.writeHead(404).end(); return; }
            const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
            response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
            response.end(content);
        });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch();
});
after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
});
async function withPage(options, run) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, ...options });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/substack-feed*', route => route.fulfill({ json: JSON.parse(fs.readFileSync(path.join(root, 'cache_substack_feed.json'))) }));
    try {
        await page.goto(origin, { waitUntil: 'domcontentloaded' });
        await page.locator('.testimonial-carousel').scrollIntoViewIfNeeded();
        await page.evaluate(() => document.fonts.ready);
        await run(page);
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
}
async function settled(page) {
    await page.waitForFunction(() => document.querySelectorAll('.blurb-card.leaving').length === 0);
}
async function verifyGlide(page, target, direction) {
    const height = await page.locator('.testimonial-carousel').evaluate(el => el.offsetHeight);
    await page.locator('.carousel-tab').nth(target).click();
    await page.waitForFunction(() => {
        const animation = document.querySelector('.blurb-card.active').getAnimations()[0];
        return Boolean(animation);
    });
    const mid = await page.evaluate(() => {
        const incoming = document.querySelector('.blurb-card.active');
        const outgoing = document.querySelector('.blurb-card.leaving');
        // Freeze one shared seek position so timing variance cannot sample the final overshoot.
        document.querySelector('.testimonial-carousel').getAnimations({ subtree: true }).filter(animation =>
            (animation.effect.pseudoElement === '::before' && animation.effect.target === document.querySelector('.testimonial-carousel')) || animation.effect.target.classList.contains('fiche-seek-light') || animation.effect.target === incoming || animation.effect.target === outgoing
        ).forEach(animation => { animation.pause(); animation.currentTime = 180; });
        return {
            incoming: new DOMMatrix(getComputedStyle(incoming).transform).m41,
            outgoing: new DOMMatrix(getComputedStyle(outgoing).transform).m41,
            width: incoming.offsetWidth,
            height: document.querySelector('.testimonial-carousel').offsetHeight,
            leakOpacity: Number(getComputedStyle(document.querySelector('.fiche-seek-light')).opacity),
            flareX: new DOMMatrix(getComputedStyle(document.querySelector('.fiche-seek-light')).transform).m41,
            hiddenOutgoing: outgoing.inert && outgoing.getAttribute('aria-hidden') === 'true'
        };
    });
    assert.ok(mid.incoming * direction > 0, 'Next sheet enters from selection direction');
    assert.ok(mid.outgoing * direction < 0, 'Previous sheet travels in the opposite direction');
    assert.ok(Math.abs(mid.incoming - mid.outgoing) >= mid.width + 15, 'An unlit gap separates the sheets');
    assert.equal(mid.height, height, 'Reader remains fixed during the glide');
    assert.ok(mid.hiddenOutgoing, 'Leaving content is excluded from interaction');
    assert.ok(mid.leakOpacity > 0, 'Warm light leak accompanies the moving sheets');
    assert.ok(Math.abs(mid.flareX - (mid.incoming + mid.outgoing) / 2) < 2, 'Light rays stay aligned with the gap between sheets');
    await page.locator('.testimonial-carousel').evaluate(el => el.getAnimations({ subtree: true }).filter(animation => animation.playState === 'paused').forEach(animation => animation.play()));
    await settled(page);
    assert.equal(await page.locator('.testimonial-carousel').evaluate(el => el.offsetHeight), height);
    assert.equal(await page.locator('.blurb-card.active').evaluate(el => getComputedStyle(el).transform), 'none');
    assert.equal(await page.locator('.fiche-seek-light').evaluate(el => getComputedStyle(el).opacity), '0');
}
test('sheets move left/right through a fixed window on desktop and mobile', async () => {
    for (const width of [1440, 390]) {
        await withPage({ viewport: { width, height: 1000 } }, async page => {
            await verifyGlide(page, 1, 1);
            await verifyGlide(page, 0, -1);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        });
    }
});
test('rapid selections and reselecting the active card leave only the final sheet visible', async () => {
    await withPage({}, async page => {
        for (const index of [1, 2, 0, 3, 3]) await page.locator('.carousel-tab').nth(index).click();
        await settled(page);
        const state = await page.locator('.blurb-card').evaluateAll(cards => cards.map(card => ({
            active: card.classList.contains('active'),
            visible: getComputedStyle(card).visibility === 'visible',
            inert: card.inert,
            animations: card.getAnimations().length
        })));
        assert.deepEqual(state.map(card => card.visible), [false, false, false, true]);
        assert.deepEqual(state.map(card => card.inert), [true, true, true, false]);
        assert.ok(state.every(card => card.animations === 0));
        assert.equal(await page.locator('.testimonial-carousel').evaluate(el => el.getAnimations({ subtree: true }).filter(animation => (animation.effect.pseudoElement === '::before' && animation.effect.target === document.querySelector('.testimonial-carousel')) || animation.effect.target.classList.contains('fiche-seek-light')).length), 0);
        assert.equal(await page.locator('.carousel-tab[aria-pressed="true"]').count(), 1);
    });
});
test('reduced motion switches instantly and touch swipes wrap in the swipe direction', async () => {
    await withPage({ reducedMotion: 'reduce' }, async page => {
        await page.locator('.carousel-tab').nth(3).click();
        assert.equal(await page.locator('.blurb-card.leaving').count(), 0);
        assert.equal(await page.locator('.blurb-card.active').evaluate(el => el.getAnimations().length), 0);
        assert.equal(await page.locator('.testimonial-carousel').evaluate(el => el.getAnimations({ subtree: true }).filter(animation => (animation.effect.pseudoElement === '::before' && animation.effect.target === document.querySelector('.testimonial-carousel')) || animation.effect.target.classList.contains('fiche-seek-light')).length), 0);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.locator('.testimonial-carousel').evaluate(el => {
            const start = new Event('touchstart');
            Object.defineProperty(start, 'touches', { value: [{ clientX: 200, pageY: 300 }] });
            el.dispatchEvent(start);
            const end = new Event('touchend');
            Object.defineProperty(end, 'changedTouches', { value: [{ clientX: 80, pageY: 300 }] });
            el.dispatchEvent(end);
        });
        await page.waitForFunction(() => {
            const el = document.querySelector('.blurb-card.active');
            return new DOMMatrix(getComputedStyle(el).transform).m41 > 20;
        });
        assert.equal(await page.locator('.carousel-tab').first().getAttribute('aria-pressed'), 'true');
        await settled(page);
    });
});
