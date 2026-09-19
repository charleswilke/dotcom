const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { chromium } = require('playwright');
const tracks = require('../lib/play-catalog.json');
function response() {
    return { code: 200, headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(n) { this.code=n; return this; }, end() {}, json(data) { this.data=data; return this; } };
}

test('play endpoint rejects unknown tracks and cross-site writes before storage', async () => {
    process.env.plays_KV_REST_API_URL = 'https://storage.invalid';
    process.env.plays_KV_REST_API_TOKEN = 'test-only';
    delete process.env.VERCEL;
    const original = global.fetch;
    global.fetch = async () => { throw new Error('Storage must not be called'); };
    try {
        const handler = require('../api/play');
        for (const [headers, body, expected] of [ [{}, {album:'invented', slug:'track'},400], [{'sec-fetch-site':'cross-site'}, {},403] ]) {
            const res = response();
            await handler({method:'POST', headers, body}, res);
            assert.equal(res.code, expected);
        }
    } finally { global.fetch=original; }
});

test('play endpoint handles atomic write, duplicate, throttle and storage errors', async () => {
    const original = global.fetch;
    const [album,slug] = tracks[0].split('/');
    try {
        for (const [result, expected] of [[1,204],[0,204],[-1,429],[null,502]]) {
            global.fetch = async (_, options) => {
                const command=JSON.parse(options.body);
                assert.equal(command[0], 'EVAL');
                assert.equal(command[2], '5');
                assert.equal(command.length, 8);
                assert.ok(!options.body.includes('192.0.2.1'));
                return {ok:true,json:async()=>({result})};
            };
            const res=response();
            await require('../api/play')({method:'POST',headers:{},socket:{remoteAddress:'192.0.2.1'},body:{album,slug}},res);
            assert.equal(res.code,expected);
            if(expected===429) assert.equal(res.headers['Retry-After'],'60');
        }
    } finally {global.fetch=original;}
});

test('report accepts header authentication and rejects legacy URL credentials', async () => {
    process.env.PLAYS_REPORT_TOKEN='test-report-token';
    const handler=require('../api/plays-report');
    const original=global.fetch;
    try {
        global.fetch=async()=>({ok:true,json:async()=>({result:['0',[]]})});
        for (const [headers, expected] of [[{},404],[{authorization:'Bearer wrong'},404],[{authorization:'Bearer test-report-token'},200]]) {
            const res=response();
            await handler({method:'GET',headers,query:{token:'test-report-token'}},res);
            assert.equal(res.code,expected);
            assert.equal(res.headers['Cache-Control'],'no-store');
        }
    } finally {global.fetch=original;}
});

test('leaderboard throttles before DB writes, limits body size and fails closed', async () => {
    const src=fs.readFileSync(path.join(__dirname,'../games/TootsJam/cloudflare-api/src/index.js'),'utf8');
    const worker=(await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))).default;
    let writes=0;
    const DB={prepare(){return {bind(){return {run:async()=>{writes++;}};}};}};
    const request=(body=JSON.stringify({initials:'TST',score:42}))=>new Request('https://test.invalid/api/scores',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body});
    assert.equal((await worker.fetch(request(),{DB})).status,503);
    const blocked={DB,SCORE_LIMITER:{limit:async()=>({success:false})}};
    assert.equal((await worker.fetch(request(),blocked)).status,429);
    assert.equal(writes,0);
    const allowed={DB,SCORE_LIMITER:{limit:async()=>({success:true})}};
    assert.equal((await worker.fetch(request(' '.repeat(2049)),allowed)).status,413);
    assert.equal((await worker.fetch(request(JSON.stringify({initials:'TST',score:-1})),allowed)).status,400);
    assert.equal(writes,0);
    assert.equal((await worker.fetch(request(),allowed)).status,201);
    assert.equal(writes,2);
});

test('local leaderboard cannot read a sibling directory with the same prefix', () => {
    const src=fs.readFileSync(path.join(__dirname,'../games/TootsJam/server.js'),'utf8');
    const fn=src.slice(src.indexOf('function safeFilePath('),src.indexOf('\nasync function serveStatic'));
    const safe=vm.runInNewContext(fn+'; safeFilePath',{path,rootDir:'/games/TootsJam'});
    assert.equal(safe('/..%2fTootsJam-private%2fsecret'),null);
    assert.equal(safe('/game.js'),'/games/TootsJam/game.js');
});

test('article sanitizer blocks executable markup while preserving article and native media content', async () => {
    const browser=await chromium.launch({headless:true});
    try {
        const page=await browser.newPage();
        await page.route('**/*', route=>route.abort());
        await page.addScriptTag({path:path.join(__dirname,'../vendor/dompurify.min.js')});
        const src=fs.readFileSync(path.join(__dirname,'../main.js'),'utf8');
        const fn=src.slice(src.indexOf('function sanitizeArticleHtml('),src.indexOf('\nfunction ensureReaderOverlay('));
        await page.addScriptTag({content:fn});
        const result=await page.evaluate(async()=>{
            const dirty='<iframe srcdoc="<script>parent.__probe=true</script>"></iframe><svg onload="window.__probe=true"></svg><img src="bad" onerror="window.__probe=true"><a href="javascript:window.__probe=true">bad link</a><form id="article-reader-body"><input name="innerHTML"></form><style>body{display:none}</style><p>Hello <strong>reader</strong></p><div class="native-audio-embed" data-attrs="{&quot;mediaUploadId&quot;:&quot;123&quot;}"></div>';
            const root=document.createElement('div'); document.body.append(root); root.innerHTML=sanitizeArticleHtml(dirty);
            await new Promise(resolve=>setTimeout(resolve,50));
            return {executed:!!window.__probe,unsafe:!!root.querySelector('iframe,script,svg,form,input,style,[onerror],[srcdoc],a[href^="javascript:"]'),text:document.querySelector('p').textContent,media:document.querySelector('.native-audio-embed').getAttribute('data-attrs')};
        });
        assert.equal(result.executed,false);
        assert.equal(result.unsafe,false);
        assert.equal(result.text,'Hello reader');
        assert.equal(JSON.parse(result.media).mediaUploadId,'123');
        assert.equal(await page.evaluate(()=>{window.DOMPurify=undefined;document.body.innerHTML=sanitizeArticleHtml('<img onerror="alert(1)">');return document.body.querySelector('img')===null;}),true);
    } finally {await browser.close();}
});

test('homepage and article reader work with the enforced deployment CSP', async () => {
    const browser=await chromium.launch({headless:true});
    const root=path.join(__dirname,'..');
    const csp=require('../vercel.json').headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
    const article={title:'Security regression article',link:'https://charleswilke.substack.com/p/security-test',pubDate:'2026-09-01T12:00:00Z',description:'A safe article.',content:'<p>A safe article with <strong>formatting</strong>.</p><div class="native-audio-embed" data-attrs="{&quot;mediaUploadId&quot;:&quot;test&quot;}"></div>'};
    try {
        const page=await browser.newPage();
        const errors=[];
        page.on('pageerror', e=>errors.push(e.message));
        await page.addInitScript(()=>{window.cspViolations=[];document.addEventListener('securitypolicyviolation',e=>window.cspViolations.push(e.effectiveDirective+': '+e.blockedURI));});
        await page.route('**/*', async route=>{
            const url=new URL(route.request().url());
            if(url.origin!=='https://security.test') return route.abort();
            if(url.pathname==='/api/substack-feed') return route.fulfill({json:{status:'ok',items:[article],item:article}});
            if(url.pathname.startsWith('/api/')) return route.fulfill({status:204});
            if(route.request().resourceType()==='media') return route.abort();
            const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
            if(!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({status:404,body:''});
            const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'}[path.extname(file)] || 'application/octet-stream';
            await route.fulfill({path:file,contentType:mime,headers:{'Content-Security-Policy':csp}});
        });
        await page.goto('https://security.test/',{waitUntil:'load'});
        await page.waitForFunction(()=>typeof window.openArticleReader==='function' && window.DOMPurify?.isSupported);
        await page.evaluate(item=>openArticleReader(item,{syncUrl:false}),article);
        await page.locator('.article-reader-overlay.is-open').waitFor({state:'visible'});
        assert.equal(await page.locator('.article-reader-body strong').textContent(),'formatting');
        assert.equal(await page.locator('.article-reader-body audio').count(),1);
        assert.deepEqual(errors,[]);
        assert.deepEqual(await page.evaluate(()=>window.cspViolations),[]);
        await page.evaluate(()=>closeArticleReader());
    } finally {await browser.close();}
});
