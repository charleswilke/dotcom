const {test,before,after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {renderArticle} = require('../lib/article-archive');
const root = path.resolve(__dirname,'..');
let browser;
before(async()=>{browser=await chromium.launch({headless:true});});
after(async()=>{await browser?.close();});

async function localPage(width=1200) {
    const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
    const requests=[];
    await page.route('**/*',async route=>{
        const url=new URL(route.request().url());
        if(url.origin!=='https://optimization.test') return route.abort();
        requests.push(url.pathname);
        if(url.pathname.startsWith('/api/')) return route.fulfill({status:503,body:''});
        if(route.request().resourceType()==='media') return route.abort();
        if(url.pathname.startsWith('/read/')) {
            const slug=url.pathname.split('/').pop();
            const item=require('../articles/local.json')[slug]||require('../articles/archive.json')[slug];
            return route.fulfill({body:renderArticle(item,slug),contentType:'text/html'});
        }
        const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
        if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) return route.fulfill({status:404,body:''});
        const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
        return route.fulfill({path:file,contentType:types[path.extname(file)]||'application/octet-stream'});
    });
    return {page,requests};
}

test('reader subset preserves computed styles, including mobile menus and transcript/audio content', async()=>{
    const properties=['display','position','color','background','font-family','font-size','font-weight','font-style','line-height','letter-spacing','width','height','margin','padding','border','box-shadow','text-shadow','overflow','transform'];
    for(const width of [390,1200]) for(const slug of ['the-social-siege-of-atomization','surviving-salem-transcript']) {
        const {page}=await localPage(width);
        try {
            await page.goto(`https://optimization.test/read/${slug}`);
            await page.evaluate(()=>document.fonts.ready);
            await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
            if(width<800) await page.locator('#navHamburger').click();
            await page.locator('#navExploreBtn').click();
            const snapshot=()=>page.evaluate(properties=>[document.body,...document.body.querySelectorAll('*')].flatMap(element=>
                [null,'::before','::after'].map(pseudo=>{
                    const style=getComputedStyle(element,pseudo);
                    return properties.map(property=>style.getPropertyValue(property));
                })),properties);
            const subset=await snapshot();
            await page.evaluate(()=>new Promise((resolve,reject)=>{
                const link=document.querySelector('link[href^="/reader-base.css"]');
                link.onload=resolve;link.onerror=reject;link.href='/styles.css';
            }));
            await page.evaluate(()=>document.fonts.ready);
            assert.deepEqual(await snapshot(),subset,`${slug} at ${width}px must retain the full stylesheet's appearance`);
        } finally {await page.close();}
    }
});

test('lobby avoids unopened-room downloads, then prepares the selected room and its dice', async()=>{
    const {page,requests}=await localPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    try {
        await page.goto('https://optimization.test/before-times.html');
        await page.waitForTimeout(500);
        const backdrop='/images/before-times/absurd-alchemy-clean-v4-no-pen.webp';
        const dice='/images/before-times/layers/alchemy-ivory-dice-v1.webp';
        assert.ok(!requests.includes(backdrop));assert.ok(!requests.includes(dice));
        await page.locator('[data-panel="alchemy"]').focus();
        await page.waitForFunction(()=>document.querySelector('.bt-alchemy-art').complete && document.querySelector('.bt-alchemy-art').naturalWidth>0);
        await page.locator('[data-panel="alchemy"]').click();
        await page.waitForFunction(()=>document.body.classList.contains('bt-room-alchemy'));
        await page.waitForFunction(()=>document.querySelector('#bt-alchemy-dice image').hasAttribute('href'));
        assert.ok(requests.includes(backdrop));assert.ok(requests.includes(dice));
        assert.equal(await page.locator('#bt-alchemy-dice [data-room-src]').count(),0);
        assert.ok(!requests.includes('/images/before-times/content-factory-room-v1.webp'));
        assert.deepEqual(errors,[]);
    } finally {await page.close();}
});

test('lossless dice conversion preserves decoded pixels and the Back artwork is requested only when visible', async()=>{
    const {page,requests}=await localPage();
    try {
        await page.goto('https://optimization.test/');
        assert.ok(!requests.includes('/images/textures/gwor-back-sharpie-small-v1.webp'));
        const identical=await page.evaluate(async()=>{
            const pixels=async src=>{
                const image=new Image();image.src=src;await image.decode();
                const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
                const context=canvas.getContext('2d');context.fillStyle='#17121c';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0);
                return context.getImageData(0,0,canvas.width,canvas.height).data;
            };
            const [a,b]=await Promise.all(['png','webp'].map(ext=>pixels(`/images/before-times/layers/alchemy-ivory-dice-v1.${ext}`)));
            let max=0, changed=0, alphaChanged=0;
            for(let i=0;i<a.length;i++){const delta=Math.abs(a[i]-b[i]);if(delta){max=Math.max(max,delta);changed++;if(i%4===3)alphaChanged++;}}
            return {lengths:[a.length,b.length],max,changed,alphaChanged};
        });
        assert.deepEqual(identical.lengths,[6290064,6290064]);
        // Browser image decoders round premultiplied alpha differently. Compare
        // the displayed pixels rather than unpremultiplying near-transparent RGB.
        assert.ok(identical.max<=1,JSON.stringify(identical));
        assert.equal(identical.alphaChanged,0);
        await page.locator('#gworTile').click();
        await page.locator('#gworTrackList .track-songbook-button').first().click();
        const back=page.locator('#gworSongbookBack img');
        await back.waitFor({state:'visible'});
        await page.waitForFunction(()=>document.querySelector('#gworSongbookBack img').naturalWidth===140);
        assert.ok(requests.includes('/images/textures/gwor-back-sharpie-small-v1.webp'));
    } finally {await page.close();}
});

test('direct room links prepare their art on desktop and phones with reduced motion', async()=>{
    for(const width of [390,1200]) for(const [hash,room] of [['screening-room','alchemy'],['game-development','games'],['content-factory','content'],['knowledge-maze','knowledge']]) {
        const {page}=await localPage(width);
        const errors=[];page.on('pageerror',error=>errors.push(error.message));
        try {
            await page.goto(`https://optimization.test/before-times.html#${hash}`);
            await page.waitForFunction(room=>document.body.classList.contains(`bt-room-${room}`),room);
            if(room==='alchemy') assert.equal(await page.locator('#bt-alchemy-dice [data-room-src]').count(),0);
            assert.deepEqual(errors,[]);
        } finally {await page.close();}
    }
});
