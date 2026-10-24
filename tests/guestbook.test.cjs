const { test } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/before-times-guestbook');
const response = () => ({code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;},end(){}});
const request = (overrides = {}) => ({method:'POST',headers:{'content-type':'application/json'},socket:{remoteAddress:'192.0.2.1'},body:{name:'A visitor',message:'Still here. Still making things.'},...overrides});

test('guestbook rejects cross-site, non-JSON and oversized writes without storage work', async () => {
    const original = global.fetch;
    global.fetch = async () => {throw new Error('Unexpected storage call');};
    try {
        for (const [req,expected] of [
            [request({headers:{'content-type':'application/json','sec-fetch-site':'cross-site'}}),403],
            [request({headers:{'content-type':'text/plain'}}),415],
            [request({body:'x'.repeat(4097)}),413]
        ]) {
            const res=response();await handler(req,res);assert.equal(res.code,expected);
        }
    } finally {global.fetch=original;}
});

test('guestbook uses one storage call for throttling and append and fails closed on command errors', async t => {
    t.mock.method(console,'error',()=>{});
    const original=global.fetch, originalVercel=process.env.VERCEL;
    process.env.guestbook_KV_REST_API_URL='https://storage.invalid';
    process.env.guestbook_KV_REST_API_TOKEN='guestbook-test-only';
    delete process.env.VERCEL;
    try {
        for (const [payload,expected] of [[{result:1},201],[{result:-1},429],[{error:'ERR storage rejected command'},502],[{result:null},502],[{},502]]) {
            let calls=0;
            global.fetch=async(url,options)=>{
                calls++;
                assert.equal(url,'https://storage.invalid');
                assert.ok(options.signal);
                const command=JSON.parse(options.body);
                assert.equal(command[0],'EVAL');assert.equal(command[2],'2');
                assert.equal(command[4],'before-times:guestbook:entries:v1');
                assert.ok(!command[3].includes('192.0.2.1'));
                assert.equal(JSON.parse(command[5]).message,'Still here. Still making things.');
                return {ok:true,json:async()=>payload};
            };
            const res=response();await handler(request(),res);
            assert.equal(res.code,expected);assert.equal(calls,1);
            if(expected===201) assert.equal(res.data.entry.name,'A visitor');
            if(expected===429) assert.equal(res.headers['Retry-After'],'900');
        }
        global.fetch=async()=>({ok:true,json:async()=>({error:'ERR read rejected'})});
        const read=response();await handler(request({method:'GET'}),read);assert.equal(read.code,502);
    } finally {
        global.fetch=original;
        if(originalVercel===undefined) delete process.env.VERCEL;else process.env.VERCEL=originalVercel;
        delete process.env.guestbook_KV_REST_API_URL;delete process.env.guestbook_KV_REST_API_TOKEN;
    }
});
