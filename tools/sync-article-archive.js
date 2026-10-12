// Append/update public posts; an upstream omission never deletes a saved article.
const fs = require('node:fs');
const path = require('node:path');
const { parseRssItems, slugifyArticle, enrichVideoEmbeds } = require('../lib/substack-utils');
const { validSlug } = require('../lib/article-archive');
const root = path.join(__dirname, '..');
const file = path.join(root, 'articles/archive.json');
const base = 'https://charleswilke.substack.com';
const args = process.argv.slice(2);
const archive = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const retainedVideoItems = Object.values(archive);
const headers = {'User-Agent':'CharlesWilkeArchive/1.0 (+https://charleswilke.com)'};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(url, json = true) {
    let failure;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await delay(1200);
            const res = await fetch(url, {headers, signal:AbortSignal.timeout(30000)});
            if (res.status === 429) {
                await delay(Math.min(60000, Math.max(15000, Number(res.headers.get('retry-after')) * 1000 || 30000)));
                throw new Error('Substack throttled the import; retrying');
            }
            if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
            return json ? await res.json() : await res.text();
        } catch (error) { failure = error; }
    }
    throw failure;
}
function save(item, onlyMissing = false) {
    const slug = item.slug || slugifyArticle(item);
    if (!validSlug(slug) || !item.title || !item.content?.trim()) throw new Error(`Invalid article: ${slug}`);
    if (onlyMissing && Object.hasOwn(archive, slug)) return;
    archive[slug] = {...item, slug};
}
function checkpoint() {
    fs.mkdirSync(path.dirname(file), {recursive:true});
    const ordered = Object.fromEntries(Object.entries(archive).sort(([a], [b]) => a.localeCompare(b)));
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(ordered, null, 2) + '\n');
    fs.renameSync(`${file}.tmp`, file);
}
async function main() {
    // Preserve the original fallback snapshot as well as the current RSS window.
    for (const item of JSON.parse(fs.readFileSync(path.join(root, 'cache_substack_feed.json'))).items) save(item, true);
    const feedArg = args.indexOf('--feed-file');
    const xml = feedArg >= 0 ? fs.readFileSync(args[feedArg + 1], 'utf8') : await request(`${base}/feed`, false);
    const items = parseRssItems(xml, 200);
    if (!items.length) throw new Error('Empty RSS feed; archive left untouched');
    for (const item of items) save(item);
    if (feedArg < 0) await enrichVideoEmbeds(Object.values(archive), retainedVideoItems);
    checkpoint();
    if (args.includes('--backfill')) {
        for (let offset = 0; ; offset += 20) {
            const posts = await request(`${base}/api/v1/archive?sort=new&offset=${offset}&limit=20`);
            if (!Array.isArray(posts)) throw new Error('Invalid archive listing');
            for (const post of posts) {
                if (!validSlug(post.slug) || post.audience !== 'everyone' || Object.hasOwn(archive, post.slug)) continue;
                const full = await request(`${base}/api/v1/posts/${encodeURIComponent(post.slug)}`);
                if (full.audience !== 'everyone' || !full.body_html) continue;
                save({slug:post.slug, title:full.title, link:`${base}/p/${post.slug}`, pubDate:full.post_date,
                    description:full.subtitle || full.description || '', content:full.body_html,
                    thumbnail:full.cover_image || '', categories:(full.postTags || []).map(tag => tag.name)});
            }
            checkpoint();
            console.log(`Scanned ${offset + posts.length} posts; retained ${Object.keys(archive).length}`);
            if (posts.length < 20) break;
        }
    }
    // Preserve poster metadata in retained HTML so readers need no live lookup.
    // A feed-file import stays fully offline; failed lookups retain playable embeds.
    if (feedArg < 0 && args.includes('--backfill')) await enrichVideoEmbeds(Object.values(archive), retainedVideoItems);
    checkpoint();
    // Keep the offline homepage fallback current, without replacing the archive.
    fs.writeFileSync(path.join(root, 'cache_substack_feed.json'), JSON.stringify({status:'ok', items:items.slice(0,19)}, null, 2) + '\n');
    console.log(`Saved ${Object.keys(archive).length} articles.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
