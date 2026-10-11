/* AURAVYA theme core — no dependencies */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  window.Auravya = window.Auravya || {};
  const A = window.Auravya;
  A.$ = $; A.$$ = $$; A.debounce = debounce;

  /* ---------- settings & money ---------- */
  let S = { money_format: '₹{{amount}}', strings: {} };
  try { S = Object.assign(S, JSON.parse($('#ShopSettings').textContent)); } catch (e) {}
  A.settings = S;
  A.money = function (cents) {
    const v = Math.round(cents) / 100;
    const int = Math.floor(Math.abs(v));
    const str = int.toLocaleString('en-IN');
    const out = (S.money_format || '₹{{amount}}')
      .replace('{{amount}}', str)
      .replace('{{amount_no_decimals}}', str)
      .replace('{{amount_with_comma_separator}}', str)
      .replace('{{amount_no_decimals_with_comma_separator}}', str);
    return (v < 0 ? '-' : '') + out;
  };

  /* ---------- toast ---------- */
  A.toast = function (msg, type) {
    const host = $('#ToastHost'); if (!host) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'err' ? ' toast--err' : '');
    el.innerHTML = '<svg class="icon"><use href="#i-' + (type === 'err' ? 'close' : 'check') + '"/></svg><span></span>';
    $('span', el).textContent = msg;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, 2600);
  };

  /* ---------- drawers & modals ---------- */
  let lastFocus = null;
  function openBox(box) {
    if (!box) return;
    lastFocus = document.activeElement;
    box.hidden = false;
    document.body.style.overflow = 'hidden';
    const f = box.querySelector('input,button,a,select,textarea');
    if (f) setTimeout(() => f.focus(), 60);
  }
  function closeBox(box) {
    if (!box || box.hidden) return;
    box.hidden = true;
    if (!$$('.drawer:not([hidden]),.modal:not([hidden]),.lightbox:not([hidden])').length) document.body.style.overflow = '';
    if (lastFocus) { try { lastFocus.focus(); } catch (e) {} }
  }
  A.openDrawer = (name) => openBox($('[data-drawer="' + name + '"]'));
  A.closeDrawer = (name) => closeBox($('[data-drawer="' + name + '"]'));
  A.openModal = (name) => openBox($('[data-modal="' + name + '"]'));
  A.closeModal = (name) => closeBox($('[data-modal="' + name + '"]'));
  document.addEventListener('click', (e) => {
    const oc = e.target.closest('[data-drawer-close]');
    if (oc) { closeBox(oc.closest('.drawer')); return; }
    const om = e.target.closest('[data-modal-close]');
    if (om) { closeBox(om.closest('.modal')); return; }
    const o = e.target.closest('[data-cart-open]'); if (o) { A.openDrawer('cart'); return; }
    const w = e.target.closest('[data-wishlist-open]'); if (w) { A.Wishlist && A.Wishlist.render(); A.openDrawer('wishlist'); return; }
    const sg = e.target.closest('[data-open-size-guide]'); if (sg) { A.openModal('sizeguide'); return; }
    const lb = e.target.closest('[data-lightbox-close]'); if (lb) { closeBox($('#ZoomLightbox')); return; }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { $$('.drawer:not([hidden]),.modal:not([hidden]),.lightbox:not([hidden])').forEach(closeBox); closeMega(); closeSearch(); closeMnav(); }
  });

  /* ---------- header ---------- */
  const header = $('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  // announcement rotation
  const ann = $('[data-announce]');
  if (ann) {
    const msgs = $$('.announce__msg', ann);
    const every = parseFloat(ann.dataset.rotate || 0) * 1000;
    if (every > 0 && msgs.length > 1) {
      let i = 0;
      setInterval(() => { msgs[i].classList.remove('is-active'); i = (i + 1) % msgs.length; msgs[i].classList.add('is-active'); }, every);
    }
  }
  // mega menu
  const mega = $('[data-mega]');
  const megaTrigger = () => $$('.header__item.has-mega > a');
  function openMega() { if (mega) { mega.hidden = false; megaTrigger().forEach(a => a.setAttribute('aria-expanded', 'true')); } }
  function closeMega() { if (mega && !mega.hidden) { mega.hidden = true; megaTrigger().forEach(a => a.setAttribute('aria-expanded', 'false')); } }
  megaTrigger().forEach(a => {
    a.addEventListener('click', (e) => { if (window.innerWidth >= 1024) { e.preventDefault(); mega.hidden ? openMega() : closeMega(); } });
    a.addEventListener('mouseenter', () => { if (window.innerWidth >= 1024) openMega(); });
  });
  if (mega) mega.addEventListener('mouseleave', () => { if (window.innerWidth >= 1024) closeMega(); });
  document.addEventListener('click', (e) => { if (mega && !mega.hidden && !e.target.closest('.mega') && !e.target.closest('.has-mega')) closeMega(); });

  // mobile nav
  const mnav = $('[data-mnav]');
  function closeMnav() { if (mnav && !mnav.hidden) { mnav.hidden = true; document.body.style.overflow = ''; } }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-menu-open]')) { if (mnav) { mnav.hidden = false; document.body.style.overflow = 'hidden'; } }
    if (e.target.closest('[data-menu-close]')) closeMnav();
  });

  // search panel
  const spanel = $('[data-search-panel]');
  function closeSearch() { if (spanel && !spanel.hidden) { spanel.hidden = true; $('[data-search-open]').setAttribute('aria-expanded', 'false'); } }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-search-open]')) {
      if (spanel) { spanel.hidden = !spanel.hidden; if (!spanel.hidden) { const i = $('.searchpanel__input'); i && i.focus(); } }
    }
    if (e.target.closest('[data-search-close]')) closeSearch();
    if (spanel && !spanel.hidden && !e.target.closest('.searchpanel') && !e.target.closest('[data-search-open]')) closeSearch();
  });

  /* ---------- quantity steppers ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.qty__btn'); if (!b) return;
    const wrap = b.closest('quantity-input, .qty');
    const input = $('.qty__input', wrap);
    const min = parseInt(input.min || 1, 10);
    const max = input.max ? parseInt(input.max, 10) : Infinity;
    let v = parseInt(input.value || min, 10) + parseInt(b.dataset.step, 10);
    v = Math.max(min, Math.min(max, v));
    input.value = v;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------- tabs ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tabs] [data-tab]'); if (!t) return;
    const root = t.closest('[data-tabs]');
    $$('[data-tab]', root).forEach(x => { x.classList.toggle('is-active', x === t); x.setAttribute('aria-selected', x === t); });
    $$('[data-panel]', root).forEach(p => p.classList.toggle('is-active', p.dataset.panel === t.dataset.tab));
  });

  /* ---------- carousels ---------- */
  document.addEventListener('click', (e) => {
    const prev = e.target.closest('[data-carousel-prev]');
    const next = e.target.closest('[data-carousel-next]');
    if (!prev && !next) return;
    const sec = (prev || next).closest('section, .related, .featcol');
    const track = $('[data-carousel-track], .carousel__track', sec);
    if (!track) return;
    const w = track.clientWidth * 0.8;
    track.scrollBy({ left: prev ? -w : w, behavior: 'smooth' });
  });

  /* ---------- hero slider ---------- */
  const heroSlides = $$('[data-hero-slide]');
  if (heroSlides.length > 1) {
    let hi = 0;
    const go = (i) => { heroSlides[hi].classList.remove('is-active'); hi = i; heroSlides[hi].classList.add('is-active'); $$('[data-hero-dot]').forEach((d, di) => d.classList.toggle('is-active', di === hi)); };
    $$('[data-hero-dot]').forEach(d => d.addEventListener('click', () => go(parseInt(d.dataset.heroDot, 10))));
    setInterval(() => go((hi + 1) % heroSlides.length), 7000);
  }

  /* ---------- newsletter ---------- */
  $$('[data-newsletter]').forEach(f => f.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('input[type=email]', f);
    const msg = $('.newsform__msg', f);
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value);
    if (msg) msg.textContent = ok ? (S.strings && S.strings.newsletter_ok || 'Welcome to the circle! Check your inbox for 10% off.') : 'Please enter a valid email.';
    if (ok) { input.value = ''; fetch('/contact', { method: 'POST', body: new FormData(f) }).catch(() => {}); }
  }));

  /* ---------- copy link ---------- */
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-copy-link]'); if (!c) return;
    (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject())
      .then(() => A.toast('Link copied to clipboard'))
      .catch(() => A.toast('Copy failed — use the address bar', 'err'));
  });

  /* ---------- auth pane swap ---------- */
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-auth-show]'); if (!s) return;
    $$('[data-auth-pane]').forEach(p => { p.hidden = p.dataset.authPane !== s.dataset.authShow; });
  });

  /* ---------- wishlist ---------- */
  const WL_KEY = 'auravya_wishlist';
  const Wishlist = A.Wishlist = {
    list() { try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); } catch (e) { return []; } },
    save(l) { localStorage.setItem(WL_KEY, JSON.stringify(l)); this.sync(); },
    has(h) { return this.list().includes(h); },
    toggle(h) {
      let l = this.list();
      const had = l.includes(h);
      l = had ? l.filter(x => x !== h) : l.concat(h);
      this.save(l);
      return !had;
    },
    sync() {
      const l = this.list();
      $$('[data-wishlist-toggle]').forEach(b => {
        const on = l.includes(b.dataset.wishlistToggle);
        b.classList.toggle('is-saved', on);
        b.setAttribute('aria-pressed', on);
      });
      $$('[data-wl-count]').forEach(el => { el.textContent = l.length; el.hidden = l.length === 0; });
    },
    render() {
      const body = $('[data-wishlist-body]'); if (!body) return;
      const l = this.list();
      if (!l.length) { body.innerHTML = '<div class="drawer__empty"><svg class="icon drawer__emptyicon"><use href="#i-heart"/></svg><p>' + (S.strings && S.strings.wl_empty || 'Your wishlist is empty.') + '</p></div>'; return; }
      body.innerHTML = '<div class="drawer__loader" style="display:grid;place-items:center;padding:2rem"><span class="spinner"></span></div>';
      Promise.all(l.map(h => fetch('/products/' + h + '.js').then(r => r.ok ? r.json() : null))).then(items => {
        body.innerHTML = '';
        items.filter(Boolean).forEach(p => {
          const el = document.createElement('div');
          el.className = 'citem';
          el.innerHTML =
            '<a class="citem__media" href="' + p.url + '">' + (p.featured_image ? '<img src="' + p.featured_image + '" alt="" width="88" height="88" loading="lazy">' : '') + '</a>' +
            '<div class="citem__body"><div class="citem__top"><a class="citem__title" href="' + p.url + '">' + p.title + '</a>' +
            '<button class="iconbtn citem__remove" data-wl-remove="' + p.handle + '" aria-label="Remove"><svg class="icon"><use href="#i-trash"/></svg></button></div>' +
            '<div class="citem__bottom"><span class="price price--sm"><span class="price__regular">' + A.money(p.price) + '</span></span>' +
            '<button class="btn btn--sm" data-wl-add="' + p.handle + '">Add to bag</button></div></div>';
          body.appendChild(el);
        });
      });
    }
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-wishlist-toggle]');
    if (t) {
      const added = Wishlist.toggle(t.dataset.wishlistToggle);
      A.toast(added ? (S.strings.wl_added || 'Saved to wishlist') : (S.strings.wl_removed || 'Removed from wishlist'));
      return;
    }
    const rm = e.target.closest('[data-wl-remove]');
    if (rm) { Wishlist.toggle(rm.dataset.wlRemove); Wishlist.render(); return; }
    const ad = e.target.closest('[data-wl-add]');
    if (ad && A.Cart) {
      fetch('/products/' + ad.dataset.wlAdd + '.js').then(r => r.json()).then(p => {
        const id = p.variants && p.variants[0] && (p.variants[0].id || p.variants[0]);
        A.Cart.add(id, 1).then(() => { Wishlist.toggle(ad.dataset.wlAdd); Wishlist.render(); });
      });
    }
  });
  Wishlist.sync();

  /* ---------- collapsibles (details) smooth ---------- */
  $$('[data-acc]').forEach(d => {
    const head = $('summary', d);
    head.addEventListener('click', (e) => {
      e.preventDefault();
      const body = $('.acc__body', d);
      if (d.open) {
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(() => { body.style.maxHeight = '0'; body.style.overflow = 'hidden'; });
        setTimeout(() => { d.open = false; body.style.maxHeight = ''; }, 260);
      } else {
        d.open = true;
        body.style.maxHeight = '0'; body.style.overflow = 'hidden';
        requestAnimationFrame(() => { body.style.maxHeight = body.scrollHeight + 'px'; });
        setTimeout(() => { body.style.maxHeight = ''; body.style.overflow = ''; }, 300);
      }
    });
  });
  // facet open/close
  document.addEventListener('click', (e) => {
    const fh = e.target.closest('.facet__head'); if (!fh) return;
    fh.closest('.facet').classList.toggle('is-closed');
    fh.setAttribute('aria-expanded', !fh.closest('.facet').classList.contains('is-closed'));
  });
})();

/* footer link columns: accordion on small screens, always-open rows on desktop */
(function () {
  'use strict';
  const init = () => {
    const cols = document.querySelectorAll('footer .footer__col');
    if (!cols.length || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width:1024px)');
    const apply = () => cols.forEach((d, i) => { d.open = mq.matches || i === 0; });
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
