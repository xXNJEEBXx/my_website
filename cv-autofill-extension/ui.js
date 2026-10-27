// Compatibility entry: behavior and styles have separate sources.
(() => {
  if (!globalThis.__CV_APP?.UI) throw new Error('CV_DASHBOARD_NOT_LOADED');
})();
