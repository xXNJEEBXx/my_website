(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  let fillPromise = null, stopRequested = false, lastSignature = '', observedURL = location.href;
  const buttonIds = new WeakMap(); let buttonSequence = 0;
  APP.session = {
    active: false, url: '', expanded: new Set(),
    activate() { this.active = true; this.url = location.href; },
    deactivate() { this.active = false; this.expanded.clear(); APP.Attachments.clear(); }
  };
  function buttons() {
    const result = [];
    for (const el of APP.DOM.queryAll(document, 'button, a[role="button"], input[type="submit"], input[type="button"], [role="tab"], div[role="button"]')) {
      if (!APP.DOM.visible(el)) continue;
      const text = (el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || '').trim();
      if (!text) continue;
      if (!buttonIds.has(el)) buttonIds.set(el, 'button-' + (++buttonSequence));
      const type = el.type === 'submit' || /إرسال|تقديم|\bsubmit\b|\bapply\b/i.test(text) ? 'submit' : /التالي|\bnext\b|continue|متابعة/i.test(text) ? 'next' : /السابق|back|previous/i.test(text) ? 'back' : /حذف|delete|remove|trash/i.test(text) ? 'delete' : el.getAttribute('role') === 'tab' ? 'tab' : 'action';
      result.push({ buttonId: buttonIds.get(el), index: result.length, text: text.slice(0, 80), id: el.id || '', type, disabled: !!el.disabled || el.getAttribute('aria-disabled') === 'true', el });
    }
    return result;
  }
  const publicButton = ({ el, ...item }) => item;
  function plan(options = {}) {
    if (APP.profileStale) return { error: 'PROFILE_UPDATED_REFRESH_PAGE', code: 'PROFILE_UPDATED_REFRESH_PAGE' };
    if (APP.Engine.isRunning()) return { error: 'EXECUTION_BUSY', code: 'EXECUTION_BUSY' };
    if (typeof options === 'boolean') options = {}; // legacy plan(false/true): every preview is rebuilt without consuming state.
    const nextPlan = APP.Planner.build(APP.Scanner.scan(), { expand: options.expand !== false, expanded: APP.session.expanded });
    APP.Engine.load(nextPlan.actions); APP.lastPlan = nextPlan;
    APP.unmappedFields = nextPlan.unmapped;
    APP.UI.init();
    APP.events.emit('plan', nextPlan);
    APP.Improvement.observePlan().catch(() => {});
    return { totalActions: nextPlan.actions.length, unmappedCount: nextPlan.unmapped.length, platform: nextPlan.platform,
      issues: nextPlan.issues, actions: nextPlan.actions.map(action => ({ id: action.id, type: action.type, fieldKey: action.fieldKey, label: action.label, source: action.source, confidence: action.confidence })),
      detectedButtons: buttons().map(publicButton) };
  }
  async function fill(options = {}) {
    await APP.ready;
    const started = performance.now();
    if (APP.profileStale) return { success: false, status: 'blocked', code: 'PROFILE_UPDATED_REFRESH_PAGE' };
    if (typeof options === 'number') options = { delay: options };
    const records = [], rounds = new Set(); let pending = [], unmapped = [];
    for (let round = 0; round < 8; round++) {
      if (stopRequested) break;
      if (!(round === 0 && options.useCurrentPlan && APP.lastPlan)) {
        const planned = plan(options);
        if (planned.error) return { success: false, status: 'blocked', code: planned.error };
      }
      pending = APP.lastPlan.issues;
      unmapped = APP.lastPlan.unmapped;
      const roundKey = APP.Scanner.signature() + '|' + APP.Engine.getQueue().map(action => action.id).join('|');
      if (rounds.has(roundKey)) { pending = [...pending, { code: 'REPLAN_DID_NOT_PROGRESS' }]; break; }
      rounds.add(roundKey);
      if (!APP.Engine.getQueue().length) break;
      const result = await APP.Engine.play(options.delay ?? 35);
      records.push(...APP.Engine.getQueue().filter(action => action.status !== 'queued').map(action => ['PAGE_CHANGED', 'STEP_CHANGED', 'TARGET_DETACHED'].includes(action.code) ? { ...action, status: 'skipped', code: 'REPLANNED' } : action));
      if (result.cancelled || stopRequested) { stopRequested = true; break; }
      if (!result.needsReplan && (result.failedActions || result.blockedActions || APP.Engine.getQueue().some(action => action.enabled === false))) break;
      if (round === 7) pending = [...pending, { code: 'MAX_REPLAN_ROUNDS' }];
    }
    pending = [...pending];
    for (const issue of APP.Validation.validate().issues) {
      if (!pending.some(existing => existing.fieldId === issue.fieldId && existing.code === issue.code)) pending.push(issue);
    }
    const result = APP.Engine.summarize(records, { cancelled: stopRequested, issues: pending, unmapped, buttons: buttons().map(publicButton) });
    if (pending.length) { result.success = false; result.status = stopRequested ? 'cancelled' : 'partial'; result.blockedActions += pending.length; }
    result.elapsedMs = Math.round(performance.now() - started);
    for (const action of records) await APP.Learning.observe(action).catch(() => {});
    await APP.Improvement.observeResult(result).catch(() => {});
    APP.lastResult = result; APP.events.emit('result', result);
    return result;
  }
  async function clickButton(query, options = {}) {
    if (APP.Engine.isRunning() || fillPromise) return { success: false, code: 'EXECUTION_BUSY' };
    const available = buttons();
    const target = typeof query === 'number' ? available[query] : query instanceof RegExp ? available.find(button => query.test(button.text)) : available.find(button => button.buttonId === query || button.id === query) || available.find(button => button.text.toLowerCase() === String(query).toLowerCase()) || available.find(button => button.type === query);
    if (!target || target.disabled) return { success: false, code: 'BUTTON_NOT_AVAILABLE' };
    if (target.type === 'submit') {
      if (options.confirmSubmit !== true && APP.UI.isLocked) return { success: false, blocked: true, code: 'SUBMIT_REVIEW_REQUIRED' };
      const validation = APP.Validation.validate(APP.DOM.scope(target.el));
      if (!validation.valid) return { success: false, blocked: true, issues: validation.issues };
    }
    const before = APP.Scanner.signature(); const url = location.href;
    APP.Drivers.click(target.el);
    const changed = await APP.waitFor(() => !target.el.isConnected || !APP.DOM.visible(target.el) || location.href !== url || APP.Scanner.signature() !== before, { timeout: 1600 });
    APP.session.expanded.clear();
    if (location.href === url) plan();
    return { success: !!changed, clicked: true, verified: !!changed, ...(changed ? {} : { code: 'BUTTON_EFFECT_NOT_CONFIRMED' }) };
  }
  const roles = () => [...document.querySelectorAll('a[href]')].filter(el => APP.DOM.visible(el) && /co.?op|intern(?:ship)?|trainee|training|tamheer|تدريب|متدرب|تمهير/i.test(el.textContent) && /software|computer|\bit\b|cyber|data|network|developer|engineering|systems?|تقنية|برمجيات|حاسب|نظم\s*معلومات|شبكات/i.test(el.textContent)).map(el => ({ title: el.textContent.trim(), url: el.href })).filter((item, index, all) => all.findIndex(other => other.url === item.url) === index);
  const API = APP.Agent = {
    version: APP.version,
    plan: options => fillPromise ? { error: 'EXECUTION_BUSY', code: 'EXECUTION_BUSY' } : plan(options),
    fill(options) {
      if (fillPromise) return fillPromise;
      if (APP.Engine.isRunning()) return APP.Engine.play();
      stopRequested = false;
      APP.session.activate();
      fillPromise = fill(options).finally(() => { fillPromise = null; });
      return fillPromise;
    },
    expandAndFill: options => API.fill(options),
    async play(delay = 35, single = false) {
      await APP.ready;
      if (APP.profileStale) return { success: false, code: 'PROFILE_UPDATED_REFRESH_PAGE' };
      APP.session.activate();
      const start = APP.Engine.getCurrentIndex();
      const result = await (single ? APP.Engine.next() : APP.Engine.play(delay));
      for (const action of APP.Engine.getQueue().slice(start, APP.Engine.getCurrentIndex())) await APP.Learning.observe(action).catch(() => {});
      if (!result.pendingActions || result.cancelled) await APP.Improvement.observeResult(result).catch(() => {});
      APP.lastResult = result; APP.events.emit('result', result); return result;
    },
    cancel() { stopRequested = true; return APP.Engine.cancel(); },
    async clear() { await this.cancel(); return APP.Engine.clear(); },
    getButtons: () => buttons().map(publicButton), clickButton,
    validate: () => APP.Validation.validate(),
    getUnmapped: () => (APP.lastPlan?.unmapped || []).map(field => ({ ...field })),
    async learn(selector, value, options) {
      await APP.ready;
      const matches = APP.DOM.queryAll(document, selector);
      if (matches.length !== 1) return APP.result('blocked', 'LEARNING_TARGET_AMBIGUOUS');
      const result = await APP.Learning.approve(matches[0], value, options);
      plan(); return result; // Learning never starts a fill as a side effect.
    },
    learned: () => APP.Learning.list(), exportLearned: () => JSON.stringify(APP.Learning.list(), null, 2), improvementReport: () => APP.Improvement.report(),
    clearLearned: () => APP.Learning.clear(),
    autoSnapshot: () => ({ success: false, code: 'AUTOMATIC_CAPTURE_DISABLED' }),
    captureFixture: () => APP.Diagnostics.capture(),
    lock: () => APP.UI.setGuardianLock(true), unlock: () => APP.UI.setGuardianLock(false), isLocked: () => APP.UI.isLocked,
    getRoles: roles, isJobBoard: () => /jobs|requisitions|careers|opportunities|search/i.test(location.pathname) && !document.querySelector('input[type="file"]'),
    inspect: () => ({ ready: true, version: APP.version, platform: APP.Adapters.current().id, url: location.origin + location.pathname,
      totalElements: APP.DOM.controls().length, processedCount: APP.Engine.getProcessedElements().length, queueLength: APP.Engine.getQueue().length,
      currentIndex: APP.Engine.getCurrentIndex(), running: APP.Engine.isRunning() || !!fillPromise, unmapped: API.getUnmapped(), buttons: API.getButtons(),
      activated: APP.session.active && APP.session.url === location.href, lastResult: APP.lastResult || null }),
    status: () => API.inspect(),
    toJSON: () => API.inspect()
  };
  globalThis.__CV_AGENT = API; // This object is private to the extension's isolated world.
  APP.toJSON = () => API.inspect();
  APP.ready = Promise.all([APP.Learning.ready, APP.Profile.ready]).then(() => {
    const observations = APP.Scanner.scan().observations;
    if (observations.filter(item => item.resolved).length >= 2 || (APP.Adapters.current().id !== 'generic' && observations.length)) plan();
    lastSignature = APP.Scanner.signature();
  });
  const readMethods = new Set(['plan', 'inspect', 'status', 'getButtons', 'getUnmapped', 'validate', 'getRoles', 'isJobBoard', 'isLocked']);
  const pageMethods = new Set(['fill', 'expandAndFill', 'play', 'cancel']);
  window.addEventListener('message', async event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.channel !== 'cv-autofill-v2') return;
    if (event.data.direction === 'probe') { window.postMessage({ channel: 'cv-autofill-v2', direction: 'ready' }, location.origin === 'null' ? '*' : location.origin); return; }
    if (event.data.direction !== 'request') return;
    const { id, method, args } = event.data;
    if (typeof id !== 'string' || id.length > 100 || typeof method !== 'string' || !Array.isArray(args) || args.length > 2) return;
    let result;
    try {
      if (readMethods.has(method)) { await APP.ready; result = await API[method](...(method === 'plan' ? [] : args)); }
      else if (pageMethods.has(method) && APP.session.active && APP.session.url === location.href) result = await API[method](...(method === 'fill' || method === 'expandAndFill' ? [{ delay: Math.max(0, Math.min(500, Number(args[0]?.delay ?? args[0] ?? 35) || 35)) }] : method === 'play' ? [35] : []));
      else result = { success: false, code: pageMethods.has(method) ? 'ACTIVATE_FROM_EXTENSION_FIRST' : 'TRUSTED_CHANNEL_REQUIRED' };
    } catch (error) { result = { success: false, code: error.message }; }
    window.postMessage({ channel: 'cv-autofill-v2', direction: 'response', id, result }, location.origin === 'null' ? '*' : location.origin);
  });
  window.postMessage({ channel: 'cv-autofill-v2', direction: 'ready' }, location.origin === 'null' ? '*' : location.origin);
  if (globalThis.chrome?.runtime?.id) chrome.runtime.onMessage.addListener((request, sender, respond) => {
    if (sender.id !== chrome.runtime.id || sender.tab || (sender.url && !sender.url.startsWith(chrome.runtime.getURL('')))) return;
    if (request.type === 'CV_DEV_STATUS' || request.type === 'CV_DEV_PREPARE') {
      const relevant = !!APP.lastPlan || APP.session.active;
      const dirty = relevant && APP.DOM.controls().some(el => !APP.DOM.sensitive(el) && el.type !== 'hidden' && (el.type === 'file' ? el.files.length : el.type === 'checkbox' || el.type === 'radio' ? el.checked : !APP.DOM.empty(el)));
      const busy = APP.Engine.isRunning() || !!fillPromise;
      respond({ relevant, dirty, busy, ready: !busy && !dirty }); return;
    }
    if (request.type === 'CV_DEV_PENDING') { APP.UI.log('يوجد تحديث للكود؛ سيُطبق تلقائيًا بعد انتهاء العمل وخلو النموذج من البيانات غير المرسلة.', 'info'); respond({ ok: true }); return; }
    if (request.type === 'CV_DEV_DISPOSE') { API.cancel(); APP.UI.destroy(); respond({ ok: true }); return; }
    if (request.type === 'CV_DISCOVER' && typeof request.nonce === 'string') {
      APP.ready.then(() => chrome.runtime.sendMessage({ action: 'frame_ready', nonce: request.nonce })).catch(() => {});
      respond({ ready: true }); return;
    }
    if (request.type !== 'CV_TRUSTED_COMMAND') return;
    if (!['plan', 'fill', 'play', 'cancel', 'inspect', 'validate', 'captureFixture'].includes(request.method)) return;
    APP.ready.then(() => {
      if (request.activate) APP.session.activate();
      return API[request.method](...(request.args || []));
    }).then(respond, error => respond({ success: false, code: error.message }));
    return true;
  });
  globalThis.chrome?.storage?.onChanged?.addListener((changes, area) => {
    if (area !== 'local' || !changes.profileOverrides) return;
    APP.profileStale = true; APP.session.deactivate(); API.cancel();
    APP.UI.log('تغيّر الملف الشخصي. حدّث صفحة النموذج قبل المتابعة.', 'blocked');
  });
  let timer;
  const observer = new MutationObserver(mutations => {
    if (mutations.every(mutation => APP.DOM.own(mutation.target instanceof Element ? mutation.target : mutation.target.parentElement))) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (APP.Engine.isRunning() || fillPromise) return;
      observeRoots();
      const signature = APP.Scanner.signature();
      if (location.href !== observedURL) { APP.session.deactivate(); observedURL = location.href; }
      if (signature !== lastSignature) {
        lastSignature = signature;
        if (APP.lastPlan) plan();
        else if (APP.Scanner.scan().observations.filter(item => item.resolved).length >= 2) plan();
      }
    }, 250);
  });
  const observed = new WeakSet();
  const observeRoots = () => { for (const root of APP.DOM.roots()) if (!observed.has(root)) { observed.add(root); observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'disabled', 'aria-hidden', 'class', 'style'] }); } };
  observeRoots();
  document.addEventListener('focusin', observeRoots, true);
  window.addEventListener('pagehide', () => { observer.disconnect(); clearTimeout(timer); API.cancel(); APP.session.deactivate(); }, { once: true });
})();
