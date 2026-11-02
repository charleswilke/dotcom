'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const origin = 'https://matchbooks.test';
const template = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .match(/<template id="recently-matchbooks-template">([\s\S]*?)<\/template>/)[1];
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function localPage(reducedMotion = 'no-preference', mobile = true) {
    const page = await browser.newPage({ viewport: { width: mobile ? 390 : 1440, height: 844 },
        hasTouch: mobile, isMobile: mobile, reducedMotion });
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="stylesheet" href="/recently-matchbooks.css">
            <style>body{margin:0}.container{padding:0 24px}main{padding-top:60px}</style>
            <main class="matchbook-wall">${template}</main>
            <script>
                window.activations = 0; window.effects = 0;
                document.addEventListener('click', event => {
                    if (event.target.closest('a')) { event.preventDefault(); window.activations++; }
                });
                new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
                    if (node.matches?.('.matchbook-sparks, .matchbook-strike-glint')) window.effects++;
                }))).observe(document.body, {childList:true, subtree:true});
            </script>
            <script src="/recently-matchbooks.js"></script>` });
        const file = path.resolve(root, '.' + url.pathname);
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.abort();
        return route.fulfill({ path: file });
    });
    await page.goto(origin);
    await page.waitForFunction(() => document.querySelectorAll('.matchbook[data-matchbook-ready]').length === 6);
    const book = await page.locator('.matchbook').first().boundingBox();
    const session = mobile ? await page.context().newCDPSession(page) : null;
    return { page, book, errors, session };
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function swipe(session, points, hold = 0) {
    const send = (type, point) => session.send('Input.dispatchTouchEvent', {
        type, touchPoints: point ? [{ ...point, id: 0, radiusX: 10, radiusY: 10 }] : [],
    });
    await send('touchStart', points[0]);
    if (hold) await pause(hold);
    for (const point of points.slice(1)) {
        await pause(20);
        await send('touchMove', point);
    }
    await send('touchEnd');
}

test('finger swipes above the printed pad spark in both directions, including diagonal drift', async () => {
    const { page, book: b, session, errors } = await localPage();
    try {
        // Start just above the old hit area, as a finger covering the strip does.
        const y = b.y + b.height * .9 - 6;
        await swipe(session, [0, 1, 2, 3].map(i => ({ x: b.x + b.width * (.2 + i * .18), y: y + i * 3 })));
        assert.equal(await page.locator('.matchbook-sparks').first().getAttribute('data-strike-direction'), 'right');
        const effects = await page.evaluate(() => window.effects);
        await pause(180);
        await swipe(session, [0, 1, 2, 3].map(i => ({ x: b.x + b.width * (.8 - i * .18), y: y + i * 3 })));
        assert.equal(await page.locator('.matchbook-sparks').first().getAttribute('data-strike-direction'), 'left');
        assert.ok(await page.evaluate(() => window.effects) > effects);
        assert.equal(await page.evaluate(() => window.activations), 0, 'Swipes must not activate project links');
        assert.equal(await page.evaluate(() => scrollY), 0, 'Striking must not scroll the page');
        await page.locator('.matchbook-striker-target').first().tap();
        assert.equal(await page.evaluate(() => window.activations), 1, 'A fresh tap after striking follows the link');
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('a short finger strike registers immediately after resting on the pad', async () => {
    const { page, book: b, session, errors } = await localPage();
    try {
        const x = b.x + b.width * .4, y = b.y + b.height * .941;
        await swipe(session, [{ x, y }, { x: x + 7, y }], 200);
        assert.equal(await page.evaluate(() => window.effects), 1);
        assert.equal(await page.evaluate(() => window.activations), 0);
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('vertical swipes still scroll and fresh taps and keyboard activation still follow links', async () => {
    const { page, book: b, session, errors } = await localPage();
    try {
        const x = b.x + b.width * .5, y = b.y + b.height * .941;
        await swipe(session, [0, 1, 2, 3, 4].map(i => ({ x: x + i, y: y - i * 25 })));
        await page.waitForFunction(() => scrollY > 30);
        assert.equal(await page.evaluate(() => window.effects), 0);
        assert.equal(await page.evaluate(() => window.activations), 0);
        // Finish touch momentum before interacting with the first card again.
        await page.mouse.wheel(0, -1000);
        await page.locator('.matchbook').first().scrollIntoViewIfNeeded();
        await page.locator('.matchbook-striker-target').first().tap();
        assert.equal(await page.evaluate(() => window.activations), 1, 'A tap on the strip is still a link');
        await page.locator('.matchbook-link').first().press('Enter');
        assert.equal(await page.evaluate(() => window.activations), 2);
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('reduced motion uses a glint for forgiving finger strikes', async () => {
    const { page, book: b, session, errors } = await localPage('reduce');
    try {
        const y = b.y + b.height * .9 - 6;
        await swipe(session, [{ x: b.x + 50, y }, { x: b.x + 80, y }]);
        assert.equal(await page.evaluate(() => window.effects), 1);
        assert.equal(await page.locator('.matchbook-sparks').count(), 0);
        assert.equal(await page.evaluate(() => window.activations), 0);
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('desktop mouse hover still sparks only on the printed strip', async () => {
    const { page, book: b, errors } = await localPage('no-preference', false);
    try {
        await page.mouse.move(b.x + 50, b.y + b.height * .85);
        await pause(20);
        await page.mouse.move(b.x + 100, b.y + b.height * .85);
        assert.equal(await page.evaluate(() => window.effects), 0);
        await page.mouse.move(b.x + 50, b.y + b.height * .941);
        await pause(20);
        await page.mouse.move(b.x + 100, b.y + b.height * .941);
        assert.ok(await page.evaluate(() => window.effects) > 0);
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});
