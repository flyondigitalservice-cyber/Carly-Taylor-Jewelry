/* AURAVYA collection & search — native Shopify filters/sort with AJAX (Section Rendering API).
   Without JavaScript the filter form still submits normally, so nothing depends on this file. */
(function () {
  'use strict';
  const A = window.Auravya;
  const $ = A.$, $$ = A.$$;

  const resultsEl = () => $('[data-results]');
  if (!resultsEl()) return;
  let ctrl = null;

  function urlFromForm(form) {
    const fd = new FormData(form);
    const params = new URLSearchParams();
    for (const [k, v] of fd.entries()) { if (String(v).trim() !== '') params.append(k, v); }
    const action = form.getAttribute('action') || location.pathname;
    return action.split('?')[0] + '?' + params.toString();
  }

  function render(url, push) {
    const host = resultsEl();
    const sectionId = host.dataset.sectionId;
    const wasOpen = !!$('[data-facets].is-open', host);
    const openFacets = $$('[data-facet]:not(.is-closed)', host).map(f => f.dataset.facetKey);
    host.classList.add('is-loading');
    if (ctrl) ctrl.abort();
    ctrl = 'AbortController' in window ? new AbortController() : null;
    const fetchUrl = url + (url.indexOf('?') > -1 ? '&' : '?') + 'section_id=' + encodeURIComponent(sectionId);
    fetch(fetchUrl, ctrl ? { signal: ctrl.signal } : {})
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const next = doc.querySelector('[data-results]');
        if (!next) { location.href = url; return; }
        host.innerHTML = next.innerHTML;
        host.classList.remove('is-loading');
        // keep the shopper's open/closed accordions and the mobile drawer state
        $$('[data-facet]', host).forEach(f => {
          if (openFacets.includes(f.dataset.facetKey)) { f.classList.remove('is-closed'); const h = $('.facet__head', f); h && h.setAttribute('aria-expanded', 'true'); }
        });
        if (wasOpen) { const fr = $('[data-facets]', host); fr && fr.classList.add('is-open'); }
        paintAllPrices();
        if (push) history.pushState({ facets: true }, '', url);
        A.Wishlist && A.Wishlist.sync();
        if (!wasOpen) {
          const top = host.getBoundingClientRect().top + window.scrollY - 90;
          if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
        }
      })
      .catch((e) => { if (!e || e.name !== 'AbortError') location.href = url; });
  }
  const renderDebounced = A.debounce((url) => render(url, true), 450);

  /* ---- price range: sliders mirror the number inputs ---- */
  function paintPrice(root) {
    const min = $('[data-price-min]', root), max = $('[data-price-max]', root);
    const fill = $('[data-price-fill]', root);
    const span = parseFloat(root.dataset.max) || 1;
    const lo = parseFloat(min.value) || 0, hi = parseFloat(max.value) || span;
    if (fill) { fill.style.left = (lo / span * 100) + '%'; fill.style.right = (100 - hi / span * 100) + '%'; }
  }
  function paintAllPrices() { $$('[data-price-range]').forEach(paintPrice); }

  document.addEventListener('input', (e) => {
    const r = e.target.closest('[data-price-range]'); if (!r) return;
    const span = parseFloat(r.dataset.max) || 1;
    const minS = $('[data-price-min]', r), maxS = $('[data-price-max]', r);
    const minI = $('[data-price-input-min]', r), maxI = $('[data-price-input-max]', r);
    if (e.target === minS || e.target === maxS) {
      let lo = parseFloat(minS.value), hi = parseFloat(maxS.value);
      if (lo > hi) { if (e.target === minS) lo = hi; else hi = lo; minS.value = lo; maxS.value = hi; }
      minI.value = lo > 0 ? lo : '';
      maxI.value = hi < span ? hi : '';
    } else {
      minS.value = minI.value || 0;
      maxS.value = maxI.value || span;
    }
    paintPrice(r);
    if (window.innerWidth >= 1024) renderDebounced(urlFromForm(r.closest('form')));
  });

  /* ---- checkbox filters: instant on desktop, "Apply" in the mobile drawer ---- */
  document.addEventListener('change', (e) => {
    const i = e.target.closest('[data-facet-input]');
    if (i && window.innerWidth >= 1024) { render(urlFromForm(i.closest('form')), true); return; }
    const s = e.target.closest('[data-sort-select]');
    if (s) {
      const root = s.closest('[data-facets]');
      const form = $('[data-facet-form]', root);
      $('[data-sort-hidden]', form).value = s.value;
      render(urlFromForm(form), true);
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-facet-form]'); if (!form) return;
    e.preventDefault();
    const root = form.closest('[data-facets]'); root && root.classList.remove('is-open');
    document.body.style.overflow = '';
    render(urlFromForm(form), true);
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-facet-link], [data-results] .pagination a');
    if (link) { e.preventDefault(); render(link.href.split('#')[0], true); return; }
    if (e.target.closest('[data-open-filters]')) {
      const root = $('[data-facets]'); if (root) { root.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
      return;
    }
    if (e.target.closest('[data-close-filters]')) {
      const root = e.target.closest('[data-facets]'); if (root) root.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });

  window.addEventListener('popstate', (e) => { if (e.state && e.state.facets) render(location.href, false); });
  history.replaceState({ facets: true }, '', location.href);
  paintAllPrices();
})();
