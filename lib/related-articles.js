const selections = require('./related-article-selections.json');
const { stripHtml } = require('./substack-utils');

// The existing archive has editorial selections. New essays get a deterministic
// text-similarity fallback until their selections are added to the catalog.
const stopWords = new Set(('the and that this with from have what your they their about into there them then than when will would could should been being were some more most just like only also each these those which where while does dont its our are for but not you all can has how who was had one out now get very even much really because through something things think know want people human humans artificial intelligence generative chatgpt claude essay article transcript conversation collaboration generated image images link charles wilke').split(' '));
function terms(item) {
    // Favor the argument over the appended collaboration notes/transcripts.
    const body = stripHtml(item.content || '').slice(0, 12000);
    const text = `${stripHtml(item.title)} ${stripHtml(item.description)} `.repeat(3) + body;
    const counts = new Map();
    for (const term of text.toLowerCase().match(/[a-z]{3,}/g) || []) {
        if (!stopWords.has(term)) counts.set(term, (counts.get(term) || 0) + 1);
    }
    return counts;
}

function buildRelatedArticles(archive, local = {}, editorial = selections) {
    const slugs = Object.keys(archive).sort();
    const vectors = new Map(slugs.map(slug => [slug, terms(archive[slug])]));
    const frequencies = new Map();
    for (const counts of vectors.values()) {
        for (const word of counts.keys()) frequencies.set(word, (frequencies.get(word) || 0) + 1);
    }
    const lengths = new Map();
    for (const [slug, counts] of vectors) {
        let squared = 0;
        for (const [word, count] of counts) {
            const weight = (1 + Math.log(count)) * (1 + Math.log((slugs.length + 1) / (frequencies.get(word) + 1)));
            counts.set(word, weight);
            squared += weight * weight;
        }
        lengths.set(slug, Math.sqrt(squared));
    }
    function similarity(source, target) {
        let dot = 0;
        for (const [word, weight] of vectors.get(source)) dot += weight * (vectors.get(target).get(word) || 0);
        return dot / ((lengths.get(source) * lengths.get(target)) || 1);
    }
    const related = {};
    for (const slug of slugs) {
        const curated = Object.hasOwn(editorial, slug);
        const chosen = curated ? editorial[slug] : slugs
            .filter(target => target !== slug)
            .sort((a, b) => similarity(slug, b) - similarity(slug, a) || a.localeCompare(b))
            .slice(0, 3).map(target => ({slug: target}));
        if (!Array.isArray(chosen) || chosen.length !== Math.min(3, slugs.length - 1) || new Set(chosen.map(entry => entry?.slug)).size !== chosen.length ||
            chosen.some(entry => !entry || entry.slug === slug || !Object.hasOwn(archive, entry.slug) ||
                (curated && (typeof entry.reason !== 'string' || !entry.reason.trim())))) {
            throw new Error(`Invalid related reading selections for ${slug}`);
        }
        related[slug] = chosen.map(entry => ({
            slug: entry.slug,
            title: stripHtml(archive[entry.slug].title),
            description: stripHtml(archive[entry.slug].description || '').slice(0, 180),
            ...(entry.reason ? {reason: entry.reason.trim()} : {})
        }));
    }
    // Conversations lead back into essays, never into other transcripts.
    for (const slug of Object.keys(local)) related[slug] = related[slug.replace(/-transcript$/, '')] || [];
    return related;
}

module.exports = { buildRelatedArticles };
