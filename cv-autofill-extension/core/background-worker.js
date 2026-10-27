// Event-driven MV3 worker. No permanent polling and no automatic tab reloads.
importScripts(chrome.runtime.getURL('core/attachment-store.js'));
importScripts(chrome.runtime.getURL('core/knowledge-store.js'));
(() => {
  'use strict';
  const discoveries = new Map();
  const trustedUI = sender => sender.id === chrome.runtime.id && !!sender.url?.startsWith(chrome.runtime.getURL(''));
  async function discover(tabId) {
    const nonce = crypto.randomUUID();
    const job = { tabId, frames: new Set(), last: Date.now() }; discoveries.set(nonce, job);
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'CV_DISCOVER', nonce });
      const start = Date.now();
      while (Date.now() - job.last < 120 && Date.now() - start < 900) await new Promise(resolve => setTimeout(resolve, 25));
      return [...job.frames];
    } finally { discoveries.delete(nonce); }
  }
  async function attachment(key) {
    if (!['cv', 'coverLetter', 'certificate'].includes(key)) return { ok: false, code: 'UNKNOWN_ATTACHMENT' };
    const saved = await CVAttachmentStore.get(key);
    let blob = saved?.blob, name = saved?.name;
    if (!blob && key === 'cv') {
      const response = await fetch(chrome.runtime.getURL('assets/resume.pdf'));
      if (!response.ok) throw new Error('RESUME_ASSET_MISSING');
      blob = await response.blob(); name = 'CV.pdf';
    }
    if (!blob) return { ok: false, code: 'ATTACHMENT_NOT_CONFIGURED' };
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    return { ok: true, attachment: { name, type: 'application/pdf', size: bytes.length, base64: btoa(binary) } };
  }
  globalThis.CVServices = { discover };
  chrome.runtime.onMessage.addListener((request, sender, respond) => {
    if (sender.id !== chrome.runtime.id) return;
    if (request.action === 'learning_mutation') {
      CVKnowledge.mutate(request, sender).then(respond, error => respond({ ok: false, code: error.message })); return true;
    }
    if (request.action === 'record_run' && sender.tab) {
      CVKnowledge.record({ ...request.run, origin: new URL(sender.url).origin }).then(respond, error => respond({ ok: false, code: error.message })); return true;
    }
    if (request.action === 'dev_status') { CVDev.status().then(respond); return true; }
    if (request.action === 'record_fixture' && sender.tab) { CVDev.fixture(request.fixture).then(respond, () => respond({ ok: false })); return true; }
    if (request.action === 'frame_ready' && sender.tab && Number.isInteger(sender.frameId)) {
      const job = discoveries.get(request.nonce);
      if (job?.tabId === sender.tab.id) { job.frames.add(sender.frameId); job.last = Date.now(); }
      respond({ ok: true }); return;
    }
    if (request.action === 'get_attachment' && sender.tab) {
      attachment(request.key).then(respond, error => respond({ ok: false, code: error.message })); return true;
    }
    if (request.action === 'open_options') { chrome.runtime.openOptionsPage(); respond({ ok: true }); return; }
    if (!trustedUI(sender)) return;
    if (request.action === 'reload_extension') { respond({ ok: true }); setTimeout(() => chrome.runtime.reload(), 100); return; }
    if (request.action !== 'run_in_tab' || !['plan', 'fill', 'play', 'cancel', 'inspect', 'validate'].includes(request.method)) return;
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('NO_ACTIVE_TAB');
      const frames = await discover(tab.id);
      if (!frames.length) throw new Error('EXTENSION_NOT_READY_REFRESH_PAGE');
      const results = await Promise.all(frames.map(async frameId => {
        try {
          const result = await chrome.tabs.sendMessage(tab.id, { type: 'CV_TRUSTED_COMMAND', method: request.method, args: Array.isArray(request.args) ? request.args.slice(0, 2) : [], activate: ['fill', 'play'].includes(request.method) }, { frameId });
          return { frameId, result };
        } catch (error) { return { frameId, result: { success: false, code: error.message } }; }
      }));
      return { ok: true, frames: results, success: results.every(item => item.result?.success !== false && !item.result?.error && !item.result?.code) };
    })().then(respond, error => respond({ ok: false, code: error.message }));
    return true;
  });
})();
