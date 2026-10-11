/* AURAVYA product page — variants, gallery, quick view, extras */
(function () {
  'use strict';
  const A = window.Auravya;
  const $ = A.$, $$ = A.$$;
  const S = A.settings;

  /* ---------- coating helpers: hex map, image resolution, tint ---------- */
  const SWATCH_HEX = (function () {
    const map = {};
    (S.swatch_map || '').split('\n').forEach(line => {
      const i = line.indexOf(':');
      if (i > 0) map[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    });
    return map;
  })();
  const hexFor = (val) => SWATCH_HEX[String(val).trim().toLowerCase()] || null;
  const isSwatchOption = (name) => (S.swatch_names || '').split(',').map(x => x.trim().toLowerCase()).includes(String(name).trim().toLowerCase());
  // Native first (variant's own image), then alt-text grouping, else null
  function imageForVariant(p, v, value) {
    const fi = v.featured_image || (v.featured_media && v.featured_media.image) || null;
    if (fi) return typeof fi === 'string' ? { url: fi } : fi;
    const imgs = p.images || p.media || [];
    const hit = imgs.find(im => value && String(im.alt || '').toLowerCase().includes(String(value).toLowerCase()));
    return hit || null;
  }
  function setTint(scopeEl, value, on) {
    if (!scopeEl) return;
    const hex = on && value ? hexFor(value) : null;
    if (hex && S.coating_tint) { scopeEl.classList.add('is-tinted'); scopeEl.style.setProperty('--tint', hex); }
    else { scopeEl.classList.remove('is-tinted'); scopeEl.style.removeProperty('--tint'); }
  }
  const productCache = {};
  function loadProduct(handle) {
    if (productCache[handle]) return Promise.resolve(productCache[handle]);
    return fetch('/products/' + handle + '.js').then(r => r.json()).then(p => { productCache[handle] = p; return p; });
  }

  /* ---------- variant engine (works for PDP + quick view) ---------- */
  function initForm(form) {
    if (form.dataset.vinit) return;
    form.dataset.vinit = '1';
    const root = form.closest('[data-product-json]') || form.closest('[data-qv-root]') || document;
    let product = null;
    const jsonEl = form.closest('.pdp') && $('.pdp').dataset.productJson;
    if (jsonEl) { try { product = JSON.parse(jsonEl); } catch (e) {} }
    if (!product && form.dataset.productHandle) {
      // quick view: fetch product json once
      fetch('/products/' + form.dataset.productHandle + '.js').then(r => r.json()).then(p => { product = p; bind(); });
    } else bind();

    function selectedOptions() {
      return $$('.opt', form).map(opt => {
        const inputs = $$('[data-option-input]', opt);
        if (inputs[0] && (inputs[0].type === 'radio')) {
          const c = inputs.find(i => i.checked);
          return c ? c.value : inputs[0].value;
        }
        return inputs[0] ? inputs[0].value : '';
      });
    }
    function findVariant(opts) {
      if (!product || !product.variants) return null;
      const list = product.variants.map(v => Array.isArray(v.options) ? v.options : [v.options]);
      for (let i = 0; i < list.length; i++) {
        if (list[i].every((o, oi) => String(o) === String(opts[oi]))) return product.variants[i];
      }
      return null;
    }
    function bind() {
      form.addEventListener('change', (e) => {
        if (!e.target.closest('[data-option-input]')) return;
        const opt = e.target.closest('.opt');
        const idx = parseInt(opt.dataset.optionIndex, 10);
        // visual selection
        $$('.swatch,.sizepill', opt).forEach(l => l.classList.toggle('is-selected', $('input', l) === e.target || $('select', opt) === e.target));
        if (e.target.tagName === 'SELECT') { /* value label below */ }
        const valEl = $('[data-option-value="' + idx + '"]', opt);
        if (valEl) valEl.textContent = e.target.value;
        update();
      });
      update();
    }
    function update() {
      const opts = selectedOptions();
      $$('.opt', form).forEach((opt, i) => {
        const valEl = $('[data-option-value="' + i + '"]', opt);
        if (valEl && !valEl.dataset.skip) valEl.textContent = opts[i];
      });
      const v = findVariant(opts);
      const priceWrap = form.closest('.pdp__buy, .qv__body, .pdp') ? $('.price[data-price-wrap]', form.closest('.pdp__buy') || form.closest('.qv__body') || form) : null;
      const scope = form.closest('.qv__body') || form.closest('.pdp__buy') || form;
      const priceEl = $('.price[data-price-wrap]', scope) || priceWrap;
      const addBtn = $('[data-add-button]', form);
      const idInput = $('[data-variant-id]', form);
      if (!v) {
        if (addBtn) { addBtn.disabled = true; $('[data-add-label]', addBtn) && ($('[data-add-label]', addBtn).textContent = S.strings.sold_out || 'Sold out'); }
        return;
      }
      if (idInput) idInput.value = v.id;
      if (priceEl) {
        const off = v.compare_at_price > v.price ? Math.round((v.compare_at_price - v.price) / v.compare_at_price * 100) : 0;
        priceEl.innerHTML = v.compare_at_price > v.price
          ? '<span class="price__sale">' + A.money(v.price) + '</span><s class="price__compare">' + A.money(v.compare_at_price) + '</s><span class="price__off">-' + off + '%</span>'
          : '<span class="price__regular">' + A.money(v.price) + '</span>';
      }
      const stock = $('[data-stock-line]', form);
      if (stock) {
        stock.innerHTML = v.available
          ? (v.inventory_quantity > 0 && v.inventory_quantity <= (S.lowstock || 5) ? '<span class="stock stock--low"><svg class="icon"><use href="#i-sparkle"/></svg>' + (S.strings.only_left || 'Only {{ count }} left').replace('{{ count }}', v.inventory_quantity) + '</span>'
            : '<span class="stock stock--ok"><svg class="icon"><use href="#i-check"/></svg>In stock, ships in 24 hrs</span>')
          : '<span class="stock stock--out">Sold out</span>';
      }
      if (addBtn) {
        addBtn.disabled = !v.available;
        const lbl = $('[data-add-label]', addBtn);
        if (lbl) lbl.textContent = v.available ? (S.strings.add_cta || 'Add to Cart') : (S.strings.sold_out || 'Sold out');
      }
      // gallery sync: 1) variant's own image  2) image alt tagged with coating  3) metal tint
      const gal = form.closest('.pdp, .qv') && $('[data-gallery]', form.closest('.pdp, .qv') || document);
      if (gal) {
        const swatchOpt = $$('.opt', form).find(o => isSwatchOption(o.dataset.optionName || ''));
        const swatchVal = swatchOpt ? (opts[parseInt(swatchOpt.dataset.optionIndex, 10)] || '') : '';
        const mediaId = v.featured_media && (v.featured_media.id || v.featured_media);
        const thumb = mediaId ? $('[data-thumb="' + mediaId + '"]', gal) : null;
        if (thumb) { thumb.click(); $$('.gallery__slide', gal).forEach(sl => sl.classList.remove('is-tinted')); }
        else {
          const slide = swatchVal ? $$('.gallery__slide', gal).find(sl => (sl.dataset.alt || '').toLowerCase().includes(swatchVal.toLowerCase())) : null;
          if (slide) {
            $$('.gallery__slide', gal).forEach(sl => { sl.classList.toggle('is-active', sl === slide); sl.classList.remove('is-tinted'); });
            $$('.gallery__thumb', gal).forEach(t => t.classList.remove('is-active'));
          } else {
            const active = $('.gallery__slide.is-active', gal);
            setTint(active, swatchVal, !!swatchVal);
          }
        }
      }
      // URL
      if (form.closest('.pdp') && history.replaceState) {
        const u = new URL(location.href);
        u.searchParams.set('variant', v.id);
        history.replaceState({}, '', u);
      }
    }
  }
  $$('[data-product-form]').forEach(initForm);
  document.addEventListener('qv:loaded', () => $$('[data-product-form]').forEach(initForm));

  /* ---------- gallery ---------- */
  $$('[data-gallery]').forEach(g => {
    const slides = $$('[data-slide]', g);
    const thumbs = $$('[data-thumb]', g);
    function show(id) {
      slides.forEach(s => s.classList.toggle('is-active', s.dataset.slide === id));
      thumbs.forEach(t => { const on = t.dataset.thumb === id; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
    }
    thumbs.forEach(t => t.addEventListener('click', () => show(t.dataset.thumb)));
    // touch swipe
    let sx = null;
    const stage = $('[data-stage]', g);
    stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) {
        const i = slides.findIndex(s => s.classList.contains('is-active'));
        const n = dx < 0 ? Math.min(i + 1, slides.length - 1) : Math.max(i - 1, 0);
        show(slides[n].dataset.slide);
      }
      sx = null;
    }, { passive: true });
  });

  /* ---------- lightbox ---------- */
  let lbImgs = [], lbI = 0;
  function lbShow(i) {
    lbI = (i + lbImgs.length) % lbImgs.length;
    const st = $('[data-lightbox-stage]');
    st.innerHTML = '<img src="' + lbImgs[lbI] + '" alt="">';
  }
  document.addEventListener('click', (e) => {
    const z = e.target.closest('[data-zoom]');
    if (z) {
      const g = z.closest('[data-gallery]');
      lbImgs = $$('[data-zoom]', g).map(b => b.dataset.zoom);
      lbI = Math.max(0, $$('[data-zoom]', g).indexOf(z));
      const lb = $('#ZoomLightbox');
      lb.hidden = false; document.body.style.overflow = 'hidden';
      lbShow(lbI);
      return;
    }
    if (e.target.closest('[data-lightbox-prev]')) lbShow(lbI - 1);
    if (e.target.closest('[data-lightbox-next]')) lbShow(lbI + 1);
  });

  /* ---------- sticky add bar ---------- */
  const sticky = $('[data-sticky-bar]');
  const mainAdd = $('[data-add-button]');
  if (sticky && mainAdd && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      es.forEach(en => sticky.classList.toggle('is-visible', !en.isIntersecting && en.boundingClientRect.top < 0));
    }, { threshold: 0 }).observe(mainAdd);
    sticky.addEventListener('click', (e) => {
      if (e.target.closest('[data-sticky-add]')) mainAdd.closest('form').requestSubmit ? mainAdd.closest('form').requestSubmit(mainAdd) : mainAdd.click();
    });
  }

  /* ---------- engraving ---------- */
  document.addEventListener('change', (e) => {
    const t = e.target.closest('[data-toggle-engraving]');
    if (t) {
      const wrap = $('[data-engraving-wrap]', t.closest('form'));
      if (wrap) wrap.hidden = !t.checked;
    }
  });
  document.addEventListener('input', (e) => {
    const i = e.target.closest('[data-engraving-input]');
    if (i) {
      const left = (parseInt(i.maxLength, 10) || 20) - i.value.length;
      const c = $('[data-engraving-count]', i.closest('form'));
      if (c) c.textContent = left;
    }
  });

  /* ---------- pincode ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pincode-check]'); if (!b) return;
    const wrap = b.closest('.pincode');
    const val = ($('[data-pincode-input]', wrap).value || '').trim();
    const msg = $('[data-pincode-msg]', wrap);
    if (!/^\d{6}$/.test(val)) { msg.textContent = 'Enter a valid 6-digit pincode'; msg.style.color = 'var(--c-sale)'; return; }
    msg.style.color = '';
    msg.textContent = 'Checking…';
    setTimeout(() => { msg.textContent = 'Delivery in 2–4 days to ' + val + '. Free shipping above ' + A.money((S.free_ship || 0) * 100) + '.'; }, 500);
  });

  /* ---------- quick view ---------- */
  document.addEventListener('click', (e) => {
    const qa = e.target.closest('[data-quick-add],[data-quick-view]'); if (!qa) return;
    const handle = qa.dataset.quickAdd || qa.dataset.quickView;
    const modal = $('[data-modal="quickview"]');
    const body = $('[data-quickview-body]', modal);
    modal.hidden = false; document.body.style.overflow = 'hidden';
    body.innerHTML = '<div class="modal__loader"><span class="spinner"></span></div>';
    fetch('/products/' + handle + '?view=quick')
      .then(r => r.text())
      .then(html => {
        // demo & Shopify both return a full page; extract the quick-view root
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const root = doc.querySelector('[data-qv-root]');
        body.innerHTML = root ? root.innerHTML : '<p style="padding:2rem">Quick view unavailable.</p>';
        const form = $('[data-product-form]', body);
        if (form) { form.dataset.productHandle = handle; form.removeAttribute('data-vinit'); }
        document.dispatchEvent(new CustomEvent('qv:loaded'));
      })
      .catch(() => { body.innerHTML = '<p style="padding:2rem">Could not load product.</p>'; });
  });

  /* ---------- card swatch -> swap image/price/link in place ---------- */
  document.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-goto-variant]'); if (!sw) return;
    e.preventDefault();
    const card = sw.closest('[data-product-card]');
    const val = sw.dataset.gotoVariant;
    loadProduct(card.dataset.handle).then(p => {
      const owv = p.options_with_values || [];
      let oi = owv.findIndex(o => isSwatchOption(o.name) && (o.values || []).includes(val));
      if (oi < 0) oi = owv.findIndex(o => (o.values || []).includes(val));
      if (oi < 0) return;
      const v = (p.variants || []).find(v => String((v.options || [])[oi]) === val);
      if (!v) return;
      const media = $('.pcard__media', card);
      const img = imageForVariant(p, v, val);
      const mainImg = $('.pcard__img--1', card);
      if (img && mainImg) { mainImg.src = img.url || img.src || img; setTint(media, val, false); }
      else setTint(media, val, true);
      const price = $('[data-price-wrap]', card);
      if (price && v.price) {
        price.innerHTML = v.compare_at_price > v.price
          ? '<span class="price__sale">' + A.money(v.price) + '</span><s class="price__compare">' + A.money(v.compare_at_price) + '</s><span class="price__off">-' + Math.round((v.compare_at_price - v.price) / v.compare_at_price * 100) + '%</span>'
          : '<span class="price__regular">' + A.money(v.price) + '</span>';
      }
      const url = p.url + '?variant=' + v.id;
      $$('.pcard__link, .pcard__title a', card).forEach(a => { a.href = url; });
      const add = $('[data-add-to-cart]', card); if (add) add.dataset.addToCart = v.id;
      $$('[data-goto-variant]', card).forEach(b => b.classList.toggle('is-selected', b === sw));
      card.dataset.variantId = v.id;
    });
  });
})();
