const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const {createServer} = require('../.claude/static-server');

test('preview server contains files, handles malformed URLs and preserves media ranges and HEAD', async () => {
    const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dotcom-server-'));
    const root=path.join(temp,'site'), sibling=path.join(temp,'site-private');
    fs.mkdirSync(root);fs.mkdirSync(sibling);
    fs.writeFileSync(path.join(root,'index.html'),'<h1>Preview</h1>');
    fs.writeFileSync(path.join(root,'sample.mp3'),'0123456789');
    fs.writeFileSync(path.join(root,'.env'),'fixture-only');
    fs.writeFileSync(path.join(sibling,'secret.txt'),'fixture-only');
    fs.symlinkSync(path.join(sibling,'secret.txt'),path.join(root,'linked.txt'));
    const server=createServer(root);
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const port=server.address().port;
    const get=(url,options={})=>new Promise((resolve,reject)=>{
        const req=http.request({host:'127.0.0.1',port,path:url,...options},res=>{
            const chunks=[];res.on('data',d=>chunks.push(d));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString()}));
        });req.on('error',reject);req.end();
    });
    try {
        for(const url of ['/..%2fsite-private%2fsecret.txt','/.env','/.git/config','/linked.txt']) assert.equal((await get(url)).status,403,url);
        assert.equal((await get('/%zz')).status,400);
        assert.equal((await get('/')).body,'<h1>Preview</h1>');
        assert.equal((await get('/clean-route')).status,200);
        const partial=await get('/sample.mp3',{headers:{Range:'bytes=2-5'}});
        assert.equal(partial.status,206);assert.equal(partial.body,'2345');assert.equal(partial.headers['content-range'],'bytes 2-5/10');
        assert.equal((await get('/sample.mp3',{headers:{Range:'bytes=99-'}})).status,416);
        const head=await get('/sample.mp3',{method:'HEAD'});assert.equal(head.body,'');assert.equal(head.headers['content-length'],'10');
        assert.equal((await get('/',{method:'POST'})).status,405);
    } finally {
        await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true});
    }
});
