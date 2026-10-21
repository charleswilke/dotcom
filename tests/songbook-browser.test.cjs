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
