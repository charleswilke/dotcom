// Keep the local browser bundle and server-side track allowlist in sync at build time.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
fs.mkdirSync(path.join(root, 'vendor'), { recursive: true });
fs.copyFileSync(require.resolve('dompurify/dist/purify.min.js'), path.join(root, 'vendor/dompurify.min.js'));
fs.copyFileSync(path.join(path.dirname(require.resolve('dompurify/dist/purify.min.js')), '../LICENSE'), path.join(root, 'vendor/DOMPurify-LICENSE.txt'));
const tracks = new Set();
function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) visit(file);
        else {
            const relative = path.relative(path.join(root, 'audio'), file).split(path.sep).join('/');
            const match = relative.match(/^(?:([^/]+)\/)?([^/]+)\.(?:mp3|mp4|mov|m4a|wav)$/i);
            if (!match) continue;
            const album = (match[1] || 'recaps').toLowerCase();
            const slug = match[2].toLowerCase();
            if (/^[a-z0-9][a-z0-9-]{0,80}$/.test(album) && /^[a-z0-9][a-z0-9-]{0,80}$/.test(slug)) tracks.add(`${album}/${slug}`);
        }
    }
}
visit(path.join(root, 'audio'));
fs.writeFileSync(path.join(root, 'lib/play-catalog.json'), JSON.stringify([...tracks].sort(), null, 2) + '\n');
console.log(`Prepared DOMPurify and ${tracks.size} allowed play targets.`);
