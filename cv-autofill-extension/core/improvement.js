(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  const snapshots = new Set();
  const send = request => globalThis.chrome?.runtime?.id ? chrome.runtime.sendMessage(request) : Promise.resolve({ ok: false });
  function redact(text) {
    let safe = String(text || '');
    for (const value of Object.values(APP.CV).filter(value => typeof value === 'string' && value.length >= 3)) safe = safe.split(value).join('[redacted]');
    return safe.replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]').replace(/\+?\d[\d ()-]{7,}\d/g, '[number]').slice(0, 160);
  }
  APP.Improvement = {
    async observePlan() {
      if (!(await send({ action: 'dev_status' })).enabled) return;
      const fixture = APP.Diagnostics.capture();
      if (snapshots.has(fixture.name)) return;
      const response = await send({ action: 'record_fixture', fixture });
      if (response?.saved || response?.duplicate) snapshots.add(fixture.name);
    },
    async observeResult(result) {
      return send({ action: 'record_run', run: { origin: location.origin, platform: APP.Adapters.current().id,
        verifiedFields: result.verifiedFields, failedActions: result.failedActions, blockedActions: result.blockedActions, elapsedMs: result.elapsedMs,
        codes: [...(result.actions || []).map(action => action.code), ...(result.issues || []).map(issue => issue.code)].filter(Boolean),
        gaps: (result.unmapped || APP.lastPlan?.unmapped || []).map(field => ({ type: field.type, hints: redact(field.hints), reason: field.reason })) } });
    },
    async report() {
      const stored = await chrome.storage.local.get(['improvementRunsV1', 'approvedFieldRulesV1']);
      const runs = (stored.improvementRunsV1 || []).filter(run => run.origin === location.origin);
      return { runs: runs.length, rules: (stored.approvedFieldRulesV1 || []).filter(rule => rule.origin === location.origin).length,
        verifiedFields: runs.reduce((sum, run) => sum + run.verifiedFields, 0), failures: runs.reduce((sum, run) => sum + run.failedActions, 0),
        averageElapsedMs: runs.length ? Math.round(runs.reduce((sum, run) => sum + (run.elapsedMs || 0), 0) / runs.length) : 0, recentCodes: [...new Set(runs.slice(-10).flatMap(run => run.codes))] };
    }
  };
})();
