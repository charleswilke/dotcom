(() => {
  // An equal three-way choice on each full page load. A direct link can pin an
  // edition for review without storing a preference or affecting later visits.
  const requested = new URLSearchParams(location.search).get('recently');
  const editions = ['classic', 'posters', 'matchbooks'];
  const edition = editions.includes(requested)
    ? requested : editions[Math.floor(Math.random() * editions.length)];
  document.documentElement.dataset.recentlyEdition = edition;

  // The original cards' image URLs remain inert until their edition is chosen.
  // Only the selected Toast IQ artwork competes for first-paint bandwidth.
  function preloadImage(href, media) {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = href;
    if (media) preload.media = media;
    preload.fetchPriority = 'high';
    document.head.append(preload);
  }
  if (edition === 'posters') {
    preloadImage('/images/recently-stickers/toast-iq.webp', '(max-width: 767px)');
    preloadImage('/images/recently-screenprint/toast-iq.webp', '(min-width: 768px)');
  } else if (edition === 'matchbooks') {
    preloadImage('/images/recently-matchbooks/toast-iq.webp');
  } else {
    preloadImage('/images/toast-iq-cloche-card.webp?v=20260909101748');
  }

  window.renderRecentlyEdition = () => {
    const section = document.getElementById('portfolio');
    const template = document.getElementById('recently-posters-template');
    const matchbooks = document.getElementById('recently-matchbooks-template');
    if (!section || section.dataset.recentlyEdition) return;

    if (edition === 'matchbooks' && matchbooks) {
      section.replaceChildren(matchbooks.content.cloneNode(true));
      section.classList.add('matchbook-wall');
      section.setAttribute('aria-labelledby', 'recently-heading');
      section.dataset.recentlyEdition = 'matchbooks';
      const effects = document.createElement('script');
      effects.src = '/recently-matchbooks.js?v=20261030-release-1';
      document.head.append(effects);
    } else if (edition === 'posters' && template) {
      section.replaceChildren(template.content.cloneNode(true));
      section.classList.add('poster-wall', 'poster-wall-native');
      section.setAttribute('aria-labelledby', 'recently-heading');
      section.dataset.recentlyEdition = 'posters';
      const spotlight = document.createElement('script');
      spotlight.src = '/recently-posters.js?v=20261027-mobile-1';
      document.head.append(spotlight);
    } else {
      section.querySelectorAll('img[data-recently-src]').forEach(image => {
        image.src = image.dataset.recentlySrc;
        image.removeAttribute('data-recently-src');
      });
      section.dataset.recentlyEdition = 'classic';
      document.documentElement.dataset.recentlyEdition = 'classic';
    }
    template?.remove();
    matchbooks?.remove();
    delete window.renderRecentlyEdition;
  };
})();
