(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  function control(el) { return el.closest('[class*="control"], cx-select, oj-combobox-one, oj-select-single, .oj-combobox') || (el.matches('input') ? el.parentElement : el); }
  function selectedText(el) {
    const root = control(el);
    const selected = root?.querySelector('[class*="singleValue"], [class*="single-value"], [class*="multiValue"], .cx-select-pill-name, .oj-select-chosen');
    return selected?.textContent?.trim() || el.value || (el.matches('button') ? el.textContent.trim() : '');
  }
  function options(el) {
    const controlled = (el.getAttribute('aria-controls') || el.getAttribute('aria-owns') || '').split(/\s+/).filter(Boolean).map(id => el.getRootNode().getElementById?.(id) || document.getElementById(id)).filter(Boolean);
    let candidates;
    if (controlled.length) candidates = controlled.flatMap(root => [...root.querySelectorAll('[role="option"], [role="gridcell"], li, [id*="-option-"]')]);
    else {
      candidates = APP.DOM.queryAll(document, '.cx-select__options [role="gridcell"], .cx-select__options li, .oj-listbox-drop [role="option"], .oj-listbox-drop li, [role="listbox"] [role="option"], [class*="menu"] [id*="-option-"], .select__option');
      // React Select option IDs identify the instance even when a menu is portalled to body.
      const prefix = el.id.match(/^(react-select-.+)-input$/)?.[1];
      if (prefix) candidates = candidates.filter(option => !option.id || option.id.startsWith(prefix + '-option-'));
    }
    return [...new Set(candidates)].filter(APP.DOM.visible);
  }
  async function combo(el, value, { signal } = {}) {
    APP.Drivers.ensure(el, signal, { allowReadOnly: true });
    if (APP.Matching.rank(selectedText(el), value) >= 90) return APP.result('verified');
    const original = el.value || '';
    APP.Drivers.click(control(el), signal, { pointer: true });
    el.focus();
    if (el.matches('input') && !el.readOnly) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(value));
      el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      el.dispatchEvent(new KeyboardEvent('keyup', { key: String(value).slice(-1), bubbles: true, composed: true }));
    }
    let chosen;
    await APP.waitFor(() => {
      const found = APP.Matching.choose(options(el), value, { value: option => option.getAttribute('data-value') });
      if (found.option) { chosen = found.option; return true; }
      return false;
    }, { signal, timeout: 1800 });
    if (!chosen) {
      // Never choose the first option through ArrowDown+Enter as a fallback.
      if (el.matches('input')) Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, original);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return APP.result('blocked', 'OPTION_NOT_FOUND_OR_AMBIGUOUS');
    }
    const label = chosen.textContent.trim();
    APP.Drivers.click(chosen, signal, { pointer: true });
    const committed = await APP.waitFor(() => {
      const text = selectedText(el);
      const menuClosed = options(el).length === 0 || el.getAttribute('aria-expanded') === 'false';
      return menuClosed && APP.Matching.rank(text, label) >= 90;
    }, { signal, timeout: 1600 });
    el.blur();
    return committed ? APP.result('verified') : APP.result('failed', 'OPTION_NOT_COMMITTED');
  }
  APP.Drivers.combo = combo;
  APP.Drivers.selectedText = selectedText;
})();
