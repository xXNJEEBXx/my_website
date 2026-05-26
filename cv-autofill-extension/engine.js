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
    const combobox = el.closest('oj-combobox-one, oj-combobox-many, oj-select-single, oj-select-many');
    
    // METHOD 1: Programmatic Hook via <oj-option> Web Components
    if (combobox) {
        const ojOptions = Array.from(combobox.querySelectorAll('oj-option'));
        if (ojOptions.length > 0) {
            const targetOption = ojOptions.find(opt => {
                const text = (opt.innerText || opt.textContent || '').trim().toLowerCase();
                return text === valStr || text.startsWith(valStr) || text.includes(valStr);
            });
            if (targetOption) {
                window.__CV_APP.UI.log(`Programmatic Hook (oj-option): Set value to [${targetOption.value}]`, "success");
                combobox.value = targetOption.value;
                el.blur();
                return; // Success!
            }
        }
    }

    // Wait for dropdown animation to finish to inspect the popup DOM
    await new Promise(r => setTimeout(r, 400));
    
    function findVisibleOption() {
        const allElements = Array.from(document.querySelectorAll('*'));
        allElements.reverse(); // Deepest elements first (perfect for body-appended dropdowns)
        
        return allElements.find(e => {
            if (e.tagName === 'INPUT' || e.tagName === 'SCRIPT' || e.tagName === 'STYLE' || e.tagName === 'NOSCRIPT' || e.tagName === 'HEAD') return false;
            
            const rect = e.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            // Strict off-screen check
            if (rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth || rect.top > window.innerHeight) return false;
            
            const style = window.getComputedStyle(e);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            
            // Check parent opacity/visibility (sometimes a wrapper hides the dropdown)
            let parent = e.parentElement;
            let hidden = false;
            while(parent && parent.tagName !== 'HTML') {
                const pStyle = window.getComputedStyle(parent);
                if (pStyle.display === 'none' || pStyle.visibility === 'hidden' || pStyle.opacity === '0') {
                    hidden = true;
                    break;
                }
                parent = parent.parentElement;
            }
            if (hidden) return false;

            const text = (e.innerText !== undefined ? e.innerText : e.textContent || '').trim().toLowerCase();
            return text === valStr || text.startsWith(valStr) || text.includes(valStr);
        });
    }

    let clickable = findVisibleOption();

    if (!clickable) {
        window.__CV_APP.UI.log(`Options not found in active dropdown. Retrying...`, "info");
        el.click();
        el.focus();
        dispatchKey(el, 'keydown', 'ArrowDown', 'ArrowDown', 40);
        await new Promise(r => setTimeout(r, 800));
        clickable = findVisibleOption();
    }

    if (clickable && combobox) {
        // METHOD 2: Extract internal ID directly from Knockout JS context (Bypasses UI security)
        try {
            if (window.ko && window.ko.dataFor) {
                const koData = window.ko.dataFor(clickable);
                if (koData) {
                    // Oracle JET data providers usually store the ID in value, key, or nested data
                    let internalValue = koData.value !== undefined ? koData.value : (koData.key !== undefined ? koData.key : null);
                    if (internalValue === null && koData.data && koData.data.value !== undefined) {
                        internalValue = koData.data.value;
                    }
                    
                    if (internalValue !== null) {
                        window.__CV_APP.UI.log(`Programmatic Hook (Knockout): Set value to [${internalValue}]`, "success");
                        combobox.value = internalValue;
                        el.blur();
                        return; // Success!
                    }
                }
            }
        } catch (e) {
            window.__CV_APP.UI.log(`Knockout hook failed: ${e.message}`, "error");
        }

        // METHOD 3: Fallback to the strict visibility click if programmatic hooks missed
        window.__CV_APP.UI.log(`Programmatic hooks missed. Triggering physical fallback click...`, "warning");
        clickable.scrollIntoView({ block: 'nearest' });
        
        clickable.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 }));
        clickable.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 }));
        
        clickable.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 0 }));
        clickable.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 0 }));
        
        clickable.click();
    } else {
        window.__CV_APP.UI.log(`Could not find option ${valStr} anywhere!`, "error");
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
