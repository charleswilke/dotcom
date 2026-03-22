// Vercel serverless function replacing substack_feed.php
// Fetches Substack RSS feed and returns JSON with the same structure

const FEED_URL = 'https://charleswilke.substack.com/feed';

function extractTag(itemXml, tag) {
    const escapedTag = tag.replace(':', '\\:');
    // CDATA version
    const cdataRe = new RegExp(`<${escapedTag}(?:\\s[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escapedTag}>`, 'i');
    const cdataMatch = itemXml.match(cdataRe);
    if (cdataMatch) return cdataMatch[1];
    // Plain text version
    const plainRe = new RegExp(`<${escapedTag}(?:\\s[^>]*)?>([^<]*)<\\/${escapedTag}>`, 'i');
    const plainMatch = itemXml.match(plainRe);
    return plainMatch ? plainMatch[1].trim() : '';
}

function parseRssItems(xml, limit) {
    const parts = xml.split(/<item[\s>]/i);
    parts.shift(); // remove preamble before first <item>

    const items = [];
    for (const part of parts) {
        if (items.length >= limit) break;

        const title = extractTag(part, 'title');
        const link = extractTag(part, 'link');
        const pubDate = extractTag(part, 'pubDate');
        const description = extractTag(part, 'description');
        const content = extractTag(part, 'content:encoded') || description;

        // Extract thumbnail from first img tag in content or description
        let thumbnail = '';
        const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i)
            || description.match(/<img[^>]+src="([^"]+)"/i);
        if (imgMatch) thumbnail = imgMatch[1];

        // Extract all categories
        const categories = [];
        const catRe = /<category(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi;
        let catMatch;
        while ((catMatch = catRe.exec(part)) !== null) {
            categories.push(catMatch[1].trim());
        }

        items.push({ title, link, pubDate, description, content, thumbnail, categories });
    }

    return items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}

module.exports = async function handler(req, res) {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));

    try {
        const response = await fetch(FEED_URL, {
            headers: {
                'User-Agent': 'SubstackFeedFetcher/1.0 (+charleswilke.com)',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            }
        });

        if (!response.ok) {
            throw new Error(`Fetch failed: HTTP ${response.status}`);
        }

        const xml = await response.text();
        const items = parseRssItems(xml, limit);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800, stale-if-error=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ status: 'ok', items });
    } catch (err) {
        res.status(502).json({ status: 'error', message: err.message });
    }
};
