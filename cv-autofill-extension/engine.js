// Compatibility entry: the single execution engine lives in core/runner.js.
(() => {
  if (!globalThis.__CV_APP?.Engine) throw new Error('CV_ENGINE_NOT_LOADED');
})();
