// Shared infrastructure. Every source owns its scope; no top-level lexical globals.
(() => {
  'use strict';
  const APP = globalThis.__CV_APP = globalThis.__CV_APP || {};
  APP.version = '2.0.0';
  const listeners = new Map();
  APP.events = {
    on(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
      return () => listeners.get(type)?.delete(listener);
    },
    emit(type, detail) {
      for (const listener of listeners.get(type) || []) {
        try { listener(detail); } catch (error) { console.error('[CV AutoFill] Subscriber failed', error); }
      }
    }
  };
  APP.abortError = () => new DOMException('Execution cancelled', 'AbortError');
  APP.throwIfAborted = signal => { if (signal?.aborted) throw APP.abortError(); };
  APP.wait = (ms, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(APP.abortError());
    const done = () => { signal?.removeEventListener('abort', abort); resolve(); };
    const timer = setTimeout(done, Math.max(0, ms));
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(APP.abortError()); };
    signal?.addEventListener('abort', abort, { once: true });
  });
  APP.waitFor = async (check, { signal, timeout = 1800, interval = 40 } = {}) => {
    const start = performance.now();
    do {
      APP.throwIfAborted(signal);
      const result = check();
      if (result) return result;
      await APP.wait(interval, signal);
    } while (performance.now() - start < timeout);
    return null;
  };
  APP.result = (status, code, extra = {}) => ({ status, ...(code ? { code } : {}), ...extra });
})();
