// Append/update public posts; an upstream omission never deletes a saved article.
const fs = require('node:fs');
const path = require('node:path');
const { parseRssItems, slugifyArticle, enrichVideoEmbeds } = require('../lib/substack-utils');
const { validSlug } = require('../lib/article-archive');
const base = 'https://charleswilke.substack.com';
const headers = {'User-Agent':'CharlesWilkeArchive/1.0 (+https://charleswilke.com)'};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Do not log response bodies, URLs with query strings, or arbitrary upstream errors.
function diagnostic(error) {
    return String(error.message).replace(/[^\x20-\x7e]/g, ' ').slice(0, 300);
}
function retryAfter(value, now) {
    if (!value) return null;
    const ms = /^\d+(?:\.\d+)?$/.test(value) ? Number(value) * 1000 : Date.parse(value) - now;
    return Number.isFinite(ms) ? Math.max(0, ms) : null;
}
async function request(url, json = true, {fetchImpl = global.fetch, sleep = delay, now = Date.now} = {}) {
    const endpoint = new URL(url).pathname.startsWith('/api/') ? 'Historical archive' : 'RSS feed';
    for (let attempt = 0; attempt < 3; attempt++) {
        await sleep(1200);
        let res;
        try {
            res = await fetchImpl(url, {headers, signal:AbortSignal.timeout(30000)});
        } catch {
            if (attempt === 2) throw new Error(`${endpoint}: network/timeout failure after 3 attempts`);
            await sleep(2000 * 2 ** attempt);
            continue;
        }
        if (res.ok) {
            try { return json ? await res.json() : await res.text(); }
            catch (error) {
                if (json && error.name === 'SyntaxError') throw new Error(`${endpoint}: invalid JSON response`);
                if (attempt === 2) throw new Error(`${endpoint}: response read failed after 3 attempts`);
                await sleep(2000 * 2 ** attempt);
                continue;
            }
        }
        const failure = new Error(`${endpoint}: HTTP ${res.status} (attempt ${attempt + 1}/3)`);
        // Access denial and other permanent client errors must stop immediately.
        if (res.body) await res.body.cancel().catch(() => {});
        if (![408, 429, 500, 502, 503, 504].includes(res.status) || attempt === 2) throw failure;
        const wait = retryAfter(res.headers.get('retry-after'), now());
        // Never retry earlier than requested. Long server waits defer to the next run.
        if (wait !== null && wait > 60000) throw new Error(`${failure.message}; Retry-After exceeds 60s budget; deferred`);
        await sleep(wait ?? (res.status === 429 ? 15000 : 2000 * 2 ** attempt));
    }
}
function validateFeed(xml) {
    // The shared RSS extractor is permissive. Reject truncated/mismatched XML before
    // using it, including a partially valid feed with one damaged later article.
    const stack = [];
    const tokens = xml.match(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<\/?[A-Za-z_][\w:.-]*(?:\s+(?:[^<>"']|"[^"]*"|'[^']*')*)?\s*\/?>|[^<]+/g) || [];
    let roots = 0;
    if (tokens.join('') !== xml) throw new Error('Malformed RSS XML; saved data unchanged');
    for (const token of tokens) {
        if (/^<\?|^<!--/.test(token)) continue;
        if (!token.startsWith('<') || token.startsWith('<![CDATA[')) {
            if (!stack.length && token.trim()) throw new Error('Malformed RSS XML; saved data unchanged');
            if (!token.startsWith('<![CDATA[') && (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(token) || token.includes(']]>'))) throw new Error('Malformed RSS XML; saved data unchanged');
            continue;
        }
        const name = token.match(/^<\/?([\w:.-]+)/)[1];
        if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(token)) throw new Error('Malformed RSS XML; saved data unchanged');
        if (token.startsWith('</')) {
            if (!/^<\/[\w:.-]+\s*>$/.test(token) || stack.pop() !== name) throw new Error('Malformed RSS XML; saved data unchanged');
        } else {
            if (!/^<[\w:.-]+(?:\s+[\w:.-]+\s*=\s*(?:"[^"<]*"|'[^'<]*'))*\s*\/?>$/.test(token)) throw new Error('Malformed RSS XML; saved data unchanged');
            if ((name === 'channel' && stack.join('/') !== 'rss') || (name === 'item' && stack.join('/') !== 'rss/channel')) throw new Error('Malformed RSS XML; saved data unchanged');
            if (!stack.length && (name !== 'rss' || ++roots !== 1)) throw new Error('Expected RSS XML; saved data unchanged');
            if (!token.endsWith('/>')) stack.push(name);
        }
    }
    if (stack.length || roots !== 1) throw new Error('Malformed RSS XML; saved data unchanged');
}
function atomicJson(file, data) {
    fs.mkdirSync(path.dirname(file), {recursive:true});
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2) + '\n');
    fs.renameSync(`${file}.tmp`, file);
}
async function main({root = path.join(__dirname, '..'), args = process.argv.slice(2), requestImpl = request,
    enrich = enrichVideoEmbeds, log = console.log} = {}) {
    const file = path.join(root, 'articles/archive.json');
    const cacheFile = path.join(root, 'cache_substack_feed.json');
    let archive = {};
    let retainedVideoItems = [];
    function save(item, onlyMissing = false) {
        const slug = item.slug || slugifyArticle(item);
        if (!validSlug(slug) || !item.title || !item.content?.trim()) throw new Error('Invalid article record; import stopped');
        if (onlyMissing && Object.hasOwn(archive, slug)) return;
        archive[slug] = {...item, slug};
    }
    function checkpoint() {
        atomicJson(file, Object.fromEntries(Object.entries(archive).sort(([a], [b]) => a.localeCompare(b))));
    }
    const feedArg = args.indexOf('--feed-file');
    if (feedArg >= 0 && (!args[feedArg + 1] || args[feedArg + 1].startsWith('--'))) throw new Error('--feed-file requires a path');
    if (feedArg >= 0 && args.includes('--backfill')) throw new Error('--feed-file is offline; run --backfill separately');
    let refreshed = false;
    let archiveSaved = false;
    try {
        archive = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
        retainedVideoItems = Object.values(archive);
        // Preserve the original fallback snapshot as well as the current RSS window.
        for (const item of JSON.parse(fs.readFileSync(cacheFile, 'utf8')).items) save(item, true);
        const xml = feedArg >= 0 ? fs.readFileSync(args[feedArg + 1], 'utf8') : await requestImpl(`${base}/feed`, false);
        validateFeed(xml);
        const items = parseRssItems(xml, 200);
        // Refuse silent truncation rather than publishing a partial refresh.
        if (!items.length || (xml.match(/<item[\s>]/g) || []).length !== items.length) throw new Error('Empty or oversized RSS feed; saved data unchanged');
        for (const item of items) save(item);
        if (feedArg < 0) await enrich(Object.values(archive), retainedVideoItems);
        checkpoint();
        archiveSaved = true;
        // Commit the fresh fallback before optional historical work can fail.
        atomicJson(cacheFile, {status:'ok', source:feedArg >= 0 ? 'offline-rss' : 'live-rss',
            importedAt:new Date().toISOString(), items:items.slice(0,19)});
        refreshed = true;
        log(`${feedArg >= 0 ? 'Offline RSS imported' : 'Live RSS refreshed'}: ${items.length} feed articles; ${Object.keys(archive).length} retained.`);
        if (args.includes('--backfill')) {
            for (let offset = 0; ; offset += 20) {
                const posts = await requestImpl(`${base}/api/v1/archive?sort=new&offset=${offset}&limit=20`);
                if (!Array.isArray(posts)) throw new Error('Invalid archive listing');
                for (const post of posts) {
                    if (!validSlug(post.slug) || post.audience !== 'everyone' || Object.hasOwn(archive, post.slug)) continue;
                    const full = await requestImpl(`${base}/api/v1/posts/${encodeURIComponent(post.slug)}`);
                    if (full.audience !== 'everyone' || !full.body_html) continue;
                    save({slug:post.slug, title:full.title, link:`${base}/p/${post.slug}`, pubDate:full.post_date,
                        description:full.subtitle || full.description || '', content:full.body_html,
                        thumbnail:full.cover_image || '', categories:(full.postTags || []).map(tag => tag.name)});
                }
                checkpoint();
                log(`Scanned ${offset + posts.length} posts; retained ${Object.keys(archive).length}`);
                if (posts.length < 20) break;
            }
            await enrich(Object.values(archive), retainedVideoItems);
            checkpoint();
            log('Historical backfill completed.');
        }
    } catch (error) {
        // Only known internal request diagnostics are exposed. Never include file
        // contents or arbitrary exceptions from response parsing/metadata helpers.
        const message = /^(RSS feed:|Historical archive:|Malformed RSS|Expected RSS|Empty or oversized RSS|Invalid article record|Invalid archive listing)/.test(error.message)
            ? diagnostic(error) : 'Import failed (local I/O, parsing, or metadata error)';
        throw new Error(`${refreshed ? 'Historical backfill failed; valid RSS refresh remains saved' : archiveSaved ? 'RSS snapshot write failed; archive saved but fallback freshness unconfirmed' : 'RSS refresh failed; existing files retained, no new freshness claimed'}: ${message}`);
    }
}
if (require.main === module) main().catch(error => { console.error(diagnostic(error)); process.exitCode = 1; });
module.exports = {main, request, retryAfter, validateFeed};
