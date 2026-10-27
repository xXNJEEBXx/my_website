(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  const cache = new Map();
  APP.Attachments = {
    async get(key = 'cv') {
      if (!['cv', 'coverLetter', 'certificate'].includes(key)) return null;
      if (cache.has(key)) return cache.get(key);
      if (!globalThis.chrome?.runtime?.id) return null;
      const response = await chrome.runtime.sendMessage({ action: 'get_attachment', key });
      if (!response?.ok) return null;
      cache.set(key, response.attachment);
      return response.attachment;
    },
    clear() { cache.clear(); }
  };
  APP.Drivers.upload = async (input, key = 'cv', { signal } = {}) => {
    APP.Drivers.ensure(input, signal);
    if (input.files.length) return APP.result('skipped', 'FILE_ALREADY_PRESENT');
    const attachment = await APP.Attachments.get(key);
    APP.throwIfAborted(signal);
    if (!attachment) return APP.result('blocked', 'ATTACHMENT_NOT_CONFIGURED');
    const accepts = input.accept.split(',').map(type => type.trim().toLowerCase()).filter(Boolean);
    const extension = '.' + attachment.name.split('.').pop().toLowerCase();
    if (accepts.length && !accepts.some(type => type === extension || type === attachment.type || type === 'application/*' || type === '*/*')) return APP.result('blocked', 'FILE_TYPE_NOT_ACCEPTED');
    const bytes = Uint8Array.from(atob(attachment.base64), char => char.charCodeAt(0));
    const declaredMax = Number(input.getAttribute('data-max-size'));
    if (declaredMax > 0 && bytes.length > declaredMax) return APP.result('blocked', 'FILE_TOO_LARGE');
    const file = new File([bytes], attachment.name, { type: attachment.type });
    const transfer = new DataTransfer(); transfer.items.add(file);
    input.files = transfer.files;
    APP.Drivers.change(input);
    await APP.wait(180, signal);
    const group = input.closest('.form-group, .field, .dropzone, [role="presentation"]') || input.parentElement;
    const rejected = [...group.querySelectorAll('[role="alert"], .error, [class*="error"]')].some(el => APP.DOM.visible(el) && el.textContent.trim());
    return input.files.length === 1 && input.files[0].size === file.size && !rejected ? APP.result('verified') : APP.result('failed', 'FILE_NOT_ACCEPTED');
  };
})();
