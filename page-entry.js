// Shared first-paint reveal. Load synchronously in the head before stylesheets.
(() => {
    const root = document.documentElement;
    // Before Times has its own arrival reveal.
    if (root.classList.contains('bt-present-arrival')) return;
    // Install the cover before parsing the body so the grid never flashes.
    // Without JavaScript the page stays visible.
    const style = document.createElement('style');
    style.textContent = `html.page-entering::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: #1a1550;
    pointer-events: none;
    opacity: 1;
    transition: opacity 400ms ease-out;
    animation: page-entry-fallback 400ms ease-out 4s forwards;
}
html.page-entering.page-ready::after {
    animation: none;
    opacity: 0;
}
@keyframes page-entry-fallback {
    to { opacity: 0; visibility: hidden; }
}
@media (prefers-reduced-motion: reduce) {
    html.page-entering::after {
        transition: none !important;
        animation-duration: 0s;
    }
}`;
    document.head.appendChild(style);
    root.classList.add('page-entering');
    document.addEventListener('DOMContentLoaded', () => {
        const openingImages = document.querySelectorAll('.nav-logo img, .header-wordmark img, .showcase-item-featured img, .biography-banner img, .biography-portrait img, .archive-publication-header img');
        const assets = Array.from(openingImages, image => image.decode().catch(() => {}));
        if (document.fonts) assets.push(document.fonts.ready);
        // Reveal promptly even if an asset stalls; don't wait on lazy media or RSS.
        Promise.race([
            Promise.allSettled(assets),
            new Promise(resolve => setTimeout(resolve, 1200))
        ]).then(() => {
            requestAnimationFrame(() => requestAnimationFrame(() => {
                root.classList.add('page-ready');
                setTimeout(() => root.classList.remove('page-entering', 'page-ready'), 450);
            }));
        });
    }, { once: true });
})();
