(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  function capture(root = document.querySelector('form, [role="form"], main') || document.body) {
    const copy = source => {
      const cloned = source.cloneNode(false);
      for (const child of source.childNodes) cloned.append(copy(child));
      if (source.shadowRoot && !APP.DOM.own(source)) { const section = document.createElement('section'); section.className = 'fixture-shadow-root'; for (const child of source.shadowRoot.childNodes) section.append(copy(child)); cloned.append(section); }
      return cloned;
    };
    const clone = copy(root);
    clone.querySelectorAll('script, style, link, svg, canvas, iframe, #cv-agent-host, [data-cv-ui], [contenteditable]').forEach(el => el.remove());
    const personal = Object.values(APP.CV).filter(value => typeof value === 'string' && value.length >= 3);
    const allowedAttributes = new Set(['id', 'name', 'class', 'type', 'for', 'role', 'placeholder', 'required', 'disabled', 'readonly', 'multiple', 'accept', 'min', 'max', 'step', 'maxlength', 'minlength', 'pattern', 'lang', 'dir', 'autocomplete', 'hidden', 'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-required', 'aria-hidden', 'aria-expanded']);
    for (const el of [clone, ...clone.querySelectorAll('*')]) {
      for (const attr of [...el.attributes]) {
        if (!allowedAttributes.has(attr.name)) { el.removeAttribute(attr.name); continue; }
        let safe = attr.value;
        for (const value of personal) safe = safe.split(value).join('redacted');
        if (safe !== attr.value) el.setAttribute(attr.name, safe);
      }
      if (el.matches('input, textarea')) {
        el.value = ''; el.defaultValue = '';
        if (el.tagName === 'TEXTAREA') el.textContent = '';
        el.removeAttribute('value');
        if (el.matches('input[type="hidden"], input[type="password"]')) el.remove();
      }
      if (el.matches('[class*="singleValue"], [class*="single-value"], [class*="multiValue"], [class*="file-name"]')) el.textContent = '';
    }
    const allowed = [...clone.querySelectorAll('label, legend, option, button, [role="option"], [role="heading"], [role="radio"], [role="checkbox"]')];
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!allowed.some(el => el.contains(node))) node.textContent = '';
      else for (const value of personal) node.textContent = node.textContent.split(value).join('[redacted]');
    }
    const signature = APP.DOM.controls(clone).filter(el => !APP.DOM.sensitive(el)).map(el => `${el.tagName}:${el.type || ''}:${el.name || el.id || ''}:${APP.DOM.learningHints(el)}:${el.tagName === 'SELECT' ? [...el.options].map(option => option.textContent).join(',') : ''}`).sort().join('|');
    let hash = 2166136261;
    for (const char of signature) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    const platform = APP.Adapters.current().id;
    const name = `${platform}-${location.hostname.replace(/[^a-z0-9-]/gi, '-')}-${(hash >>> 0).toString(16)}`;
    return { name, signature, platform, sanitized: true, fieldCount: APP.DOM.controls(root).length, url: location.origin + location.pathname, html: `<!doctype html><html><head><meta charset="utf-8"><title>Sanitized form fixture</title></head><body>${clone.outerHTML}</body></html>` };
  }
  APP.Diagnostics = Object.freeze({ capture });
})();
