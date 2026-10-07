'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const feed = JSON.parse(fs.readFileSync(path.join(root, 'cache_substack_feed.json')));
let browser, server, origin;

before(async () => {
    server = http.createServer((request, response) => {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
        if (!file.startsWith(`${root}${path.sep}`)) { response.writeHead(403).end(); return; }
        fs.readFile(file, (error, content) => {
            if (error) { response.writeHead(404).end(); return; }
            const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
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

async function withPage(width, run) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 800, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try { await run(page); assert.deepEqual(errors, [], 'No uncaught browser errors'); }
    finally { await context.close(); }
}

async function aligned(page, id) {
    await page.waitForFunction(id => {
        const top = document.getElementById(id).getBoundingClientRect().top;
        return Math.abs(top - document.getElementById('siteNav').offsetHeight - 8) < 2;
    }, id);
    // Confirm the destination remains aligned after smooth scrolling/anchoring.
    await page.waitForTimeout(400);
    const error = await page.evaluate(id => Math.abs(document.getElementById(id).getBoundingClientRect().top - document.getElementById('siteNav').offsetHeight - 8), id);
    assert.ok(error < 2, `${id} alignment error: ${error}px`);
}

async function nav(page, id) {
    const hamburger = page.locator('#navHamburger');
    if (await hamburger.isVisible()) await hamburger.click();
    if (['about', 'projections'].includes(id)) await page.locator('#navExploreBtn').click();
    await page.locator(`[data-section="${id}"]`).click();
    await aligned(page, id);
    assert.equal(new URL(page.url()).hash, `#${id}`);
}

for (const width of [390, 768, 1440]) {
    test(`direct Music link survives delayed feed at ${width}px`, async () => withPage(width, async page => {
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/api/substack-feed?**', async route => {
            await gate;
            await route.fulfill({ json: { status: 'ok', items: feed.items } });
        });
        await page.goto(`${origin}/#albums`);
        await page.evaluate(() => { void fetchRSSFeed(); });
        await aligned(page, 'albums');
        release();
        await page.waitForFunction(() => document.querySelectorAll('#feed-content .feed-item').length > 1);
        await aligned(page, 'albums');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    }));
}

test('section links update history and Back/Forward restore alignment', async () => withPage(390, async page => {
    await page.goto(origin);
    await nav(page, 'albums');
    await nav(page, 'l.ai.bor');
    await page.goBack();
    await aligned(page, 'albums');
    assert.equal(new URL(page.url()).hash, '#albums');
    await page.goForward();
    await aligned(page, 'l.ai.bor');
    await nav(page, 'game-cartridges');
    await nav(page, 'about');
}));

test('late layout changes yield to user scrolling', async () => withPage(390, async page => {
    await page.goto(`${origin}/#albums`);
    await aligned(page, 'albums');
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(400);
    await page.evaluate(() => document.getElementById('feed-content').style.paddingBottom = '400px');
    await page.waitForTimeout(400);
    const top = await page.locator('#albums').evaluate(element => element.getBoundingClientRect().top);
    assert.ok(Math.abs(top - 61) > 100, 'Late content must not pull the visitor back');
}));

test('closed Explore menu is skipped by Tab; Escape restores its button', async () => withPage(1440, async page => {
    await page.goto(origin);
    await page.locator('#navExploreBtn').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#navDropdown')), false);
    await page.locator('#navExploreBtn').click();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#navDropdown')), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'navExploreBtn');
    assert.equal(await page.locator('#navExploreBtn').getAttribute('aria-expanded'), 'false');
}));

test('player traps focus, nested cover stays locked, close returns to opener', async () => withPage(1440, async page => {
    await page.goto(origin);
    await nav(page, 'albums');
    await page.locator('.album-case-mixtape').click();
    await page.waitForFunction(() => document.activeElement.closest('#mixtapeLightbox'));
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#mixtapeLightbox')), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#mixtapeLightbox')), true);
    assert.equal(await page.locator('main').evaluate(element => element.inert), true);
    await page.locator('#mixtapeCoverImg').click();
    await page.waitForFunction(() => document.activeElement.closest('#coverZoom'));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('coverZoom').hidden);
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#mixtapeLightbox')), true);
    await page.keyboard.press('Escape');
    await page.waitForURL(`${origin}/#albums`);
    assert.equal(await page.locator('.lightbox.active').count(), 0);
    assert.equal(await page.locator('main').evaluate(element => element.inert), false);
    await page.waitForFunction(() => document.activeElement.classList.contains('album-case-mixtape'));
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    await page.goBack();
    assert.equal(new URL(page.url()).hash, '', 'Back goes past Music rather than reopening the closed player');
    assert.equal(await page.locator('.lightbox.active').count(), 0);
}));

test('Back/Forward toggles player and direct player close stays on the site', async () => withPage(390, async page => {
    await page.goto(origin);
    await nav(page, 'albums');
    await page.locator('.album-case-jc').click();
    await page.waitForFunction(() => document.getElementById('jcLightbox').classList.contains('active'));
    await page.goBack();
    await aligned(page, 'albums');
    assert.equal(await page.locator('.lightbox.active').count(), 0);
    await page.goForward();
    await page.waitForFunction(() => document.getElementById('jcLightbox').classList.contains('active'));
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    await page.goto(`${origin}/#mixtape/hum-of-humanity`);
    await page.locator('#mixtapeClose').click();
    await page.waitForURL(`${origin}/#albums`);
    await aligned(page, 'albums');
}));

test('game close consumes its history entry and Escape works inside the frame', async () => withPage(390, async page => {
    // The page shell owns overlay navigation; gameplay is outside this suite.
    await page.route('**/games/SpaceToots/index.html', route => route.fulfill({ contentType: 'text/html', body: '<button>Game control</button>' }));
    await page.goto(origin);
    await nav(page, 'game-cartridges');
    await page.locator('.game-cartridge-spacetoots').click();
    await page.waitForFunction(() => document.getElementById('gameLightbox').classList.contains('active'));
    await page.frameLocator('#gameLightboxFrame').locator('button').focus();
    await page.keyboard.press('Escape');
    await page.waitForURL(`${origin}/#game-cartridges`);
    assert.equal(await page.locator('.lightbox.active').count(), 0);
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    await page.goBack();
    assert.equal(new URL(page.url()).hash, '');
}));

test('slide deck closes to its opening section without reopening on Back', async () => withPage(1440, async page => {
    await page.goto(`${origin}/#portfolio`);
    await aligned(page, 'portfolio');
    await page.locator('#s2iTile').click();
    await page.waitForFunction(() => document.getElementById('s2iLightbox').classList.contains('active'));
    await page.keyboard.press('Escape');
    await page.waitForURL(`${origin}/#portfolio`);
    assert.equal(await page.locator('.lightbox.active').count(), 0);
    assert.equal(await page.locator('main').evaluate(element => element.inert), false);
}));

for (const width of [390, 1440]) {
    test(`album cards reopen without document navigation at ${width}px`, async () => withPage(width, async page => {
        const documents = [];
        page.on('request', request => {
            if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents.push(request.url());
        });
        await page.goto(origin);
        await nav(page, 'albums');
        const startScroll = await page.evaluate(() => scrollY);
        for (const [card, dialog, close] of [
            ['.album-case-mixtape', '#mixtapeLightbox', '#mixtapeClose'],
            ['.album-case-jc', '#jcLightbox', '#jcClose'],
            ['.album-case-gwor', '#gworLightbox', '#gworClose']
        ]) {
            for (let opening = 0; opening < 2; opening++) {
                await page.locator(card).click();
                await page.waitForFunction(selector => document.querySelector(selector).classList.contains('active'), dialog);
                await page.locator(close).click();
                await page.waitForURL(`${origin}/#albums`);
                await aligned(page, 'albums');
                assert.equal(await page.locator('.lightbox.active').count(), 0);
            }
        }
        assert.deepEqual(documents, [`${origin}/`], 'Only the initial page load may navigate a document');
        assert.ok(Math.abs(await page.evaluate(() => scrollY) - startScroll) < 2);
    }));
}

test('Back dismisses player and nested cover; Forward opens only the player', async () => withPage(390, async page => {
    await page.goto(origin);
    await nav(page, 'albums');
    await page.locator('.album-case-mixtape').click();
    await page.locator('#mixtapeCoverImg').click();
    await page.waitForFunction(() => !document.getElementById('coverZoom').hidden);
    await page.goBack();
    await page.waitForURL(`${origin}/#albums`);
    await page.waitForFunction(() => document.getElementById('coverZoom').hidden);
    assert.equal(await page.locator('.lightbox.active').count(), 0);
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert.equal(await page.locator('main').evaluate(element => element.inert), false);
    await page.waitForFunction(() => document.activeElement.classList.contains('album-case-mixtape'));
    await page.goForward();
    await page.waitForFunction(() => document.getElementById('mixtapeLightbox').classList.contains('active'));
    assert.equal(await page.locator('#coverZoom').evaluate(element => element.hidden), true);
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
}));

test('song buttons select with Enter and Space without selecting article/share actions', async () => withPage(1440, async page => {
    await page.goto(origin);
    await nav(page, 'albums');
    await page.locator('.album-case-mixtape').click();
    const songs = page.locator('#mixtapeTrackList button.track-title-text');
    await songs.nth(1).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelectorAll('#mixtapeTrackList .mixtape-track-item')[1].classList.contains('active'));
    assert.ok(new URL(page.url()).hash.endsWith('/protect-the-hollow'));
    await songs.nth(2).focus();
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelectorAll('#mixtapeTrackList .mixtape-track-item')[2].classList.contains('active'));
    assert.equal(await songs.nth(2).getAttribute('aria-current'), 'true');
    assert.equal(await songs.nth(1).getAttribute('aria-current'), null);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('track-article-link')), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('track-share-button')), true);
    assert.ok(new URL(page.url()).hash.endsWith('/data-dignity'));
}));

test('hidden home logo is skipped by Tab and becomes focusable after the header leaves', async () => withPage(1440, async page => {
    await page.goto(origin);
    await page.keyboard.press('Tab');
    assert.notEqual(await page.evaluate(() => document.activeElement.id), 'navLogo');
    assert.equal(await page.locator('#navLogo').evaluate(element => element.inert), true);
    await nav(page, 'albums');
    await page.waitForFunction(() => !document.getElementById('navLogo').inert);
    await page.locator('#navLogo').focus();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'navLogo');
    assert.equal(await page.locator('#navLogo').getAttribute('aria-hidden'), 'false');
}));
