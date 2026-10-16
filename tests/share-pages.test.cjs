'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { build } = require('../tools/build-share-pages');

const root = path.resolve(__dirname, '..');

test('share pages retain custom previews and the complete homepage without redirects', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dotcom-share-pages-'));
    try {
        for (const file of ['index.html', 'junkyard-cabaret.html', 'l.ai.bor.html']) {
            fs.copyFileSync(path.join(root, file), path.join(directory, file));
        }
        build(directory);
        const homepage = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
        for (const entry of ['junkyard-cabaret', 'l.ai.bor']) {
            const template = fs.readFileSync(path.join(directory, `${entry}.html`), 'utf8');
            const html = fs.readFileSync(path.join(directory, `generated/share-pages/${entry}.html`), 'utf8');
            assert.equal(html.slice(html.indexOf('<body>')), homepage.slice(homepage.indexOf('<body>')));
            assert.equal((html.match(/<title>/g) || []).length, 1);
            assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
            assert.match(html, /rel="canonical" href="https:\/\/charleswilke\.com\/"/);
            for (const property of ['og:title', 'og:image', 'og:url']) {
                const tag = template.match(new RegExp(`<meta property="${property}"[^>]*>`))[0];
                assert.ok(html.includes(tag), `${entry} preserves ${property}`);
                assert.equal((html.match(new RegExp(`property="${property}"`, 'g')) || []).length, 1);
            }
            assert.doesNotMatch(html, /http-equiv="refresh"|window\.location\.(?:replace|assign)\(/i);
            assert.ok(html.indexOf('window.history.replaceState') < html.indexOf('src="/page-entry.js'));

            const bootstrap = html.match(/<script>(window\.history\.replaceState[\s\S]*?)<\/script>/)[1];
            for (const hash of ['', `#${entry}/a-track`]) {
                let destination;
                const state = { marker: 1 };
                vm.runInNewContext(bootstrap, { window: {
                    location: { search: '?source=shared', hash },
                    history: { state, replaceState(receivedState, title, url) {
                        assert.equal(receivedState, state);
                        destination = url;
                    } }
                } });
                assert.equal(destination, `/?source=shared${hash || `#${entry}`}`);
            }
        }
        // Safe to rerun during local development and deployment builds.
        const first = fs.readFileSync(path.join(directory, 'generated/share-pages/junkyard-cabaret.html'), 'utf8');
        build(directory);
        assert.equal(fs.readFileSync(path.join(directory, 'generated/share-pages/junkyard-cabaret.html'), 'utf8'), first);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});
