// <promotion-schedule data-starts-at data-ends-at> picks a promotion state from the browser clock,
// so cached pages switch at the exact minute. Liquid renders the markup and its best-guess state;
// this element corrects it on connect (page load, Section Rendering swaps, copied price markup).
//
// Children it controls:
// - [data-promotion-scheduled]: shown before data-starts-at
// - [data-promotion-active]: shown from data-starts-at through data-ends-at
// - [data-promotion-inactive]: shown whenever the promotion is not active
// - template[data-promotion-stamp="active|inactive"]: its content is inserted in that state (for markup
//   that must not initialise while hidden, such as the announcement slideshow)
// - data-promotion-toggle="parent" on the element itself: the parent element is shown only when active
//
// Preview: on a non-live theme only, ?bfcm_preview=1 (kept in sessionStorage; ?bfcm_preview=0 clears it)
// treats every promotion that has not ended as active. The layout adds data-promotion-preview-allowed
// to <html> only when theme.role is not 'main', and Shopify.theme.role must also not be 'main'.
(() => {
  const PREVIEW_KEY = 'bfcm_preview';

  const previewEnabled = (() => {
    try {
      const role = window.Shopify && window.Shopify.theme && window.Shopify.theme.role;
      if (!role || role === 'main') return false;
      if (!document.documentElement.hasAttribute('data-promotion-preview-allowed')) return false;
      const param = new URLSearchParams(window.location.search).get(PREVIEW_KEY);
      if (param === '1') window.sessionStorage.setItem(PREVIEW_KEY, '1');
      if (param === '0') window.sessionStorage.removeItem(PREVIEW_KEY);
      return window.sessionStorage.getItem(PREVIEW_KEY) === '1';
    } catch (error) {
      return false;
    }
  })();

  if (customElements.get('promotion-schedule')) return;

  customElements.define(
    'promotion-schedule',
    class PromotionSchedule extends HTMLElement {
      connectedCallback() {
        const now = Date.now();
        const startsAt = Date.parse(this.dataset.startsAt);
        const endsAt = Date.parse(this.dataset.endsAt);
        const ended = Number.isNaN(startsAt) || Number.isNaN(endsAt) || now > endsAt;
        const scheduled = !previewEnabled && now < startsAt;
        const active = !ended && !scheduled;

        this.dataset.promotionState = active ? 'active' : scheduled ? 'scheduled' : 'ended';

        this.querySelectorAll('template[data-promotion-stamp]').forEach((template) => {
          const stampWhenActive = template.dataset.promotionStamp !== 'inactive';
          if (stampWhenActive === active) template.replaceWith(template.content.cloneNode(true));
        });

        this.querySelectorAll('[data-promotion-scheduled]').forEach((element) => {
          element.toggleAttribute('hidden', !scheduled);
        });
        this.querySelectorAll('[data-promotion-active]').forEach((element) => {
          element.toggleAttribute('hidden', !active);
        });
        this.querySelectorAll('[data-promotion-inactive]').forEach((element) => {
          element.toggleAttribute('hidden', active);
        });

        if (this.dataset.promotionToggle === 'parent' && this.parentElement) {
          this.parentElement.toggleAttribute('hidden', !active);
        }
      }
    }
  );
})();
