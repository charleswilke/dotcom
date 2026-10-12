// The article text is server-rendered. Only Substack media placeholders need JS.
document.querySelectorAll('.native-audio-embed,.native-video-embed').forEach(el => {
    try {
        const attrs = JSON.parse(el.getAttribute('data-attrs') || '{}');
        if (!attrs.mediaUploadId) return;
        const kind = el.classList.contains('native-video-embed') ? 'video' : 'audio';
        const src = `https://charleswilke.substack.com/api/v1/${kind}/upload/${encodeURIComponent(attrs.mediaUploadId)}/src`;
        if (kind === 'audio' && window.ArticleReaderUI) {
            el.replaceWith(window.ArticleReaderUI.createScopePlayer(src, 'Recap'));
            return;
        }
        const media = document.createElement(kind);
        media.src = src;
        media.controls = true;
        media.preload = kind === 'video' ? 'metadata' : 'none';
        if (kind === 'video') {
            media.className = 'article-reader-video';
            media.setAttribute('playsinline', '');
            if (typeof attrs.thumbnailUrl === 'string' && attrs.thumbnailUrl.startsWith('https://')) media.poster = attrs.thumbnailUrl;
        }
        el.replaceWith(media);
    } catch (error) { /* Leave the article text readable if an embed is malformed. */ }
});
document.addEventListener('play', event => {
    if (!event.target.matches('audio,video')) return;
    document.querySelectorAll('audio,video').forEach(media => { if (media !== event.target) media.pause(); });
}, true);

// Keep document scrolling, with the same tick rail and drag behavior as the overlay.
if (document.body.classList.contains('article-page') && window.ArticleReaderUI) {
    document.documentElement.classList.add('article-reader-enhanced');
    const bar = document.createElement('div');
    bar.className = 'article-page-scrollbar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<div class="article-reader-rail"></div><div class="article-reader-thumb"></div>';
    document.body.appendChild(bar);
    const scroll = {
        get clientHeight() { return bar.clientHeight; },
        get scrollHeight() { return document.documentElement.scrollHeight - (innerHeight - bar.clientHeight); },
        get scrollTop() { return window.scrollY; },
        set scrollTop(value) { window.scrollTo({top:value, behavior:'instant'}); }
    };
    const update = window.ArticleReaderUI.attachScrollbar(scroll, bar.querySelector('.article-reader-thumb'), bar.querySelector('.article-reader-rail'), {scrollTarget:window, resizeTarget:document.body});
    document.addEventListener('load', update, true);
    document.fonts.ready.then(update);
}

// Progressive enhancement: every essay remains readable and linked without JS.
const archiveSearch = document.querySelector('#archive-search');
if (archiveSearch) {
    initLaiborRails(document.querySelector('.archive-surface'));
    const normalize = text => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const sections = [...document.querySelectorAll('.archive-year')];
    const entries = sections.flatMap(section => [...section.querySelectorAll('.archive-entry')].map(el => ({
        el, year: section.dataset.year, text: normalize(el.dataset.search)
    })));
    const grids = [...document.querySelectorAll('.archive-list')];
    function layoutArchiveCards() {
        grids.forEach(grid => {
            if (grid.closest('.archive-year').hidden) return;
            const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
            const cards = [...grid.querySelectorAll('.archive-entry:not([hidden])')];
            grid.classList.toggle('is-masonry', columns > 1);
            if (columns === 1) {
                cards.forEach(card => { card.style.removeProperty('grid-column'); card.style.removeProperty('grid-row'); });
                return;
            }
            const bottoms = Array(columns).fill(0);
            // Read all intrinsic heights before writing positions. Images reserve their
            // aspect ratio in CSS, so lazy loading cannot move the cards around.
            const heights = cards.map(card => Math.ceil(card.getBoundingClientRect().height));
            cards.forEach((card, index) => {
                const column = bottoms.indexOf(Math.min(...bottoms));
                card.style.gridColumn = String(column + 1);
                card.style.gridRow = `${bottoms[column] + 1} / span ${heights[index]}`;
                bottoms[column] += heights[index] + 24;
            });
        });
    }
    // Mobile browser chrome changes viewport HEIGHT while scrolling. Only a real
    // container WIDTH change may trigger responsive repacking; never reset scroll.
    const widths = new WeakMap();
    let layoutFrame = 0;
    const gridObserver = new ResizeObserver(changes => {
        let changed = false;
        changes.forEach(({target, contentRect}) => {
            if (!contentRect.width) return;
            const width = Math.round(contentRect.width * 100) / 100;
            if (widths.get(target) === width) return;
            widths.set(target, width);
            changed = true;
        });
        if (changed && !layoutFrame) layoutFrame = requestAnimationFrame(() => {
            layoutFrame = 0;
            layoutArchiveCards();
        });
    });
    grids.forEach(grid => gridObserver.observe(grid));
    document.fonts.ready.then(layoutArchiveCards);
    const filters = [...document.querySelectorAll('.archive-year-nav [data-year]')];
    const status = document.querySelector('.archive-result-count');
    let year = 'all';
    function filterArchive() {
        const terms = normalize(archiveSearch.value.trim()).split(/\s+/).filter(Boolean);
        let count = 0;
        entries.forEach(entry => {
            entry.el.hidden = !((year === 'all' || entry.year === year) && terms.every(term => entry.text.includes(term)));
            if (!entry.el.hidden) count++;
        });
        sections.forEach(section => {
            const visible = section.querySelectorAll('.archive-entry:not([hidden])').length;
            section.hidden = visible === 0;
            section.querySelector('.archive-year-heading span').textContent = `${visible} ${visible === 1 ? 'essay' : 'essays'}`;
        });
        filters.forEach(link => {
            if (link.dataset.year === year) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
        });
        status.textContent = `${count} of ${entries.length} essays${year === 'all' ? '' : ` · ${year}`}`;
        document.querySelector('.archive-empty').hidden = count !== 0;
        layoutArchiveCards();
    }
    document.querySelector('.archive-search').hidden = false;
    status.hidden = false;
    archiveSearch.addEventListener('input', filterArchive);
    filters.forEach(link => link.addEventListener('click', event => {
        event.preventDefault();
        year = link.dataset.year;
        filterArchive();
    }));
    document.querySelector('#archive-reset').addEventListener('click', () => {
        archiveSearch.value = '';
        year = 'all';
        filterArchive();
        archiveSearch.focus();
    });
    // Year links also work when followed from outside this page.
    const initialYear = location.hash.match(/^#year-(\d{4})$/)?.[1];
    if (initialYear && filters.some(link => link.dataset.year === initialYear)) year = initialYear;
    filterArchive();
}
