#!/usr/bin/env node

/**
 * Record the real present-day homepage's ambient motion for the Knowledge Maze
 * breach. The viewport remains locked at the top of the page.
 *
 * Prerequisites:
 *   python3 -m http.server 8080
 *   ffmpeg and cwebp on PATH
 */

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUTPUT_DIR = join(ROOT, 'images', 'before-times', 'knowledge-maze');
const PAGE_URL = 'http://localhost:8080/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const WIDTH = 390;
const HEIGHT = 844;
const FPS = 16;
const DURATION_SECONDS = 6;
const FRAME_COUNT = FPS * DURATION_SECONDS;

class CdpConnection {
    constructor(webSocketUrl) {
        this.socket = new WebSocket(webSocketUrl);
        this.nextId = 0;
        this.pending = new Map();
        this.ready = new Promise((resolveReady, rejectReady) => {
            this.socket.addEventListener('open', resolveReady, { once: true });
            this.socket.addEventListener('error', rejectReady, { once: true });
        });
        this.socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            if (!message.id || !this.pending.has(message.id)) return;
            const { resolvePending, rejectPending } = this.pending.get(message.id);
            this.pending.delete(message.id);
            if (message.error) rejectPending(new Error(message.error.message));
            else resolvePending(message.result);
        });
    }

    async send(method, params = {}) {
        await this.ready;
        const id = ++this.nextId;
        this.socket.send(JSON.stringify({ id, method, params }));
        return new Promise((resolvePending, rejectPending) => {
            this.pending.set(id, { resolvePending, rejectPending });
        });
    }

    close() {
        this.socket.close();
    }
}

function waitForDebugger(chrome) {
    return new Promise((resolveDebugger, rejectDebugger) => {
        let output = '';
        const timeout = setTimeout(() => rejectDebugger(new Error('Chrome debugging endpoint timed out.')), 10000);
        chrome.stderr.setEncoding('utf8');
        chrome.stderr.on('data', (chunk) => {
            output += chunk;
            const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
            if (!match) return;
            clearTimeout(timeout);
            resolveDebugger(match[1]);
        });
        chrome.once('exit', (code) => {
            clearTimeout(timeout);
            rejectDebugger(new Error(`Chrome exited before capture with code ${code}.`));
        });
    });
}

function wait(milliseconds) {
    return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

async function main() {
    const response = await fetch(PAGE_URL);
    if (!response.ok) throw new Error(`Expected ${PAGE_URL} to return 200, received ${response.status}.`);

    mkdirSync(OUTPUT_DIR, { recursive: true });
    const temporary = mkdtempSync(join(tmpdir(), 'knowledge-maze-present-'));
    const profile = join(temporary, 'chrome-profile');
    const frames = join(temporary, 'frames');
    mkdirSync(frames);

    const chrome = spawn(CHROME, [
        '--headless=new',
        '--remote-debugging-port=0',
        `--user-data-dir=${profile}`,
        '--no-first-run',
        '--disable-background-networking',
        '--hide-scrollbars',
        'about:blank'
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    let page;
    try {
        const debuggerUrl = await waitForDebugger(chrome);
        const port = new URL(debuggerUrl).port;
        const targetResponse = await fetch(
            `http://127.0.0.1:${port}/json/new?${encodeURIComponent(PAGE_URL)}`,
            { method: 'PUT' }
        );
        const target = await targetResponse.json();
        page = new CdpConnection(target.webSocketDebuggerUrl);
        await page.send('Page.enable');
        await page.send('Runtime.enable');
        await page.send('Emulation.setDeviceMetricsOverride', {
            width: WIDTH,
            height: HEIGHT,
            deviceScaleFactor: 1,
            mobile: true,
            screenWidth: WIDTH,
            screenHeight: HEIGHT
        });
        await page.send('Page.navigate', { url: PAGE_URL });
        await wait(1800);
        await page.send('Runtime.evaluate', {
            expression: `document.fonts.ready.then(() => { scrollTo(0, 0); return true; })`,
            awaitPromise: true,
            returnByValue: true
        });
        await wait(350);

        const poster = await page.send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: false
        });
        const posterPng = join(temporary, 'poster.png');
        writeFileSync(posterPng, Buffer.from(poster.data, 'base64'));

        for (let index = 0; index < FRAME_COUNT; index += 1) {
            const frameStarted = Date.now();
            const frame = await page.send('Page.captureScreenshot', {
                format: 'jpeg',
                quality: 90,
                captureBeyondViewport: false
            });
            const frameName = `frame-${String(index).padStart(4, '0')}.jpg`;
            writeFileSync(join(frames, frameName), Buffer.from(frame.data, 'base64'));
            const remaining = Math.max(0, Math.round(1000 / FPS) - (Date.now() - frameStarted));
            if (remaining) await wait(remaining);
        }

        const mp4 = join(OUTPUT_DIR, 'present-site-peek-v1.mp4');
        const encode = spawnSync('ffmpeg', [
            '-y',
            '-loglevel', 'error',
            '-framerate', String(FPS),
            '-i', join(frames, 'frame-%04d.jpg'),
            '-c:v', 'libx264',
            '-preset', 'slow',
            '-crf', '24',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            mp4
        ], { stdio: 'inherit' });
        if (encode.status !== 0) throw new Error('ffmpeg failed to encode the homepage recording.');

        const posterWebp = join(OUTPUT_DIR, 'present-site-peek-poster-v1.webp');
        const posterEncode = spawnSync('cwebp', [
            '-quiet',
            '-q', '88',
            posterPng,
            '-o', posterWebp
        ], { stdio: 'inherit' });
        if (posterEncode.status !== 0) throw new Error('cwebp failed to encode the homepage poster.');

        const bytes = readFileSync(mp4).byteLength;
        console.log(`Captured ${FRAME_COUNT} frames to ${mp4} (${Math.round(bytes / 1024)} KB).`);
        console.log(`Poster saved to ${posterWebp}.`);
    } finally {
        if (page) page.close();
        if (chrome.exitCode === null) {
            const chromeExited = new Promise((resolveExit) => chrome.once('exit', resolveExit));
            chrome.kill('SIGTERM');
            await Promise.race([chromeExited, wait(1600)]);
        }
        rmSync(temporary, { recursive: true, force: true });
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
