const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync} = require('node:child_process');
const {stampAssets} = require('../tools/stamp-assets');

test('build stamps nested and generated HTML, changes versions with content, and is idempotent', () => {
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'dotcom-assets-'));
    const write=(file,text)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),text);};
    try {
        write('styles.css','body{color:red}');write('games/TootsJam/game.js','let score = 0;');
        write('index.html','<link href="/styles.css?v=old"><script src="https://external.invalid/script.js"></script>');
        write('games/TootsJam/tootsjam.html','<script src="game.js?v=__ASSET_VERSION__"></script>');
        write('generated/share-pages/music.html','<link href="/styles.css?v=old">');
        assert.equal(stampAssets(root).length,3);
        const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
        const shared=fs.readFileSync(path.join(root,'generated/share-pages/music.html'),'utf8');
        const versions=JSON.parse(fs.readFileSync(path.join(root,'lib/asset-versions.json'),'utf8'));
        assert.ok(home.includes(`/styles.css?v=${versions['/styles.css']}`));
        fs.copyFileSync(path.join(__dirname,'../lib/asset-url.js'),path.join(root,'lib/asset-url.js'));
        // A deployed function only needs its manifest, not the static asset files.
        fs.renameSync(path.join(root,'styles.css'),path.join(root,'styles.css.offline'));
        try {
            const runtimeUrl=execFileSync(process.execPath,['-e',"process.stdout.write(require('./lib/asset-url').assetUrl('/styles.css'))"],{cwd:root,env:{...process.env,VERCEL:'1'},encoding:'utf8'});
            assert.equal(runtimeUrl,`/styles.css?v=${versions['/styles.css']}`);
        } finally {fs.renameSync(path.join(root,'styles.css.offline'),path.join(root,'styles.css'));}
        assert.equal(home.match(/styles.css\?v=([a-f0-9]{16})/)[1],shared.match(/styles.css\?v=([a-f0-9]{16})/)[1]);
        assert.ok(home.includes('https://external.invalid/script.js'));
        assert.match(fs.readFileSync(path.join(root,'games/TootsJam/tootsjam.html'),'utf8'),/game.js\?v=[a-f0-9]{16}/);
        assert.deepEqual(stampAssets(root),[]);
        write('styles.css','body{color:blue}');assert.equal(stampAssets(root,true).length,2);
        assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8'),home,'check mode must not write');
        stampAssets(root);assert.notEqual(fs.readFileSync(path.join(root,'index.html'),'utf8'),home);
    } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('only content-versioned code gets immutable caching; game HTML and module imports revalidate', () => {
    const config=require('../vercel.json');
    assert.ok(!config.headers.some(rule=>rule.source.includes('folder')));
    const rule=config.headers.find(rule=>rule.source==='/:path*\\.(js|css)');
    assert.deepEqual(rule.has,[{type:'query',key:'v',value:'[a-f0-9]{16}'}]);
    const fallback=config.headers.find(rule=>rule.source==='/:path*\\.(html|js|css)');
    assert.equal(fallback.headers[0].value,'public, max-age=0, must-revalidate');
});
