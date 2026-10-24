'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const origin = 'https://audio-controls.test';
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

// A decodable two-minute silent file keeps seeking/playback tests local and quiet.
const wav = Buffer.alloc(44 + 120 * 8000, 128);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(8000, 28);
wav.writeUInt16LE(1, 32); wav.writeUInt16LE(8, 34);
wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);

async function localPage(width) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', hasTouch: width < 768 });
    page.setDefaultTimeout(8000);
    let missing = true;
    let releaseMedia;
    const gate = new Promise(resolve => { releaseMedia = resolve; });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === '/audio/test-missing.wav' && missing) return route.fulfill({ status: 404, body: '' });
        if (url.pathname === '/audio/test-delayed.wav') await gate;
        if (route.request().resourceType() === 'media') {
            const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers().range || '');
            const start = range ? Number(range[1]) : 0;
            const end = range && range[2] ? Math.min(Number(range[2]), wav.length - 1) : wav.length - 1;
            return route.fulfill({
                status: range ? 206 : 200, body: wav.subarray(start, end + 1), contentType: 'audio/wav',
                headers: { 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1),
                    ...(range ? { 'Content-Range': `bytes ${start}-${end}/${wav.length}` } : {}) }
            });
        }
        if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, body: '' });
        const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
            return route.fulfill({ status: 404, body: '' });
        }
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
        return route.fulfill({ path: file, contentType: types[path.extname(file)] || 'application/octet-stream' });
    });
    await page.goto(origin);
    return { page, errors, recoverMedia: () => { missing = false; }, releaseMedia };
}

async function seekChecks(page, selector, audioId) {
    const slider = page.locator(selector);
    await page.waitForFunction(id => Number.isFinite(document.getElementById(id).duration), audioId);
    assert.equal(await slider.getAttribute('role'), 'slider');
    assert.equal(await slider.getAttribute('aria-disabled'), 'false');
    await slider.focus();
    await slider.press('Home');
    await slider.press('ArrowRight');
    assert.equal(await slider.getAttribute('aria-valuenow'), '5');
    await slider.press('Shift+ArrowUp');
    assert.equal(await slider.getAttribute('aria-valuenow'), '35');
    await slider.press('ArrowDown');
    assert.equal(await slider.getAttribute('aria-valuenow'), '30');
    assert.equal(await slider.getAttribute('aria-valuetext'), '0:30 of 2:00');
    await slider.press('End');
    await slider.press('ArrowRight');
    assert.equal(await slider.getAttribute('aria-valuenow'), '120');
    await slider.press('Home');
    await slider.press('ArrowLeft');
    assert.equal(await slider.getAttribute('aria-valuenow'), '0');
    assert.equal(await page.evaluate(id => document.getElementById(id).paused, audioId), true, 'Seeking preserves pause');
}

for (const width of [390, 1440]) {
    test(`recap and all album seek controls work by keyboard at ${width}px`, async () => {
        const { page, errors } = await localPage(width);
        try {
            const recap = page.locator('.audio-summary-player .audio-progress-container');
            await recap.scrollIntoViewIfNeeded();
            await seekChecks(page, '.audio-summary-player .audio-progress-container', 'recap-audio');
            const rail = await recap.boundingBox();
            await recap.click({ position: { x: rail.width / 2, y: rail.height / 2 } });
            await page.waitForFunction(() => Math.abs(document.getElementById('recap-audio').currentTime - 60) < 1);
            assert.equal(await page.evaluate(() => document.getElementById('recap-audio').paused), true);
            await page.mouse.move(rail.x + rail.width / 4, rail.y + rail.height / 2);
            await page.mouse.down();
            await page.mouse.move(rail.x + rail.width * .75, rail.y + rail.height / 2, { steps: 4 });
            await page.mouse.up();
            await page.waitForFunction(() => Math.abs(document.getElementById('recap-audio').currentTime - 90) < 1);
            for (const [prefix, tile] of [['mixtape', '.album-case-mixtape'], ['jc', '#jcTile'], ['gwor', '#gworTile']]) {
                await page.locator(tile).click();
                await seekChecks(page, `#${prefix}Vial`, `${prefix}Audio`);
                const vial = page.locator(`#${prefix}Vial`);
                assert.equal(await vial.getAttribute('aria-orientation'), 'vertical');
                const box = await vial.boundingBox();
                const target = await page.evaluate(({x, y}) => document.elementFromPoint(x, y)?.closest('.time-vial')?.id,
                    { x: box.x - 10, y: box.y + box.height * .75 });
                assert.equal(target, `${prefix}Vial`, 'Invisible padding belongs to the seek control');
                await page.mouse.click(box.x - 10, box.y + box.height * .75);
                await page.waitForFunction(id => Math.abs(document.getElementById(id).currentTime - 30) < 1, `${prefix}Audio`);
                await page.locator(`#${prefix}Close`).click();
            }
            assert.deepEqual(errors, []);
        } finally { await page.close(); }
    });

    test(`recap errors recover through Play and reflect actual playback at ${width}px`, async () => {
        const { page, errors, recoverMedia } = await localPage(width);
        try {
            const button = page.locator('.audio-summary-btn');
            await button.scrollIntoViewIfNeeded();
            await page.evaluate(() => {
                const audio = document.getElementById('recap-audio');
                audio.src = '/audio/test-missing.wav';
                audio.load();
            });
            const host = page.locator('.audio-summary-player .custom-audio-player');
            await page.waitForFunction(() => !!document.getElementById('recap-audio').error);
            assert.match(await host.locator('[role="status"]').textContent(), /Couldn’t/);
            assert.equal(await button.getAttribute('aria-label'), 'Play audio');
            recoverMedia();
            await button.click();
            await page.waitForFunction(() => !document.getElementById('recap-audio').paused);
            await page.waitForFunction(() => document.querySelector('.audio-summary-btn').getAttribute('aria-label') === 'Pause audio');
            await page.waitForFunction(() => document.querySelector('.audio-summary-player [role="status"]').textContent === '');
            await button.click();
            await page.waitForFunction(() => document.querySelector('.audio-summary-btn').getAttribute('aria-label') === 'Play audio');
            assert.equal(await button.getAttribute('aria-label'), 'Play audio');
            // A rejected play promise must leave a truthful icon and actionable feedback.
            await page.evaluate(() => {
                const audio = document.getElementById('recap-audio');
                audio.play = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
            });
            await button.click();
            await page.waitForFunction(() => document.querySelector('.audio-summary-player [role="status"]').textContent.includes('Tap Play'));
            assert.equal(await button.getAttribute('aria-label'), 'Play audio');
            assert.deepEqual(errors, []);
        } finally { await page.close(); }
    });

    test(`loading and buffering feedback stays within the recap at ${width}px`, async () => {
        const { page, errors, releaseMedia } = await localPage(width);
        try {
            const button = page.locator('.audio-summary-btn');
            await button.scrollIntoViewIfNeeded();
            const host = page.locator('.audio-summary-player .custom-audio-player');
            const before = await host.boundingBox();
            await page.evaluate(() => {
                const audio = document.getElementById('recap-audio');
                audio.preload = 'none';
                audio.src = '/audio/test-delayed.wav';
                audio.load();
            });
            await button.click();
            await page.waitForFunction(() => document.querySelector('.audio-summary-player [role="status"]').textContent.includes('audio…'));
            assert.equal(await host.locator('[role="status"]').getAttribute('aria-live'), 'polite');
            const loading = await host.boundingBox();
            assert.equal(loading.height, before.height);
            assert.equal(loading.width, before.width);
            releaseMedia();
            await page.waitForFunction(() => document.querySelector('.audio-summary-player [role="status"]').textContent === '');
            await page.evaluate(() => document.getElementById('recap-audio').dispatchEvent(new Event('waiting')));
            assert.match(await host.locator('[role="status"]').textContent(), /Buffering/);
            await page.evaluate(() => document.getElementById('recap-audio').dispatchEvent(new Event('playing')));
            assert.equal(await host.locator('[role="status"]').textContent(), '');
            assert.deepEqual(errors, []);
        } finally { releaseMedia(); await page.close(); }
    });

    test('mini player artwork reflection stays synchronized and behind controls at ' + width + 'px', async () => {
        const { page, errors } = await localPage(width);
        try {
            for (const [prefix, tile] of [['jc', '#jcTile'], ['gwor', '#gworTile'], ['mixtape', '.album-case-mixtape']]) {
                await page.locator(tile).click();
                await page.locator('#' + prefix + 'PlayPause').click();
                await page.waitForFunction(id => !document.getElementById(id).paused, prefix + 'Audio');
                await page.locator('#' + prefix + 'Close').click();
                const mini = page.locator('#miniPlayer');
                await mini.waitFor({ state: 'visible' });
                await mini.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))));
                await page.locator('#miniPlayerCoverImg').evaluate(img => img.decode());
                const initial = await mini.evaluate((root, prefix) => {
                    const reflection = root.querySelector('.mini-player-artwork-reflection');
                    const canvas = root.querySelector('.modal-oscilloscope');
                    const box = canvas.getBoundingClientRect();
                    return {
                        source: document.getElementById(prefix + 'CoverImg').src,
                        thumbnail: root.querySelector('#miniPlayerCoverImg').src,
                        reflection: getComputedStyle(reflection, '::before').backgroundImage,
                        hidden: reflection.getAttribute('aria-hidden'),
                        pointerEvents: getComputedStyle(reflection).pointerEvents,
                        canvasLayer: getComputedStyle(canvas).zIndex,
                        reflectionLayer: getComputedStyle(reflection).zIndex,
                        hit: document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest('button')?.id,
                        height: root.getBoundingClientRect().height
                    };
                }, prefix);
                assert.equal(initial.thumbnail, initial.source);
                assert.ok(initial.reflection.includes(initial.source));
                assert.equal(initial.hidden, 'true');
                assert.equal(initial.pointerEvents, 'none');
                assert.ok(Number(initial.canvasLayer) > Number(initial.reflectionLayer));
                assert.equal(initial.hit, 'miniPlayerOscFrame');
                assert.equal(initial.height, 80, 'The existing player dimensions are preserved');
                await page.locator('#miniPlayerCover').click();
                await page.waitForFunction(({ prefix, previous }) => {
                    const src = document.getElementById(prefix + 'CoverImg').src;
                    return (prefix === 'mixtape' || src !== previous) &&
                        document.getElementById('miniPlayerCoverImg').src === src &&
                        document.getElementById('miniPlayer').style.getPropertyValue('--mini-cover-art').includes(src);
                }, { prefix, previous: initial.thumbnail });
                if (prefix !== 'mixtape') {
                    assert.notEqual(await page.locator('#miniPlayerCoverImg').getAttribute('src'), initial.thumbnail,
                        'Pausing returns the thumbnail and reflection to album artwork');
                }
                await page.emulateMedia({ contrast: 'more' });
                assert.equal(await mini.locator('.mini-player-artwork-reflection').evaluate(el => getComputedStyle(el).display), 'none');
                await page.emulateMedia({ contrast: 'no-preference' });
                await page.locator('#miniPlayerClose').click();
                await page.waitForFunction(() => document.getElementById('miniPlayer').hidden);
            }
            assert.equal(await page.locator('.mini-player-artwork-reflection').count(), 1);
            assert.deepEqual(errors, []);
        } finally { await page.close(); }
    });

    test(`mini player retains its fixed layout, feedback, and expanded close target at ${width}px`, async () => {
        const { page, errors } = await localPage(width);
        try {
            await page.locator('#jcTile').click();
            await page.locator('#jcPlayPause').click();
            await page.waitForFunction(() => !document.getElementById('jcAudio').paused);
            await page.locator('#jcClose').click();
            const mini = page.locator('#miniPlayer');
            await mini.waitFor({ state: 'visible' });
            assert.equal(await mini.evaluate(el => getComputedStyle(el).position), 'fixed');
            const close = page.locator('#miniPlayerClose');
            const box = await close.boundingBox();
            assert.equal(box.width, 44); assert.equal(box.height, 44);
            await page.locator('#miniPlayerCover').click();
            await page.evaluate(() => {
                const audio = document.getElementById('jcAudio');
                audio.play = () => Promise.reject(new DOMException('Missing', 'NotSupportedError'));
            });
            await page.locator('#miniPlayerCover').click();
            await page.waitForFunction(() => document.querySelector('#miniPlayer [role="status"]').textContent.includes('retry'));
            assert.match(await page.locator('#jcOscilloscopeFrame [role="status"]').textContent(), /retry/);
            // Hit the padding below/left of the original 16px glyph.
            await close.click({ position: { x: 4, y: 38 } });
            await page.waitForFunction(() => document.getElementById('miniPlayer').hidden);
            assert.deepEqual(errors, []);
        } finally { await page.close(); }
    });
}


test('album advances after playing reaches the end, and seeking keeps playback active', async () => {
    const { page, errors } = await localPage(390);
    try {
        await page.locator('#jcTile').click();
        await page.locator('#jcPlayPause').click();
        await page.waitForFunction(() => !document.getElementById('jcAudio').paused);
        const first = await page.evaluate(() => document.getElementById('jcAudio').src);
        await page.locator('#jcVial').press('ArrowUp');
        assert.equal(await page.evaluate(() => document.getElementById('jcAudio').paused), false);
        await page.locator('#jcClose').click();
        const firstArt = await page.locator('#miniPlayerCoverImg').getAttribute('src');
        await page.evaluate(() => { document.getElementById('jcAudio').currentTime = 119.8; });
        await page.waitForFunction(first => {
            const audio = document.getElementById('jcAudio');
            return audio.src !== first && !audio.paused;
        }, first);
        await page.waitForFunction(firstArt => {
            const img = document.getElementById('miniPlayerCoverImg');
            const src = document.getElementById('jcCoverImg').src;
            return img.src !== firstArt && img.src === src &&
                document.getElementById('miniPlayer').style.getPropertyValue('--mini-cover-art').includes(src);
        }, firstArt);
        assert.deepEqual(errors, []);
    } finally { await page.close(); }
});
