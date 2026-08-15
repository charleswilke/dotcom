const {
    decodeHtmlEntities,
    fetchSubstackItems,
    slugifyArticle,
    stripHtml
} = require('../lib/substack-utils');

const SITE_URL = 'https://charleswilke.com';
const DEFAULT_IMAGE = `${SITE_URL}/images/og-image.jpg?v=202607032147`;
const DEFAULT_TITLE = 'Exploring L.ai.bor | Charles Wilke';
const DEFAULT_DESCRIPTION = 'Essays on capitalism, humanity, and AI from Charles Wilke.';

// Repo-hosted articles that open in the reader but aren't in the Substack feed.
// Keep in sync with LOCAL_ARTICLES in main.js.
const LOCAL_ARTICLES = {
    'surviving-salem-transcript': {
        title: 'Surviving Salem: The Conversation',
        description: 'The full working session behind "Vilify and Deny" — workshopping the essay with Codex, from first draft to final polish, generated art included.',
        thumbnail: '/images/transcripts/surviving-salem/the-accusation-creates-the-witch.webp',
        image: { width: 1536, height: 1024 },
        pubDate: '2026-07-18T16:00:00.000Z'
    },
    'baby-steps-transcript': {
        title: 'Baby Steps: The Conversation',
        description: 'The full working session behind "Baby Steps" — a Saturday-morning brain dump about local AI worked into an essay with Codex, then the hunt for the right enormous shadow.',
        thumbnail: '/images/transcripts/baby-steps/06-pulp-cast-shadow.webp',
        image: { width: 1774, height: 887 },
        pubDate: '2026-08-15T16:00:00.000Z'
    }
};

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeSlug(value = '') {
    const rawSlug = String(value).split('/')[0] || '';
    let decodedSlug = rawSlug;
    try {
        decodedSlug = decodeURIComponent(rawSlug);
    } catch (e) {
        decodedSlug = rawSlug;
    }

    return decodedSlug
        .replace(/[^a-zA-Z0-9-]/g, '')
        .trim();
}

function absoluteUrl(url) {
    if (!url) return DEFAULT_IMAGE;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${SITE_URL}${url}`;
    return `${SITE_URL}/${url.replace(/^\.?\//, '')}`;
}

function excerptFromArticle(item) {
    const description = stripHtml(item.description || '');
    if (description) return description;
    return stripHtml(item.content || '').slice(0, 240);
}

function truncate(value, maxLength) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).trim()}...`;
}

function renderPage({ item, slug, statusCode = 200 }) {
    const title = item ? stripHtml(item.title) : DEFAULT_TITLE;
    const description = item ? truncate(excerptFromArticle(item), 240) : DEFAULT_DESCRIPTION;
    const pageTitle = item ? `${title} | Charles Wilke` : title;
    const image = absoluteUrl(item && item.thumbnail);
    const imageWidth = item && item.image && item.image.width ? item.image.width : 1200;
    const imageHeight = item && item.image && item.image.height ? item.image.height : 630;
    const shareUrl = `${SITE_URL}/read/${encodeURIComponent(slug)}`;
    const readerHash = `/#read/${encodeURIComponent(slug)}`;
    const published = item && item.pubDate ? new Date(item.pubDate) : null;
    const publishedMeta = published && !isNaN(published)
        ? `<meta property="article:published_time" content="${escapeHtml(published.toISOString())}">`
        : '';
    const fallbackText = statusCode === 200 ? 'Opening the article...' : 'Article not found.';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index,follow,max-image-preview:large">
    <link rel="canonical" href="${escapeHtml(shareUrl)}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Charles Wilke">
    <meta property="og:url" content="${escapeHtml(shareUrl)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:width" content="${escapeHtml(imageWidth)}">
    <meta property="og:image:height" content="${escapeHtml(imageHeight)}">
    <meta property="og:image:alt" content="${escapeHtml(title)}">
    ${publishedMeta}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${escapeHtml(shareUrl)}">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <meta name="twitter:image:alt" content="${escapeHtml(title)}">
    <link rel="icon" type="image/x-icon" href="/favicon.ico?v=202607032147">
    <meta http-equiv="refresh" content="0;url=${escapeHtml(readerHash)}">
    <script>window.location.replace(${JSON.stringify(readerHash)});</script>
</head>
<body>
    <p>${escapeHtml(fallbackText)}</p>
    <p><a href="${escapeHtml(readerHash)}">Open on charleswilke.com</a></p>
    ${item && item.link ? `<p><a href="${escapeHtml(decodeHtmlEntities(item.link))}">Read on Substack</a></p>` : ''}
</body>
</html>`;
}

module.exports = async function handler(req, res) {
    const slug = normalizeSlug(req.query && req.query.slug);

    if (!slug) {
        res.setHeader('Location', '/#writing');
        res.status(302).end();
        return;
    }

    const localItem = LOCAL_ARTICLES[slug];
    if (localItem) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800, stale-if-error=3600');
        res.status(200).send(renderPage({ item: localItem, slug, statusCode: 200 }));
        return;
    }

    try {
        const items = await fetchSubstackItems(200);
        const item = items.find(candidate => slugifyArticle(candidate) === slug);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800, stale-if-error=3600');
        res.status(item ? 200 : 404).send(renderPage({ item, slug, statusCode: item ? 200 : 404 }));
    } catch (err) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300, stale-if-error=3600');
        res.status(502).send(renderPage({ item: null, slug, statusCode: 502 }));
    }
};
