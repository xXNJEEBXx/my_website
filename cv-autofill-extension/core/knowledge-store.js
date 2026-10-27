// Worker-owned read/modify/write queue: concurrent frames never overwrite each other's rules.
(() => {
  'use strict';
  let pending = Promise.resolve();
  function serial(operation) { const result = pending.then(operation); pending = result.catch(() => {}); return result; }
  globalThis.CVKnowledge = {
    mutate(request, sender) { return serial(async () => {
      const KEY = 'approvedFieldRulesV1';
      const origin = sender.url?.startsWith(chrome.runtime.getURL('')) ? null : new URL(sender.url).origin;
      let rules = (await chrome.storage.local.get(KEY))[KEY] || [];
      if (!Array.isArray(rules)) rules = [];
      if (request.operation === 'upsert') {
        const rule = request.rule;
        if (!rule || typeof rule.key !== 'string' || rule.key.length > 4000 || (origin && rule.origin !== origin) ||
          /password|passcode|otp|token|secret|verification|كلمة.?المرور|رمز.?التحقق/i.test(rule.hints || '') ||
          !['profile', 'literal'].includes(rule.kind) || (rule.kind === 'literal' && (typeof rule.value !== 'string' || rule.value.length > 5000)) ||
          (rule.kind === 'profile' && !/^[a-z][a-zA-Z.]{0,70}$/.test(rule.fieldKey || ''))) throw new Error('INVALID_APPROVED_RULE');
        if (rule.automatic && rules.some(item => item.key === rule.key && !item.automatic)) return { ok: true, rules };
        rules = rules.filter(item => item.key !== rule.key); rules.push(rule);
      } else if (request.operation === 'remove') rules = rules.filter(rule => rule.key !== request.key || (origin && rule.origin !== origin));
      else if (request.operation === 'clear') rules = rules.filter(rule => rule.origin !== (origin || request.origin));
      else throw new Error('UNKNOWN_KNOWLEDGE_OPERATION');
      await chrome.storage.local.set({ [KEY]: rules });
      return { ok: true, rules };
    }); },
    record(run) { return serial(async () => {
      const KEY = 'improvementRunsV1'; const stored = (await chrome.storage.local.get(KEY))[KEY] || [];
      const safe = { at: new Date().toISOString(), origin: String(run.origin || '').slice(0, 250), platform: String(run.platform || 'generic').slice(0, 40),
        verifiedFields: Number(run.verifiedFields) || 0, failedActions: Number(run.failedActions) || 0, blockedActions: Number(run.blockedActions) || 0, elapsedMs: Math.max(0, Number(run.elapsedMs) || 0),
        codes: [...new Set((run.codes || []).filter(code => typeof code === 'string' && /^[A-Z_]{1,90}$/.test(code)))].slice(0, 40),
        gaps: (run.gaps || []).slice(0, 50).map(gap => ({ type: String(gap.type || '').slice(0, 30), hints: String(gap.hints || '').slice(0, 160), reason: String(gap.reason || '').slice(0, 90) })) };
      await chrome.storage.local.set({ [KEY]: [...stored.slice(-99), safe] });
      return { ok: true };
    }); }
  };
})();
