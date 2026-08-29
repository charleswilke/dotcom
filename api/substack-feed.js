// Vercel serverless function replacing substack_feed.php
// Fetches Substack RSS feed and returns JSON with the same structure

const {
    fetchSubstackItemBySlug,
    fetchSubstackItems,
    summarizeSubstackItem
} = require('../lib/substack-utils');

function normalizeSlug(value = '') {
    let decoded = String(value || '');
    try { decoded = decodeURIComponent(decoded); } catch (error) { /* use raw value */ }
    return /^[a-z0-9][a-z0-9-]{0,100}$/i.test(decoded) ? decoded : '';
}

module.exports = async function handler(req, res) {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));
    const slug = normalizeSlug(req.query.slug);
    const summaryOnly = req.query.summary === '1';

    try {
        if (slug) {
            const item = await fetchSubstackItemBySlug(slug);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800, stale-if-error=3600');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.status(item ? 200 : 404).json(item
                ? { status: 'ok', item }
                : { status: 'error', message: 'Article not found' });
            return;
        }

        const items = await fetchSubstackItems(limit, { enrichVideo: !summaryOnly });
        const payloadItems = summaryOnly ? items.map(summarizeSubstackItem) : items;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800, stale-if-error=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ status: 'ok', items: payloadItems });
    } catch (err) {
        res.status(502).json({ status: 'error', message: err.message });
    }
};
