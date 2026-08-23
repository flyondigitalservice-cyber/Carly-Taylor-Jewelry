/*
 * Carly Taylor Jewelry -- mobile sticky add-to-bag bar
 * -------------------------------------------------------------------------
 * Dawn ships no equivalent component; this is new. Rendered by
 * sections/main-product.liquid as `.ct-sticky-atc`, hidden by default (both
 * the `hidden` attribute in the markup and assets/ct-product.css's
 * `display: none` outside the 749px-and-below breakpoint).
 *
 * Deliberately does NOT duplicate form state. The bar's button carries no
 * <form> of its own -- it points at the real product form via the HTML
 * `form="product-form-{{ section.id }}"` attribute, so the exact same
 * variant-id/quantity hidden inputs and the same assets/product-form.js
 * submit handler run. This script only ever toggles visibility and mirrors
 * two bits of already-rendered state (price, disabled) into the bar; it
 * never reads or writes cart/variant state itself.
 *
 * Every lookup is null-checked and every observer is optional -- on any
 * markup change this silently does less (usually: the bar just never shows)
 * rather than throwing, matching the defensive style already established in
 * this section's own inline scripts.
 */
(function () {
  function init(root) {
    var sectionId = root.dataset.sectionId;
    if (!sectionId) return;

    var realButton = document.getElementById('ProductSubmitButton-' + sectionId);
    var footer = document.querySelector('.footer');
    var priceSource = document.getElementById('price-' + sectionId);
    var priceTarget = root.querySelector('[data-ct-sticky-price]');
    var stickyButton = root.querySelector('.ct-sticky-atc__button');
    if (!realButton || !stickyButton) return;

    var buttonVisible = true;
    var footerVisible = false;

    function updateVisibility() {
      root.hidden = buttonVisible || footerVisible;
    }

    function syncDisabled() {
      var disabled = realButton.hasAttribute('disabled') || realButton.getAttribute('aria-disabled') === 'true';
      stickyButton.disabled = disabled;
    }

    function syncPrice() {
      if (!priceSource || !priceTarget) return;
      priceTarget.innerHTML = priceSource.innerHTML;
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        function (entries) {
          buttonVisible = entries[entries.length - 1].isIntersecting;
          updateVisibility();
        },
        { threshold: 0 }
      ).observe(realButton);

      // Also hide the bar once the footer is on screen, so it never sits on
      // top of it (or, on very short pages, on top of the cart drawer's own
      // footer-adjacent controls).
      if (footer) {
        new IntersectionObserver(
          function (entries) {
            footerVisible = entries[entries.length - 1].isIntersecting;
            updateVisibility();
          },
          { threshold: 0 }
        ).observe(footer);
      }
    } else {
      // No IntersectionObserver support: stay hidden rather than guess from
      // scroll position (the task explicitly calls for observer-based
      // visibility, not a scroll heuristic) -- graceful no-op, same
      // philosophy as the rest of this file.
      return;
    }

    syncDisabled();
    syncPrice();

    if (window.MutationObserver) {
      new MutationObserver(syncDisabled).observe(realButton, {
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled'],
      });
      if (priceSource) {
        new MutationObserver(syncPrice).observe(priceSource, { childList: true, subtree: true });
      }
    }
  }

  function initAll() {
    document.querySelectorAll('.ct-sticky-atc').forEach(function (root) {
      if (root.dataset.ctInit) return;
      root.dataset.ctInit = 'true';
      init(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
