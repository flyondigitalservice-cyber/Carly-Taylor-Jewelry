/* AURAVYA collection/search — client-side facets, sorting, price range, pills */
(function () {
  'use strict';
  const A = window.Auravya;
  const $ = A.$, $$ = A.$$;

  const facetsRoot = $('[data-facets]');
  if (!facetsRoot) return;
  const grid = $('[data-product-grid]');
  if (!grid) return;
  const cards = $$('.pcard', grid);
  cards.forEach((c, i) => { c.dataset.order = i; });

  // Price ceiling comes from the facet markup (computed from real product prices); nothing hard-coded here.
  const capEl = $('[data-price-range]', facetsRoot);
  const CAP = (capEl && parseInt(capEl.dataset.priceCap, 10)) || 15000;

  const state = { coating: [], size: [], type: [], stock: false, min: 0, max: CAP, sort: '' };

  /* ---- read initial state from URL ---- */
  const url = new URL(location.href);
  state.coating = url.searchParams.getAll('coating');
  state.size = url.searchParams.getAll('size');
  state.type = url.searchParams.getAll('type');
  state.stock = url.searchParams.get('stock') === '1';
  state.min = parseInt(url.searchParams.get('min') || 0, 10);
  state.max = parseInt(url.searchParams.get('max') || CAP, 10);
  state.sort = url.searchParams.get('sort_by') || '';

  function syncInputs() {
    $$('[data-facet-input]', facetsRoot).forEach(i => {
      if (i.dataset.coating) i.checked = state.coating.includes(i.value);
      else if (i.dataset.size) i.checked = state.size.includes(i.value);
      else if (i.name === 'filter.p.product_type') i.checked = state.type.includes(i.value);
      else if (i.name === 'filter.v_availability') i.checked = state.stock;
    });
    const pmin = $('[data-price-min]', facetsRoot), pmax = $('[data-price-max]', facetsRoot);
    if (pmin) pmin.value = state.min;
    if (pmax) pmax.value = state.max;
    paintPrice();
    const sel = $('[data-sort-select]', facetsRoot);
    if (sel && state.sort) sel.value = state.sort;
  }

  function matches(card) {
    const price = parseInt(card.dataset.price, 10);
    if (price < state.min || price > state.max) return false;
    if (state.stock && card.dataset.available !== 'true') return false;
    if (state.type.length && !state.type.includes((card.dataset.tags || '').split(',').find(t => false) || '') ) {
      // match by product type via title fallback: use data-tags only when types provided
      const types = (card.dataset.tags || '').split(',');
      if (!state.type.some(t => types.includes(t))) {
        // product type isn't in tags on all stores; fall back to always-true when unknown
        if (!card.dataset.typeUnknown) return false;
      }
    }
    const coat = (card.dataset.optionCoating || card.dataset.optionColor || card.dataset.optionColour || card.dataset.optionFinish || card.dataset.optionPlating || '').split('|').filter(Boolean);
    if (state.coating.length && !state.coating.some(c => coat.includes(c))) return false;
    const sizes = (card.dataset.optionSize || card.dataset.optionRingSize || card.dataset.optionBraceletSize || card.dataset.optionChainLength || card.dataset.optionLength || '').split('|').filter(Boolean);
    if (state.size.length && !state.size.some(s => sizes.includes(s))) return false;
    return true;
  }

  function apply() {
    let visible = 0;
    cards.forEach(c => {
      const ok = matches(c);
      c.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });
    sortGrid();
    paintPills();
    paintCount(visible);
    writeUrl();
  }

  function sortGrid() {
    if (!state.sort || state.sort === 'featured') {
      cards.slice().sort((a, b) => a.dataset.order - b.dataset.order).forEach(c => grid.appendChild(c));
      return;
    }
    const dir = state.sort.includes('descending') ? -1 : 1;
    cards.slice().sort((a, b) => {
      switch (state.sort) {
        case 'price-ascending': return (a.dataset.price - b.dataset.price) * dir;
        case 'price-descending': return (a.dataset.price - b.dataset.price) * dir;
        case 'title-ascending': return a.dataset.title.localeCompare(b.dataset.title) * dir;
        case 'title-descending': return a.dataset.title.localeCompare(b.dataset.title) * dir;
        case 'best-selling': {
          const av = (a.dataset.tags || '').includes('bestseller') ? 0 : 1;
          const bv = (b.dataset.tags || '').includes('bestseller') ? 0 : 1;
          return (av - bv) || (a.dataset.order - b.dataset.order);
        }
        case 'created-descending': return (parseInt(b.dataset.isNew || 0) - parseInt(a.dataset.isNew || 0)) || (a.dataset.order - b.dataset.order);
        default: return a.dataset.order - b.dataset.order;
      }
    }).forEach(c => grid.appendChild(c));
  }

  function paintCount(n) {
    const el = $('[data-results-count]');
    if (el) el.textContent = n + (n === 1 ? ' product' : ' products');
  }

  function paintPills() {
    const host = $('[data-filter-pills]', facetsRoot);
    if (!host) return;
    const pills = [];
    state.coating.forEach(v => pills.push({ k: 'coating', v }));
    state.size.forEach(v => pills.push({ k: 'size', v }));
    state.type.forEach(v => pills.push({ k: 'type', v }));
    if (state.stock) pills.push({ k: 'stock', v: 'In stock' });
    if (state.min > 0 || state.max < CAP) pills.push({ k: 'price', v: A.money(state.min * 100) + ' – ' + A.money(state.max * 100) });
    host.hidden = pills.length === 0;
    host.innerHTML = pills.map(p => '<button class="chip is-active" data-pill-remove="' + p.k + '" data-pill-value="' + p.v.replace(/"/g, '&quot;') + '">' + p.v + ' <svg class="icon"><use href="#i-close"/></svg></button>').join('') +
      (pills.length > 1 ? '<button class="chip" data-pill-remove="all">Clear all</button>' : '');
    const cnt = $('[data-active-count]');
    if (cnt) { cnt.textContent = pills.length; cnt.hidden = pills.length === 0; }
  }

  function writeUrl() {
    const u = new URL(location.href);
    ['coating', 'size', 'type', 'stock', 'min', 'max'].forEach(k => u.searchParams.delete(k));
    state.coating.forEach(v => u.searchParams.append('coating', v));
    state.size.forEach(v => u.searchParams.append('size', v));
    state.type.forEach(v => u.searchParams.append('type', v));
    if (state.stock) u.searchParams.set('stock', '1');
    if (state.min > 0) u.searchParams.set('min', state.min);
    if (state.max < CAP) u.searchParams.set('max', state.max);
    if (state.sort) u.searchParams.set('sort_by', state.sort); else u.searchParams.delete('sort_by');
    history.replaceState({}, '', u);
  }

  /* ---- price range ---- */
  function paintPrice() {
    const root = $('[data-price-range]', facetsRoot); if (!root) return;
    const min = $('[data-price-min]', root), max = $('[data-price-max]', root);
    const fill = $('[data-price-fill]', root);
    const lo = parseInt(min.value, 10), hi = parseInt(max.value, 10);
    const span = parseInt(max.max, 10) || CAP;
    fill.style.left = (lo / span * 100) + '%';
    fill.style.right = (100 - hi / span * 100) + '%';
    $('[data-price-label-min]', root).textContent = A.money(lo * 100);
    $('[data-price-label-max]', root).textContent = A.money(hi * 100);
  }
  facetsRoot.addEventListener('input', (e) => {
    const r = e.target.closest('[data-price-range]'); if (!r) return;
    let lo = parseInt($('[data-price-min]', r).value, 10);
    let hi = parseInt($('[data-price-max]', r).value, 10);
    if (lo > hi - 250) {
      if (e.target.dataset.priceMin !== undefined) lo = hi - 250; else hi = lo + 250;
      $('[data-price-min]', r).value = lo; $('[data-price-max]', r).value = hi;
    }
    state.min = lo; state.max = hi;
    paintPrice();
    apply();
  });

  /* ---- facet inputs ---- */
  facetsRoot.addEventListener('change', (e) => {
    const i = e.target.closest('[data-facet-input]'); if (!i) return;
    const on = i.checked;
    if (i.dataset.coating) toggle(state.coating, i.value, on);
    else if (i.dataset.size) toggle(state.size, i.value, on);
    else if (i.name === 'filter.p.product_type') toggle(state.type, i.value, on);
    else if (i.name === 'filter.v_availability') state.stock = on;
    apply();
  });
  function toggle(arr, v, on) {
    const i = arr.indexOf(v);
    if (on && i < 0) arr.push(v);
    if (!on && i >= 0) arr.splice(i, 1);
  }

  facetsRoot.addEventListener('submit', (e) => { e.preventDefault(); apply(); closeMobile(); });

  /* ---- pills removal & clear ---- */
  facetsRoot.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-pill-remove]');
    if (pill) {
      const k = pill.dataset.pillRemove, v = pill.dataset.pillValue;
      if (k === 'all') { state.coating = []; state.size = []; state.type = []; state.stock = false; state.min = 0; state.max = CAP; }
      else if (k === 'stock') state.stock = false;
      else if (k === 'price') { state.min = 0; state.max = CAP; }
      else toggle(state[k], v, false);
      syncInputs(); apply();
      return;
    }
    if (e.target.closest('[data-clear-filters]')) {
      state.coating = []; state.size = []; state.type = []; state.stock = false; state.min = 0; state.max = CAP;
      syncInputs(); apply();
    }
  });

  /* ---- sort ---- */
  facetsRoot.addEventListener('change', (e) => {
    const s = e.target.closest('[data-sort-select]'); if (!s) return;
    state.sort = s.value; apply();
  });

  /* ---- mobile drawer ---- */
  function closeMobile() { if (window.innerWidth < 1024) facetsRoot.classList.remove('is-open'); }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-filters]')) facetsRoot.classList.add('is-open');
    if (e.target.closest('[data-close-filters]')) closeMobile();
  });

  syncInputs();
  apply();
})();
