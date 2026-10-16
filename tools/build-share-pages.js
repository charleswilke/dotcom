// Serve the homepage with route-specific social previews, without a redirect.
// Root HTML files supply preview metadata; index.html supplies the complete UI.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const entries = ['junkyard-cabaret', 'l.ai.bor'];

function build(root = path.resolve(__dirname, '..')) {
    const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const output = path.join(root, 'generated/share-pages');
    fs.mkdirSync(output, { recursive: true });

    for (const entry of entries) {
        const template = fs.readFileSync(path.join(root, `${entry}.html`), 'utf8');
        const previewTags = template.match(/<title>[\s\S]*?<\/title>|<meta\s+(?:name="(?:title|description|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g);
        if (!previewTags) throw new Error(`Missing social preview metadata for ${entry}`);

        // Keep the homepage's canonical: these URLs show the same complete page.
        // Set its normal hash before nav.js/common.js/main.js initialize. History
        // replacement changes the address in place; it makes no second request.
        const entryScript = `<script>window.history.replaceState(window.history.state, '', '/' + window.location.search + (window.location.hash || ${JSON.stringify(`#${entry}`)}));</script>`;
        const html = homepage
            .replace(/<title>[\s\S]*?<\/title>|<meta\s+(?:name="(?:description|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, '')
            .replace(/<meta name="viewport"[^>]*>/, viewport => `${viewport}\n    ${previewTags.join('\n    ')}\n    ${entryScript}`);
        fs.writeFileSync(path.join(output, `${entry}.html`), html);
    }
}

if (require.main === module) build();
module.exports = { build };
