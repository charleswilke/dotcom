(() => {
  // A fresh 50/50 choice on each full page load. A direct link can pin either
  // edition for review without storing a preference or affecting later visits.
  const requested = new URLSearchParams(location.search).get('recently');
  const edition = requested === 'classic' || requested === 'posters'
    ? requested
    : Math.random() < .5 ? 'classic' : 'posters';
  document.documentElement.dataset.recentlyEdition = edition;

  // The original cards' image URLs remain inert until their edition is chosen.
  // Only the selected Toast IQ artwork competes for first-paint bandwidth.
  const preload = document.createElement('link');
  preload.rel = 'preload';
  preload.as = 'image';
  preload.href = edition === 'posters'
    ? '/images/recently-screenprint/toast-iq.webp'
    : '/images/toast-iq-cloche-card.webp?v=20260909101748';
  preload.fetchPriority = 'high';
  document.head.append(preload);

  window.renderRecentlyEdition = () => {
    const section = document.getElementById('portfolio');
    const template = document.getElementById('recently-posters-template');
    if (!section || section.dataset.recentlyEdition) return;

    if (edition === 'posters' && template) {
      section.replaceChildren(template.content.cloneNode(true));
      section.classList.add('poster-wall', 'poster-wall-native');
      section.setAttribute('aria-labelledby', 'recently-heading');
      section.dataset.recentlyEdition = 'posters';
      const spotlight = document.createElement('script');
      spotlight.src = '/recently-posters.js?v=20261026-editions-1';
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
    delete window.renderRecentlyEdition;
  };
})();
