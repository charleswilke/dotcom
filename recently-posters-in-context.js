(() => {
  const frame = document.querySelector('#homepage-preview');
  const status = document.querySelector('#context-status');
  function showHomepage() {
    frame.classList.add('is-ready');
    status.hidden = true;
  }

  // The homepage now owns the real poster edition, including its lightboxes.
  frame.addEventListener('load', showHomepage, { once: true });
  if (frame.contentDocument?.readyState === 'complete' && frame.contentDocument.querySelector('#portfolio')) {
    showHomepage();
  }
})();
