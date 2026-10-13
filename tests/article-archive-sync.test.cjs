const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {main, request, validateFeed} = require('../tools/sync-article-archive');
const feed = '<rss><channel><item><title>New essay</title><link>https://charleswilke.substack.com/p/new-essay</link><description>New</description><content:encoded><![CDATA[<p>New body</p>]]></content:encoded></item></channel></rss>';
function fixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dotcom-sync-'));
    fs.mkdirSync(path.join(root, 'articles'));
    const old = {slug:'old-essay',title:'Old essay',content:'<p>Retain me</p>'};
    fs.writeFileSync(path.join(root,'articles/archive.json'), JSON.stringify({'old-essay':old}));
    fs.writeFileSync(path.join(root,'cache_substack_feed.json'), JSON.stringify({status:'ok', items:[old]}));
    const read = () => ['articles/archive.json','cache_substack_feed.json'].map(file => fs.readFileSync(path.join(root,file),'utf8'));
    return {root, old, read, before:read(), cleanup:() => fs.rmSync(root,{recursive:true,force:true})};
}
function mockResponse(status, after = null, value = feed) {
    return {ok:status === 200, status, headers:{get:() => after}, text:async () => value, json:async () => value};
}
for (const status of [401,403,404]) test(`HTTP ${status} stops after one request with bounded diagnostics`, async () => {
    let calls = 0;
    await assert.rejects(request('https://charleswilke.substack.com/feed?token=secret', false, {
        sleep:async()=>{}, fetchImpl:async()=>{calls++; return mockResponse(status);}
    }), error => {
        assert.match(error.message, new RegExp(`RSS feed: HTTP ${status}`));
        assert.doesNotMatch(error.message, /token|secret|https:/);
        assert.ok(error.message.length < 300);
        return true;
    });
    assert.equal(calls, 1);
});
test('transient HTTP failures retry with backoff; no sleep after exhausted final attempt', async () => {
    const sleeps = [];
    let calls = 0;
    assert.equal(await request('https://charleswilke.substack.com/feed', false, {
        sleep:async ms=>sleeps.push(ms), fetchImpl:async()=>mockResponse(++calls < 3 ? 503 : 200)
    }), feed);
    assert.equal(calls, 3);
    assert.deepEqual(sleeps, [1200,2000,1200,4000,1200]);
    calls = 0; sleeps.length = 0;
    await assert.rejects(request('https://charleswilke.substack.com/feed', false, {
        sleep:async ms=>sleeps.push(ms), fetchImpl:async()=>{calls++; return mockResponse(500);}
    }), /attempt 3\/3/);
    assert.equal(calls, 3);
    assert.deepEqual(sleeps, [1200,2000,1200,4000,1200]);
});
test('network and timeout failures retry without leaking arbitrary error text', async () => {
    let calls = 0;
    const options = {sleep:async()=>{}, fetchImpl:async()=>{calls++; throw new Error('secret\n<body>');}};
    await assert.rejects(request('https://charleswilke.substack.com/feed', false, options), /network\/timeout failure after 3 attempts$/);
    assert.equal(calls, 3);
});
test('Retry-After seconds and HTTP dates are honored; excessive waits defer without retry', async () => {
    const now = Date.parse('2026-10-12T11:23:00Z');
    for (const [value, expected] of [['5',5000],['Mon, 12 Oct 2026 11:23:12 GMT',12000],['invalid',15000],['0',0]]) {
        let calls = 0;
        const sleeps = [];
        await request('https://charleswilke.substack.com/feed', false, {
            now:()=>now, sleep:async ms=>sleeps.push(ms), fetchImpl:async()=>mockResponse(++calls === 1 ? 429 : 200, value)
        });
        assert.deepEqual(sleeps, [1200,expected,1200]);
    }
    let calls = 0;
    await assert.rejects(request('https://charleswilke.substack.com/feed', false, {
        sleep:async()=>{}, fetchImpl:async()=>{calls++; return mockResponse(503,'120');}
    }), /deferred/);
    assert.equal(calls, 1);
});
for (const [name, xml] of [
    ['empty', '<rss><channel></channel></rss>'],
    ['HTML denial', '<html><body>Denied</body></html>'],
    ['truncated', feed.replace('</rss>','')],
    ['mismatched', feed.replace('</channel>', '</broken>')],
    ['malformed attribute', feed.replace('<rss>', '<rss broken=>')],
    ['malformed entity', feed.replace('New essay', 'New &broken; essay')],
    ['item outside channel', feed.replace('<channel>', '').replace('</channel>', '')],
    ['invalid later article', feed.replace('</channel>', '<item><title>Damaged</title></item></channel>')],
    ['oversized', '<rss><channel>' + feed.match(/<item>[\s\S]*<\/item>/)[0].repeat(201) + '</channel></rss>']
]) test(`${name} input leaves archive and fallback byte-for-byte unchanged`, async () => {
    const f = fixture();
    try {
        const logs = [];
        await assert.rejects(main({root:f.root,args:[], requestImpl:async()=>xml, log:line=>logs.push(line)}), /RSS refresh failed/);
        assert.deepEqual(f.read(), f.before);
        assert.deepEqual(logs, []);
    } finally {f.cleanup();}
});
test('live rejection retains both files and never reports cached data as fresh', async () => {
    const f = fixture();
    try {
        const logs = [];
        await assert.rejects(main({root:f.root,args:[],requestImpl:async()=>request('https://charleswilke.substack.com/feed', false, {
            sleep:async()=>{},fetchImpl:async()=>mockResponse(403)
        }),log:line=>logs.push(line)}), /existing files retained, no new freshness claimed: RSS feed: HTTP 403/);
        assert.deepEqual(f.read(), f.before);
        assert.deepEqual(logs, []);
    } finally {f.cleanup();}
});
test('valid RSS refresh persists before optional backfill rejection', async () => {
    const f = fixture();
    try {
        const calls = [], logs = [];
        await assert.rejects(main({root:f.root,args:['--backfill'],enrich:async()=>{},log:line=>logs.push(line),requestImpl:async url=>{
            calls.push(url);
            if (url.endsWith('/feed')) return feed;
            // Verify fallback is already committed when historical work starts.
            assert.equal(JSON.parse(f.read()[1]).items[0].title,'New essay');
            throw new Error('Historical archive: HTTP 403 (attempt 1/3)');
        }}), /Historical backfill failed; valid RSS refresh remains saved/);
        const [archive,cache] = f.read().map(JSON.parse);
        assert.deepEqual(archive['old-essay'], f.old);
        assert.equal(archive['new-essay'].content,'<p>New body</p>');
        assert.equal(cache.source,'live-rss');
        assert.ok(Number.isFinite(Date.parse(cache.importedAt)));
        assert.equal(calls.length,2);
        assert.match(logs[0],/^Live RSS refreshed/);
        assert.ok(!logs.includes('Historical backfill completed.'));
    } finally {f.cleanup();}
});
test('regular refresh only requests RSS; offline import performs no upstream work', async () => {
    for (const offline of [false,true]) {
        const f = fixture();
        try {
            const file = path.join(f.root,'feed.xml');
            fs.writeFileSync(file,feed);
            let calls = 0;
            await main({root:f.root,args:offline ? ['--feed-file',file] : [],log:()=>{},
                requestImpl:async url=>{calls++; assert.ok(url.endsWith('/feed')); return feed;},
                enrich:async()=>{assert.equal(offline,false);}});
            const [archive,cache] = f.read().map(JSON.parse);
            assert.deepEqual(archive['old-essay'],f.old);
            assert.equal(calls,offline ? 0 : 1);
            assert.equal(cache.source,offline ? 'offline-rss' : 'live-rss');
            if (offline) {
                const saved = f.read();
                await assert.rejects(main({root:f.root,args:['--feed-file',file,'--backfill']}), /is offline/);
                assert.deepEqual(f.read(),saved);
            }
        } finally {f.cleanup();}
    }
});
test('RSS envelope validation allows XML declaration, comments, escaped text and CDATA', () => {
    validateFeed('<?xml version="1.0"?>\n<!-- comment -->' + feed.replace('New essay','New &amp; essay'));
});
test('workflow runs Mondays at 11:23 UTC without historical backfill', () => {
    const workflow = fs.readFileSync(path.join(__dirname,'../.github/workflows/archive-articles.yml'),'utf8');
    assert.match(workflow, /cron: '23 11 \* \* 1'/);
    assert.match(workflow, /run: node tools\/sync-article-archive.js\n/);
    assert.doesNotMatch(workflow, /--backfill/);
});

test('body timeouts retry, invalid JSON does not retry or disclose the response', async () => {
    let calls = 0;
    assert.equal(await request('https://charleswilke.substack.com/feed', false, {
        sleep:async()=>{}, fetchImpl:async()=>({ok:true,text:async()=>{if (++calls < 3) throw new Error('timeout secret'); return feed;}})
    }),feed);
    assert.equal(calls,3);
    calls = 0;
    await assert.rejects(request('https://charleswilke.substack.com/api/v1/archive', true, {
        sleep:async()=>{},fetchImpl:async()=>{calls++; return {ok:true,json:async()=>{throw new SyntaxError('secret HTML body');}};}
    }),/^Error: Historical archive: invalid JSON response$/);
    assert.equal(calls,1);
});

test('corrupt retained input fails without disclosing contents or changing files', async () => {
    const f = fixture();
    try {
        fs.writeFileSync(path.join(f.root,'articles/archive.json'),'{secret-retained-body');
        const saved = f.read();
        await assert.rejects(main({root:f.root,args:[],requestImpl:async()=>{throw new Error('should not fetch');}}), error=>{
            assert.match(error.message,/RSS refresh failed/);
            assert.doesNotMatch(error.message,/secret-retained-body|should not fetch/);
            return true;
        });
        assert.deepEqual(f.read(),saved);
    } finally {f.cleanup();}
});
