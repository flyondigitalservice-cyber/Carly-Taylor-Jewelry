/* AURAVYA cart — AJAX Cart API (Shopify-compatible endpoints) */
(function () {
  'use strict';
  const A = window.Auravya;
  const $ = A.$, $$ = A.$$;
  const S = A.settings;

  const Api = {
    get() { return fetch('/cart.js').then(r => r.json()); },
    add(id, qty, props) {
      const body = { items: [{ id: id, quantity: qty || 1, properties: props || {} }] };
      return fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(r => r.json().then(j => { if (!r.ok) throw j; return j; }));
    },
    change(key, qty) {
      return fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: key, quantity: qty }) }).then(r => r.json());
    },
    update(data) {
      return fetch('/cart/update.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
    }
  };

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

    add(id, qty, props) {
      return Api.add(id, qty, props).then(() => {
        A.toast(S.strings.added || 'Added to your bag');
        return Cart.refresh(true).then(() => {
          if (S.cart_drawer) A.openDrawer('cart');
        });
      }).catch(err => {
        A.toast((err && err.description) || 'Could not add to bag', 'err');
        throw err;
      });
    },

    paintCounts() {
      const n = Cart.state.item_count || 0;
      $$('[data-cart-count]').forEach(el => { el.textContent = n; el.hidden = n === 0; });
    },

    paintShipbar() {
      const bar = $('[data-shipbar]'); if (!bar || !S.free_ship_on) return;
      const sub = Cart.state.items_subtotal_price || 0;
      const th = (S.free_ship || 0) * 100;
      const label = $('[data-shipbar-label]', bar);
      const fill = $('[data-shipbar-fill]', bar);
      if (th > 0) {
        const pct = Math.min(100, (sub / th) * 100);
        if (fill) fill.style.width = pct + '%';
        if (label) {
          if (sub >= th) label.textContent = S.strings.free_ship_done || 'You unlocked FREE shipping 🎉';
          else label.textContent = (S.strings.free_ship_progress || "You're {{ amount }} away from FREE shipping").replace('{{ amount }}', A.money(th - sub));
        }
      }
    },

    itemHTML(item) {
      const props = Object.entries(item.properties || {}).filter(([, v]) => v);
      return '<div class="citem" data-cart-item="' + item.key + '">' +
        '<a class="citem__media" href="' + item.url + '">' + (item.image ? '<img src="' + item.image + '" alt="" width="88" height="88" loading="lazy">' : '') + '</a>' +
        '<div class="citem__body">' +
        '<div class="citem__top"><a class="citem__title" href="' + item.url + '">' + item.product_title +
        (item.variant_title && item.variant_title !== 'Default Title' ? '<span class="citem__variant">' + item.variant_title + '</span>' : '') + '</a>' +
        '<button class="iconbtn citem__remove" data-remove-item="' + item.key + '" aria-label="Remove"><svg class="icon"><use href="#i-trash"/></svg></button></div>' +
        (props.length ? '<ul class="citem__props">' + props.map(([k, v]) => '<li><strong>' + k + ':</strong> ' + v + '</li>').join('') + '</ul>' : '') +
        '<div class="citem__bottom">' +
        '<quantity-input class="qty qty--sm"><button type="button" class="qty__btn" data-step="-1" aria-label="Decrease"><svg class="icon"><use href="#i-minus"/></svg></button>' +
        '<input class="qty__input" type="number" value="' + item.quantity + '" min="0" data-item-key="' + item.key + '" aria-label="Quantity">' +
        '<button type="button" class="qty__btn" data-step="1" aria-label="Increase"><svg class="icon"><use href="#i-plus"/></svg></button></quantity-input>' +
        '<span class="citem__price">' + (item.original_line_price > item.final_line_price ? '<s>' + A.money(item.original_line_price) + '</s>' : '') + '<strong>' + A.money(item.final_line_price) + '</strong></span>' +
        '</div></div></div>';
    },

    paintDrawer() {
      const body = $('[data-cart-items]'); if (!body) return;
      const items = Cart.state.items || [];
      if (!items.length) {
        body.innerHTML = '<div class="drawer__empty"><svg class="icon drawer__emptyicon"><use href="#i-bag"/></svg><p>' + (S.strings.cart_empty || 'Your bag is empty.') + '</p><a class="btn" href="/collections/all" data-drawer-close>Start shopping</a></div>';
      } else {
        body.innerHTML = items.map(Cart.itemHTML).join('');
      }
      $$('[data-cart-total]').forEach(el => { el.textContent = A.money(Cart.state.items_subtotal_price || 0); });
      const note = $('[data-cart-note]');
      if (note && Cart.state.note) note.value = Cart.state.note;
    }
  };

  /* ----- events ----- */
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-product-form]'); if (!form) return;
    e.preventDefault();
    const btn = e.submitter || $('[data-add-button]', form);
    const id = $('[data-variant-id]', form).value;
    const qty = parseInt(($('.qty__input', form) || {}).value || 1, 10);
    const props = {};
    const eng = $('[data-engraving-input]', form);
    if (eng && eng.value.trim()) props['Engraving'] = eng.value.trim();
    const gw = $('[data-giftwrap]', form);
    if (gw && gw.checked) props['Gift Wrap'] = gw.value || 'Yes';
    if (btn && btn.hasAttribute('data-buy-now')) {
      btn.classList.add('is-loading');
      Cart.add(id, qty, props).then(() => { window.location.href = '/checkout'; }).catch(() => btn.classList.remove('is-loading'));
      return;
    }
    btn && btn.classList.add('is-loading');
    Cart.add(id, qty, props).finally(() => btn && btn.classList.remove('is-loading'));
  });

  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add-to-cart]');
    if (add) {
      if (add.disabled) return;
      add.classList.add('is-loading');
      Cart.add(add.dataset.addToCart, 1).finally(() => add.classList.remove('is-loading'));
      return;
    }
    const rm = e.target.closest('[data-remove-item]');
    if (rm) { Api.change(rm.dataset.removeItem, 0).then(() => Cart.refresh(true)); return; }
    const co = e.target.closest('[data-checkout]');
    if (co) { window.location.href = '/checkout'; return; }
  });

  document.addEventListener('change', (e) => {
    const qi = e.target.closest('.qty__input[data-item-key]');
    if (qi) {
      const v = parseInt(qi.value, 10);
      if (v === 0) Api.change(qi.dataset.itemKey, 0).then(() => Cart.refresh(true));
      else Api.change(qi.dataset.itemKey, v).then(() => Cart.refresh(true));
      return;
    }
    const note = e.target.closest('[data-cart-note]');
    if (note) Api.update({ note: note.value }).then(() => Cart.refresh(true));
  });

  Cart.refresh(true);
})();
