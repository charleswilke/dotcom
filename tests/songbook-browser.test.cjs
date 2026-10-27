'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const origin = 'https://songbook.test';
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { if (browser) await browser.close(); });

for (const width of [390, 1440]) {
    for (const [prefix, hash, collection] of [
        ['jc', 'junkyard-cabaret', 'Junkyard Cabaret'],
        ['gwor', 'gwor', 'Grief without Ritual']
    ]) {
        test(`${collection} footer is ready before lyrics load at ${width}px`, async () => {
            const page = await browser.newPage({ viewport: { width, height: 900 } });
            let release;
            const gate = new Promise(resolve => { release = resolve; });
            try {
                await page.route('**/*', async route => {
                    const url = new URL(route.request().url());
                    if (url.origin !== origin) return route.abort();
                    if (url.pathname.endsWith('/songbook.json')) await gate;
                    if (route.request().resourceType() === 'media') return route.abort();
                    const file = path.resolve(root, `.${url.pathname === '/' ? '/index.html' : url.pathname}`);
                    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
                        return route.fulfill({ status: 404, body: '' });
                    }
                    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
                    return route.fulfill({ path: file, contentType: mime[path.extname(file)] || 'application/octet-stream' });
                });
                await page.goto(`${origin}/#${hash}`);
                const open = page.locator(`#${prefix}TrackList .track-songbook-button`).first();
                await open.waitFor();
                await page.evaluate(() => document.fonts.ready);
                // Inspect in the same task as the click, while fetch is still blocked.
                const initial = await open.evaluate(button => {
                    button.click();
                    const panel = document.getElementById(button.getAttribute('aria-controls'));
                    const footer = panel.querySelector('.jc-book-footer');
                    return {
                        text: footer.textContent,
                        href: footer.querySelector('a')?.href,
                        height: footer.getBoundingClientRect().height,
                        busy: panel.querySelector('.jc-songbook-content').getAttribute('aria-busy')
                    };
                });
                assert.equal(initial.busy, 'true');
                assert.match(initial.text, /Words & production by Charles Wilke/);
                assert.ok(initial.text.includes(`${collection} / Songbook`));
                assert.ok(initial.href, 'Inspiration link is available before lyrics arrive');
                const footer = page.locator(`#${prefix}SongbookFooter`);
                await page.locator(`#${prefix}SongbookPanel`).evaluate(async panel => {
                    await Promise.all(panel.getAnimations().map(animation => animation.finished));
                });
                const loadingHeight = await page.locator(`#${prefix}SongbookContent`).evaluate(el => el.clientHeight);
                release();
                await page.waitForFunction(prefix => document.getElementById(`${prefix}SongbookContent`).getAttribute('aria-busy') === 'false', prefix);
                assert.equal(await footer.textContent(), initial.text);
                assert.equal(await footer.evaluate(el => el.getBoundingClientRect().height), initial.height);
                assert.equal(await page.locator(`#${prefix}SongbookContent`).evaluate(el => el.clientHeight), loadingHeight, 'Lyrics arrival must not resize the reading area');
                await page.locator(`#${prefix}SongbookBack`).click();
                await open.click();
                assert.equal(await footer.textContent(), initial.text, 'Cached reopening keeps the footer');
            } finally {
                release();
                await page.close();
            }
        });
    }
}

// Use real media events with a quiet local fixture to verify playback handoffs.
const silentWav = Buffer.alloc(44 + 30 * 8000, 128);
silentWav.write('RIFF', 0); silentWav.writeUInt32LE(silentWav.length - 8, 4); silentWav.write('WAVEfmt ', 8);
silentWav.writeUInt32LE(16, 16); silentWav.writeUInt16LE(1, 20); silentWav.writeUInt16LE(1, 22);
silentWav.writeUInt32LE(8000, 24); silentWav.writeUInt32LE(8000, 28);
silentWav.writeUInt16LE(1, 32); silentWav.writeUInt16LE(8, 34);
silentWav.write('data', 36); silentWav.writeUInt32LE(silentWav.length - 44, 40);

for (const width of [390, 1440]) {
    for (const [prefix, hash, firstSong] of [
        ['jc', 'junkyard-cabaret', 'why-this-way'], ['gwor', 'gwor', 'clear-as-day']
    ]) {
        test(`${prefix} previous takes expand, share, and hand off playback at ${width}px`, async () => {
            const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
            page.setDefaultTimeout(8000);
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            let takeRequests = 0;
            try {
                await page.route('**/*', async route => {
                    const url = new URL(route.request().url());
                    if (url.origin !== origin) return route.abort();
                    if (route.request().resourceType() === 'media') {
                        if (url.pathname.includes('/previous-takes/')) takeRequests++;
                        const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers().range || '');
                        const start = range ? Number(range[1]) : 0;
                        const end = range && range[2] ? Math.min(Number(range[2]), silentWav.length - 1) : silentWav.length - 1;
                        return route.fulfill({
                            status: range ? 206 : 200, body: silentWav.subarray(start, end + 1), contentType: 'audio/wav',
                            headers: { 'Accept-Ranges': 'bytes', 'Content-Length': String(end - start + 1),
                                ...(range ? { 'Content-Range': `bytes ${start}-${end}/${silentWav.length}` } : {}) }
                        });
                    }
                    const file = path.resolve(root, `.${url.pathname === '/' ? '/index.html' : url.pathname}`);
                    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
                        return route.fulfill({ status: 404, body: '' });
                    }
                    if (url.pathname.endsWith(`/${firstSong}/songbook.json`)) {
                        const song = JSON.parse(fs.readFileSync(file, 'utf8'));
                        song.previousTakes = [
                            { title: 'First arrangement', file: '/audio/previous-takes/first.wav', notes: 'An earlier chorus.' },
                            { title: 'Second arrangement', file: '/audio/previous-takes/second.wav' },
                            { title: 'Missing file' }, { title: 'Invalid link', file: 'javascript:alert(1)' }
                        ];
                        return route.fulfill({ json: song });
                    }
                    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
                    return route.fulfill({ path: file, contentType: types[path.extname(file)] || 'application/octet-stream' });
                });
                await page.goto(`${origin}/#${hash}`);
                const open = page.locator(`#${prefix}TrackList .track-songbook-button`).first();
                await open.waitFor();
                const managedCount = await page.evaluate(() => managedAudioPlayers.size);
                await page.evaluate(prefix => document.getElementById(`${prefix}Audio`).play(), prefix);
                await open.click();
                const previous = page.locator(`#${prefix}SongbookContent .jc-book-previous-takes`);
                await previous.waitFor();
                assert.equal(await previous.getAttribute('open'), null);
                assert.equal(await page.evaluate(prefix => document.getElementById(`${prefix}Audio`).paused, prefix), false, 'Opening lyrics preserves current playback');
                await previous.locator('summary').focus();
                await previous.locator('summary').press('Enter');
                await page.waitForFunction(prefix => document.querySelector(`#${prefix}SongbookContent .jc-book-previous-takes`).open, prefix);
                assert.equal(takeRequests, 0, 'Opening previous takes does not fetch recordings');
                assert.equal(await previous.locator('audio').count(), 2);
                assert.equal(await previous.locator('a').first().getAttribute('href'), '/audio/previous-takes/first.wav');
                assert.equal(await previous.locator('a').first().getAttribute('target'), '_blank');
                await previous.scrollIntoViewIfNeeded();
                assert.ok(await previous.evaluate(el => el.scrollWidth <= el.clientWidth), 'Takes fit the reading column');
                if (process.env.SONGBOOK_SCREENSHOTS) {
                    await page.screenshot({ path: `/tmp/songbook-${prefix}-${width}.png` });
                }
                const audios = previous.locator('audio');
                const playButtons = previous.locator('.jc-book-take-play');
                await playButtons.nth(0).click();
                await page.waitForFunction(prefix => Number.isFinite(document.querySelector(`#${prefix}SongbookContent audio`).duration), prefix);
                assert.equal(await playButtons.nth(0).getAttribute('aria-label'), 'Pause First arrangement');
                await playButtons.nth(0).click();
                const seek = previous.locator('[role="slider"]').first();
                await page.waitForFunction(prefix => {
                    const audio = document.querySelector(`#${prefix}SongbookContent audio`);
                    return audio.seekable.length && audio.seekable.end(0) >= 5;
                }, prefix);
                await seek.focus();
                await seek.press('Home');
                await seek.press('ArrowRight');
                assert.equal(await seek.getAttribute('aria-valuenow'), '5');
                assert.equal(await audios.nth(0).evaluate(audio => audio.paused), true, 'Seeking preserves pause');
                await playButtons.nth(0).click();
                assert.equal(await page.evaluate(prefix => document.getElementById(`${prefix}Audio`).paused, prefix), true);
                await playButtons.nth(1).click();
                assert.equal(await audios.nth(0).evaluate(audio => audio.paused), true, 'Only one take plays');
                await page.locator(`#${prefix}SongbookToolbar .jc-book-listen`).click();
                assert.equal(await audios.nth(1).evaluate(audio => audio.paused), true, 'Album Listen pauses the take');
                await playButtons.nth(0).click();
                await previous.locator('summary').click();
                await page.waitForFunction(prefix => document.querySelector(`#${prefix}SongbookContent audio`).paused, prefix);
                await previous.locator('summary').click();
                await playButtons.nth(0).click();
                await page.locator(`#${prefix}SongbookBack`).click();
                assert.equal(await audios.nth(0).evaluate(audio => audio.paused), true, 'Leaving the book pauses the take');
                await open.click();
                await previous.waitFor();
                assert.equal(await page.evaluate(() => managedAudioPlayers.size), managedCount + 2, 'Cached reopening releases old audio players');
                await page.locator(`#${prefix}SongbookBack`).click();
                await page.locator(`#${prefix}TrackList .track-songbook-button`).nth(2).click();
                await page.waitForFunction(prefix => document.getElementById(`${prefix}SongbookContent`).getAttribute('aria-busy') === 'false', prefix);
                assert.equal(await previous.count(), 0, 'Songs without takes have no empty section');
                assert.equal(await page.evaluate(() => managedAudioPlayers.size), managedCount);
                await page.locator(`#${prefix}SongbookBack`).click();
                await open.click();
                await previous.locator('summary').click();
                await playButtons.nth(0).click();
                await page.locator(`#${prefix}Close`).click();
                await page.waitForFunction(prefix => document.querySelector(`#${prefix}SongbookContent audio`).paused, prefix);
                assert.deepEqual(errors, []);
            } finally { await page.close(); }
        });
    }
}

test('songbooks display only the last numbered effort per day and retain the archive', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
    try {
        await page.route('**/*', route => {
            const url = new URL(route.request().url());
            if (url.origin !== origin) return route.abort();
            const file = path.resolve(root, `.${url.pathname === '/' ? '/index.html' : url.pathname}`);
            if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
                return route.fulfill({ status: 404, body: '' });
            }
            const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.woff2': 'font/woff2' };
            return route.fulfill({ path: file, contentType: types[path.extname(file)] || 'application/octet-stream' });
        });
        await page.goto(`${origin}/#junkyard-cabaret`);
        for (const slug of ['mostly-yours', 'refuse-the-call', 'misdirected']) {
            const song = JSON.parse(fs.readFileSync(path.join(root, `songs/junkyard-cabaret/${slug}/songbook.json`), 'utf8'));
            const button = page.locator('#jcTrackList .mixtape-track-item').filter({ has: page.getByText(song.title, { exact: true }) }).locator('.track-songbook-button');
            await button.click();
            const previous = page.locator('#jcSongbookContent .jc-book-previous-takes');
            await previous.waitFor();
            await previous.locator('summary').click();
            const titles = await previous.locator('.jc-book-take-title').allTextContents();
            assert.equal(titles.filter(title => title === 'September 27, 2026').length, 1);
            assert.ok(titles.every(title => !title.includes(' · ')));
            const last = song.previousTakes.filter(take => take.title.startsWith('September 27, 2026')).at(-1);
            const row = previous.locator('li').filter({ hasText: 'September 27, 2026' });
            assert.equal(await row.locator('a').getAttribute('href'), last.file);
            const days = new Set(song.previousTakes.map(take => take.title.split(' · ')[0]));
            assert.equal(await previous.locator('audio').count(), days.size);
            assert.ok(song.previousTakes.length > days.size, 'Earlier efforts remain archived');
            await page.locator('#jcSongbookBack').click();
        }
    } finally { await page.close(); }
});

test('Cathedral of Junk preserves the March recording as a distinct playable file', () => {
    const song = JSON.parse(fs.readFileSync(path.join(root, 'songs/junkyard-cabaret/cathedral-of-junk/songbook.json'), 'utf8'));
    const take = song.previousTakes[0];
    const audio = fs.readFileSync(path.join(root, take.file));
    assert.equal(audio.subarray(0, 3).toString(), 'ID3');
    assert.notDeepEqual(audio, fs.readFileSync(path.join(root, 'audio/junkyard-cabaret/cathedral-of-junk.mp3')));
});
