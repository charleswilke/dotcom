const { test } = require('node:test');
const assert = require('node:assert/strict');
const archive = require('../articles/archive.json');
const local = require('../articles/local.json');
const selections = require('../lib/related-article-selections.json');
const related = require('../articles/related.json');
const { buildRelatedArticles } = require('../lib/related-articles');
const { renderArticle, escapeHtml } = require('../lib/article-archive');

test('every retained essay has three selections pointing to distinct existing essays', () => {
    for (const [slug, chosen] of Object.entries(selections)) {
        assert.ok(Object.hasOwn(archive, slug), `Unknown editorial source: ${slug}`);
        assert.deepEqual(related[slug].map(entry => entry.slug), chosen.map(entry => entry.slug));
        for (const entry of chosen) {
            assert.ok(entry.reason.length > 30 && entry.reason.length < 360, `${slug}: explanation should be one concise sentence`);
            assert.equal((entry.reason.match(/[.!?](?:\s|$)/g) || []).length, 1, `${slug}: explanation should be a single sentence`);
            assert.equal(related[slug].find(target => target.slug === entry.slug).reason, entry.reason);
        }
    }
    for (const slug of Object.keys(archive)) {
        assert.equal(related[slug].length, 3);
        assert.equal(new Set(related[slug].map(entry => entry.slug)).size, 3);
        for (const entry of related[slug]) {
            assert.notEqual(entry.slug, slug);
            assert.ok(Object.hasOwn(archive, entry.slug));
            assert.ok(entry.title);
        }
    }
    for (const slug of Object.keys(local)) {
        assert.deepEqual(related[slug], related[slug.replace(/-transcript$/, '')]);
    }
});

test('new essays get reproducible content-based choices without editorial entries', () => {
    const fixture = {
        gardening: { title: 'Gardening', content: '<p>Soil seeds garden harvest plants</p>' },
        planting: { title: 'Planting', content: '<p>Garden plants soil seeds harvest</p>' },
        music: { title: 'Music', content: '<p>Orchestra melody rhythm concert</p>' },
        astronomy: { title: 'Astronomy', content: '<p>Planets orbit galaxy telescope</p>' },
        cooking: { title: 'Cooking', content: '<p>Kitchen recipes skillet dinner</p>' }
    };
    const result = buildRelatedArticles(fixture, {}, {});
    assert.equal(result.gardening[0].slug, 'planting');
    assert.equal(result.gardening.length, 3);
    assert.ok(result.gardening.every(entry => entry.slug !== 'gardening'));
    assert.deepEqual(result, buildRelatedArticles(Object.fromEntries(Object.entries(fixture).reverse()), {}, {}));
    assert.throws(() => buildRelatedArticles(fixture, {}, {gardening: ['planting', 'planting', 'missing']}), /Invalid related reading/);
    assert.throws(() => buildRelatedArticles(fixture, {}, {gardening: [{slug: 'planting'}, {slug: 'music'}, {slug: 'astronomy'}]}), /Invalid related reading/);
});

test('article API includes crawlable related links after the body and excludes them from errors', async () => {
    const slug = 'what-hope-do-we-have';
    const response = { setHeader() {}, status(code) { this.code = code; return this; }, send(html) { this.html = html; } };
    await require('../api/article-preview')({query: {slug}}, response);
    assert.equal(response.code, 200);
    const section = response.html.match(/<section class="article-related"[\s\S]*?<\/section>/)[0];
    assert.equal((section.match(/href="\/read\//g) || []).length, 3);
    assert.ok(response.html.indexOf(section) > response.html.indexOf('class="article-body'));
    assert.ok(response.html.indexOf(section) < response.html.indexOf('<footer class="archive-footer"'));
    for (const entry of related[slug]) {
        assert.ok(section.includes(`href="/read/${entry.slug}"`));
        assert.ok(section.includes(escapeHtml(entry.reason)));
        assert.ok(!section.includes(escapeHtml(entry.description)));
    }
    assert.doesNotMatch(renderArticle(null, 'missing', 404, related[slug]), /article-related/);
    const escaped = renderArticle(archive[slug], slug, 200, [{slug: 'safe', title: '<img onerror="alert(1)">', reason: '<script>unsafe</script>'}]);
    assert.ok(escaped.includes('&lt;img onerror='));
    assert.doesNotMatch(escaped, /<script>unsafe/);
    const fallback = renderArticle(archive[slug], slug, 200, [{slug: 'safe', title: 'Safe', description: 'A subtitle awaiting editorial context.'}]);
    assert.ok(fallback.includes('A subtitle awaiting editorial context.'));
});
