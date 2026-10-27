const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
async function harness({ enabled = true, dirty = false, busy = false, restore = [] } = {}) {
  const state = { dirty, busy, runtimeReloads: 0, refreshed: [], data: { devAppliedRevision: 'old', devReloadTargets: restore }, network: [] };
  const chrome = { runtime: { getURL: file => 'chrome-extension://test/' + file, reload() { state.runtimeReloads++; } },
    alarms: { create: async () => {}, clear: async () => {}, onAlarm: { addListener() {} } },
    storage: { local: { get: async key => ({ [key]: structuredClone(state.data[key]) }), set: async values => Object.assign(state.data, structuredClone(values)), remove: async key => { delete state.data[key]; } }, session: { set: async () => {} } },
    tabs: { query: async () => [{ id: 1, url: 'https://form.invalid/' }, { id: 2, url: 'https://unrelated.invalid/' }], get: async id => ({ id, url: 'https://form.invalid/' }), reload: async id => state.refreshed.push(id),
      sendMessage: async (_tab, request) => request.type === 'CV_DEV_STATUS' ? { relevant: true, dirty: state.dirty, busy: state.busy } : request.type === 'CV_DEV_PREPARE' ? { ready: !state.dirty && !state.busy } : { ok: true } } };
  const context = vm.createContext({ chrome, console, URL, AbortController, setTimeout, clearTimeout, CVServices: { discover: async id => id === 1 ? [0] : [] },
    fetch: async url => { state.network.push(url); if (url.startsWith('chrome-extension://')) return { ok: enabled, json: async () => ({ enabled, token: 'local-test-auth-token' }) }; throw new Error('offline in test'); } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../cv-autofill-extension/core/dev-runtime.js'), 'utf8'), context);
  await context.CVDev.ready;
  return { state, dev: context.CVDev };
}
test('automatic update waits for dirty forms', async () => { const { state, dev } = await harness({ dirty: true }); assert.equal(await dev.tryApply('new'), false); assert.equal(state.runtimeReloads, 0); assert.equal(state.data.devAppliedRevision, 'old'); });
test('automatic update waits for active execution', async () => { const { state, dev } = await harness({ busy: true }); assert.equal(await dev.tryApply('new'), false); assert.equal(state.runtimeReloads, 0); });
test('automatic update targets only related pristine tabs', async () => { const { state, dev } = await harness(); assert.equal(await dev.tryApply('new'), true); assert.equal(state.runtimeReloads, 1); assert.deepEqual(state.data.devReloadTargets.map(target => target.tabId), [1]); });
test('post-reload refresh checks URL and expiry', async () => {
  const { state } = await harness({ restore: [{ tabId: 1, url: 'https://form.invalid/', at: Date.now() }, { tabId: 2, url: 'https://old.invalid/', at: Date.now() }, { tabId: 3, url: 'https://form.invalid/', at: Date.now() - 60000 }] });
  assert.deepEqual(state.refreshed, [1]);
});
test('normal mode makes no requests to the development server', async () => { const { state, dev } = await harness({ enabled: false }); assert.equal((await dev.status()).enabled, false); assert.ok(state.network.every(url => url.startsWith('chrome-extension://'))); });
test('concurrent knowledge writes keep every rule', async () => {
  const data = {}; const storage = { get: async key => { await new Promise(resolve => setTimeout(resolve, 1)); return { [key]: structuredClone(data[key]) }; }, set: async values => { await new Promise(resolve => setTimeout(resolve, 1)); Object.assign(data, structuredClone(values)); } };
  const context = vm.createContext({ chrome: { runtime: { getURL: file => 'chrome-extension://test/' + file }, storage: { local: storage } }, URL });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../cv-autofill-extension/core/knowledge-store.js'), 'utf8'), context);
  await Promise.all(Array.from({ length: 10 }, (_, index) => context.CVKnowledge.mutate({ operation: 'upsert', rule: { key: 'rule-' + index, origin: 'https://form.invalid', hints: 'Question', kind: 'literal', value: 'confirmed answer' } }, { url: 'https://form.invalid/' })));
  assert.equal(data.approvedFieldRulesV1.length, 10);
  const explicit = data.approvedFieldRulesV1[0];
  await context.CVKnowledge.mutate({ operation: 'upsert', rule: { ...explicit, automatic: true, value: 'automatic candidate' } }, { url: 'https://form.invalid/' });
  assert.equal(data.approvedFieldRulesV1.find(rule => rule.key === explicit.key).value, 'confirmed answer');
});
