// Approved semantic mappings follow current profile values. Literal answers remain explicit.
(() => {
  'use strict';
  const APP = globalThis.__CV_APP, KEY = 'approvedFieldRulesV1';
  let rules = [];
  const storage = globalThis.chrome?.storage?.local;
  const formKey = el => { const form = APP.DOM.scope(el); return (form.id || form.getAttribute('name') || form.getAttribute('role') || form.tagName || 'document') + ':' + location.pathname; };
  const ruleKey = el => [location.origin, formKey(el), el.type || el.getAttribute('role') || el.tagName, APP.Matching.normalize(APP.DOM.learningHints(el))].join('|');
  const forbidden = el => APP.DOM.sensitive(el) || /national.?id|هوية|passport|جواز|bank|iban|بطاقة|signature|توقيع/i.test(APP.DOM.hints(el)) || el.type === 'file';
  globalThis.chrome?.storage?.onChanged?.addListener((changes, area) => { if (area === 'local' && changes[KEY]) rules = changes[KEY].newValue || []; });
  async function mutate(operation, extra = {}) {
    if (globalThis.chrome?.runtime?.id) {
      const response = await chrome.runtime.sendMessage({ action: 'learning_mutation', operation, ...extra });
      if (!response?.ok) throw new Error(response?.code || 'LEARNING_SAVE_FAILED');
      rules = response.rules; return;
    }
    if (operation === 'upsert') rules = [...rules.filter(rule => rule.key !== extra.rule.key), extra.rule];
    if (operation === 'remove') rules = rules.filter(rule => rule.key !== extra.key);
    if (operation === 'clear') rules = rules.filter(rule => rule.origin !== location.origin);
  }
  APP.Learning = {
    ready: storage ? storage.get(KEY).then(data => { rules = Array.isArray(data[KEY]) ? data[KEY] : []; }) : Promise.resolve(),
    match(el, { automatic = false } = {}) {
      if (forbidden(el)) return null;
      const form = APP.DOM.scope(el);
      const legacy = [location.origin, form.id || form.getAttribute('name') || form.getAttribute('role') || 'document', el.type || el.tagName, APP.Matching.normalize(APP.DOM.hints(el))].join('|');
      const rule = rules.find(item => (item.key === ruleKey(el) || item.key === legacy) && !!item.automatic === automatic);
      if (!rule) return null;
      if (rule.kind === 'profile') return { ...APP.Profile.value(rule.fieldKey, el, APP.DOM.hints(el), rule.profileKey), source: 'approved-rule' };
      return { status: 'resolved', fieldKey: 'learned', value: rule.value, source: 'approved-rule', confidence: 1 };
    },
    async approve(el, value = el.value ?? el.textContent, options = {}) {
      if (forbidden(el) || !APP.DOM.visible(el) || !String(value ?? '').trim()) return APP.result('blocked', 'FIELD_NOT_LEARNABLE');
      let binding = options.fieldKey ? { fieldKey: options.fieldKey, profileKey: options.profileKey } : null;
      if (!binding) {
        const candidates = [...new Set(APP.FIELD_CATALOG.map(rule => rule.fieldKey))].flatMap(fieldKey => {
          const base = APP.Profile.value(fieldKey, el, APP.DOM.hints(el));
          if (base.status === 'resolved' && base.value === String(value).trim()) return [{ fieldKey }];
          if (APP.CV[fieldKey + 'Ar'] === String(value).trim()) return [{ fieldKey, profileKey: fieldKey + 'Ar' }];
          return [];
        });
        if (candidates.length === 1) binding = candidates[0];
      }
      const rule = { key: ruleKey(el), origin: location.origin, form: formKey(el), hints: APP.DOM.learningHints(el), type: el.type || el.tagName, automatic: options.automatic === true,
        kind: binding ? 'profile' : 'literal', ...(binding || { value: String(value).trim() }), updatedAt: new Date().toISOString() };
      await mutate('upsert', { rule });
      return APP.result('verified', null, { learnedCount: rules.length, kind: rule.kind });
    },
    async observe(action) {
      if (action.status !== 'verified' || !action.source?.startsWith('adapter:') || !APP.FIELD_CATALOG.some(rule => rule.fieldKey === action.fieldKey)) return;
      const el = APP.DOM.resolve(action.target);
      if (!el || forbidden(el) || this.match(el)) return;
      await this.approve(el, action.value, { fieldKey: action.fieldKey, profileKey: action.profileKey, automatic: true });
    },
    list: () => rules.filter(rule => rule.origin === location.origin).map(rule => ({ ...rule })),
    remove: key => mutate('remove', { key }), clear: () => mutate('clear', { origin: location.origin })
  };
})();
