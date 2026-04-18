// Returns all play counters as JSON. Gated by a shared-secret query param.
// Usage: GET /api/plays-report?token=<PLAYS_REPORT_TOKEN>

async function kvCommand(url, token, command) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
    });
    if (!res.ok) throw new Error(`KV ${command[0]} failed: ${res.status}`);
    return res.json();
}

async function scanAll(url, token, pattern) {
    const keys = [];
    let cursor = '0';
    do {
        const { result } = await kvCommand(url, token, ['SCAN', cursor, 'MATCH', pattern, 'COUNT', '500']);
        cursor = result[0];
        keys.push(...result[1]);
    } while (cursor !== '0');
    return keys;
}

async function mget(url, token, keys) {
    if (keys.length === 0) return [];
    const { result } = await kvCommand(url, token, ['MGET', ...keys]);
    return result;
}

module.exports = async function handler(req, res) {
    const expected = (process.env.PLAYS_REPORT_TOKEN || '').trim();
    const provided = req.query.token;
    if (!expected || provided !== expected) {
        return res.status(404).end();
    }

    const url = process.env.plays_KV_REST_API_URL || process.env.KV_REST_API_URL;
    const token = process.env.plays_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
        return res.status(500).json({ error: 'KV not configured' });
    }

    try {
        const [totalKeys, dailyKeys] = await Promise.all([
            scanAll(url, token, 'plays:total:*'),
            scanAll(url, token, 'plays:daily:*'),
        ]);
        const [totalVals, dailyVals] = await Promise.all([
            mget(url, token, totalKeys),
            mget(url, token, dailyKeys),
        ]);

        const totals = {};
        totalKeys.forEach((k, i) => {
            const [, , album, slug] = k.split(':');
            totals[`${album}/${slug}`] = parseInt(totalVals[i], 10) || 0;
        });

        const daily = {};
        dailyKeys.forEach((k, i) => {
            const [, , album, slug, date] = k.split(':');
            const trackKey = `${album}/${slug}`;
            daily[trackKey] = daily[trackKey] || {};
            daily[trackKey][date] = parseInt(dailyVals[i], 10) || 0;
        });

        const sortedTotals = Object.entries(totals).sort((a, b) => b[1] - a[1]);

        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({
            generatedAt: new Date().toISOString(),
            trackCount: sortedTotals.length,
            totals: Object.fromEntries(sortedTotals),
            daily,
        });
    } catch (err) {
        console.error('plays-report failed', err);
        return res.status(502).json({ error: String(err) });
    }
}
