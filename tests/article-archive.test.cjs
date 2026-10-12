const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {sanitizeContent, renderArticle} = require('../lib/article-archive');
const archive = require('../articles/archive.json');
function response() { return {headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},send(body){this.body=body;return this;}}; }

test('archived links and local transcripts return full canonical HTML without Substack', async () => {
    const fetch = global.fetch;
    global.fetch = async () => { throw new Error('Substack is offline'); };
    try {
        const handler = require('../api/article-preview');
        for (const slug of [Object.keys(archive)[0], 'what-hope-do-we-have-transcript']) {
            const res = response();
            await handler({query:{slug}},res);
            assert.equal(res.code,200);
            assert.ok(res.body.includes(`rel="canonical" href="https://charleswilke.com/read/${slug}"`));
            assert.match(res.body, /"@type":"BlogPosting"/);
            assert.match(res.body, /<div class="article-body[^"]*">[\s\S]{1000}/);
            assert.doesNotMatch(res.body, /http-equiv="refresh"|window.location.replace/);
        }
        const res = response();
        await handler({query:{slug:'../invalid'}}, res);
        assert.equal(res.code,404);
        assert.match(res.body,/noindex,follow/);
        const unavailable = response();
        await handler({query:{slug:'constructor'}}, unavailable);
        assert.equal(unavailable.code,502);
    } finally {global.fetch=fetch;}
});

test('unknown articles return 404, upstream failures remain retryable', async () => {
    const fetch = global.fetch;
    try {
        global.fetch = async () => ({ok:true,text:async()=>'<rss><channel></channel></rss>'});
        const res = response();
        await require('../api/article-preview')({query:{slug:'missing-essay'}},res);
        assert.equal(res.code,404);
        assert.match(res.body,/noindex,follow/);
    } finally {global.fetch=fetch;}
});

test('server HTML strips executable markup and preserves text, media and internal article links', () => {
    const html = sanitizeContent('<script>alert(1)</script><img src="https://example.com/a.png" onerror="alert(1)"><a href="javascript:alert(1)">bad</a><iframe src="https://evil.example"></iframe><iframe src="https://www.youtube.com/embed/123"></iframe><p>Hello <strong>world</strong></p><div class="native-audio-embed" data-attrs="{&quot;mediaUploadId&quot;:&quot;123&quot;}"></div><a href="https://charleswilke.substack.com/p/old-essay?utm_source=email">Essay</a>');
    assert.doesNotMatch(html,/script|onerror|javascript:|evil.example/);
    assert.match(html,/<strong>world<\/strong>/);
    assert.match(html,/data-attrs=/);
    assert.match(html,/href="\/read\/old-essay"/);
    assert.match(html,/www.youtube.com\/embed\/123/);
    const page = renderArticle({title:'</script><script>alert(1)</script>',description:'<img onerror="alert(1)">',content:'<p>Safe</p>'},'safe');
    assert.doesNotMatch(page,/<script>alert/);
});

test('sync preserves articles that disappear from RSS and fails safely on an empty feed', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(),'dotcom-archive-'));
    try {
        for (const dir of ['tools','lib','articles']) fs.mkdirSync(path.join(temp,dir));
        for (const file of ['tools/sync-article-archive.js','lib/substack-utils.js','lib/article-archive.js']) fs.copyFileSync(path.join(__dirname,'..',file),path.join(temp,file));
        fs.symlinkSync(path.join(__dirname,'../node_modules'),path.join(temp,'node_modules'));
        const old = {slug:'old-essay',title:'Old essay',content:'<p>Keep this forever.</p>',link:'https://charleswilke.substack.com/p/old-essay'};
        fs.writeFileSync(path.join(temp,'articles/archive.json'),JSON.stringify({'old-essay':old}));
        fs.writeFileSync(path.join(temp,'cache_substack_feed.json'),JSON.stringify({items:[]}));
        const feed = path.join(temp,'feed.xml');
        fs.writeFileSync(feed,'<rss><channel><item><title>New essay</title><link>https://charleswilke.substack.com/p/new-essay</link><description>New</description><content:encoded><![CDATA[<p>New body</p>]]></content:encoded></item></channel></rss>');
        execFileSync(process.execPath,[path.join(temp,'tools/sync-article-archive.js'),'--feed-file',feed]);
        const saved = fs.readFileSync(path.join(temp,'articles/archive.json'),'utf8');
        assert.deepEqual(JSON.parse(saved)['old-essay'],old);
        assert.equal(JSON.parse(saved)['new-essay'].content,'<p>New body</p>');
        fs.writeFileSync(feed,'<rss><channel></channel></rss>');
        assert.throws(()=>execFileSync(process.execPath,[path.join(temp,'tools/sync-article-archive.js'),'--feed-file',feed],{stdio:'pipe'}));
        assert.equal(fs.readFileSync(path.join(temp,'articles/archive.json'),'utf8'),saved);
    } finally {fs.rmSync(temp,{recursive:true,force:true});}
});

test('bundled sanitizer runs when CommonJS loading of ES modules is disabled', () => {
    const output = execFileSync(process.execPath,['--no-experimental-require-module','-e',"process.stdout.write(require('./lib/article-archive').sanitizeContent('<p>Safe <strong>article</strong></p>'))"],{cwd:path.join(__dirname,'..'),encoding:'utf8'});
    assert.equal(output,'<p>Safe <strong>article</strong></p>');
});
