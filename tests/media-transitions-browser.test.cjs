'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const origin = 'https://media-transitions.test';
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function localPage(width, reducedMotion = 'no-preference') {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion, hasTouch: width < 768 });
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin || route.request().resourceType() === 'media') return route.abort();
        // Exercise the cabinet's lifecycle without running or modifying gameplay.
        if (['/tootsjam/', '/spacetoots/'].includes(url.pathname)) {
            return route.fulfill({ contentType: 'text/html', body: '<button>Game control</button>' });
        }
        if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, body: '' });
        const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
            return route.fulfill({ status: 404, body: '' });
        }
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
        return route.fulfill({ path: file, contentType: types[path.extname(file)] || 'application/octet-stream' });
    });
    await page.goto(origin + '/#albums');
    return { page, errors };
}

const objects = [
    ['.album-case-mixtape', '#mixtapeLightbox', '#mixtapeClose', 'album'],
    ['.album-case-jc', '#jcLightbox', '#jcClose', 'album'],
    ['.album-case-gwor', '#gworLightbox', '#gworClose', 'album'],
    ['.game-cartridge-tootsjam', '#gameLightbox', '#gameLightboxClose', 'game'],
    ['.game-cartridge-spacetoots', '#gameLightbox', '#gameLightboxClose', 'game']
];

async function finishMotion(page) {
    await page.evaluate(() => {
        document.querySelectorAll('.media-object-flight, .media-object-backdrop, .lightbox.active, .lightbox.active > .mixtape-content, .lightbox.active > .game-lightbox-content')
            .forEach(node => node.getAnimations().forEach(animation => animation.finish()));
    });
    await page.waitForFunction(() => !document.querySelector('.media-object-flight, .media-object-backdrop, [data-object-motion]'));
}

for (const width of [390, 1440]) {
    test(`all cases and cartridges fly from and return to their exact origin at ${width}px`, async () => {
        const { page, errors } = await localPage(width);
        try {
            for (const [card, dialog, close, kind] of objects) {
                await page.locator(card).scrollIntoViewIfNeeded();
                await page.locator(card).locator('img').first().evaluate(img => img.decode());
                await page.locator(card).focus();
                // Capture the first frame just after activation. This remains
                // deterministic if a later resize legitimately cancels motion.
                await page.evaluate(({ card, dialog, kind }) => {
                    window.mediaFlightSnapshot = null;
                    window.addEventListener('click', () => setTimeout(() => {
                        const visual = document.querySelector(card).querySelector(kind === 'album' ? '.jewel-shell' : '.cartridge-shell');
                        const source = visual.getBoundingClientRect().toJSON();
                        const ghost = document.querySelector('.media-object-flight');
                        if (!ghost) { window.mediaFlightSnapshot = { missing: card, source }; return; }
                        ghost.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 0; });
                        const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
                        window.mediaFlightSnapshot = { source, scroll: scrollY, flight: ghost.getBoundingClientRect().toJSON(),
                            artwork: visual.querySelector('img').src, copyArtwork: ghost.querySelector('img').src,
                            hidden: ghost.getAttribute('aria-hidden'), inert: ghost.inert,
                            duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
                            state: document.querySelector(dialog).dataset.objectMotion,
                            visualHidden: getComputedStyle(visual).visibility };
                    }, 0), { once: true, capture: true });
                }, { card, dialog, kind });
                await page.locator(card).click();
                await page.waitForFunction(() => window.mediaFlightSnapshot !== null);
                const initial = await page.evaluate(() => window.mediaFlightSnapshot);
                assert.ok(initial && !initial.missing, JSON.stringify(initial));
                assert.equal(initial.state, 'opening');
                assert.equal(initial.hidden, 'true'); assert.equal(initial.inert, true);
                assert.equal(initial.visualHidden, 'hidden');
                assert.equal(initial.artwork, initial.copyArtwork);
                assert.deepEqual(initial.duplicateIds, []);
                for (const key of ['x', 'y', 'width', 'height']) {
                    assert.ok(Math.abs(initial.source[key] - initial.flight[key]) < 5, `${card} opening ${key}`);
                }
                await finishMotion(page);
                assert.equal(await page.locator(card).locator(kind === 'album' ? '.jewel-shell' : '.cartridge-shell').evaluate(el => getComputedStyle(el).visibility), 'visible');
                const route = new URL(page.url()).hash;
                const closing = await page.locator(close).evaluate((button, { card, kind, dialog }) => {
                    button.click();
                    const ghost = document.querySelector('.media-object-flight');
                    if (!ghost) throw new Error(`No closing flight: ${card}, origin ${document.querySelector(card).getBoundingClientRect().top}, hash ${location.hash}`);
                    const animation = ghost.getAnimations()[0];
                    animation.pause(); animation.currentTime = 319;
                    const visual = document.querySelector(card).querySelector(kind === 'album' ? '.jewel-shell' : '.cartridge-shell');
                    return { source: visual.getBoundingClientRect().toJSON(), flight: ghost.getBoundingClientRect().toJSON(),
                        active: document.querySelector(dialog).classList.contains('active') };
                }, { card, kind, dialog });
                assert.equal(closing.active, false, 'Modal closes immediately without waiting for motion');
                if (kind === 'game') await page.waitForFunction(() => document.getElementById('gameLightboxFrame').contentWindow.location.href === 'about:blank');
                for (const key of ['x', 'y', 'width', 'height']) {
                    assert.ok(Math.abs(closing.source[key] - closing.flight[key]) < 3, `${card} closing ${key}`);
                }
                await page.waitForFunction(route => location.hash !== route, route, { timeout: 3000 }).catch(error => { throw new Error(`Route did not close: ${route}; ${error.message}`); });
                await finishMotion(page);
                assert.equal(await page.locator('.media-object-in-flight').count(), 0);
                assert.equal(await page.evaluate(() => document.body.style.overflow), '');
                await page.waitForFunction(scroll => Math.abs(scrollY - scroll) < 2, initial.scroll);
                await page.waitForFunction(card => document.activeElement === document.querySelector(card), card);
            }
            assert.deepEqual(errors, []);
        } finally { await page.close(); }
    });

    test(`reduced motion bypasses object flights and keeps players usable at ${width}px`, async () => {
        const { page, errors } = await localPage(width, 'reduce');
        try {
            for (const [card, dialog, close] of [objects[0], objects[4]]) {
                await page.locator(card).click();
                assert.equal(await page.locator(dialog).evaluate(el => el.classList.contains('active')), true);
                assert.equal(await page.locator('.media-object-flight, .media-object-backdrop').count(), 0);
                assert.equal(await page.locator('.media-object-in-flight').count(), 0);
                const route = new URL(page.url()).hash;
                await page.locator(close).click();
                await page.waitForFunction(route => location.hash !== route, route);
                assert.equal(await page.locator('.media-object-flight, .media-object-backdrop').count(), 0);
            }
            assert.deepEqual(errors, []);
        } finally { await page.close(); }
    });
}

test('Escape interrupts opening, a new launch cancels closing, and Back/Forward stay coherent', async () => {
    const { page, errors } = await localPage(390);
    try {
        await page.locator('.album-case-mixtape').scrollIntoViewIfNeeded();
        await page.locator('.album-case-mixtape').focus();
        await page.locator('.album-case-mixtape').press('Enter');
        await page.keyboard.press('Escape');
        await page.waitForURL(origin + '/#albums');
        assert.equal(await page.locator('.lightbox.active').count(), 0);
        // Open again before the 320ms return trip completes.
        await page.locator('.album-case-mixtape').press('Enter');
        assert.equal(await page.locator('.media-object-flight').count(), 1);
        assert.equal(await page.locator('.media-object-backdrop').count(), 0);
        await finishMotion(page);
        await page.goBack();
        assert.equal(await page.locator('.lightbox.active').count(), 0);
        await finishMotion(page);
        await page.goForward();
        assert.equal(await page.locator('#mixtapeLightbox').evaluate(el => el.classList.contains('active')), true);
        await finishMotion(page);
        assert.equal(await page.locator('.media-object-in-flight').count(), 0);
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('resizing or enabling reduced motion during a flight cleans up immediately', async () => {
    const { page, errors } = await localPage(1440);
    try {
        await page.locator('.album-case-mixtape').click();
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.waitForFunction(() => !document.querySelector('.media-object-flight'));
        assert.equal(await page.locator('.media-object-in-flight').count(), 0);
        assert.equal(await page.locator('#mixtapeLightbox').evaluate(el => el.classList.contains('active')), true);
        await page.locator('#mixtapeClose').click();
        await page.waitForURL(origin + '/#albums');
        await page.locator('.album-case-mixtape').press('Enter');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction(() => !document.querySelector('.media-object-flight'));
        assert.equal(await page.locator('.media-object-in-flight').count(), 0);
        assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});

test('direct album and game links open normally without an invented origin', async () => {
    const { page, errors } = await localPage(390);
    try {
        for (const [hash, dialog] of [['mixtape', '#mixtapeLightbox'], ['spacetoots', '#gameLightbox']]) {
            await page.goto('about:blank');
            await page.goto(origin + '/#' + hash);
            await page.locator(dialog + '.active').waitFor();
            assert.equal(await page.locator('.media-object-flight').count(), 0);
            assert.deepEqual(errors, []);
        }
    } finally { await page.close(); }
});
