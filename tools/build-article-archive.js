// Offline build: the repository archive is the source of truth for published pages.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { SITE_URL, escapeHtml, validSlug } = require('../lib/article-archive');
const localImages = require('../lib/local-article-images.json');
const { stripHtml } = require('../lib/substack-utils');
const root = path.join(__dirname, '..');
function build() {
    const archive = JSON.parse(fs.readFileSync(path.join(root, 'articles/archive.json'), 'utf8'));
    const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
    const source = main.match(/const LOCAL_ARTICLES = (\[[\s\S]*?\n\]);/);
    if (!source) throw new Error('Could not read local article catalog');
    const local = {};
    for (const entry of vm.runInNewContext(`(${source[1]})`)) {
        if (!validSlug(entry.slug) || !/^\/transcripts\/[a-z0-9-]+\.html$/.test(entry.contentUrl)) throw new Error('Invalid local article path');
        local[entry.slug] = {...entry, ...localImages[entry.slug], description:entry.cleanDescription, content:fs.readFileSync(path.join(root, entry.contentUrl), 'utf8')};
    }
    fs.writeFileSync(path.join(root, 'articles/local.json'), JSON.stringify(local, null, 2) + '\n');
    const all = {...archive, ...local};
    const itemsDir = path.join(root, 'articles/items');
    fs.mkdirSync(itemsDir, {recursive:true});
    for (const [slug, item] of Object.entries(all)) {
        if (!validSlug(slug)) throw new Error(`Invalid archived slug: ${slug}`);
        fs.writeFileSync(path.join(itemsDir, `${slug}.json`), JSON.stringify(item) + '\n');
    }
    const items = Object.values(all).sort((a,b) => Date.parse(b.pubDate)-Date.parse(a.pubDate));
    const list = items.map(item => `<li><time datetime="${escapeHtml(new Date(item.pubDate).toISOString())}">${escapeHtml(new Date(item.pubDate).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}))}</time><h2><a href="/read/${escapeHtml(item.slug)}">${escapeHtml(stripHtml(item.title))}</a></h2><p>${escapeHtml(stripHtml(item.description || ''))}</p></li>`).join('\n');
    fs.writeFileSync(path.join(root, 'writing-archive.html'), `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Writing Archive | Charles Wilke</title><meta name="description" content="Essays on AI, humanity, creativity, and work, plus conversations behind the writing. By Charles Wilke."><link rel="canonical" href="${SITE_URL}/writing-archive"><link rel="stylesheet" href="/article-archive.css?v=1"><link rel="icon" href="/favicon.ico"></head><body><nav aria-label="Site"><a href="/">Charles Wilke</a><a href="/#l.ai.bor">Latest writing</a></nav><main><header><p class="eyebrow">Exploring L.ai.bor</p><h1>The writing archive</h1><p class="subtitle">Essays and the conversations behind them. By <a href="/">Charles Wilke</a>.</p></header><ul class="archive-list">${list}</ul></main></body></html>\n`);
    // Replace only archive entries; preserve unrelated sitemap pages.
    const sitemapPath = path.join(root, 'sitemap.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8').replace(/\s*<url>\s*<loc>https:\/\/charleswilke\.com\/(?:read\/[^<]*|writing-archive)<\/loc>[\s\S]*?<\/url>/g, '');
    const urls = [`  <url><loc>${SITE_URL}/writing-archive</loc></url>`, ...items.map(item => `  <url><loc>${SITE_URL}/read/${escapeHtml(item.slug)}</loc></url>`)];
    sitemap = sitemap.replace('</urlset>', `${urls.join('\n')}\n</urlset>`);
    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`Built archive index and article data for ${items.length} entries.`);
}
if (require.main === module) build();
module.exports = build;
