(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  function signature(root = document.body) {
    return APP.DOM.controls(root).filter(el => !APP.DOM.sensitive(el) && el.type !== 'hidden').map(el => `${el.tagName}:${el.type || ''}:${el.name || el.id || el.getAttribute('aria-label') || ''}:${APP.DOM.visible(el) ? 1 : 0}`).sort().join('|');
  }
  function resolve(el, adapter, group = false) {
    const approved = APP.Learning.match(el);
    if (approved) return approved;
    if (!group) for (const [selector, rule] of Object.entries(adapter.fields || {})) {
      if (el.matches(selector)) return { ...APP.Profile.value(rule.fieldKey, el, APP.DOM.hints(el), rule.profileKey), profileKey: rule.profileKey, source: 'adapter:' + adapter.id };
    }
    return adapter.resolve?.(el) || APP.Learning.match(el, { automatic: true }) || APP.Profile.infer(el, { group });
  }
  function scan(root = document) {
    const adapter = APP.Adapters.current();
    const observations = [], groups = new Map();
    for (const el of APP.DOM.controls(root)) {
      if (el.disabled || APP.DOM.sensitive(el) || (!el.matches('[role="combobox"]') && /^(?:hidden|submit|button|reset|image)$/i.test(el.type))) continue;
      const fileVisible = el.type === 'file' && APP.DOM.visible(el.closest('.dropzone, [role="presentation"], .form-group') || el.parentElement);
      const hiddenSelect = el.tagName === 'SELECT' && el.classList.contains('select2-hidden-accessible') && APP.DOM.visible(el.parentElement);
      if (!APP.DOM.visible(el) && !fileVisible && !hiddenSelect) continue;
      if (el.readOnly && !el.matches('[role="combobox"], input[id^="react-select-"]')) continue;
      if (el.type === 'radio') {
        const groupKey = APP.DOM.key(APP.DOM.scope(el)) + ':' + (el.name || APP.DOM.key(el.closest('fieldset') || el));
        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey).push(el); continue;
      }
      if (el.matches('[role="radiogroup"]')) {
        const radios = [...el.querySelectorAll('[role="radio"], [role="checkbox"]')].filter(APP.DOM.visible);
        if (radios.length) observations.push({ el, choices: radios, resolved: resolve(el, adapter, true), type: 'choice', hints: APP.DOM.hints(el) });
        continue;
      }
      if (el.type === 'checkbox') {
        const resolved = adapter.resolve?.(el);
        if (resolved) observations.push({ el, resolved, type: 'checkbox', hints: APP.DOM.hints(el) });
        continue; // Consent/subscription checkboxes are never guessed.
      }
      const hints = APP.DOM.hints(el);
      const type = el.type === 'file' ? 'upload' : el.tagName === 'SELECT' ? 'select' : el.matches('[role="combobox"], input[id^="react-select-"], .oj-combobox-input') ? 'combo' : 'text';
      const attachmentKey = /resume|\bcv\b|السيرة|سيره/i.test(hints) ? 'cv' : /cover.?letter|coop.*letter|خطاب.*جامعة/i.test(hints) ? 'coverLetter' : /certificate|شهادة/i.test(hints) ? 'certificate' : null;
      const resolved = type === 'upload' ? (attachmentKey ? { status: 'resolved', fieldKey: 'attachment.' + attachmentKey, value: attachmentKey, source: 'file-label' } : null) : resolve(el, adapter);
      observations.push({ el, hints, resolved, type });
    }
    for (const radios of groups.values()) observations.push({ el: radios[0], choices: radios, resolved: resolve(radios[0], adapter, true), type: 'choice', hints: APP.DOM.hints(radios[0], { group: true }) });
    // Google Forms often does not expose role=radiogroup on the question container.
    for (const question of APP.DOM.queryAll(root, '.geS5n, .Qr7Oae, [role="listitem"]')) {
      const radios = [...question.querySelectorAll('[role="radio"], [role="checkbox"]')].filter(APP.DOM.visible);
      if (!radios.length || observations.some(item => item.choices?.some(choice => radios.includes(choice)))) continue;
      observations.push({ el: radios[0], choices: radios, resolved: APP.Profile.infer(radios[0], { group: true }), type: 'choice', hints: APP.DOM.hints(radios[0], { group: true }) });
    }
    return { adapter, observations, signature: signature() };
  }
  APP.Scanner = Object.freeze({ signature, scan });
})();
