// Anonymous analytics are approximate. Bound storage and suppress repeat/spam writes.
const crypto = require('node:crypto');
const tracks = new Set(require('../lib/play-catalog.json'));
const RECORD_PLAY = `
local global = redis.call('INCR', KEYS[1])
if global == 1 then redis.call('EXPIRE', KEYS[1], 60) end
if global > 1000 then return -1 end
local client = redis.call('INCR', KEYS[2])
if client == 1 then redis.call('EXPIRE', KEYS[2], 60) end
if client > 60 then return -1 end
if not redis.call('SET', KEYS[3], '1', 'EX', 1800, 'NX') then return 0 end
redis.call('INCR', KEYS[4])
redis.call('INCR', KEYS[5])
redis.call('EXPIRE', KEYS[5], 34560000)
return 1
`;

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end();
    }
    // Browsers must submit from this site; this is not a substitute for rate limits.
    if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).end();
    const url = process.env.plays_KV_REST_API_URL || process.env.KV_REST_API_URL;
    const token = process.env.plays_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) return res.status(503).json({ error: 'Tracking unavailable' });

    let body = req.body;
    if (typeof body === 'string') {
        if (Buffer.byteLength(body) > 2048) return res.status(413).end();
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    const album = typeof body?.album === 'string' ? body.album.toLowerCase() : '';
    const slug = typeof body?.slug === 'string' ? body.slug.toLowerCase() : '';
    if (!tracks.has(`${album}/${slug}`)) return res.status(400).json({ error: 'Unknown track' });

    // Vercel overwrites x-forwarded-for. Local servers use the socket address.
    const address = process.env.VERCEL === '1'
        ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
        : req.socket?.remoteAddress;
    if (!address) return res.status(503).json({ error: 'Tracking unavailable' });
    const fingerprint = crypto.createHmac('sha256', token).update(address).digest('hex').slice(0, 32);
    const today = new Date().toISOString().slice(0, 10);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000),
            body: JSON.stringify(['EVAL', RECORD_PLAY, '5',
                'plays:rate:global', `plays:rate:${fingerprint}`,
                `plays:dedup:${fingerprint}:${album}:${slug}`,
                `plays:total:${album}:${slug}`, `plays:daily:${album}:${slug}:${today}`]),
        });
        if (!response.ok) throw new Error('Tracking storage unavailable');
        const payload = await response.json();
        if (payload.error || ![0, 1, -1].includes(payload.result)) throw new Error('Tracking storage rejected write');
        if (payload.result === -1) {
            res.setHeader('Retry-After', '60');
            return res.status(429).end();
        }
        return res.status(204).end();
    } catch {
        return res.status(502).json({ error: 'Tracking unavailable' });
    }
};
module.exports.config = { api: { bodyParser: { sizeLimit: '2kb' } } };
