window.__CV_APP = window.__CV_APP || {};

window.__CV_APP.Engine = (function() {
  let queue = [];
  let isPlaying = false;
  let currentIndex = 0;

  function executeNativeSet(el, value) {
    try {
      el.select();
      if (document.execCommand('insertText', false, value)) {
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    } catch(e) {}
    
    const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const nativeSet = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (nativeSet) nativeSet.call(el, value);
    else el.value = value;
    if (el._valueTracker) el._valueTracker.setValue('');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function executeOracleTextInput(el, value) {
    const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeSet) nativeSet.call(el, value);
    else el.value = value;
    
    const changeEvent = new UIEvent("change", { "view": window, "bubbles": true, "cancelable": true });
    el.dispatchEvent(changeEvent);
    
    const inputEvent = new UIEvent("input", { "view": window, "bubbles": true, "cancelable": true });
    el.dispatchEvent(inputEvent);
  }

  async function executeOracleDropdownOpen(el) {
    window.__CV_APP.UI.log(`Clicking input to open dropdown...`, "info");
    el.click();
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
  }

  async function executeOracleOptionClick(el, value) {
    const valStr = String(value).trim().toLowerCase();
    
    function findTarget() {
        const allElements = Array.from(document.querySelectorAll('*'));
        // querySelectorAll returns elements in pre-order (parents before children).
        // By reversing, we evaluate the deepest nested leaf nodes at the end of the document FIRST.
        // This is perfect for dropdown popups which are appended to the body.
        allElements.reverse(); 
        
        return allElements.find(e => {
            // Ignore inputs and invisible metadata tags
            if (e.tagName === 'INPUT' || e.tagName === 'SCRIPT' || e.tagName === 'STYLE' || e.tagName === 'NOSCRIPT' || e.tagName === 'HEAD') return false;
            
            // Element must be visually rendered on the screen
            const rect = e.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false; 
            
            // Check exact text match
            const text = (e.innerText !== undefined ? e.innerText : e.textContent || '').trim().toLowerCase();
            return text === valStr;
        });
    }

    let targetItem = findTarget();

    if (!targetItem) {
        window.__CV_APP.UI.log(`Options not found in DOM. Re-clicking input...`, "info");
        el.click();
        el.focus();
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
        
        await new Promise(r => setTimeout(r, 800));
        targetItem = findTarget();
    }

    if (targetItem) {
        window.__CV_APP.UI.log(`Clicking dropdown option for ${valStr}...`, "info");
        targetItem.scrollIntoView({ block: 'nearest' });
        targetItem.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        targetItem.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        targetItem.click();
    } else {
        window.__CV_APP.UI.log(`Could not find any visible text node for ${valStr}, trying Enter fallback...`, "error");
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
        await new Promise(r => setTimeout(r, 200));
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    }
    
    el.blur();
  }

  async function step() {
    if (currentIndex >= queue.length) {
      window.__CV_APP.UI.log("All actions completed!", "success");
      isPlaying = false;
      return;
    }
    
    const action = queue[currentIndex];
    window.__CV_APP.UI.log(`Processing: ${action.label}`);
    window.__CV_APP.UI.highlight(action.el);
    window.__CV_APP.UI.updateProgress(currentIndex + 1, queue.length);
    
    try {
      await action.execute();
      window.__CV_APP.UI.log(`Filled: ${action.value}`, "success");
    } catch (err) {
      window.__CV_APP.UI.log(`Error: ${err.message}`, "error");
    }
    
    currentIndex++;
    
    if (isPlaying) {
      setTimeout(step, 800); // 800ms delay between automatic steps
    }
  }

  return {
    clear: () => { queue = []; currentIndex = 0; window.__CV_APP.UI.updateProgress(0, 0); },
    enqueue: (action) => queue.push(action),
    getQueue: () => queue,
    getCurrentIndex: () => currentIndex,
    play: () => {
      if (currentIndex >= queue.length) return;
      isPlaying = true;
      step();
    },
    next: () => {
      isPlaying = false;
      step();
    },
    cancel: () => {
      isPlaying = false;
      window.__CV_APP.UI.log("Execution paused/cancelled.", "error");
    },
    executeNativeSet,
    executeOracleTextInput,
    executeOracleDropdownOpen,
    executeOracleOptionClick
  };
})();
