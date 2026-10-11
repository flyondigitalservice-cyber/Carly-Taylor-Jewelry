/* AURAVYA predictive search */
(function () {
  'use strict';
  const A = window.Auravya;
  const $ = A.$;
  const input = $('[data-predictive-input]');
  const results = $('[data-predictive-results]');
  if (!input || !results) return;

  const run = A.debounce(() => {
    const q = input.value.trim();
    if (q.length < 2) { results.innerHTML = ''; return; }
    fetch('/search/suggest.json?q=' + encodeURIComponent(q) + '&section_id=predictive-search')
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const box = doc.querySelector('.psuggest');
        results.innerHTML = box ? box.outerHTML : '';
      })
      .catch(() => { results.innerHTML = ''; });
  }, 260);

  input.addEventListener('input', run);
  input.addEventListener('focus', run);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { results.innerHTML = ''; input.blur(); }
  });
})();
