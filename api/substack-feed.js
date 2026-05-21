// Vercel serverless function replacing substack_feed.php
// Fetches Substack RSS feed and returns JSON with the same structure

const { fetchSubstackItems } = require('../lib/substack-utils');

module.exports = async function handler(req, res) {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 100));

    try {
        const items = await fetchSubstackItems(limit);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800, stale-if-error=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json({ status: 'ok', items });
    } catch (err) {
        res.status(502).json({ status: 'error', message: err.message });
    }
};
