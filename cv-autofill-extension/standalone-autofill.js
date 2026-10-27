// GENERATED. Requires the installed extension. No personal data is embedded.
// Public compatibility API. No profile, attachment, learned values or extension privileges.
(() => {
  'use strict';
  if (window.__CV_AGENT?.version === '2.0.0') return;
  const pending = new Map();
  let ready = false;
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.channel !== 'cv-autofill-v2') return;
    if (event.data.direction === 'ready') { ready = true; for (const task of pending.values()) if (!task.sent) { task.sent = true; task.send(); } return; }
    if (event.data.direction !== 'response') return;
    const task = pending.get(event.data.id); if (!task) return;
    clearTimeout(task.timer); pending.delete(event.data.id); task.resolve(event.data.result);
  });
  function call(method, ...args) {
    const id = crypto.randomUUID();
    return new Promise(resolve => {
      const timer = setTimeout(() => { pending.delete(id); resolve({ success: false, code: 'EXTENSION_RESPONSE_TIMEOUT' }); }, 60000);
      const send = () => window.postMessage({ channel: 'cv-autofill-v2', direction: 'request', id, method, args }, location.origin === 'null' ? '*' : location.origin);
      pending.set(id, { resolve, timer, send, sent: ready });
      if (ready) send();
    });
  }
  const api = { version: '2.0.0', toJSON: () => ({ version: '2.0.0', engine: 'extension-bridge', ready: true }) };
  for (const method of ['plan', 'fill', 'expandAndFill', 'play', 'cancel', 'inspect', 'status', 'getButtons', 'getUnmapped', 'validate', 'getRoles', 'isJobBoard', 'isLocked', 'clickButton', 'learn', 'unlock', 'lock', 'learned', 'exportLearned', 'clearLearned']) api[method] = (...args) => call(method, ...args);
  window.__CV_AGENT = Object.freeze(api);
  window.postMessage({ channel: 'cv-autofill-v2', direction: 'probe' }, location.origin === 'null' ? '*' : location.origin);
})();

window.__runCoopAutofill = options => window.__CV_AGENT.fill(options);
