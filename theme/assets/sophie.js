(() => {
  document.documentElement.classList.add('js');

  document.querySelectorAll('[name="language_code"]').forEach((select) => {
    select.addEventListener('change', () => {
      const form = select.form;
      if (!form) return;
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.submit();
    });
  });

  const menuButton = document.querySelector('[data-menu-toggle]');
  const navigation = document.querySelector('[data-primary-navigation]');

  if (menuButton && navigation) {
    const menuLabel = menuButton.querySelector('.sr-only');
    const openLabel = menuButton.dataset.openLabel || menuLabel?.textContent || 'Open menu';
    const closeLabel = menuButton.dataset.closeLabel || 'Close menu';
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      if (menuLabel) menuLabel.textContent = openLabel;
      navigation.classList.remove('is-open');
    };
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      if (menuLabel) menuLabel.textContent = open ? closeLabel : openLabel;
      navigation.classList.toggle('is-open', open);
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
    document.addEventListener('click', (event) => {
      if (menuButton.getAttribute('aria-expanded') === 'true' && !navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  const mobileSearch = document.querySelector('[data-mobile-search]');
  if (mobileSearch) {
    const summary = mobileSearch.querySelector('summary');
    const input = mobileSearch.querySelector('input[type="search"]');
    mobileSearch.addEventListener('toggle', () => {
      if (mobileSearch.open) window.requestAnimationFrame(() => input?.focus());
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mobileSearch.open) {
        mobileSearch.open = false;
        summary?.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (mobileSearch.open && !mobileSearch.contains(event.target)) mobileSearch.open = false;
    });
  }

  document.querySelectorAll('[data-submenu-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      button.closest('.nav-item')?.classList.toggle('is-open', open);
    });
  });

  document.querySelectorAll('.product-form').forEach((form) => {
    const variantScript = form.querySelector('[data-variants]');
    const variantInput = form.querySelector('[data-variant-id]');
    const selectors = [...form.querySelectorAll('[data-product-option]')];
    const button = form.querySelector('[data-add-to-cart]');
    const price = form.closest('[data-product-section]')?.querySelector('[data-product-price]');
    if (!variantScript || !variantInput || !button || selectors.length === 0) return;

    let variants;
    try { variants = JSON.parse(variantScript.textContent); } catch { return; }
    const currency = window.Shopify?.currency?.active || 'EUR';
    const money = (minorUnits) => {
      try { return new Intl.NumberFormat(document.documentElement.lang || 'en-GB', { style: 'currency', currency }).format(Number(minorUnits) / 100); }
      catch { return `${(Number(minorUnits) / 100).toFixed(2)} ${currency}`; }
    };
    const updateVariant = () => {
      const selected = selectors.map((select) => select.value);
      const variant = variants.find((item) => item.options?.every((option, index) => option === selected[index]));
      if (!variant) {
        variantInput.value = '';
        button.disabled = true;
        button.textContent = button.dataset.soldOutLabel || 'Out of stock';
        return;
      }
      variantInput.value = variant.id;
      button.disabled = !variant.available;
      button.textContent = variant.available ? (button.dataset.addLabel || 'Add to bag') : (button.dataset.soldOutLabel || 'Out of stock');
      if (price) price.textContent = money(variant.price);
      const next = new URL(window.location.href);
      next.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', next);
    };
    selectors.forEach((select) => select.addEventListener('change', updateVariant));
  });

  class SophieRecommendations extends HTMLElement {
    connectedCallback() {
      const endpoint = this.dataset.url;
      if (!endpoint) return;
      fetch(endpoint, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then((response) => response.ok ? response.text() : '')
        .then((markup) => {
          if (!markup) { this.remove(); return; }
          const documentFragment = new DOMParser().parseFromString(markup, 'text/html');
          const incoming = documentFragment.querySelector('product-recommendations');
          if (!incoming?.querySelector('.product-card')) { this.remove(); return; }
          this.innerHTML = incoming.innerHTML;
          this.hidden = false;
        })
        .catch(() => this.remove());
    }
  }
  if (!customElements.get('product-recommendations')) customElements.define('product-recommendations', SophieRecommendations);

  document.querySelectorAll('[data-preview-newsletter]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const feedback = form.querySelector('.form-feedback');
      if (feedback) feedback.textContent = 'Preview only: newsletter sign-ups are processed by Shopify once the theme is installed.';
      form.reset();
    });
  });
})();
