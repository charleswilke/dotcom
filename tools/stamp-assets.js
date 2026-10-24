// Run after minification so every HTML entry references the deployed bytes.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

function stampAssets(root = path.resolve(__dirname, '..'), check = false) {
    const versions = new Map();
    const changed = [];
    function stamp(file) {
        const original = fs.readFileSync(file, 'utf8');
        const html = original.replace(/\b(src|href)=(['"])([^'"\n]+)\2/g, (match, attr, quote, raw) => {
            if (/^(?:[a-z]+:|\/\/|#)/i.test(raw)) return match;
            const base = 'https://assets.invalid/' + path.relative(root, file).split(path.sep).join('/');
            const url = new URL(raw.replace(/&amp;/g, '&'), base);
            if (!/\.(?:css|js)$/.test(url.pathname)) return match;
            const target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
            if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) return match;
            if (!versions.has(target)) versions.set(target, createHash('sha256').update(fs.readFileSync(target)).digest('hex').slice(0, 16));
            url.searchParams.set('v', versions.get(target));
            const pathname = raw.split(/[?#]/)[0];
            return `${attr}=${quote}${pathname}${url.search.replace(/&/g, '&amp;')}${url.hash}${quote}`;
        });
        if (html === original) return;
        changed.push(path.relative(root, file));
        if (!check) fs.writeFileSync(file, html);
    }
    function visit(directory, recursive) {
        if (!fs.existsSync(directory)) return;
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory() && recursive && !['node_modules', 'build', 'src', '.git'].includes(entry.name)) visit(file, true);
            else if (entry.isFile() && entry.name.endsWith('.html')) stamp(file);
        }
    }
    visit(root, false);
    for (const directory of ['games', 'songs', 'generated', 'OMAxAI/viewer', 'transcripts']) visit(path.join(root, directory), true);
    // The API emits these links at request time rather than in a static entry.
    for (const url of ['/reader-base.css', '/article-archive.css', '/article-reader-ui.js', '/common.js', '/article-archive.js', '/nav.js']) {
        const file = path.join(root, url);
        if (fs.existsSync(file)) versions.set(file, createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16));
    }
    if (!check) {
        fs.mkdirSync(path.join(root, 'lib'), {recursive:true});
        const manifest = Object.fromEntries([...versions].map(([file,version]) => ['/' + path.relative(root,file).split(path.sep).join('/'),version]).sort(([a],[b])=>a.localeCompare(b)));
        fs.writeFileSync(path.join(root, 'lib/asset-versions.json'), JSON.stringify(manifest, null, 2) + '\n');
    }
    return changed;
}
if (require.main === module) {
    const check = process.argv.includes('--check');
    const changed = stampAssets(undefined, check);
    console.log(`${changed.length} HTML entries ${check ? 'need updated' : 'received'} asset versions.`);
    if (check && changed.length) process.exitCode = 1;
}
module.exports = { stampAssets };
