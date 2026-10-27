// Verify the declared load order before marking the isolated runtime ready.
(() => {
  const app = globalThis.__CV_APP;
  if (!app?.Agent || !app?.Profile || !app?.Planner || !app?.Engine) throw new Error('CV_INITIALIZATION_INCOMPLETE');
  app.__CV_AGENT_INITIALIZED = true;
})();
