(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  function validate(root = document) {
    const issues = [];
    const checkedGroups = new Set();
    for (const el of APP.DOM.controls(root)) {
      if (el.disabled || APP.DOM.sensitive(el) || el.type === 'hidden') continue;
      const relevant = APP.DOM.visible(el) || (el.type === 'file' && APP.DOM.visible(el.closest('.dropzone, [role="presentation"], .form-group') || el.parentElement));
      if (!relevant) continue;
      const hints = APP.DOM.hints(el);
      const fieldId = APP.DOM.key(el);
      const required = el.required || el.getAttribute('aria-required') === 'true' || hints.includes('*') || !!el.closest('.required, [data-required="true"]');
      const selected = el.tagName === 'SELECT' ? [...el.selectedOptions].map(option => option.textContent.trim()).join(', ') : el.matches('[role="combobox"], input[id^="react-select-"]') ? APP.Drivers.selectedText(el) : el.isContentEditable ? el.textContent : el.value;
      if (el.type === 'radio') {
        const key = APP.DOM.key(APP.DOM.scope(el)) + ':' + el.name;
        if (checkedGroups.has(key)) continue;
        checkedGroups.add(key);
        const radios = APP.DOM.queryAll(APP.DOM.scope(el), 'input[type="radio"]').filter(radio => radio.name === el.name && APP.DOM.visible(radio));
        if ((required || radios.some(radio => radio.required)) && !radios.some(radio => radio.checked)) issues.push({ fieldId, code: 'REQUIRED_CHOICE_MISSING', hints });
      } else if (el.type === 'file') {
        if (required && !el.files.length) issues.push({ fieldId, code: 'REQUIRED_ATTACHMENT_MISSING', hints });
      } else if (required && (el.type === 'checkbox' ? !el.checked : !String(selected || '').trim())) {
        issues.push({ fieldId, code: 'REQUIRED_VALUE_MISSING', hints });
      }
      if (el.willValidate && !el.validity.valid && !issues.some(issue => issue.fieldId === fieldId)) issues.push({ fieldId, code: 'FIELD_CONSTRAINT_FAILED', hints });
      if (/nationality|citizenship|الجنسية/i.test(hints) && selected && !APP.Matching.matches(selected, APP.CV.nationality)) issues.push({ fieldId, code: 'NATIONALITY_MISMATCH', hints });
    }
    for (const group of APP.DOM.queryAll(root, '[role="radiogroup"], .geS5n, .Qr7Oae, [role="listitem"]')) {
      const choices = [...group.querySelectorAll('[role="radio"], [role="checkbox"]')].filter(APP.DOM.visible);
      if (!choices.length || !APP.DOM.visible(group)) continue;
      const required = group.getAttribute('aria-required') === 'true' || APP.DOM.hints(choices[0], { group: true }).includes('*');
      if (required && !choices.some(choice => choice.getAttribute('aria-checked') === 'true')) issues.push({ fieldId: APP.DOM.key(group), code: 'REQUIRED_CHOICE_MISSING' });
    }
    for (const el of APP.DOM.queryAll(root, '[role="alert"], .error, [class*="error-message"], [class*="invalid-feedback"]')) {
      if (APP.DOM.visible(el) && /required|invalid|مطلوب|يرجى|يتجاوز|غير صالح/i.test(el.textContent)) issues.push({ fieldId: APP.DOM.key(el), code: 'VISIBLE_FORM_ERROR' });
    }
    return { valid: issues.length === 0, issues };
  }
  const commitLabel = /^(?:add(?:\s+(?:education|experience|item|citizenship))?|save(?:\s+(?:changes|item|education|experience))?|done|update|confirm|إضافة(?:\s+(?:مؤهل|خبرة|عنصر))?|حفظ(?:\s+التغييرات)?|تأكيد)$/i;
  APP.Commit = {
    findCommitButton(container) {
      const candidates = [...container.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')]
        .filter(el => APP.DOM.visible(el) && !el.disabled && commitLabel.test((el.innerText || el.value || el.getAttribute('aria-label') || '').trim()));
      return candidates.length === 1 ? candidates[0] : null;
    },
    async commitAndVerify(container, { signal } = {}) {
      const button = this.findCommitButton(container);
      if (!button) return APP.result('blocked', 'COMMIT_TARGET_AMBIGUOUS');
      const validation = validate(container);
      if (!validation.valid) return APP.result('blocked', 'SECTION_INVALID', { issues: validation.issues });
      const controls = APP.DOM.controls(container).filter(APP.DOM.visible);
      if (!controls.some(el => String(el.value || '').trim())) return APP.result('blocked', 'SECTION_EMPTY');
      const parent = container.parentElement;
      const cards = parent?.querySelectorAll('[class*="card"], [class*="item-summary"], [class*="summary-card"]').length || 0;
      APP.Drivers.click(button, signal);
      const verified = await APP.waitFor(() => !container.isConnected || !APP.DOM.visible(container) || (parent?.querySelectorAll('[class*="card"], [class*="item-summary"], [class*="summary-card"]').length || 0) > cards, { signal, timeout: 2200 });
      return verified ? APP.result('verified') : APP.result('failed', 'COMMIT_NOT_CONFIRMED');
    }
  };
  APP.Validation = Object.freeze({ validate });
})();
