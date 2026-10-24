const crypto = require('crypto');

const ENTRIES_KEY = 'before-times:guestbook:entries:v1';
const MAX_ENTRIES = 100;
const MAX_VISIBLE_ENTRIES = 40;
// Rate-limit and append together: a failed expiry must never lock out a visitor.
const SIGN_GUESTBOOK = `
local kind = redis.call('TYPE', KEYS[2]).ok
if kind ~= 'none' and kind ~= 'list' then return redis.error_reply('Invalid ledger type') end
local count = redis.call('INCR', KEYS[1])
if count == 1 or redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], 900) end
if count > 3 then return -1 end
redis.call('LPUSH', KEYS[2], ARGV[1])
redis.call('LTRIM', KEYS[2], 0, ${MAX_ENTRIES - 1})
return 1
`;

function getKvConfig() {
    return {
        url: process.env.guestbook_KV_REST_API_URL
            || process.env.plays_KV_REST_API_URL
            || process.env.KV_REST_API_URL,
        token: process.env.guestbook_KV_REST_API_TOKEN
            || process.env.plays_KV_REST_API_TOKEN
            || process.env.KV_REST_API_TOKEN,
    };
}

async function kvCommand(url, token, command) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
        signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`KV ${command[0]} failed: ${response.status}`);
    const payload = await response.json();
    if (!payload || payload.error || !Object.hasOwn(payload, 'result')) {
        throw new Error('Guestbook storage rejected command');
    }
    return payload;
}

function parseBody(req) {
    if (typeof req.body === 'string') {
        try { return JSON.parse(req.body); } catch { return {}; }
    }
    return req.body || {};
}

function cleanText(value, maxLength) {
    return String(value || '')
        .normalize('NFKC')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function getClientFingerprint(req, token) {
    const address = process.env.VERCEL === '1'
        ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
        : req.socket?.remoteAddress;
    if (!address) return null;
    return crypto
        .createHmac('sha256', token)
        .update(address)
        .digest('hex')
        .slice(0, 24);
}

function parseEntries(rawEntries) {
    if (!Array.isArray(rawEntries)) throw new Error('Invalid guestbook entries');
    return rawEntries.flatMap((raw) => {
        try {
            const entry = JSON.parse(raw);
            if (!entry || !entry.id || !entry.message || !entry.createdAt) return [];
            return [{
                id: String(entry.id),
                name: cleanText(entry.name, 40) || 'Anonymous visitor',
                message: cleanText(entry.message, 500),
                createdAt: String(entry.createdAt),
            }];
        } catch {
            return [];
        }
    });
}

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'POST' || req.method === 'DELETE') {
        if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).end();
        if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return res.status(415).end();
        if (typeof req.body === 'string' && Buffer.byteLength(req.body) > 4096) return res.status(413).end();
    }

    const { url, token } = getKvConfig();
    if (!url || !token) {
        if (req.method === 'GET') return res.status(200).json({ configured: false, entries: [] });
        return res.status(503).json({ error: 'The public ledger is not connected yet.' });
    }

    if (req.method === 'GET') {
        try {
            const { result } = await kvCommand(url, token, ['LRANGE', ENTRIES_KEY, '0', String(MAX_VISIBLE_ENTRIES - 1)]);
            return res.status(200).json({ configured: true, entries: parseEntries(result) });
        } catch (error) {
            console.error('before-times guestbook read failed', error);
            return res.status(502).json({ error: 'The public ledger is temporarily unavailable.' });
        }
    }

    if (req.method === 'POST') {
        const body = parseBody(req);
        if (cleanText(body.website, 200)) return res.status(204).end();

        const name = cleanText(body.name, 40) || 'Anonymous visitor';
        const message = cleanText(body.message, 500);
        if (message.length < 3) return res.status(400).json({ error: 'Please leave at least a few words.' });
        if (/https?:\/\/|www\./i.test(message) || /https?:\/\/|www\./i.test(name)) {
            return res.status(400).json({ error: 'Please leave links out of the guest book.' });
        }

        const fingerprint = getClientFingerprint(req, token);
        if (!fingerprint) return res.status(503).json({ error: 'The guest book is temporarily unavailable.' });
        const rateKey = `before-times:guestbook:rate:${fingerprint}`;
        try {
            const entry = {
                id: crypto.randomUUID(),
                name,
                message,
                createdAt: new Date().toISOString(),
            };
            const { result } = await kvCommand(url, token, ['EVAL', SIGN_GUESTBOOK, '2', rateKey, ENTRIES_KEY, JSON.stringify(entry)]);
            if (result === -1) {
                res.setHeader('Retry-After', '900');
                return res.status(429).json({ error: 'The ink needs fifteen minutes to dry before another entry.' });
            }
            if (result !== 1) throw new Error('Guestbook storage rejected write');
            return res.status(201).json({ entry });
        } catch (error) {
            console.error('before-times guestbook write failed', error);
            return res.status(502).json({ error: 'The guest book could not hold the ink. Please try again.' });
        }
    }

    if (req.method === 'DELETE') {
        const expected = String(process.env.GUESTBOOK_ADMIN_TOKEN || process.env.PLAYS_REPORT_TOKEN || '').trim();
        const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
        const expectedBytes = Buffer.from(expected);
        const providedBytes = Buffer.from(provided);
        if (!expectedBytes.length || expectedBytes.length !== providedBytes.length || !crypto.timingSafeEqual(expectedBytes, providedBytes)) return res.status(404).end();

        const id = cleanText(parseBody(req).id, 80);
        if (!id) return res.status(400).json({ error: 'Missing entry id.' });
        try {
            const { result } = await kvCommand(url, token, ['LRANGE', ENTRIES_KEY, '0', String(MAX_ENTRIES - 1)]);
            if (!Array.isArray(result)) throw new Error('Invalid guestbook entries');
            const rawEntry = result.find((raw) => {
                try { return JSON.parse(raw).id === id; } catch { return false; }
            });
            if (!rawEntry) return res.status(404).end();
            await kvCommand(url, token, ['LREM', ENTRIES_KEY, '1', rawEntry]);
            return res.status(204).end();
        } catch (error) {
            console.error('before-times guestbook delete failed', error);
            return res.status(502).json({ error: 'The entry could not be removed.' });
        }
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).end();
};
module.exports.config = { api: { bodyParser: { sizeLimit: '4kb' } } };
