// Enabled only by npm run dev's protected, ignored config. No profile/values leave the extension.
(() => {
  'use strict';
  let config = null, watching = false;
  const local = chrome.storage.local;
  const endpoint = 'http://127.0.0.1:8989';
  const alarm = 'cv-development-reconnect';
  async function configure() {
    try {
      const response = await fetch(chrome.runtime.getURL('.dev-runtime.json'), { cache: 'no-store' });
      const candidate = response.ok ? await response.json() : null;
      config = candidate?.enabled === true && typeof candidate.token === 'string' && candidate.token.length >= 16 ? candidate : null;
    } catch { config = null; }
    if (config) await chrome.alarms.create(alarm, { periodInMinutes: 0.5 });
    else await chrome.alarms.clear(alarm);
  }
  async function request(route, body) {
    if (!config) return null;
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(endpoint + route, { method: body ? 'POST' : 'GET', cache: 'no-store', signal: controller.signal,
        headers: { Authorization: 'Bearer ' + config.token, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      if (!response.ok) throw new Error('DEV_SERVER_' + response.status);
      return response.json();
    } finally { clearTimeout(timer); }
  }
  async function tryApply(revision) {
    const tabs = (await chrome.tabs.query({})).filter(tab => /^https?:/.test(tab.url || ''));
    const targets = [];
    for (const tab of tabs) {
      let frames;
      try { frames = await CVServices.discover(tab.id); } catch { continue; }
      let relevant = false;
      for (const frameId of frames) {
        const status = await chrome.tabs.sendMessage(tab.id, { type: 'CV_DEV_STATUS' }, { frameId }).catch(() => null);
        if (!status?.relevant) continue;
        relevant = true;
        if (status.busy || status.dirty) {
          await chrome.tabs.sendMessage(tab.id, { type: 'CV_DEV_PENDING', revision }, { frameId }).catch(() => {});
          return false;
        }
      }
      if (relevant) targets.push({ tabId: tab.id, url: tab.url, frames });
    }
    // Recheck immediately before invalidating contexts; never refresh an unrelated active tab.
    for (const target of targets) for (const frameId of target.frames) {
      const prepared = await chrome.tabs.sendMessage(target.tabId, { type: 'CV_DEV_PREPARE' }, { frameId }).catch(() => null);
      if (prepared?.ready === false) return false;
    }
    for (const target of targets) for (const frameId of target.frames) await chrome.tabs.sendMessage(target.tabId, { type: 'CV_DEV_DISPOSE' }, { frameId }).catch(() => {});
    await local.set({ devAppliedRevision: revision, devReloadTargets: targets.map(({ tabId, url }) => ({ tabId, url, at: Date.now() })) });
    chrome.runtime.reload();
    return true;
  }
  async function restoreTargets() {
    const data = await local.get('devReloadTargets');
    await local.remove('devReloadTargets');
    for (const target of data.devReloadTargets || []) {
      if (Date.now() - target.at > 30000) continue;
      const tab = await chrome.tabs.get(target.tabId).catch(() => null);
      if (tab?.url === target.url) await chrome.tabs.reload(target.tabId).catch(() => {});
    }
  }
  async function watch() {
    if (watching || !config) return;
    watching = true;
    try {
      let applied = (await local.get('devAppliedRevision')).devAppliedRevision;
      let seen = applied;
      while (config) {
        const result = await request('/watch?since=' + encodeURIComponent(seen || ''));
        // An extension API event on each bounded heartbeat keeps the development worker responsive.
        await chrome.storage.session.set({ devLastHeartbeat: Date.now() });
        if (!result?.revision) break;
        seen = result.revision;
        if (!applied) { applied = seen; await local.set({ devAppliedRevision: applied }); }
        if (seen !== applied && await tryApply(seen)) return;
      }
    } catch { /* Server offline: alarm reconnects; production never enters this loop. */ }
    finally { watching = false; }
  }
  const ready = configure().then(restoreTargets);
  globalThis.CVDev = {
    ready,
    async status() { await ready; if (!config) await configure(); if (config && !watching) watch().catch(() => {}); return { enabled: !!config }; },
    async fixture(fixture) { await ready; return config ? request('/save-fixture', fixture).catch(() => ({ ok: false })) : { ok: false, disabled: true }; },
    tryApply
  };
  chrome.alarms.onAlarm.addListener(event => { if (event.name === alarm) configure().then(watch).catch(() => {}); });
  chrome.runtime.onInstalled?.addListener(() => ready.then(watch).catch(() => {}));
  chrome.runtime.onStartup?.addListener(() => ready.then(watch).catch(() => {}));
  ready.then(watch).catch(() => {});
})();
