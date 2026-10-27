// Legacy selector view. Rules live in adapters/ and reference profile keys.
(() => {
  const app = globalThis.__CV_APP;
  app.PLATFORM_SELECTORS = Object.fromEntries(app.Adapters.list().map(id => [id, Object.fromEntries(Object.entries(app.Adapters.get(id).fields || {}).map(([selector, rule]) => [selector, app.CV[rule.profileKey || rule.fieldKey]]))]));
})();
