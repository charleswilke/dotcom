const { stripHtml, resizeSubstackImage } = require('./substack-utils');
const SITE_URL = 'https://charleswilke.com';
const validSlug = slug => typeof slug === 'string' && /^[a-z0-9][a-z0-9-]{0,100}$/i.test(slug);
const escapeHtml = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sanitizeContent(content) {
    // Bundle ESM dependencies at build time for Vercel's CommonJS function loader.
    const sanitizeHtml = require('../vendor/sanitize-html.cjs');
    return sanitizeHtml(content || '', {
        allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'figure', 'figcaption', 'audio', 'video', 'source', 'iframe'],
        allowedAttributes: {
            '*': ['class', 'id'], a: ['href', 'title', 'rel'],
            img: ['src', 'alt', 'width', 'height', 'loading'],
            div: ['class', 'data-attrs'], audio: ['src', 'controls', 'preload'],
            video: ['src', 'poster', 'controls', 'preload', 'playsinline'], source: ['src', 'type'],
            iframe: ['src', 'title', 'allowfullscreen', 'loading'],
            td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan']
        },
        allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
        allowedSchemes: ['https', 'http', 'mailto'], allowProtocolRelative: false,
        transformTags: {
            a: (tagName, attribs) => {
                let href = attribs.href || '';
                const match = href.match(/^https:\/\/charleswilke\.substack\.com\/p\/([a-z0-9-]+)(?:[?#].*)?$/i);
                if (match) href = `/read/${match[1]}`;
                return { tagName, attribs: {...attribs, href, rel: 'noopener noreferrer'} };
            },
            img: (tagName, attribs) => ({tagName, attribs:{...attribs, src:resizeSubstackImage(attribs.src, 1272), loading:'lazy'}})
        },
        exclusiveFilter: frame => /(?:subscription-widget|subscribe-widget|button-wrapper|image-link-expand|image2-inset-overlay|restack-image)/.test(frame.attribs.class || '') ||
            (frame.tag === 'img' && (frame.attribs.width === '1' || frame.attribs.height === '1' || /\/(?:p-)?open\?/.test(frame.attribs.src || '')))
    });
}
function renderArticle(item, slug, status = 200) {
    const title = item ? stripHtml(item.title) : status === 404 ? 'Article not found' : 'Article temporarily unavailable';
    const description = item ? stripHtml(item.description || '').slice(0, 240) : 'Browse the writing archive by Charles Wilke.';
    const url = `${SITE_URL}/read/${encodeURIComponent(slug)}`;
    const image = item?.thumbnail ? new URL(item.thumbnail, SITE_URL).href : `${SITE_URL}/images/og-image.jpg`;
    const date = item?.pubDate && Number.isFinite(Date.parse(item.pubDate)) ? new Date(item.pubDate).toISOString() : '';
    const structured = item ? JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BlogPosting', headline: title,
        description, image, url, mainEntityOfPage: url,
        ...(date ? {datePublished: date} : {}),
        author: {'@type':'Person', '@id':`${SITE_URL}/#person`, name:'Charles Wilke', url:`${SITE_URL}/about`}
    }).replace(/</g, '\\u003c') : '';
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} | Charles Wilke</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${item ? 'index,follow,max-image-preview:large' : 'noindex,follow'}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Charles Wilke">
<meta property="og:url" content="${escapeHtml(url)}"><meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:alt" content="${escapeHtml(title)}">
${date ? `<meta property="article:published_time" content="${date}">` : ''}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(image)}">
<link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/styles.css?v=20261012-archive"><link rel="stylesheet" href="/article-archive.css?v=8">
${structured ? `<script type="application/ld+json">${structured}</script>` : ''}
<script src="/common.js?v=archive2" defer></script><script src="/article-archive.js?v=5" defer></script></head>
<body class="article-page"><script src="/nav.js?v=2f0eb52"></script><noscript><p class="archive-fallback-nav"><a href="/">Charles Wilke</a> / <a href="/writing-archive">Writing archive</a></p></noscript>
<main class="article-main"><article class="article-reader-shell"><div class="article-reader-topbar"><a href="/writing-archive">← Writing archive</a><a href="/">Charles Wilke</a></div><header class="article-reader-header"><p class="eyebrow">${item?.link ? 'Exploring L.ai.bor' : 'Charles Wilke / Conversations'}</p>
<h1 class="article-reader-title">${escapeHtml(title)}</h1><p class="subtitle article-reader-subtitle">${escapeHtml(description)}</p>
${item ? `<p class="byline">By <a href="/about">Charles Wilke</a>${date ? ` · <time datetime="${date}">${new Date(date).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})}</time>` : ''}</p>` : ''}</header>
<div class="article-body article-reader-body">${item ? sanitizeContent(item.content) : '<p>This article could not be loaded. Please browse the archive or try again later.</p>'}</div>
<footer class="archive-footer"><a href="/writing-archive">Browse all writing →</a>${item?.link ? `<a href="${escapeHtml(item.link)}" rel="noopener noreferrer">Comments &amp; subscribe on Substack ↗</a>` : ''}</footer>
</article></main></body></html>`;
}
module.exports = { SITE_URL, validSlug, escapeHtml, sanitizeContent, renderArticle };
