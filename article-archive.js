// The article text is server-rendered. Only Substack media placeholders need JS.
document.querySelectorAll('.native-audio-embed,.native-video-embed').forEach(el => {
    try {
        const attrs = JSON.parse(el.getAttribute('data-attrs') || '{}');
        if (!attrs.mediaUploadId) return;
        const kind = el.classList.contains('native-video-embed') ? 'video' : 'audio';
        const media = document.createElement(kind);
        media.src = `https://charleswilke.substack.com/api/v1/${kind}/upload/${encodeURIComponent(attrs.mediaUploadId)}/src`;
        media.controls = true;
        media.preload = 'none';
        if (kind === 'video') {
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

// Progressive enhancement: every essay remains readable and linked without JS.
const archiveSearch = document.querySelector('#archive-search');
if (archiveSearch) {
    initLaiborRails(document.querySelector('.archive-surface'));
    const normalize = text => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const sections = [...document.querySelectorAll('.archive-year')];
    const entries = sections.flatMap(section => [...section.querySelectorAll('.archive-entry')].map(el => ({
        el, year: section.dataset.year, text: normalize(el.dataset.search)
    })));
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
