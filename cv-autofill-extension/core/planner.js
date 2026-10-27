(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  function action(el, type, resolved, extra = {}, signatures) {
    const target = APP.DOM.locator(el);
    return { id: `${target.key}:${type}:${resolved.fieldKey}`, target, type, fieldKey: resolved.fieldKey, value: resolved.value,
      label: APP.DOM.hints(el).slice(0, 80) || resolved.fieldKey, source: resolved.source, confidence: resolved.confidence ?? 1,
      profileKey: resolved.profileKey, expectedURL: location.href, stepKey: signatures?.get(target.scope) ?? APP.Scanner.signature(target.scope), ...extra };
  }
  function build({ adapter, observations }, { expand = true, expanded = new Set() } = {}) {
    const actions = [], issues = [], unmapped = [];
    const signatures = new Map();
    for (const item of observations) { const scope = APP.DOM.scope(item.el); if (!signatures.has(scope)) signatures.set(scope, APP.Scanner.signature(scope)); }
    const existingLinks = new Set(APP.DOM.controls().map(el => el.value).filter(value => /^https?:\/\//.test(value || '')));
    const plannedLinks = new Set();
    for (const item of observations) {
      const { el, choices, type, hints } = item;
      if (type === 'choice' && choices.some(choice => choice.checked || choice.getAttribute('aria-checked') === 'true')) continue;
      if (type === 'upload' ? el.files.length > 0 : type === 'checkbox' ? el.checked === item.resolved?.value : type !== 'choice' && !APP.DOM.empty(el)) continue;
      let resolved = item.resolved;
      if (!resolved && type === 'text' && /(?:\blink\b|\burl\b|رابط)/i.test(hints)) {
        const link = APP.CV.links.find(value => !existingLinks.has(value) && !plannedLinks.has(value));
        if (link) { resolved = { fieldKey: 'links', value: link, status: 'resolved', source: 'profile' }; plannedLinks.add(link); }
      }
      if (!resolved || resolved.status !== 'resolved') {
        const field = { id: APP.DOM.key(el), tag: el.tagName, type: el.type || '', hints, required: !!(el.required || el.getAttribute('aria-required') === 'true' || hints.includes('*')), reason: resolved?.code || 'NO_APPROVED_RULE' };
        unmapped.push(field);
        if (resolved?.code || field.required) issues.push({ fieldId: field.id, fieldKey: resolved?.fieldKey, code: field.reason });
        continue;
      }
      if (type === 'choice') {
        const chosen = APP.Matching.choose(choices, resolved.value, { text: option => option.labels?.[0]?.textContent || option.getAttribute('aria-label') || option.getAttribute('data-value') || option.textContent, value: option => option.value });
        if (!chosen.option) { issues.push({ fieldId: APP.DOM.key(el), fieldKey: resolved.fieldKey, code: chosen.code }); continue; }
        const checkbox = chosen.option.type === 'checkbox' || chosen.option.getAttribute('role') === 'checkbox';
        actions.push(action(chosen.option, checkbox ? 'checkbox' : 'radio', { ...resolved, value: checkbox ? true : resolved.value }, {}, signatures));
      } else actions.push(action(el, type, resolved, {}, signatures));
    }
    // Structural changes invalidate existing observations. Expand one section, then rescan.
    if (expand) {
      const patterns = [
        ['education', /^(?:\+\s*)?add education$/i, /university|school|degree|جامعة|مؤهل/i],
        ['experience', /^(?:\+\s*)?add experience$/i, /employer|job.?title|المسمى/i],
        ['language', /^(?:\+\s*)?add language$/i, /language|لغة/i],
        ['link', /^(?:\+\s*)?(?:add another link|add link|إضافة رابط)$/i, null]
      ];
      const buttons = [...document.querySelectorAll('button, a, [role="button"]')].filter(el => APP.DOM.visible(el) && !el.disabled);
      for (const [kind, pattern, fieldPattern] of patterns) {
        if (expanded.has(kind) && kind !== 'link') continue;
        if (kind === 'link' && !APP.CV.links.some(value => !existingLinks.has(value) && !plannedLinks.has(value))) continue;
        if (fieldPattern && observations.some(item => fieldPattern.test(item.hints))) continue;
        const matches = buttons.filter(el => pattern.test(el.textContent.trim()));
        if (matches.length === 1) return { actions: [action(matches[0], 'expand', { fieldKey: kind, source: 'adapter:' + adapter.id }, { expansionKey: kind, replanAfter: true })], issues, unmapped, platform: adapter.id };
      }
    }
    for (const { container, button } of adapter.commits?.() || []) {
      if (actions.some(item => container.contains(item.target.element)) || APP.DOM.controls(container).some(el => APP.DOM.visible(el) && !APP.DOM.empty(el))) {
        actions.push(action(button, 'commit', { fieldKey: 'section', source: 'adapter:' + adapter.id }, { container, replanAfter: true }));
      }
    }
    return { actions, issues, unmapped, platform: adapter.id };
  }
  APP.Planner = Object.freeze({ build });
})();
