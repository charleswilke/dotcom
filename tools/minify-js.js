#!/usr/bin/env node
/**
 * Minify standalone browser scripts in place during the Vercel build.
 * Source files stay readable in git and local development.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const files = process.argv.slice(2);
if (!files.length) {
    console.error('Usage: node tools/minify-js.js <file.js...>');
    process.exit(1);
}

const kb = bytes => `${(bytes / 1024).toFixed(1)}K`;

(async () => {
    let totalIn = 0;
    let totalOut = 0;

    for (const file of files) {
        if (!fs.existsSync(file)) {
            console.error(`  ! ${file} not found`);
            process.exit(1);
        }

        const source = fs.readFileSync(file, 'utf8');
        const result = await minify(source, {
            compress: { passes: 2 },
            mangle: true,
            format: { comments: false }
        });
        if (!result.code) throw new Error(`Terser produced no output for ${file}`);

        const inputBytes = Buffer.byteLength(source);
        const outputBytes = Buffer.byteLength(result.code);
        totalIn += inputBytes;
        totalOut += outputBytes;
        fs.writeFileSync(file, result.code);
        console.log(`  ${path.basename(file)}: ${kb(inputBytes)} -> ${kb(outputBytes)}  (-${((1 - outputBytes / inputBytes) * 100).toFixed(1)}%)`);
    }

    console.log(`  total: ${kb(totalIn)} -> ${kb(totalOut)}  (-${((1 - totalOut / totalIn) * 100).toFixed(1)}%)`);
})().catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
});
