// Offline build: the repository archive is the source of truth for published pages.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { SITE_URL, escapeHtml, validSlug, sanitizeContent } = require('../lib/article-archive');
const localImages = require('../lib/local-article-images.json');
const { stripHtml, resizeSubstackImage } = require('../lib/substack-utils');
const { buildRelatedArticles } = require('../lib/related-articles');
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
    const related = buildRelatedArticles(archive, local);
    fs.writeFileSync(path.join(root, 'articles/related.json'), JSON.stringify(related) + '\n');
    const itemsDir = path.join(root, 'articles/items');
    fs.mkdirSync(itemsDir, {recursive:true});
    for (const [slug, item] of Object.entries(all)) {
        if (!validSlug(slug)) throw new Error(`Invalid archived slug: ${slug}`);
        fs.writeFileSync(path.join(itemsDir, `${slug}.json`), JSON.stringify(item) + '\n');
    }
    // Conversations remain available at their permanent URLs, linked inside each essay.
    const items = Object.values(archive).sort((a,b) => Date.parse(b.pubDate)-Date.parse(a.pubDate));
    // Full essay text is only needed when a visitor searches. Keep the initial
    // HTML small while retaining every crawlable card and a metadata fallback.
    const searchIndex = JSON.stringify(Object.fromEntries(items.map(item => [
        item.slug, stripHtml(sanitizeContent(item.content).replace(/<[^>]*>/g, ' '))
    ]))) + '\n';
    fs.writeFileSync(path.join(root, 'articles/search.json'), searchIndex);
    const searchVersion = createHash('sha256').update(searchIndex).digest('hex').slice(0, 16);
    // Reuse the homepage's actual publication lettering and radio-scale rails.
    const homepage = fs.readFileSync(path.join(root,'index.html'),'utf8');
    const publicationHeader = homepage.match(/<h2 class="section-title section-title-light crt-hover rss-section-title">[\s\S]*?<\/h2>/)?.[0]?.replace(/(<span class="rss-title-tagline">)[\s\S]*?(<\/span>)/, '$1The Full Archive$2');
    if (!publicationHeader) throw new Error('Missing Exploring L.ai.bor publication header');
    const years = [...new Set(items.map(item => new Date(item.pubDate).getUTCFullYear()))];
    const sections = years.map(year => {
        const entries = items.filter(item => new Date(item.pubDate).getUTCFullYear() === year);
        const cards = entries.map(item => {
            const date = new Date(item.pubDate);
            const stamp = date.toLocaleDateString('en-US', {month:'short',day:'numeric',timeZone:'UTC'});
            const image = resizeSubstackImage(item.thumbnail || '/images/exploring-laibor-publication-fresh-v2.webp',848);
            const description = stripHtml(item.description || '');
            return `<a class="feed-item archive-entry" data-slug="${escapeHtml(item.slug)}" data-search="${escapeHtml(stripHtml(item.title) + ' ' + description)}" href="/read/${escapeHtml(item.slug)}"><div class="feed-card-image"><img src="${escapeHtml(image)}" alt="" width="848" height="477" loading="lazy" decoding="async"></div><div class="feed-card-panel"><div class="feed-item-meta"><time class="date" datetime="${date.toISOString()}">${stamp}</time></div><div class="feed-item-body"><h3>${escapeHtml(stripHtml(item.title))}</h3><p>${escapeHtml(description.slice(0,180))}${description.length > 180 ? '…' : ''}</p></div></div></a>`;
        }).join('\n');
        return `<section class="archive-year" data-year="${year}" aria-labelledby="year-${year}"><div class="archive-year-heading"><h2 id="year-${year}">${year}</h2><span>${entries.length} essays</span></div><div class="feed-grid archive-list">${cards}</div></section>`;
    }).join('\n');
    fs.writeFileSync(path.join(root, 'writing-archive.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <script src="/page-entry.js?v=1"></script>
<title>Writing Archive | Charles Wilke</title><meta name="description" content="Essays on AI, humanity, creativity, and work, plus conversations behind the writing. By Charles Wilke.">
<link rel="canonical" href="${SITE_URL}/writing-archive"><link rel="stylesheet" href="/styles.css?v=20261024-album-titles-centered-1"><link rel="stylesheet" href="/article-archive.css?v=23"><link rel="icon" href="/favicon.ico">
<meta property="og:title" content="The Writing Archive | Charles Wilke"><meta property="og:image" content="${SITE_URL}/images/exploring-laibor-publication-fresh-v2.webp"><meta property="og:url" content="${SITE_URL}/writing-archive"><meta property="og:type" content="website">
<script src="/common.js?v=20261012-nav-logo" defer></script><script src="/laibor-rails.js?v=1" defer></script><script src="/article-archive.js?v=9" defer></script></head>
<body class="archive-page"><script src="/nav.js?v=20261013-cw-all"></script><noscript><p class="archive-fallback-nav"><a href="/">Charles Wilke</a> / <a href="/#l.ai.bor">Latest writing</a></p></noscript>
<div class="rss-feed archive-surface" data-tuner-theme="dark"><main class="archive-main"><header class="archive-publication-header">${publicationHeader}</header><div class="archive-summary"><p class="archive-result-count" role="status" aria-live="polite" hidden></p><p>${items.length} essays · Since 2023 · By <a href="/">Charles Wilke</a></p></div><header class="archive-masthead"><h1 class="archive-page-title">The writing archive</h1><nav class="archive-year-nav" aria-label="Browse by year"><a href="#archive-results" data-year="all" aria-current="true">All</a>${years.map(year => `<a href="#year-${year}" data-year="${year}">${year}</a>`).join('')}</nav>
<div class="archive-search" hidden><svg class="archive-search-icon" viewBox="0 0 36 36" aria-hidden="true" focusable="false"><path fill="var(--secondary)" d="m6 5 6 1-1 9 12 1-1-6 12 11-13 8 1-7-18-1Z"/><path fill="currentColor" d="m4 3 6 1-1 9 12 1-1-6 12 11-13 8 1-7-18-1Z"/></svg><input aria-label="Search the archive" id="archive-search" data-search-index="/articles/search.json?v=${searchVersion}" type="search" placeholder="Search the archive" autocomplete="off" aria-controls="archive-results"></div></header>

<div id="archive-results">${sections}</div><p class="archive-empty" hidden>No essays match. Try another search or <button type="button" id="archive-reset">clear the filters</button>.</p><footer class="archive-footer"><a href="/">Back to Charles Wilke</a><a href="https://charleswilke.substack.com/subscribe">Subscribe on Substack ↗</a></footer></main></div></body></html>\n`);
    // Replace only archive entries; preserve unrelated sitemap pages.
    const sitemapPath = path.join(root, 'sitemap.xml');
    let sitemap = fs.readFileSync(sitemapPath, 'utf8').replace(/\s*<url>\s*<loc>https:\/\/charleswilke\.com\/(?:read\/[^<]*|writing-archive)<\/loc>[\s\S]*?<\/url>/g, '');
    const urls = [`  <url><loc>${SITE_URL}/writing-archive</loc></url>`, ...Object.values(all).sort((a,b) => Date.parse(b.pubDate)-Date.parse(a.pubDate)).map(item => `  <url><loc>${SITE_URL}/read/${escapeHtml(item.slug)}</loc></url>`)];
    sitemap = sitemap.replace('</urlset>', `${urls.join('\n')}\n</urlset>`);
    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`Built archive index for ${items.length} essays and article data for ${Object.keys(all).length} entries.`);
}
if (require.main === module) build();
module.exports = build;
