// Records a play of a song/recap. Fire-and-forget beacon from the client.
// Increments two counters in Upstash Redis (Vercel KV):
//   plays:total:{album}:{slug}
//   plays:daily:{album}:{slug}:{YYYY-MM-DD}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,80}$/;

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end();
    }

    const url = process.env.plays_KV_REST_API_URL || process.env.KV_REST_API_URL;
    const token = process.env.plays_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!url || !token) {
        return res.status(500).json({ error: 'KV not configured' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const album = String(body.album || '').toLowerCase();
    const slug = String(body.slug || '').toLowerCase();
    if (!SLUG_RE.test(album) || !SLUG_RE.test(slug)) {
        return res.status(400).json({ error: 'invalid album or slug' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const totalKey = `plays:total:${album}:${slug}`;
    const dailyKey = `plays:daily:${album}:${slug}:${today}`;

    try {
        const response = await fetch(`${url}/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([
                ['INCR', totalKey],
                ['INCR', dailyKey],
            ]),
        });
        if (!response.ok) {
            const text = await response.text();
            console.error('KV pipeline failed', response.status, text);
            return res.status(502).json({ error: 'upstream failed' });
        }
        return res.status(204).end();
    } catch (err) {
        console.error('KV pipeline error', err);
        return res.status(502).json({ error: 'upstream error' });
    }
}
