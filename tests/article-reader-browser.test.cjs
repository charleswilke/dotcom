const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {renderArticle} = require('../lib/article-archive');
const root = path.join(__dirname,'..');
const archive = require('../articles/archive.json');
const related = require('../articles/related.json');
const slug = 'waiting-for-something';
const item = archive[slug];
const csp = require('../vercel.json').headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
async function routeLocal(page, origin = 'https://archive.test') {
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) return route.request().resourceType() === 'image' ? route.continue() : route.abort();
        if (url.pathname === '/api/substack-feed') return route.fulfill({status:503,body:''});
        if (url.pathname.startsWith('/api/')) return route.fulfill({status:204});
        if (url.pathname === `/read/${slug}`) return route.fulfill({body:renderArticle(item,slug,200,related[slug]),contentType:'text/html',headers:{'Content-Security-Policy':csp}});
        const file = path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname==='/writing-archive'?'/writing-archive.html':url.pathname));
        if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({status:404,body:''});
        const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'}[path.extname(file)] || 'application/octet-stream';
        return route.fulfill({path:file,contentType:mime,headers:{'Content-Security-Policy':csp}});
    });
}
test('legacy hash opens an archived essay outside the latest 19, even when the API is offline', async () => {
    const browser = await chromium.launch({headless:true});
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror',error=>errors.push(error.message));
        await routeLocal(page);
        await page.goto(`https://archive.test/#read/${slug}`);
        await page.locator('.article-reader-overlay.is-open').waitFor();
        assert.equal(await page.locator('.article-reader-title').textContent(),item.title);
        assert.ok((await page.locator('.article-reader-body').textContent()).length > 1000);
        assert.equal(new URL(page.url()).pathname,`/read/${slug}`);
        await page.locator('.article-related a').first().waitFor();
        assert.deepEqual(await page.locator('.article-related a').evaluateAll(links => links.map(link => link.getAttribute('href'))), related[slug].map(entry => `/read/${entry.slug}`));
        assert.deepEqual(await page.locator('.article-related-description').allTextContents(), related[slug].map(entry => entry.reason));
        await page.evaluate(()=>closeArticleReader());
        assert.equal(new URL(page.url()).hash,'#l.ai.bor');
        await page.goto('https://archive.test/#read/missing-essay');
        await page.locator('.article-reader-overlay.is-open').waitFor();
        assert.equal(await page.locator('.article-reader-title').textContent(),'Article unavailable');
        assert.equal(await page.locator('.article-reader-body a').getAttribute('href'),'/writing-archive');
        assert.deepEqual(errors,[]);
    } finally {await browser.close();}
});
test('direct article is readable without JavaScript at desktop and phone widths', async () => {
    const browser = await chromium.launch({headless:true});
    try {
        for (const width of [1200,390]) {
            const context = await browser.newContext({javaScriptEnabled:false,viewport:{width,height:900}});
            const page = await context.newPage();
            await routeLocal(page);
            await page.goto(`https://archive.test/read/${slug}`);
            assert.equal(await page.locator('h1').textContent(),item.title);
            assert.ok((await page.locator('.article-body').textContent()).length > 1000);
            assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),`https://charleswilke.com/read/${slug}`);
            assert.equal(await page.locator('.article-related a').count(), 3);
            assert.deepEqual(await page.locator('.article-related-description').allTextContents(), related[slug].map(entry => entry.reason));
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
            await page.screenshot({path:`/tmp/dotcom-article-${width}.png`});
            await page.goto('https://archive.test/writing-archive');
            assert.ok(await page.locator(`a[href="/read/${slug}"]`).count());
            assert.equal(await page.locator('.archive-list .archive-entry').count(),Object.keys(archive).length);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
            await page.evaluate(()=>document.fonts.ready);
            await page.screenshot({path:`/tmp/dotcom-writing-archive-${width}.png`});
            await context.close();
        }
    } finally {await browser.close();}
});

test('illustrated archive filters full article text and shares live dial effects', async () => {
    const browser = await chromium.launch({headless:true});
    try {
        for (const width of [1200,390]) {
            const page = await browser.newPage({viewport:{width,height:1000}});
            const errors = [];
            const searchRequests = [];
            page.on('pageerror',error=>errors.push(error.message));
            page.on('request',request => { if (new URL(request.url()).pathname === '/articles/search.json') searchRequests.push(request.url()); });
            await routeLocal(page);
            await page.goto('https://archive.test/writing-archive');
            await page.locator('#siteNav').waitFor();
            await page.evaluate(()=>document.fonts.ready);
            assert.equal(await page.locator('.archive-list .archive-entry').count(),Object.keys(archive).length);
            const first = await page.locator('.archive-entry').first().boundingBox();
            assert.ok(first.y < 600, `First essay should begin above the fold: ${JSON.stringify(first)}`);
            assert.equal(await page.locator('.archive-entry.feed-item .feed-item-body').count(),Object.keys(archive).length);
            assert.equal(await page.locator('.rss-title-sparks').count(),1);
            if (width === 1200) {
                const rail = page.locator('.rss-title-rail-left');
                const rect = await rail.boundingBox();
                await page.mouse.move(rect.x + rect.width * .7,rect.y + rect.height/2);
                await page.locator('.rss-title-rail-left.is-live').waitFor();
                assert.ok(Number(await rail.evaluate(el=>el.style.getPropertyValue('--hot'))) > 0);
                await page.mouse.move(0,0);
            }
            const searchBox = await page.locator('#archive-search').boundingBox();
            const yearBox = await page.locator('.archive-year-nav').boundingBox();
            if (width === 1200) assert.ok(Math.abs((searchBox.y+searchBox.height/2)-(yearBox.y+yearBox.height/2))<3, 'Search and years share a desktop row');
            else assert.ok(searchBox.y >= yearBox.y+yearBox.height, 'Mobile controls stack');
            await page.locator('.archive-year-nav [data-year="2023"]').click();
            const count2023 = Object.values(archive).filter(item=>new Date(item.pubDate).getUTCFullYear()===2023).length;
            assert.equal(await page.locator('.archive-entry:visible').count(),count2023);
            assert.equal(await page.locator('.archive-year:visible').count(),1);
            assert.equal(searchRequests.length,0,'Browsing and year filtering do not download full essay text');
            await page.locator('#archive-search').fill('zzzz-no-matching-essay');
            await page.waitForFunction(() => document.querySelector('.archive-result-count').getAttribute('aria-busy') === 'false');
            assert.equal(searchRequests.length,1,'The first query loads the full-text index once');
            assert.equal(await page.locator('.archive-entry:visible').count(),0);
            assert.equal(await page.locator('.archive-empty').isVisible(),true);
            await page.locator('#archive-reset').click();
            assert.equal(searchRequests.length,1,'Further queries reuse the index');
            assert.equal(await page.locator('.archive-entry:visible').count(),Object.keys(archive).length);
            await page.locator('#archive-search').fill('Waiting for Something');
            assert.ok(await page.locator(`.archive-entry[href="/read/${slug}"]`).isVisible());
            // These words occur only in the saved body, not its title or description.
            assert.doesNotMatch(item.title + item.description, /GLP-1/i);
            await page.locator('#archive-search').fill('Gripping headlines GLP-1');
            assert.equal(await page.locator('.archive-entry:visible').count(),1);
            assert.equal(await page.locator('.archive-entry:visible').getAttribute('href'),`/read/${slug}`);
            const selectedYear = new Date(item.pubDate).getUTCFullYear();
            const otherYear = selectedYear===2023 ? '2024' : '2023';
            await page.locator(`.archive-year-nav [data-year="${otherYear}"]`).click();
            assert.equal(await page.locator('.archive-entry:visible').count(),0);
            await page.locator('#archive-reset').click();
            if (width === 390) {
                await page.locator('#navHamburger').click();
                assert.equal(await page.locator('#navHamburger').getAttribute('aria-expanded'),'true');
                await page.locator('#navHamburger').click();
            }
            assert.deepEqual(errors,[]);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
            await page.screenshot({path:`/tmp/dotcom-writing-archive-styled-${width}.png`});
            await page.close();
        }
    } finally {await browser.close();}
});

test('a delayed full-text download respects edits and clearing the search', async () => {
    const browser = await chromium.launch({headless:true});
    let release;
    try {
        const page = await browser.newPage();
        await routeLocal(page);
        const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/articles/search.json?*', async route => {
            await gate;
            await route.fulfill({path:path.join(root,'articles/search.json'),contentType:'application/json'});
        });
        await page.goto('https://archive.test/writing-archive');
        await page.locator('#archive-search').fill('Gripping headlines GLP-1');
        assert.equal(await page.locator('.archive-result-count').getAttribute('aria-busy'),'true');
        assert.equal(await page.locator('.archive-empty').isVisible(),false,'Do not announce no matches while body text is still loading');
        await page.locator('#archive-search').fill('What Hope Do We Have');
        await page.locator('.archive-year-nav [data-year="2023"]').click();
        await page.locator('#archive-search').fill('');
        const response = page.waitForResponse(response => new URL(response.url()).pathname === '/articles/search.json');
        release();
        await (await response).finished();
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const count2023 = Object.values(archive).filter(item=>new Date(item.pubDate).getUTCFullYear()===2023).length;
        assert.equal(await page.locator('#archive-search').inputValue(),'');
        assert.equal(await page.locator('.archive-entry:visible').count(),count2023);
        assert.equal(await page.locator('.archive-year-nav [aria-current="true"]').getAttribute('data-year'),'2023');
        await page.locator('.archive-year-nav [data-year="all"]').click();
        await page.locator('#archive-search').fill('Gripping headlines GLP-1');
        await page.waitForFunction(() => document.querySelectorAll('.archive-entry:not([hidden])').length === 1);
        assert.equal(await page.locator('.archive-entry:visible').getAttribute('href'),`/read/${slug}`);
    } finally { release?.(); await browser.close(); }
});

test('failed full-text downloads preserve metadata search and retry on the next query', async () => {
    const browser = await chromium.launch({headless:true});
    try {
        for (const failure of ['http','invalid']) {
            const page = await browser.newPage();
            await routeLocal(page);
            let attempts = 0;
            await page.route('**/articles/search.json?*', route => {
                attempts++;
                if (attempts === 1) return route.fulfill(failure === 'http' ? {status:503,body:''} : {json:{}});
                return route.fulfill({path:path.join(root,'articles/search.json'),contentType:'application/json'});
            });
            await page.goto('https://archive.test/writing-archive');
            await page.locator('#archive-search').fill('Waiting for Something');
            await page.getByText(/Full-text search unavailable/).waitFor();
            assert.ok(await page.locator(`.archive-entry[href="/read/${slug}"]`).isVisible());
            await page.locator('#archive-search').fill('Gripping headlines GLP-1');
            await page.waitForFunction(() => document.querySelector('.archive-result-count').getAttribute('aria-busy') === 'false');
            assert.equal(await page.locator('.archive-entry:visible').count(),1);
            assert.equal(await page.locator('.archive-entry:visible').getAttribute('href'),`/read/${slug}`);
            assert.equal(attempts,2);
            await page.close();
        }
    } finally { await browser.close(); }
});

test('masonry cards stay compact and height-only viewport changes preserve scroll', async () => {
    const browser = await chromium.launch({headless:true});
    try {
        for (const width of [900,390]) {
            const page = await browser.newPage({viewport:{width,height:800}});
            await routeLocal(page);
            await page.goto('https://archive.test/writing-archive');
            await page.evaluate(()=>document.fonts.ready);
            await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
            const card = page.locator('.archive-entry').first();
            const description = await card.locator('p').boundingBox();
            const stamp = await card.locator('.feed-item-meta').boundingBox();
            assert.ok(stamp.y-description.y-description.height < 20, 'Date follows the description without a large empty chin');
            const collisions = await page.locator('.archive-entry').evaluateAll(cards => cards.flatMap(card => {
                const date = card.querySelector('.date').getBoundingClientRect();
                const range = document.createRange();
                range.selectNodeContents(card.querySelector('p'));
                return [...range.getClientRects()].filter(line => line.left < date.right && line.right > date.left && line.top < date.bottom && line.bottom > date.top);
            }).length);
            assert.equal(collisions,0,'Subtitle text wraps clear of the rotated date stamp');
            if (width === 900) {
                const rects = await page.locator('.archive-year').first().locator('.archive-entry').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
                assert.ok(new Set(rects.map(r=>Math.round(r.height))).size>1, 'Cards retain individual content heights');
                for (let i=0;i<rects.length;i++) for (let j=i+1;j<rects.length;j++) {
                    const a=rects[i],b=rects[j];
                    assert.ok(a.x+a.width<=b.x+1 || b.x+b.width<=a.x+1 || a.y+a.height<=b.y+1 || b.y+b.height<=a.y+1, 'Masonry cards do not overlap');
                }
            }
            await page.locator('.archive-entry').nth(12).evaluate(el=>el.scrollIntoView({block:'start'}));
            await page.locator('#navLogo.visible').waitFor({state:'attached'});
            assert.equal(await page.locator('#navLogo img').getAttribute('src'),'/images/cw-nav-monogram-v7.svg');
            assert.equal(await page.locator('#navLogo').getAttribute('aria-hidden'),'false');
            const before = await page.evaluate(()=>({scroll:window.scrollY, height:document.documentElement.scrollHeight}));
            const anchor = await page.locator('.archive-entry').nth(12).boundingBox();
            for (const height of [650,900,750,800]) {
                await page.setViewportSize({width,height});
                await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
                const after = await page.evaluate(()=>({scroll:window.scrollY,height:document.documentElement.scrollHeight}));
                const next = await page.locator('.archive-entry').nth(12).boundingBox();
                assert.ok(Math.abs(after.scroll-before.scroll)<2, 'Browser chrome height change preserves scroll position');
                assert.ok(Math.abs(next.y-anchor.y)<2, 'The same card stays at the same screen position');
                assert.equal(after.height,before.height,'Height-only changes do not repack cards');
            }
            await page.close();
        }
    } finally {await browser.close();}
});

test('homepage date stamps tuck beside subtitles without text collisions', async () => {
    const browser = await chromium.launch({headless:true});
    try {
        for (const width of [1200,900,390]) {
            const page = await browser.newPage({viewport:{width,height:900}});
            await routeLocal(page, 'http://localhost:8080');
            await page.goto('http://localhost:8080/#l.ai.bor');
            await page.locator('#feed-content .feed-item .feed-item-meta').first().waitFor();
            await page.evaluate(()=>document.fonts.ready);
            const results = await page.locator('#feed-content .feed-item').evaluateAll(cards => cards.map(card => {
                const stamp=card.querySelector('.date').getBoundingClientRect();
                const p=card.querySelector('.feed-item-body p');
                const range=document.createRange(); range.selectNodeContents(p);
                const collisions=[...range.getClientRects()].filter(line=>line.left<stamp.right && line.right>stamp.left && line.top<stamp.bottom && line.bottom>stamp.top).length;
                const box=p.getBoundingClientRect();
                return {collisions,delta:stamp.top-box.top};
            }));
            assert.ok(results.length>0);
            assert.ok(results.every(result=>result.collisions===0),`Every subtitle wraps clear of its date stamp at ${width}px: ${JSON.stringify(results.filter(result=>result.collisions))}`);
            assert.ok(results.every(result=>Math.abs(result.delta)<12),'Stamps tuck alongside the subtitle');
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
            await page.locator('#feed-content').scrollIntoViewIfNeeded();
            await page.screenshot({path:`/tmp/dotcom-home-stamps-${width}.png`});
            await page.close();
        }
    } finally {await browser.close();}
});

test('archived video uses its saved poster and the shared responsive player styling', async () => {
    const browser = await chromium.launch({headless:true});
    try {
        for (const width of [1200,390]) {
            const page = await browser.newPage({viewport:{width,height:900}});
            await routeLocal(page);
            await page.goto(`https://archive.test/read/${slug}`);
            const video = page.locator('video.article-reader-video');
            await video.waitFor();
            assert.match(await video.getAttribute('poster'), /^https:\/\//);
            assert.equal(await video.getAttribute('preload'),'metadata');
            const box = await video.boundingBox();
            const body = await page.locator('.article-body').boundingBox();
            assert.ok(box.width>250 && box.width<=600);
            assert.ok(box.x>=body.x && box.x+box.width<=body.x+body.width+1);
            await page.close();
        }
    } finally { await browser.close(); }
});

test('archive recap controls play, pause, seek and yield to video; reader thumb drags the document', async () => {
    const browser = await chromium.launch({headless:true});
    const wav = Buffer.alloc(44 + 8000 * 2 * 30);
    wav.write('RIFF',0); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8);
    wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(1,22);
    wav.writeUInt32LE(8000,24); wav.writeUInt32LE(16000,28); wav.writeUInt16LE(2,32); wav.writeUInt16LE(16,34);
    wav.write('data',36); wav.writeUInt32LE(wav.length-44,40);
    try {
        for (const width of [1200,390]) {
            const page = await browser.newPage({viewport:{width,height:900}});
            await routeLocal(page);
            await page.route('**/api/v1/audio/upload/*/src', route => {
                const range = route.request().headers().range;
                const start = range ? Number(range.match(/bytes=(\d+)/)?.[1] || 0) : 0;
                return route.fulfill({
                    status: range ? 206 : 200, body: wav.subarray(start), contentType: 'audio/wav',
                    headers: {'accept-ranges':'bytes', ...(range ? {'content-range':`bytes ${start}-${wav.length-1}/${wav.length}`} : {})}
                });
            });
            await page.goto(`https://archive.test/read/${slug}`);
            await page.waitForFunction(()=>document.querySelector('.scope-audio')?.duration>0);
            assert.equal(await page.locator('.scope-label').textContent(),'Recap');
            assert.equal(await page.locator('.scope-time-total').textContent(),'0:30');
            assert.equal(await page.locator('.tuner-thumb').count(),0);
            const play = page.locator('.scope-play');
            await play.click();
            await page.waitForFunction(()=>document.querySelector('.scope-player').classList.contains('is-playing'));
            assert.equal(await play.getAttribute('aria-label'),'Pause');
            await play.click();
            await page.waitForFunction(()=>!document.querySelector('.scope-player').classList.contains('is-playing'));
            assert.equal(await play.getAttribute('aria-label'),'Play');
            await page.locator('.scope-scrub').fill('12');
            assert.ok(Math.abs(await page.locator('.scope-audio').evaluate(a=>a.currentTime)-12)<1);
            assert.equal(await page.locator('.scope-scrub').evaluate(e=>e.style.getPropertyValue('--scope-progress')),'40%');
            await play.click();
            await page.waitForFunction(()=>document.querySelector('.scope-player').classList.contains('is-playing'));
            await page.locator('video').evaluate(v=>v.dispatchEvent(new Event('play')));
            assert.equal(await page.locator('.scope-audio').evaluate(a=>a.paused),true);
            await page.evaluate(() => {
                const hero = document.querySelector('.article-reader-body > .captioned-image-container:first-child');
                window.scrollTo({top:(hero || document.querySelector('.article-reader-header')).getBoundingClientRect().bottom + scrollY,behavior:'instant'});
            });
            if (width < 600) {
                assert.equal(await page.locator('.article-page-scrollbar').isVisible(),false);
                assert.ok(await page.evaluate(()=>window.scrollY>0));
                await page.close();
                continue;
            }
            await page.waitForFunction(()=>parseFloat(document.querySelector('.article-page-scrollbar .article-reader-thumb').style.top)>0);
            const thumb = page.locator('.article-page-scrollbar .article-reader-thumb');
            const beforeDrag = await page.evaluate(()=>window.scrollY);
            const box = await thumb.boundingBox();
            await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
            await page.mouse.down();
            await page.mouse.move(box.x+box.width/2,box.y+box.height/2+120,{steps:8});
            await page.mouse.up();
            assert.ok(await page.evaluate(()=>window.scrollY)>beforeDrag+500);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
            await page.close();
        }
    } finally { await browser.close(); }
});
