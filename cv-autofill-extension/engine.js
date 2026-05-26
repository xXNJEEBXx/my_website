window.__CV_APP = window.__CV_APP || {};

window.__CV_APP.Engine = (function() {
  let queue = [];
  let isPlaying = false;
  let currentIndex = 0;
  let processedIds = new Set();

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

  async function executeOracleTextInput(el, value) {
    el.focus();
    
    // Clear the field natively first
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, "");
    el.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Simulate typing character by character to trigger Oracle's search filter
    for (let i = 0; i < value.length; i++) {
        nativeInputValueSetter.call(el, el.value + value[i]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keydown', { key: value[i], bubbles: true }));
        el.dispatchEvent(new KeyboardEvent('keyup', { key: value[i], bubbles: true }));
        await new Promise(r => setTimeout(r, 10)); // small delay to allow framework to catch up
    }
    
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function executeOracleDropdownOpen(el) {
    window.__CV_APP.UI.log(`Clicking input to open dropdown...`, "info");
    el.click();
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, bubbles: true }));
  }

  function dispatchKey(el, type, key, code, keyCode) {
    const e = new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true });
    Object.defineProperty(e, 'keyCode', { get: () => keyCode });
    Object.defineProperty(e, 'which', { get: () => keyCode });
    el.dispatchEvent(e);
  }

  /*
   =============================================================================
   FAILED ATTEMPTS RECORD (Oracle JET Combobox) - DO NOT REPEAT
   =============================================================================
   1. Simple DOM Click
      Reason: Clicked hidden ghost elements or framework ignored clicks on inner spans.
      Old Code:
      let targetItem = allElements.find(e => e.innerText === valStr);
      targetItem.click();

   2. Keyboard Simulation (ArrowDown -> Enter)
      Reason: Programmatic ArrowDown triggered a reset of the filtered list, causing it to select the wrong item.
      Old Code:
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ... }));
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ... }));

   3. Direct Enter + keyCode spoofing (Object.defineProperty)
      Reason: Framework strictly checks event.isTrusted. Untrusted synthetic keys are completely ignored.
      Old Code:
      function dispatchKey(el, type, key, code, keyCode) { ... }
      dispatchKey(el, 'keydown', 'Enter', 'Enter', 13);
      
   4. Robust Pointer Click + Strict Visibility Filter
      Reason: Synthetic isTrusted=false clicks are blocked by security model, or target.click() steals focus causing instant abort.
      Old Code:
      let visiblePopups = popups.filter(p => p.getBoundingClientRect().width > 0 && ...);
      let clickable = targetItem.closest('li, [role="option"]');
      clickable.dispatchEvent(new PointerEvent('pointerdown', ...));
      clickable.click();
   =============================================================================
   NEXT APPROACH: Programmatic Framework Hooking (Bypass UI entirely)
   =============================================================================
  */
  async function executeOracleOptionClick(el, value) {
    const valStr = String(value).trim().toLowerCase();
    
    // Wait for the dropdown animation to finish
    await new Promise(r => setTimeout(r, 400));
    
    function findTarget() {
        // Find all possible dropdown containers
        const popups = Array.from(document.querySelectorAll('.oj-listbox-drop, .oj-menu, [role="listbox"], .oj-combobox-popup'));
        
        // Strictly filter to only the one currently visible ON SCREEN
        const visiblePopups = popups.filter(p => {
            const rect = p.getBoundingClientRect();
            // Check zero dimensions
            if (rect.width === 0 || rect.height === 0) return false;
            // Check off-screen positioning (which Oracle JET uses to hide ghost elements)
            if (rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth || rect.top > window.innerHeight) return false;
            // Check CSS visibility
            const style = window.getComputedStyle(p);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            return true;
        });
        
        for (const popup of visiblePopups) {
            const items = Array.from(popup.querySelectorAll('li, tr, td, [role="option"], .oj-listbox-result'));
            const match = items.find(e => {
                const text = (e.innerText !== undefined ? e.innerText : e.textContent || '').trim().toLowerCase();
                return text === valStr || text.startsWith(valStr) || text.includes(valStr);
            });
            if (match) return match;
        }
        return null;
    }

    let targetItem = findTarget();

    if (!targetItem) {
        window.__CV_APP.UI.log(`Options not found in active dropdown. Retrying...`, "info");
        el.click();
        el.focus();
        dispatchKey(el, 'keydown', 'ArrowDown', 'ArrowDown', 40);
        await new Promise(r => setTimeout(r, 800));
        targetItem = findTarget();
    }

    if (targetItem) {
        window.__CV_APP.UI.log(`Clicking exact dropdown option for ${valStr}...`, "info");
        
        // Find the actual interactive wrapper
        let clickable = targetItem.closest('li, tr, td, [role="option"]') || targetItem;
        clickable.scrollIntoView({ block: 'nearest' });
        
        // Dispatch robust events
        clickable.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 }));
        clickable.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 }));
        
        clickable.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 0 }));
        clickable.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 0 }));
        
        clickable.click();
    } else {
        window.__CV_APP.UI.log(`Could not find option ${valStr} in active dropdown!`, "error");
    }
    
    await new Promise(r => setTimeout(r, 100));
    el.blur();
  }

  async function executeNext() {
    if (currentIndex >= queue.length) {
      isPlaying = false;
      return;
    }

    const action = queue[currentIndex];
    window.__CV_APP.UI.log(`Processing: ${action.label}`, "info");

    try {
      if (action.execute) {
        await action.execute();
      }
      window.__CV_APP.UI.log(`Filled: ${action.value}`, "success");
    } catch (err) {
      window.__CV_APP.UI.log(`Error: ${err.message}`, "error");
    }

    currentIndex++;
    window.__CV_APP.UI.updateProgress(currentIndex, queue.length);

    if (isPlaying) {
      setTimeout(() => {
        executeNext();
      }, 1200); // Wait 1.2s between actions for UI to catch up
    }
  }

  return {
    clear: () => { queue = []; currentIndex = 0; processedIds.clear(); window.__CV_APP.UI.updateProgress(0, 0); },
    enqueue: (action) => {
      if (action.el && action.el.id) {
        processedIds.add(action.el.id);
      }
      queue.push(action);
    },
    isProcessed: (el) => {
      if (queue.some(a => a.el === el)) return true;
      if (el.id && processedIds.has(el.id)) return true;
      return false;
    },
    getQueue: () => queue,
    getCurrentIndex: () => currentIndex,
    play: () => {
      if (currentIndex >= queue.length) return;
      isPlaying = true;
      executeNext();
    },
    next: () => {
      isPlaying = false;
      executeNext();
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
