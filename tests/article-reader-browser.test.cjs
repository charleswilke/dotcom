const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {renderArticle} = require('../lib/article-archive');
const root = path.join(__dirname,'..');
const archive = require('../articles/archive.json');
const slug = 'waiting-for-something';
const item = archive[slug];
const csp = require('../vercel.json').headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
async function routeLocal(page) {
    await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== 'https://archive.test') return route.request().resourceType() === 'image' ? route.continue() : route.abort();
        if (url.pathname === '/api/substack-feed') return route.fulfill({status:503,body:''});
        if (url.pathname.startsWith('/api/')) return route.fulfill({status:204});
        if (url.pathname === `/read/${slug}`) return route.fulfill({body:renderArticle(item,slug),contentType:'text/html',headers:{'Content-Security-Policy':csp}});
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

test('compact archive filters essays by search and year with results above the fold', async () => {
    const browser = await chromium.launch({headless:true});
    try {
        for (const width of [1200,390]) {
            const page = await browser.newPage({viewport:{width,height:1000}});
            const errors = [];
            page.on('pageerror',error=>errors.push(error.message));
            await routeLocal(page);
            await page.goto('https://archive.test/writing-archive');
            await page.locator('#siteNav').waitFor();
            await page.evaluate(()=>document.fonts.ready);
            assert.equal(await page.locator('.archive-list .archive-entry').count(),Object.keys(archive).length);
            const first = await page.locator('.archive-entry').first().boundingBox();
            assert.ok(first.y + first.height < 800, `First essay should be visible above the fold: ${JSON.stringify(first)}`);
            await page.locator('.archive-year-nav [data-year="2023"]').click();
            const count2023 = Object.values(archive).filter(item=>new Date(item.pubDate).getUTCFullYear()===2023).length;
            assert.equal(await page.locator('.archive-entry:visible').count(),count2023);
            assert.equal(await page.locator('.archive-year:visible').count(),1);
            await page.locator('#archive-search').fill('zzzz-no-matching-essay');
            assert.equal(await page.locator('.archive-entry:visible').count(),0);
            assert.equal(await page.locator('.archive-empty').isVisible(),true);
            await page.locator('#archive-reset').click();
            assert.equal(await page.locator('.archive-entry:visible').count(),Object.keys(archive).length);
            await page.locator('#archive-search').fill('Waiting for Something');
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
