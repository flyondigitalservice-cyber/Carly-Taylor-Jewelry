/* AURAVYA cart — Shopify AJAX Cart API, drawer rendering, paid add-ons */
(function () {
  'use strict';
  const A = window.Auravya;
  const $ = A.$, $$ = A.$$;
  const S = A.settings;
  const R = A.routes;
  const esc = A.esc;
  const onCartPage = document.body.classList.contains('template-cart');

  const json = (r) => r.json().then(j => { if (!r.ok || j.status) throw j; return j; });
  const post = (url, body) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  }).then(json);

  const Api = {
    get() { return fetch(R.cart_js, { headers: { Accept: 'application/json' } }).then(r => r.json()); },
    addItems(items) { return post(R.cart_add, { items: items }); },
    change(key, qty) { return post(R.cart_change, { id: key, quantity: qty }); },
    update(data) { return post(R.cart_update, data); }
  };
  A.CartApi = Api;

  const Cart = A.Cart = {
    state: { items: [], item_count: 0, items_subtotal_price: 0 },

    refresh(silent) {
      return Api.get().then(cart => {
        Cart.state = cart;
        Cart.paintCounts();
        Cart.paintDrawer();
        Cart.paintShipbar();
        if (!silent) document.dispatchEvent(new CustomEvent('cart:refresh', { detail: cart }));
        return cart;
      }).catch(() => {});
    },

    /* add(id, qty, props) or add([{id, quantity, properties}, …]) */
    add(id, qty, props) {
      const items = Array.isArray(id) ? id : [{ id: id, quantity: qty || 1, properties: props || {} }];
      return Api.addItems(items).then(() => {
        A.toast(S.strings.added || 'Added to your bag');
        if (onCartPage) { window.location.reload(); return; }
        return Cart.refresh().then(() => { if (S.cart_drawer) A.openDrawer('cart'); });
      }).catch(err => {
        A.toast((err && (err.description || err.message)) || S.strings.cart_error || 'Could not add to bag', 'err');
        throw err;
      });
    },

    change(key, qty) {
      return Api.change(key, qty).then(() => {
        if (onCartPage) { window.location.reload(); return; }
        return Cart.refresh();
      }).catch(err => {
        A.toast((err && (err.description || err.message)) || S.strings.cart_error || 'Could not update bag', 'err');
        return Cart.refresh();
      });
    },

    paintCounts() {
      const n = Cart.state.item_count || 0;
      $$('[data-cart-count]').forEach(el => { el.textContent = n; el.hidden = n === 0; });
    },

    paintShipbar() {
      if (!S.free_ship_on) return;
      const sub = Cart.state.items_subtotal_price || 0;
      const th = (S.free_ship || 0) * 100;
      $$('[data-shipbar]').forEach(bar => {
        const label = $('[data-shipbar-label]', bar);
        const fill = $('[data-shipbar-fill]', bar);
        if (th <= 0) { bar.hidden = true; return; }
        bar.classList.toggle('is-done', sub >= th);
        if (fill) fill.style.width = Math.min(100, (sub / th) * 100) + '%';
        if (label) {
          label.textContent = sub >= th
            ? (S.strings.free_ship_done || 'You have unlocked FREE shipping')
            : A.t('free_ship_progress', { amount: A.money(th - sub) }) || ('You are ' + A.money(th - sub) + ' away from FREE shipping');
        }
      });
    },

    itemHTML(item) {
      const props = Object.entries(item.properties || {}).filter(([k, v]) => v && k.charAt(0) !== '_');
      const img = item.image ? item.image + (item.image.indexOf('?') > -1 ? '&' : '?') + 'width=200' : '';
      const variant = item.variant_title && item.variant_title !== 'Default Title' ? '<span class="citem__variant">' + esc(item.variant_title) + '</span>' : '';
      const discounts = (item.line_level_discount_allocations || []).map(d => '<li class="citem__disc"><svg class="icon"><use href="#i-sparkle"/></svg>' + esc(d.discount_application.title) + ' (−' + A.money(d.amount) + ')</li>').join('');
      return '<div class="citem" data-cart-item="' + esc(item.key) + '">' +
        '<a class="citem__media" href="' + esc(item.url) + '" tabindex="-1" aria-hidden="true">' + (img ? '<img src="' + esc(img) + '" alt="" width="88" height="88" loading="lazy">' : '') + '</a>' +
        '<div class="citem__body">' +
        '<div class="citem__top"><a class="citem__title" href="' + esc(item.url) + '">' + esc(item.product_title) + variant + '</a>' +
        '<button class="iconbtn citem__remove" type="button" data-remove-item="' + esc(item.key) + '" aria-label="' + esc((S.strings.remove || 'Remove') + ': ' + item.product_title) + '"><svg class="icon"><use href="#i-trash"/></svg></button></div>' +
        (props.length || discounts ? '<ul class="citem__props">' + props.map(([k, v]) => '<li><strong>' + esc(k) + ':</strong> ' + esc(v) + '</li>').join('') + discounts + '</ul>' : '') +
        '<div class="citem__bottom">' +
        '<quantity-input class="qty qty--sm"><button type="button" class="qty__btn" data-step="-1" aria-label="−"><svg class="icon"><use href="#i-minus"/></svg></button>' +
        '<input class="qty__input" type="number" inputmode="numeric" value="' + item.quantity + '" min="0" data-item-key="' + esc(item.key) + '" aria-label="' + esc(S.strings.quantity || 'Quantity') + '">' +
        '<button type="button" class="qty__btn" data-step="1" aria-label="+"><svg class="icon"><use href="#i-plus"/></svg></button></quantity-input>' +
        '<span class="citem__price">' + (item.original_line_price > item.final_line_price ? '<s>' + A.money(item.original_line_price) + '</s>' : '') + '<strong>' + A.money(item.final_line_price) + '</strong></span>' +
        '</div></div></div>';
    },

    paintDrawer() {
      const body = $('[data-cart-items]'); if (!body) return;
      const items = Cart.state.items || [];
      const drawer = $('#CartDrawer');
      if (drawer) drawer.classList.toggle('is-empty', !items.length);
      if (!items.length) {
        body.innerHTML = '<div class="drawer__empty"><svg class="icon drawer__emptyicon"><use href="#i-bag"/></svg><p>' + esc(S.strings.cart_empty || 'Your bag is empty.') + '</p><a class="btn" href="' + esc(R.all) + '">' + esc(S.strings.cart_empty_cta || 'Start shopping') + '</a></div>';
      } else {
        body.innerHTML = items.map(Cart.itemHTML).join('');
      }
      $$('[data-cart-total]').forEach(el => { el.textContent = A.money(Cart.state.total_price != null ? Cart.state.total_price : (Cart.state.items_subtotal_price || 0)); });
      const savings = Cart.state.total_discount || 0;
      $$('[data-cart-savings]').forEach(el => { el.hidden = savings <= 0; const v = $('[data-cart-savings-value]', el); if (v) v.textContent = A.money(savings); });
      const note = $('[data-cart-note]');
      if (note && document.activeElement !== note) note.value = Cart.state.note || '';
    }
  };

  /* ----- product form submit (PDP, quick view) ----- */
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-product-form]'); if (!form) return;
    e.preventDefault();
    const btn = $('[data-add-button]', form);
    if (btn && btn.disabled) return;
    const id = $('[data-variant-id]', form).value;
    const qty = Math.max(1, parseInt(($('.qty__input', form) || {}).value || 1, 10));
    const title = form.dataset.productTitle || '';
    const props = {};
    const items = [];

    const engToggle = $('[data-toggle-engraving]', form);
    const eng = $('[data-engraving-input]', form);
    if (engToggle && engToggle.checked) {
      const text = eng ? eng.value.trim() : '';
      if (!text) { eng && eng.focus(); A.toast(eng ? eng.placeholder : 'Add engraving text', 'err'); return; }
      props['Engraving'] = text;
      if (S.engraving_variant) items.push({ id: S.engraving_variant, quantity: qty, properties: { For: title, Text: text } });
    }
    const gw = $('[data-giftwrap]', form);
    if (gw && gw.checked) {
      props['Gift wrap'] = 'Yes';
      if (S.gift_wrap_variant) items.push({ id: S.gift_wrap_variant, quantity: qty, properties: { For: title } });
    }
    items.unshift({ id: id, quantity: qty, properties: props });

    btn && btn.classList.add('is-loading');
    Cart.add(items).catch(() => {}).finally(() => btn && btn.classList.remove('is-loading'));
  });

  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add-to-cart]');
    if (add) {
      e.preventDefault();
      if (add.disabled) return;
      add.classList.add('is-loading');
      Cart.add(add.dataset.addToCart, 1).catch(() => {}).finally(() => add.classList.remove('is-loading'));
      return;
    }
    const rm = e.target.closest('[data-remove-item]');
    if (rm) {
      e.preventDefault();
      const row = rm.closest('.citem'); if (row) row.classList.add('is-loading');
      Cart.change(rm.dataset.removeItem, 0);
    }
  });

  const queueChange = A.debounce((input) => {
    const v = Math.max(0, parseInt(input.value, 10) || 0);
    const row = input.closest('.citem'); if (row) row.classList.add('is-loading');
    Cart.change(input.dataset.itemKey, v);
  }, 350);

  document.addEventListener('change', (e) => {
    const qi = e.target.closest('.qty__input[data-item-key]');
    if (qi) { queueChange(qi); return; }
    const note = e.target.closest('[data-cart-note]');
    if (note) Api.update({ note: note.value }).catch(() => {});
  });

  /* Keep the drawer in sync when the page is restored from bfcache */
  window.addEventListener('pageshow', (e) => { if (e.persisted) Cart.refresh(true); });

  Cart.refresh(true);
})();
