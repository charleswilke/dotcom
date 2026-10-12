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
