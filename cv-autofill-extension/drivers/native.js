(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  APP.Drivers = APP.Drivers || {};
  function ensure(el, signal, { allowReadOnly = false } = {}) {
    APP.throwIfAborted(signal);
    if (!el?.isConnected) throw new Error('TARGET_DETACHED');
    if (el.disabled || (!allowReadOnly && el.readOnly) || el.getAttribute('aria-disabled') === 'true') throw new Error('TARGET_DISABLED');
    if (APP.DOM.sensitive(el)) throw new Error('SENSITIVE_FIELD');
  }
  function change(el) {
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
  function click(el, signal, { pointer = false } = {}) {
    ensure(el, signal, { allowReadOnly: true });
    el.scrollIntoView?.({ block: 'nearest' });
    if (pointer) {
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, cancelable: true, button: 0, buttons: 1 }));
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, cancelable: true, button: 0, buttons: 1 }));
      el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, composed: true, cancelable: true, button: 0 }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true, cancelable: true, button: 0 }));
    }
    APP.throwIfAborted(signal);
    el.click(); // Exactly one click; never dispatch another click before/after it.
  }
  async function text(el, value, { signal } = {}) {
    ensure(el, signal);
    const editable = el.matches('[contenteditable="true"], [role="textbox"]') && !el.matches('input, textarea');
    if ((!el.matches('input, textarea') && !editable) || el.type === 'file') return APP.result('blocked', 'UNSUPPORTED_TEXT_TARGET');
    const target = APP.DOM.locator(el);
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    el.focus();
    if (editable) el.textContent = String(value);
    else setter.call(el, String(value));
    change(el);
    el.blur();
    await APP.wait(60, signal);
    const current = APP.DOM.resolve(target);
    if (!current || (editable ? current.textContent : current.value) !== String(value) || current.getAttribute('aria-invalid') === 'true') return APP.result('failed', 'VALUE_NOT_ACCEPTED');
    if (current.willValidate && !current.validity.valid) return APP.result('failed', 'FIELD_CONSTRAINT_FAILED');
    return APP.result('verified');
  }
  async function select(el, value, { signal } = {}) {
    ensure(el, signal);
    const chosen = APP.Matching.choose([...el.options], value);
    if (!chosen.option) return APP.result('blocked', chosen.code);
    const expected = chosen.option.value;
    el.value = expected;
    change(el);
    await APP.wait(60, signal);
    return el.value === expected && (!el.willValidate || el.validity.valid) ? APP.result('verified') : APP.result('failed', 'OPTION_NOT_COMMITTED');
  }
  async function radio(el, value, { signal } = {}) {
    ensure(el, signal);
    const current = el.matches('input') ? el.checked : el.getAttribute('aria-checked') === 'true';
    if (!current) click(el, signal);
    await APP.wait(50, signal);
    const checked = el.matches('input') ? el.checked : el.getAttribute('aria-checked') === 'true';
    return checked ? APP.result('verified') : APP.result('failed', 'CHOICE_NOT_COMMITTED');
  }
  async function checkbox(el, checked = true, { signal } = {}) {
    ensure(el, signal);
    const current = el.matches('input') ? el.checked : el.getAttribute('aria-checked') === 'true';
    if (current !== checked) click(el, signal);
    await APP.wait(50, signal);
    return (el.matches('input') ? el.checked : el.getAttribute('aria-checked') === 'true') === checked ? APP.result('verified') : APP.result('failed', 'CHOICE_NOT_COMMITTED');
  }
  Object.assign(APP.Drivers, { ensure, change, click, text, select, radio, checkbox });
})();
