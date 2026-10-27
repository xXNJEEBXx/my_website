(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  const ids = new WeakMap();
  let sequence = 0;
  const parent = el => el?.parentElement || el?.getRootNode?.().host || null;
  const own = el => { for (let node = el; node; node = parent(node)) if (node.matches?.('#cv-agent-dashboard, #cv-agent-host, #cv-guardian-shield, [data-cv-ui]')) return true; return false; };
  function roots(root = document) {
    const found = [root];
    for (let index = 0; index < found.length; index++) {
      const current = found[index];
      if (current.shadowRoot && !own(current)) found.push(current.shadowRoot);
      for (const el of current.querySelectorAll('*')) if (el.shadowRoot && !own(el)) found.push(el.shadowRoot);
    }
    return [...new Set(found)];
  }
  const queryAll = (root, selector) => roots(root).flatMap(tree => [...tree.querySelectorAll(selector)]);
  function contains(root, el) { for (let node = el; node; node = parent(node)) if (node === root || root.contains(node)) return true; return false; }
  function closest(el, selector) { for (let node = el; node; node = parent(node)) if (node.matches?.(selector)) return node; return null; }
  function visible(el) {
    if (!el?.isConnected || own(el)) return false;
    if (closest(el, '[hidden], [inert], [aria-hidden="true"]')) return false;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    for (let ancestor = el; ancestor instanceof Element; ancestor = parent(ancestor)) {
      const style = getComputedStyle(ancestor);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    }
    return true;
  }
  function hints(el, { group = false } = {}) {
    const parts = [el.name, el.id, el.placeholder, el.getAttribute('aria-label'), el.getAttribute('data-automation-id'), el.title, el.autocomplete];
    if (!group) for (const label of el.labels || []) parts.push(label.textContent?.trim());
    for (const attr of ['aria-labelledby', 'aria-describedby']) {
      for (const id of (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean)) parts.push((el.getRootNode().getElementById?.(id) || el.ownerDocument.getElementById(id))?.textContent?.trim());
    }
    const container = el.closest('fieldset, .form-group, .form-row, .form-item, .field, [data-field], .ant-form-item, .geS5n, .Qr7Oae, [role="listitem"], [role="radiogroup"]');
    if (container) {
      const label = container.querySelector('legend, [role="heading"], .M7eMe, .label, label:not(:has(input[type="radio"])):not(:has(input[type="checkbox"]))');
      parts.push(label?.textContent?.trim());
    }
    if (!group && el.type !== 'radio' && el.type !== 'checkbox') parts.push(el.closest('label')?.textContent?.trim());
    return [...new Set(parts.filter(Boolean))].join(' ').trim();
  }
  function sensitive(el) {
    return el.type === 'password' || /password|passcode|passwd|otp|token|secret|verification|credit.?card|cvv|كلمة.?المرور|رمز.?التحقق/i.test(hints(el)) ||
      /one-time-code|current-password|new-password|cc-/i.test(el.autocomplete || '');
  }
  function learningHints(el) {
    const parts = [el.getAttribute('aria-label'), el.autocomplete];
    if (el.type !== 'radio' && el.type !== 'checkbox') for (const label of el.labels || []) parts.push(label.textContent.trim());
    for (const id of (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)) parts.push(el.getRootNode().getElementById?.(id)?.textContent.trim());
    const container = closest(el, 'fieldset, .form-group, .field, [role="radiogroup"], .Qr7Oae, .geS5n');
    parts.push(container?.querySelector('legend, [role="heading"], label:not(:has(input))')?.textContent.trim());
    return [...new Set(parts.filter(Boolean))].join(' ') || el.name || el.id || hints(el);
  }
  const key = el => {
    if (!ids.has(el)) ids.set(el, 'element-' + (++sequence));
    return ids.get(el);
  };
  const scope = el => closest(el, 'form, [role="form"], [data-cv-form]') || el.getRootNode().host || document.body;
  function locator(el) {
    const root = scope(el);
    let selector;
    if (el.id) selector = '#' + CSS.escape(el.id);
    else if (el.name) selector = el.tagName.toLowerCase() + '[name="' + CSS.escape(el.name) + '"]';
    else if (el.getAttribute('data-automation-id')) selector = '[data-automation-id="' + CSS.escape(el.getAttribute('data-automation-id')) + '"]';
    return { key: key(el), selector, scope: root, element: el };
  }
  function resolve(target) {
    if (target.element?.isConnected && contains(target.scope, target.element)) return target.element;
    // Rebind only within the original form, and only if the locator is unambiguous.
    if (!target.scope?.isConnected || !target.selector) return null;
    const matches = queryAll(target.scope, target.selector).filter(el => !own(el));
    return matches.length === 1 ? matches[0] : null;
  }
  const controls = (root = document) => queryAll(root, 'input, textarea, select, [role="combobox"], [role="radiogroup"], [contenteditable="true"], [role="textbox"]').filter(el => !own(el));
  function empty(el) {
    if (el.matches('[contenteditable="true"], [role="textbox"]') && !el.matches('input, textarea')) return !el.textContent.trim();
    if (el.matches('button[role="combobox"]')) return !el.textContent.trim() || /^(?:select|choose|اختر|اختيار|حدد)(?:\s|\.{3}|…|$)/i.test(el.textContent.trim());
    if (el.tagName === 'SELECT') return !el.value || el.selectedOptions[0]?.disabled || /^(?:-1|\?[^?]*\?)$/.test(el.value);
    if (el.matches('[role="combobox"], input[id^="react-select-"]')) {
      const control = el.closest('[class*="control"], cx-select, oj-combobox-one, oj-select-single') || el.parentElement;
      if (control?.querySelector('[class*="singleValue"], [class*="single-value"], [class*="multiValue"], .cx-select-pill-name')) return false;
    }
    return !String(el.value ?? '').trim();
  }
  APP.DOM = Object.freeze({ own, visible, hints, sensitive, key, scope, locator, resolve, controls, empty, roots, queryAll, closest, contains, learningHints });
})();
