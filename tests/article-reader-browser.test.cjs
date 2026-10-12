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
        if (url.origin !== 'https://archive.test') return route.abort();
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
            await context.close();
        }
    } finally {await browser.close();}
});
