// Use the same content version in runtime HTML as in build-stamped static pages.
// A static require lets Vercel package the generated versions with the function;
// runtime rendering does not depend on deployed static files being on its disk.
let deployedVersions;
try { deployedVersions = require('./asset-versions.json'); }
catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }

function assetUrl(url) {
    const version = deployedVersions?.[url];
    if (!version && process.env.VERCEL === '1') throw new Error('Missing asset version; run npm run build');
    // Local previews can run before stamping. This URL deliberately revalidates.
    return `${url}?v=${version || 'dev'}`;
}
module.exports = { assetUrl };
