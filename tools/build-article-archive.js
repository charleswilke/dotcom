// Offline build: the repository archive is the source of truth for published pages.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { SITE_URL, escapeHtml, validSlug } = require('../lib/article-archive');
const localImages = require('../lib/local-article-images.json');
const { stripHtml, resizeSubstackImage } = require('../lib/substack-utils');
const root = path.join(__dirname, '..');
function build() {
    require('esbuild').buildSync({
        entryPoints:[require.resolve('sanitize-html')], bundle:true, platform:'node',
        format:'cjs', target:'node22', outfile:path.join(root,'vendor/sanitize-html.cjs'),
        legalComments:'inline'
    });
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
    // Reuse the homepage's actual publication lettering and radio-scale rails.
    const homepage = fs.readFileSync(path.join(root,'index.html'),'utf8');
    const publicationHeader = homepage.match(/<h2 class="section-title section-title-light crt-hover rss-section-title">[\s\S]*?<\/h2>/)?.[0];
    if (!publicationHeader) throw new Error('Missing Exploring L.ai.bor publication header');
    const years = [...new Set(items.map(item => new Date(item.pubDate).getUTCFullYear()))];
    const sections = years.map(year => {
        const entries = items.filter(item => new Date(item.pubDate).getUTCFullYear() === year);
        const cards = entries.map(item => {
            const date = new Date(item.pubDate);
            const stamp = `${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}-${String(year).slice(-2)}`;
            const image = resizeSubstackImage(item.thumbnail || '/images/exploring-laibor-publication-fresh-v2.webp',848);
            const description = stripHtml(item.description || '');
            return `<a class="feed-item" href="/read/${escapeHtml(item.slug)}"><img src="${escapeHtml(image)}" alt="" width="848" height="477" loading="lazy" decoding="async"><div class="feed-item-body"><span class="archive-card-kind">${item.link ? 'Essay' : 'The conversation'}</span><h3>${escapeHtml(stripHtml(item.title))}</h3><p>${escapeHtml(description.slice(0,160))}${description.length > 160 ? '…' : ''}</p><div class="feed-item-meta"><time class="date" datetime="${date.toISOString()}">${stamp}</time></div></div></a>`;
        }).join('\n');
        return `<section class="archive-year" aria-labelledby="year-${year}"><div class="archive-year-heading"><h2 id="year-${year}">${year}</h2><span>${entries.length} entries</span></div><div class="feed-grid archive-grid">${cards}</div></section>`;
    }).join('\n');
    fs.writeFileSync(path.join(root, 'writing-archive.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Writing Archive | Charles Wilke</title><meta name="description" content="Essays on AI, humanity, creativity, and work, plus conversations behind the writing. By Charles Wilke.">
<link rel="canonical" href="${SITE_URL}/writing-archive"><link rel="stylesheet" href="/styles.css?v=20261012-archive"><link rel="stylesheet" href="/article-archive.css?v=3"><link rel="icon" href="/favicon.ico">
<meta property="og:title" content="The Writing Archive | Charles Wilke"><meta property="og:image" content="${SITE_URL}/images/exploring-laibor-publication-fresh-v2.webp"><meta property="og:url" content="${SITE_URL}/writing-archive"><meta property="og:type" content="website">
<script src="/common.js?v=archive2" defer></script><script src="/article-archive.js?v=2" defer></script></head>
<body class="archive-page"><script src="/nav.js?v=2f0eb52"></script><noscript><p class="archive-fallback-nav"><a href="/">Charles Wilke</a> / <a href="/#l.ai.bor">Latest writing</a></p></noscript>
<div class="rss-feed archive-surface"><main class="archive-main"><header class="archive-publication-header">${publicationHeader}</header><header class="archive-masthead"><div class="archive-masthead-copy"><a href="/" class="archive-home">Charles Wilke</a><p class="archive-eyebrow">Since 2023</p><h1>The writing archive<span aria-hidden="true">.</span></h1><p class="archive-intro">Essays on capitalism, humanity, and AI.<br>And the conversations behind them.</p><div class="archive-tally"><span>${Object.keys(archive).length} essays</span><span>${Object.keys(local).length} conversations</span></div></div></header>
<div class="archive-year-nav" aria-label="Browse by year">${years.map(year => `<a href="#year-${year}">${year}</a>`).join('')}<a class="archive-latest" href="/#l.ai.bor">Latest writing ↗</a></div>
${sections}<footer class="archive-footer"><a href="/">Back to Charles Wilke</a><a href="https://charleswilke.substack.com/subscribe">Subscribe on Substack ↗</a></footer></main></div></body></html>\n`);
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
