const archive = require('../articles/archive.json');
const local = require('../articles/local.json');
const related = require('../articles/related.json');
const { fetchSubstackItemBySlug } = require('../lib/substack-utils');
const { validSlug, renderArticle } = require('../lib/article-archive');

module.exports = async function handler(req, res) {
    let slug = String(req.query?.slug || '');
    try { slug = decodeURIComponent(slug); } catch (error) { slug = ''; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (!validSlug(slug)) {
        res.status(404).send(renderArticle(null, '', 404));
        return;
    }
    try {
        const item = (Object.hasOwn(local, slug) && local[slug]) || (Object.hasOwn(archive, slug) && archive[slug]) || await fetchSubstackItemBySlug(slug);
        res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800, stale-if-error=3600');
        res.status(item ? 200 : 404).send(renderArticle(item, slug, item ? 200 : 404, related[slug] || []));
    } catch (error) {
        res.setHeader('Cache-Control', 'no-store');
        res.status(502).send(renderArticle(null, slug, 502));
    }
};
