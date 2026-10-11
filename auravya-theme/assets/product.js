/* AURAVYA product — variants, gallery, quick view, pincode check, card swatches, recommendations */
(function () {
  'use strict';
  const A = window.Auravya;
  const $ = A.$, $$ = A.$$;
  const S = A.settings;
  const R = A.routes;
  const esc = A.esc;

  /* ---------- coating helpers: hex map, image resolution, tint ---------- */
  const SWATCH_HEX = (function () {
    const map = {};
    (S.swatch_map || '').split('\n').forEach(line => {
      const i = line.indexOf(':');
      if (i > 0) map[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    });
    return map;
  })();
  const hexFor = (val) => {
    const v = SWATCH_HEX[String(val).trim().toLowerCase()] || null;
    return v && v.indexOf('//') === -1 ? v : null;
  };
  const optionList = (csv) => String(csv || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  const isSwatchOption = (name) => optionList(S.swatch_names).includes(String(name).trim().toLowerCase());

  function imageForVariant(p, v, value) {
    const fi = v.featured_image || (v.featured_media && (v.featured_media.preview_image || v.featured_media)) || null;
    if (fi && (fi.src || typeof fi === 'string')) return { url: typeof fi === 'string' ? fi : fi.src };
    const imgs = p.media || [];
    const hit = imgs.find(im => value && String(im.alt || '').toLowerCase().includes(String(value).toLowerCase()));
    return hit ? { url: hit.src || (hit.preview_image && hit.preview_image.src) } : null;
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
    return fetch(R.product(handle) + '.js').then(r => r.json()).then(p => { productCache[handle] = p; return p; });
  }

  /* Price markup shared by the PDP, quick view, sticky bar and product cards */
  A.priceHTML = function (v) {
    if (v.compare_at_price > v.price) {
      const off = Math.round((v.compare_at_price - v.price) / v.compare_at_price * 100);
      return '<span class="price__sale">' + A.money(v.price) + '</span>' +
        '<span class="price__compare">' + (S.show_mrp ? '<span class="price__mrp">' + esc(S.strings.mrp || 'MRP') + '</span> ' : '') + '<s>' + A.money(v.compare_at_price) + '</s></span>' +
        '<span class="price__off">' + esc(A.t('percent_off', { percent: off }) || off + '% off') + '</span>';
    }
    return '<span class="price__regular">' + A.money(v.price) + '</span>';
  };

  /* ---------- variant engine (PDP + quick view) ---------- */
  function initForm(form) {
    if (form.dataset.vinit) return;
    form.dataset.vinit = '1';
    const host = form.closest('[data-product-json]');
    let product = null;
    if (host) { try { product = JSON.parse(host.dataset.productJson); } catch (e) {} }
    let stock = {};
    const stockEl = $('[data-variant-stock]', form);
    if (stockEl) { try { stock = JSON.parse(stockEl.textContent); } catch (e) {} }

    const opts = () => $$('.opt', form);
    function selectedOptions() {
      return opts().map(opt => {
        const sel = $('select[data-option-input]', opt);
        if (sel) return sel.value;
        const c = $('input[data-option-input]:checked', opt) || $('input[data-option-input]', opt);
        return c ? c.value : '';
      });
    }
    function findVariant(sel) {
      return (product.variants || []).find(v => (v.options || []).every((o, i) => String(o) === String(sel[i]))) || null;
    }
    /* Grey out values that would lead to a sold-out or non-existent combination */
    function paintAvailability(sel) {
      opts().forEach((opt, i) => {
        const values = $$('[data-option-input]', opt);
        const check = (val) => (product.variants || []).some(v => v.available && v.options.every((o, oi) => (oi === i ? String(o) === String(val) : String(o) === String(sel[oi]))));
        if (values[0] && values[0].tagName === 'SELECT') {
          $$('option', values[0]).forEach(o => { o.textContent = o.value + (check(o.value) ? '' : ' — ' + (S.strings.sold_out || 'Sold out')); });
        } else {
          values.forEach(inp => { const l = inp.closest('label'); if (l) l.classList.toggle('is-soldout', !check(inp.value)); });
        }
      });
    }
    function bind() {
      form.addEventListener('change', (e) => {
        const input = e.target.closest('[data-option-input]'); if (!input) return;
        const opt = input.closest('.opt');
        $$('label', opt).forEach(l => l.classList.toggle('is-selected', $('input', l) === input));
        update();
      });
      update(true);
    }
    function update(initial) {
      const sel = selectedOptions();
      opts().forEach((opt, i) => { const el = $('[data-option-value]', opt); if (el) el.textContent = sel[i]; });
      paintAvailability(sel);
      const v = findVariant(sel);
      const scope = form.closest('.qv__body') || form.closest('.pdp__buy') || form;
      const priceEls = [$('[data-price-wrap]', scope)];
      const page = form.closest('.pdp');
      if (page) priceEls.push($('[data-sticky-bar] [data-price-wrap]'));
      const addBtns = [$('[data-add-button]', form)];
      if (page) addBtns.push($('[data-sticky-add]'));
      const idInput = $('[data-variant-id]', form);
      const lblFor = (b) => $('[data-add-label]', b) || b;

      if (!v) {
        addBtns.forEach(b => { if (b) { b.disabled = true; lblFor(b).textContent = S.strings.unavailable || 'Unavailable'; } });
        return;
      }
      if (idInput) idInput.value = v.id;
      priceEls.forEach(el => { if (el) el.innerHTML = A.priceHTML(v); });

      const stockLine = $('[data-stock-line]', form);
      if (stockLine) {
        const qty = stock[v.id];
        if (!v.available) stockLine.innerHTML = '<span class="stock stock--out">' + esc(S.strings.sold_out || 'Sold out') + '</span>';
        else if (typeof qty === 'number' && qty > 0 && qty <= (S.lowstock || 5)) stockLine.innerHTML = '<span class="stock stock--low"><svg class="icon"><use href="#i-sparkle"/></svg>' + esc(A.t('only_left', { count: qty })) + '</span>';
        else stockLine.innerHTML = '<span class="stock stock--ok"><svg class="icon"><use href="#i-check"/></svg>' + esc(S.strings.in_stock || 'In stock') + '</span>';
      }
      addBtns.forEach(b => {
        if (!b) return;
        b.disabled = !v.available;
        lblFor(b).textContent = v.available ? (S.strings.add_to_cart || 'Add to cart') : (S.strings.sold_out || 'Sold out');
      });
      const dyn = $('.pform__dyncheckout', form);
      if (dyn) dyn.hidden = !v.available;

      // gallery sync: 1) variant's own image  2) image alt mentioning the coating  3) metal tint
      const gal = $('[data-gallery]', form.closest('.pdp, .qv') || document);
      if (gal && !initial) {
        const swatchOpt = opts().find(o => isSwatchOption(o.dataset.optionName || ''));
        const swatchVal = swatchOpt ? (sel[parseInt(swatchOpt.dataset.optionIndex, 10)] || '') : '';
        const mediaId = v.featured_media && v.featured_media.id;
        const slides = $$('.gallery__slide', gal);
        let target = mediaId ? slides.find(sl => sl.dataset.slide === String(mediaId)) : null;
        if (!target && swatchVal) target = slides.find(sl => (sl.dataset.alt || '').toLowerCase().includes(swatchVal.toLowerCase()));
        if (target) {
          slides.forEach(sl => sl.classList.remove('is-tinted'));
          gal.dispatchEvent(new CustomEvent('gallery:show', { detail: target.dataset.slide }));
        } else {
          setTint($('.gallery__slide.is-active', gal), swatchVal, !!swatchVal);
        }
      }
      if (page && !initial && history.replaceState) {
        const u = new URL(location.href);
        u.searchParams.set('variant', v.id);
        history.replaceState(history.state, '', u);
      }
    }
    if (product) bind();
    else if (form.dataset.handle) loadProduct(form.dataset.handle).then(p => { product = p; bind(); });
  }
  const initForms = () => $$('[data-product-form]').forEach(initForm);

  /* ---------- gallery ---------- */
  function initGallery(g) {
    if (g.dataset.ginit) return;
    g.dataset.ginit = '1';
    const slides = $$('[data-slide]', g);
    const thumbs = $$('[data-thumb]', g);
    function show(id) {
      slides.forEach(s => s.classList.toggle('is-active', s.dataset.slide === id));
      thumbs.forEach(t => { const on = t.dataset.thumb === id; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); if (on && t.scrollIntoView && g.offsetParent) t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
      const dots = $$('[data-gallery-dot]', g);
      dots.forEach(d => d.classList.toggle('is-active', d.dataset.galleryDot === id));
      $$('video', g).forEach(vid => { if (!vid.closest('.is-active')) vid.pause(); });
    }
    g.addEventListener('gallery:show', (e) => show(e.detail));
    thumbs.forEach(t => t.addEventListener('click', () => show(t.dataset.thumb)));
    const step = (dir) => {
      const i = slides.findIndex(s => s.classList.contains('is-active'));
      const n = (i + dir + slides.length) % slides.length;
      show(slides[n].dataset.slide);
    };
    g.addEventListener('click', (e) => {
      if (e.target.closest('[data-gallery-prev]')) step(-1);
      if (e.target.closest('[data-gallery-next]')) step(1);
    });
    let sx = null, sy = null;
    const stage = $('[data-stage]', g);
    if (!stage || slides.length < 2) return;
    stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      sx = null;
    }, { passive: true });
  }
  const initGalleries = () => $$('[data-gallery]').forEach(initGallery);

  /* ---------- lightbox ---------- */
  let lbImgs = [], lbI = 0;
  function lbShow(i) {
    lbI = (i + lbImgs.length) % lbImgs.length;
    const st = $('[data-lightbox-stage]');
    st.innerHTML = '<img src="' + esc(lbImgs[lbI]) + '" alt="">';
  }
  document.addEventListener('click', (e) => {
    const z = e.target.closest('[data-zoom]');
    if (z) {
      const g = z.closest('[data-gallery]');
      const all = $$('[data-zoom]', g);
      lbImgs = all.map(b => b.dataset.zoom);
      lbI = Math.max(0, all.indexOf(z));
      const lb = $('#ZoomLightbox');
      lb.hidden = false; document.body.style.overflow = 'hidden';
      lbShow(lbI);
      const c = $('[data-lightbox-close]', lb); c && c.focus();
      return;
    }
    if (e.target.closest('[data-lightbox-prev]')) lbShow(lbI - 1);
    if (e.target.closest('[data-lightbox-next]')) lbShow(lbI + 1);
  });
  document.addEventListener('keydown', (e) => {
    const lb = $('#ZoomLightbox'); if (!lb || lb.hidden) return;
    if (e.key === 'ArrowLeft') lbShow(lbI - 1);
    if (e.key === 'ArrowRight') lbShow(lbI + 1);
  });

  /* ---------- sticky add bar ---------- */
  const sticky = $('[data-sticky-bar]');
  const mainAdd = $('.pdp [data-add-button]');
  if (sticky && mainAdd && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      es.forEach(en => sticky.classList.toggle('is-visible', !en.isIntersecting && en.boundingClientRect.top < 0));
    }, { threshold: 0 }).observe(mainAdd);
    sticky.addEventListener('click', (e) => {
      if (!e.target.closest('[data-sticky-add]')) return;
      const f = mainAdd.closest('form');
      if (f.requestSubmit) f.requestSubmit(); else mainAdd.click();
    });
  }

  /* ---------- engraving ---------- */
  document.addEventListener('change', (e) => {
    const t = e.target.closest('[data-toggle-engraving]');
    if (t) {
      const wrap = $('[data-engraving-wrap]', t.closest('form'));
      if (wrap) { wrap.hidden = !t.checked; if (t.checked) { const i = $('input', wrap); i && i.focus(); } }
    }
  });
  document.addEventListener('input', (e) => {
    const i = e.target.closest('[data-engraving-input]');
    if (i) {
      const left = (parseInt(i.maxLength, 10) || 20) - i.value.length;
      const c = $('[data-engraving-count]', i.closest('form'));
      if (c) c.textContent = left;
    }
    const pin = e.target.closest('[data-pincode-input]');
    if (pin) pin.value = pin.value.replace(/\D/g, '').slice(0, 6);
  });

  /* ---------- pincode → delivery estimate ---------- */
  const PIN_KEY = 'auravya_pincode';
  const listMatch = (csv, pin) => String(csv || '').split(/[\s,]+/).filter(Boolean).some(p => pin.indexOf(p.trim()) === 0);
  function addWorkingDays(days) {
    const d = new Date();
    let added = 0;
    while (added < days) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) added++; }
    return d;
  }
  const fmtDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  function checkPincode(wrap) {
    const input = $('[data-pincode-input]', wrap);
    const msg = $('[data-pincode-msg]', wrap);
    const val = (input.value || '').trim();
    msg.className = 'pincode__msg';
    if (!/^[1-9]\d{5}$/.test(val)) { msg.classList.add('is-error'); msg.textContent = S.strings.pincode_invalid || 'Enter a valid 6-digit pincode'; return; }
    try { localStorage.setItem(PIN_KEY, val); } catch (e) {}
    if (listMatch(S.pincode_blocked, val)) { msg.classList.add('is-error'); msg.textContent = A.t('pincode_bad', { pin: val }); return; }
    const from = fmtDate(addWorkingDays(S.delivery_min || 3));
    const to = fmtDate(addWorkingDays(Math.max(S.delivery_max || 6, S.delivery_min || 3)));
    const range = from === to ? from : from + ' – ' + to;
    const cod = S.cod ? (listMatch(S.pincode_no_cod, val) ? S.strings.pincode_cod_no : S.strings.pincode_cod_yes) : '';
    msg.classList.add('is-ok');
    msg.innerHTML = '<span><svg class="icon"><use href="#i-truck"/></svg>' + esc(A.t('pincode_ok', { pin: val, date: range })) + '</span>' +
      (cod ? '<span><svg class="icon"><use href="#i-cash"/></svg>' + esc(cod) + '</span>' : '');
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pincode-check]'); if (b) checkPincode(b.closest('[data-pincode]'));
  });
  document.addEventListener('keydown', (e) => {
    const i = e.target.closest('[data-pincode-input]');
    if (i && e.key === 'Enter') { e.preventDefault(); checkPincode(i.closest('[data-pincode]')); }
  });
  function prefillPincode() {
    let saved = null;
    try { saved = localStorage.getItem(PIN_KEY); } catch (e) {}
    if (!saved) return;
    $$('[data-pincode]').forEach(w => { const i = $('[data-pincode-input]', w); if (i && !i.value) { i.value = saved; checkPincode(w); } });
  }

  /* ---------- quick view ---------- */
  document.addEventListener('click', (e) => {
    const qa = e.target.closest('[data-quick-add],[data-quick-view]'); if (!qa) return;
    e.preventDefault();
    const handle = qa.dataset.quickAdd || qa.dataset.quickView;
    const modal = $('[data-modal="quickview"]');
    if (!modal) { window.location.href = R.product(handle); return; }
    const body = $('[data-quickview-body]', modal);
    const wl = $('[data-drawer="wishlist"]'); if (wl && !wl.hidden) A.closeDrawer('wishlist');
    A.openModal('quickview');
    body.innerHTML = '<div class="modal__loader"><span class="spinner"></span></div>';
    fetch(R.product(handle) + '?section_id=quick-view')
      .then(r => { if (!r.ok) throw r; return r.text(); })
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const root = doc.querySelector('[data-qv-root]');
        if (!root) throw new Error('missing');
        body.innerHTML = '';
        body.appendChild(document.importNode(root, true));
        initForms(); initGalleries(); prefillPincode();
        A.Wishlist && A.Wishlist.sync();
        const first = $('input,select,button', body); first && first.focus();
      })
      .catch(() => { body.innerHTML = '<p class="modal__error">' + esc(S.strings.qv_error || 'Could not load this product.') + ' <a class="link-underline" href="' + esc(R.product(handle)) + '">→</a></p>'; });
  });

  /* ---------- card swatch → swap image/price/link in place ---------- */
  document.addEventListener('click', (e) => {
    const sw = e.target.closest('[data-goto-variant]'); if (!sw) return;
    e.preventDefault();
    const card = sw.closest('[data-product-card]');
    const val = sw.dataset.gotoVariant;
    loadProduct(card.dataset.handle).then(p => {
      const names = p.options || [];
      let oi = names.findIndex(n => isSwatchOption(typeof n === 'string' ? n : n.name));
      if (oi < 0) oi = (p.variants || []).length ? p.variants[0].options.findIndex((o, i) => p.variants.some(v => v.options[i] === val)) : -1;
      if (oi < 0) return;
      const matches = (p.variants || []).filter(v => String(v.options[oi]) === val);
      const v = matches.find(x => x.available) || matches[0];
      if (!v) return;
      const media = $('.pcard__media', card);
      const img = imageForVariant(p, v, val);
      const mainImg = $('.pcard__img--1', card);
      if (img && img.url && mainImg) {
        const url = img.url.indexOf('?') > -1 ? img.url + '&width=700' : img.url + '?width=700';
        mainImg.removeAttribute('srcset'); mainImg.src = url; setTint(media, val, false);
      } else setTint(media, val, true);
      const price = $('[data-price-wrap]', card);
      if (price) price.innerHTML = A.priceHTML(v);
      const url = p.url + '?variant=' + v.id;
      $$('.pcard__link, .pcard__title a', card).forEach(a => { a.href = url; });
      $$('[data-goto-variant]', card).forEach(b => { b.classList.toggle('is-selected', b === sw); b.setAttribute('aria-pressed', b === sw); });
      card.dataset.variantId = v.id;
    }).catch(() => {});
  });

  /* ---------- product recommendations (Shopify's own engine) ---------- */
  function loadRecommendations() {
    $$('[data-recommendations]').forEach(el => {
      if (el.dataset.loaded) return;
      el.dataset.loaded = '1';
      const url = R.recommendations + '?product_id=' + el.dataset.productId + '&limit=' + (el.dataset.limit || 6) + '&section_id=' + el.dataset.sectionId;
      fetch(url).then(r => r.text()).then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const inner = doc.querySelector('[data-recommendations]');
        const sec = el.closest('section') || el;
        if (inner && inner.querySelector('[data-product-card]')) { el.innerHTML = inner.innerHTML; sec.hidden = false; A.Wishlist && A.Wishlist.sync(); }
        else sec.hidden = true;
      }).catch(() => {});
    });
  }

  /* ---------- recently viewed (handles stored by main-product) ---------- */
  function loadRecent() {
    $$('[data-recent]').forEach(el => {
      if (el.dataset.loaded) return;
      el.dataset.loaded = '1';
      let list = [];
      try { list = JSON.parse(localStorage.getItem('auravya_recent') || '[]'); } catch (e) {}
      list = list.filter(h => h !== el.dataset.exclude).slice(0, parseInt(el.dataset.limit || 8, 10));
      if (!list.length) return;
      Promise.all(list.map(h => loadProduct(h).catch(() => null))).then(items => {
        items = items.filter(Boolean);
        if (!items.length) return;
        const track = $('[data-recent-track]', el);
        track.innerHTML = items.map(p => {
          const img = p.featured_image ? p.featured_image + (p.featured_image.indexOf('?') > -1 ? '&' : '?') + 'width=500' : '';
          return '<div class="carousel__slide"><div class="pcard pcard--mini"><div class="pcard__media"><a class="pcard__link" href="' + esc(p.url) + '">' +
            (img ? '<img class="pcard__img pcard__img--1" src="' + esc(img) + '" alt="' + esc(p.title) + '" width="500" height="500" loading="lazy">' : '') +
            '</a></div><div class="pcard__info"><h3 class="pcard__title"><a href="' + esc(p.url) + '">' + esc(p.title) + '</a></h3>' +
            '<div class="price price--sm" data-price-wrap>' + A.priceHTML({ price: p.price, compare_at_price: p.compare_at_price }) + '</div></div></div></div>';
        }).join('');
        el.closest('section').hidden = false;
      });
    });
  }

  initForms();
  initGalleries();
  prefillPincode();
  loadRecent();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some(x => x.isIntersecting)) { io.disconnect(); loadRecommendations(); } }, { rootMargin: '400px' });
    $$('[data-recommendations]').forEach(el => io.observe(el));
  } else loadRecommendations();

  document.addEventListener('shopify:section:load', () => { initForms(); initGalleries(); loadRecommendations(); loadRecent(); });
})();
