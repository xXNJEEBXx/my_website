// One cooperative runner per document. UI and logging consume events, not driver internals.
(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  let queue = [], currentIndex = 0, active = null, controller = null;
  let cancelled = false, needsReplan = false;
  const verified = new WeakSet();
  function summarize(actions = queue, extra = {}) {
    const records = actions.map(action => ({ id: action.id, fieldKey: action.fieldKey, label: action.label, type: action.type, status: action.status, code: action.code }));
    const failed = records.filter(action => action.status === 'failed').length;
    const blocked = records.filter(action => action.status === 'blocked').length;
    const pending = records.filter(action => action.status === 'queued' || action.status === 'running').length;
    const count = new Set(records.filter(action => action.status === 'verified' && ['text', 'select', 'combo', 'radio', 'checkbox', 'upload'].includes(action.type)).map(action => action.id)).size;
    const wasCancelled = extra.cancelled ?? cancelled;
    const success = !wasCancelled && failed === 0 && blocked === 0 && pending === 0;
    return { success, status: wasCancelled ? 'cancelled' : success ? 'complete' : 'partial', total: records.length, filled: count,
      totalActions: records.length, filledCount: count, verifiedFields: count, attemptedActions: records.filter(action => action.status !== 'queued').length,
      failedActions: failed, blockedActions: blocked, pendingActions: pending, cancelled: wasCancelled, needsReplan, actions: records, ...extra };
  }
  async function execute(action, signal) {
    APP.throwIfAborted(signal);
    if (action.enabled === false) return APP.result('skipped', 'USER_SKIPPED');
    if (action.expectedURL && action.expectedURL !== location.href) return APP.result('blocked', 'PAGE_CHANGED');
    const el = action.target ? APP.DOM.resolve(action.target) : action.el;
    if (action.target && !el) return APP.result('blocked', 'TARGET_DETACHED');
    if (action.stepKey && APP.Scanner.signature(action.target.scope) !== action.stepKey) return APP.result('blocked', 'STEP_CHANGED');
    if (action.execute) {
      const result = await action.execute({ signal, el });
      if (result && ['verified', 'skipped', 'failed', 'blocked'].includes(result.status)) return result;
      if (action.verify && await action.verify(el)) return APP.result('verified');
      return APP.result('failed', 'ACTION_RESULT_UNVERIFIED');
    }
    const options = { signal };
    switch (action.type) {
      case 'text': return APP.Drivers.text(el, action.value, options);
      case 'select': return APP.Drivers.select(el, action.value, options);
      case 'combo': return APP.Drivers.combo(el, action.value, options);
      case 'radio': return APP.Drivers.radio(el, action.value, options);
      case 'checkbox': return APP.Drivers.checkbox(el, action.value, options);
      case 'upload': return APP.Drivers.upload(el, action.value, options);
      case 'commit': return APP.Commit.commitAndVerify(action.container, options);
      case 'expand': {
        const before = APP.Scanner.signature(document.body);
        APP.Drivers.click(el, signal);
        const changed = await APP.waitFor(() => APP.Scanner.signature(document.body) !== before, { signal, timeout: 2200 });
        if (changed) APP.session.expanded.add(action.expansionKey);
        return changed ? APP.result('verified') : APP.result('failed', 'EXPANSION_NOT_CONFIRMED');
      }
      default: return APP.result('failed', 'UNKNOWN_ACTION_TYPE');
    }
  }
  async function run(delay, single, signal) {
    cancelled = false; needsReplan = false;
    while (currentIndex < queue.length) {
      if (signal.aborted) { cancelled = true; break; }
      const action = queue[currentIndex];
      action.status = 'running';
      APP.events.emit('action', { id: action.id, label: action.label, status: action.status });
      let result;
      try { result = await execute(action, signal); }
      catch (error) {
        result = error.name === 'AbortError' ? APP.result('blocked', 'ACTION_CANCELLED') : APP.result('failed', error.message || 'EXECUTION_ERROR');
      }
      action.status = result.status;
      action.code = result.code;
      if (result.status === 'verified' && action.target?.element) verified.add(action.target.element);
      currentIndex++;
      APP.events.emit('action', { id: action.id, label: action.label, status: action.status, code: action.code });
      APP.events.emit('progress', { current: currentIndex, total: queue.length, summary: summarize() });
      if (signal.aborted) { cancelled = true; break; }
      if (['PAGE_CHANGED', 'STEP_CHANGED', 'TARGET_DETACHED'].includes(result.code) || (action.replanAfter && result.status === 'verified')) {
        needsReplan = true; break;
      }
      if (single) break;
      try { if (currentIndex < queue.length) await APP.wait(delay, signal); }
      catch { cancelled = true; break; }
    }
    return summarize();
  }
  function play(delay = 35, single = false) {
    if (active) return active;
    if (currentIndex >= queue.length) return Promise.resolve(summarize());
    controller = new AbortController();
    active = run(Math.max(0, Number(delay) || 0), single, controller.signal).finally(() => {
      active = null; controller = null; APP.events.emit('state', { running: false });
    });
    APP.events.emit('state', { running: true });
    return active;
  }
  APP.Engine = {
    enqueue(action) {
      if (active) return false;
      if (action.el && !action.target) action.target = APP.DOM.locator(action.el);
      action.id = action.id || `${action.target?.key || 'custom-' + queue.length}:${action.type || 'custom'}:${action.fieldKey || ''}`;
      if (queue.some(item => item.id === action.id && !['failed', 'blocked'].includes(item.status))) return false;
      action.status = 'queued';
      Object.defineProperty(action, 'el', { get: () => action.target ? APP.DOM.resolve(action.target) : null, enumerable: false, configurable: true });
      action.toJSON = () => ({ id: action.id, label: action.label, fieldKey: action.fieldKey, type: action.type, status: action.status, code: action.code });
      queue.push(action); return true;
    },
    clear() {
      if (active) return APP.result('blocked', 'EXECUTION_BUSY');
      queue = []; currentIndex = 0; cancelled = false; needsReplan = false;
      return APP.result('verified');
    },
    load(actions) {
      const cleared = this.clear();
      if (cleared.status === 'blocked') return cleared;
      for (const action of actions) this.enqueue(action);
      return APP.result('verified');
    },
    play,
    next: () => play(0, true),
    cancel() { cancelled = true; controller?.abort(); return active || Promise.resolve(summarize()); },
    isRunning: () => !!active,
    isProcessed: el => verified.has(el) || queue.some(action => action.target?.element === el && ['queued', 'running', 'verified'].includes(action.status)),
    getQueue: () => queue,
    getCurrentIndex: () => currentIndex,
    getProcessedElements: () => queue.filter(action => action.status === 'verified').map(action => action.target?.key).filter(Boolean),
    summarize,
    toJSON: () => summarize(),
    executeNativeSet: (...args) => APP.Drivers.text(...args),
    executeSelectSet: (...args) => APP.Drivers.select(...args),
    executeRadioClick: (...args) => APP.Drivers.radio(...args),
    executeCheckboxSet: (...args) => APP.Drivers.checkbox(...args),
    executePdfUpload: (...args) => APP.Drivers.upload(...args),
    executeReactSelect: (...args) => APP.Drivers.combo(...args),
    executeOracleTextInput: (...args) => APP.Drivers.text(...args),
    executeOracleOptionClick: (...args) => APP.Drivers.combo(...args),
    dispatchRealClick: (...args) => APP.Drivers.click(...args),
    CommitEngine: APP.Commit
  };
})();
