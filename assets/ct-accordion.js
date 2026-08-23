/*
 * Carly Taylor Jewelry -- smooth open/close for the PDP's collapsible_tab
 * accordions ("Details", "Materials & care", "Shipping & returns")
 * -------------------------------------------------------------------------
 * Purely a progressive enhancement on top of Dawn's own, unmodified
 * <details>/<summary> markup (sections/main-product.liquid's
 * collapsible_tab case, styled in assets/ct-product.css). Without this
 * file -- JS disabled, blocked, or erroring -- every accordion still opens
 * and closes instantly and correctly; native <details> behaviour is never
 * removed or replaced, only intercepted to animate the height.
 *
 * Uses the Web Animations API to animate `<details>`'s own height between
 * its closed (summary-only) and open (summary + content) heights, which is
 * the standard technique for animating <details> without fighting its
 * native display:none/block toggle on the content (a plain CSS `transition`
 * can't run across that discrete display change; see the comment on
 * .product__media-item's fade-in in ct-product.css for the same constraint
 * solved a different way). Skipped entirely under prefers-reduced-motion,
 * in which case <details> falls back to its native instant toggle.
 */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('animate' in Element.prototype)) return;

  var DURATION = 250;
  var EASING = 'ease-out';

  function CtAccordion(details) {
    this.details = details;
    this.summary = details.querySelector('summary');
    this.content = details.querySelector('.accordion__content');
    this.animation = null;
    this.isClosing = false;
    this.isExpanding = false;
    if (!this.summary || !this.content) return;

    this.onClick = this.onClick.bind(this);
    this.summary.addEventListener('click', this.onClick);
  }

  CtAccordion.prototype.onClick = function (event) {
    event.preventDefault();
    this.details.style.overflow = 'hidden';

    if (this.isClosing || !this.details.open) {
      this.open();
    } else if (this.isExpanding || this.details.open) {
      this.shrink();
    }
  };

  CtAccordion.prototype.shrink = function () {
    this.isClosing = true;
    var startHeight = this.details.offsetHeight + 'px';
    var endHeight = this.summary.offsetHeight + 'px';

    if (this.animation) this.animation.cancel();
    this.animation = this.details.animate({ height: [startHeight, endHeight] }, { duration: DURATION, easing: EASING });
    this.animation.onfinish = this.onAnimationFinish.bind(this, false);
    this.animation.oncancel = function () {
      this.isClosing = false;
    }.bind(this);
  };

  CtAccordion.prototype.open = function () {
    this.details.style.height = this.details.offsetHeight + 'px';
    this.details.open = true;
    window.requestAnimationFrame(this.expand.bind(this));
  };

  CtAccordion.prototype.expand = function () {
    this.isExpanding = true;
    var startHeight = this.details.offsetHeight + 'px';
    var endHeight = this.summary.offsetHeight + this.content.offsetHeight + 'px';

    if (this.animation) this.animation.cancel();
    this.animation = this.details.animate({ height: [startHeight, endHeight] }, { duration: DURATION, easing: EASING });
    this.animation.onfinish = this.onAnimationFinish.bind(this, true);
    this.animation.oncancel = function () {
      this.isExpanding = false;
    }.bind(this);
  };

  CtAccordion.prototype.onAnimationFinish = function (open) {
    this.details.open = open;
    this.animation = null;
    this.isClosing = false;
    this.isExpanding = false;
    this.details.style.height = '';
    this.details.style.overflow = '';
  };

  function initAll() {
    document.querySelectorAll('.ct-product .product__accordion > details').forEach(function (details) {
      if (details.dataset.ctAccordionInit) return;
      details.dataset.ctAccordionInit = 'true';
      new CtAccordion(details);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
