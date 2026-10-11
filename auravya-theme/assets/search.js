/* AURAVYA predictive search — Shopify Predictive Search API + Section Rendering */
(function () {
  'use strict';
  const A = window.Auravya;
  const $ = A.$;
  const input = $('[data-predictive-input]');
  const results = $('[data-predictive-results]');
  if (!input || !results) return;
  let ctrl = null;
  const cache = {};

  const paint = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const box = doc.querySelector('.psuggest');
    results.innerHTML = box ? box.outerHTML : '';
  };

  const run = A.debounce(() => {
    const q = input.value.trim();
    if (q.length < 2) { results.innerHTML = ''; return; }
    if (cache[q]) { paint(cache[q]); return; }
    if (ctrl) ctrl.abort();
    ctrl = 'AbortController' in window ? new AbortController() : null;
    const url = A.routes.predictive + '?q=' + encodeURIComponent(q) +
      '&resources[type]=product,collection,page,article,query&resources[limit]=6&resources[options][unavailable_products]=last' +
      '&section_id=predictive-search';
    fetch(url, ctrl ? { signal: ctrl.signal } : {})
      .then(r => r.text())
      .then(html => { cache[q] = html; paint(html); })
      .catch(() => {});
  }, 220);

  input.addEventListener('input', run);
  input.addEventListener('focus', run);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { results.innerHTML = ''; input.blur(); }
  });
})();
