const FEED_URL = 'https://charleswilke.substack.com/feed';
const VIDEO_META_URL = 'https://charleswilke.substack.com/api/v1/video/upload';

function decodeHtmlEntities(value = '') {
    return String(value)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#39;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8216;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#(\d+);/g, (_, code) => {
            const n = Number(code);
            return Number.isFinite(n) ? String.fromCodePoint(n) : _;
        })
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
            const n = parseInt(code, 16);
            return Number.isFinite(n) ? String.fromCodePoint(n) : _;
        });
}

function stripHtml(value = '') {
    return decodeHtmlEntities(String(value).replace(/<[^>]*>/g, ''))
        .replace(/\s+/g, ' ')
        .trim();
}

function extractTag(itemXml, tag) {
    const escapedTag = tag.replace(':', '\\:');
    const cdataRe = new RegExp(`<${escapedTag}(?:\\s[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escapedTag}>`, 'i');
    const cdataMatch = itemXml.match(cdataRe);
    if (cdataMatch) return cdataMatch[1];

    const plainRe = new RegExp(`<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}>`, 'i');
    const plainMatch = itemXml.match(plainRe);
    return plainMatch ? plainMatch[1].trim() : '';
}

function parseAttributes(tag = '') {
    const attrs = {};
    const attrRe = /([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    let match;
    while ((match = attrRe.exec(tag)) !== null) {
        attrs[match[1].toLowerCase()] = match[2] || match[3] || match[4] || '';
    }
    return attrs;
}

function parseDimension(value) {
    const n = parseFloat(value);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function extractFirstImage(markup = '') {
    const imgMatch = String(markup).match(/<img\b[^>]*>/i);
    if (!imgMatch) return null;

    const attrs = parseAttributes(imgMatch[0]);
    if (!attrs.src) return null;

    return {
        url: decodeHtmlEntities(attrs.src),
        width: parseDimension(attrs.width),
        height: parseDimension(attrs.height),
        alt: stripHtml(attrs.alt || '')
    };
}

function extractCategories(itemXml) {
    const categories = [];
    const catRe = /<category(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi;
    let catMatch;
    while ((catMatch = catRe.exec(itemXml)) !== null) {
        const category = stripHtml(catMatch[1]);
        if (category) categories.push(category);
    }
    return categories;
}

function decodeSlug(value) {
    try {
        return decodeURIComponent(value);
    } catch (e) {
        return value;
    }
}

function slugifyArticle(item) {
    if (item && item.link) {
        const m = item.link.match(/\/p\/([^/?#]+)/);
        if (m) return decodeSlug(m[1]);
    }

    const title = (item && item.title) ? item.title : String(item || 'article');
    return stripHtml(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'article';
}

function parseRssItems(xml, limit = 100) {
    const parts = String(xml || '').split(/<item[\s>]/i);
    parts.shift();

    const items = [];
    for (const part of parts) {
        if (items.length >= limit) break;

        const title = extractTag(part, 'title');
        const link = extractTag(part, 'link');
        const pubDate = extractTag(part, 'pubDate');
        const description = extractTag(part, 'description');
        const content = extractTag(part, 'content:encoded') || description;
        const image = extractFirstImage(content) || extractFirstImage(description);
        const thumbnail = image ? image.url : '';
        const categories = extractCategories(part);

        items.push({ title, link, pubDate, description, content, thumbnail, image, categories });
    }

    return items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

function encodeAttrEntities(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Rewrite the data-attrs JSON on each native-video-embed div in a content
// string. `fn(attrs)` returns the new attrs object, or null to leave the
// embed untouched.
function mapVideoEmbeds(content, fn) {
    return String(content || '').replace(/<div\b[^>]*\bnative-video-embed\b[^>]*>/gi, (tag) => {
        const attrMatch = tag.match(/data-attrs="([^"]*)"/i);
        if (!attrMatch) return tag;

        let attrs;
        try {
            attrs = JSON.parse(decodeHtmlEntities(attrMatch[1]));
        } catch (e) {
            return tag;
        }
        if (!attrs || typeof attrs !== 'object') return tag;

        const next = fn(attrs);
        if (!next) return tag;
        return tag.replace(attrMatch[0], `data-attrs="${encodeAttrEntities(JSON.stringify(next))}"`);
    });
}

// The RSS payload only carries mediaUploadId for native video embeds. The
// poster frame lives in per-upload metadata (thumbnail_url), served without
// CORS headers — so it must be resolved here, server-side, and injected into
// data-attrs as thumbnailUrl for main.js's hydrateNativeMedia to pick up.
async function enrichVideoEmbeds(items) {
    const uploadIds = new Set();
    for (const item of items) {
        mapVideoEmbeds(item.content, (attrs) => {
            if (attrs.mediaUploadId && !attrs.thumbnailUrl) uploadIds.add(attrs.mediaUploadId);
            return null;
        });
    }
    if (uploadIds.size === 0) return items;

    const thumbnails = {};
    await Promise.all([...uploadIds].map(async (id) => {
        try {
            const res = await fetch(`${VIDEO_META_URL}/${encodeURIComponent(id)}`, {
                headers: { 'User-Agent': 'SubstackFeedFetcher/1.0 (+charleswilke.com)' },
                signal: AbortSignal.timeout(5000)
            });
            if (!res.ok) return;
            const meta = await res.json();
            if (meta && typeof meta.thumbnail_url === 'string') thumbnails[id] = meta.thumbnail_url;
        } catch (e) {
            // Metadata lookup failed — the embed stays posterless, which is
            // exactly the pre-enrichment behavior.
        }
    }));

    for (const item of items) {
        item.content = mapVideoEmbeds(item.content, (attrs) => (
            thumbnails[attrs.mediaUploadId]
                ? { ...attrs, thumbnailUrl: thumbnails[attrs.mediaUploadId] }
                : null
        ));
    }
    return items;
}

async function fetchSubstackItems(limit = 100) {
    const response = await fetch(FEED_URL, {
        headers: {
            'User-Agent': 'SubstackFeedFetcher/1.0 (+charleswilke.com)',
            'Accept': 'application/rss+xml, application/xml, text/xml'
        }
    });

    if (!response.ok) {
        throw new Error(`Fetch failed: HTTP ${response.status}`);
    }

    return enrichVideoEmbeds(parseRssItems(await response.text(), limit));
}

module.exports = {
    FEED_URL,
    decodeHtmlEntities,
    enrichVideoEmbeds,
    fetchSubstackItems,
    parseRssItems,
    slugifyArticle,
    stripHtml
};
