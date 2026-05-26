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
    let debugLogOutput = [];
    const addLog = (msg) => {
        debugLogOutput.push(msg);
        window.__CV_APP.UI.log(msg, "info");
    };

    addLog(`=== START ORACLE OPTION SELECTION FOR [${valStr}] ===`);
    
    // STEP 1: Wait for UI
    addLog(`[STEP 1] Waiting 400ms for dropdown animation...`);
    await new Promise(r => setTimeout(r, 400));
    
    // STEP 2: Find visible option - search for the actual list items inside dropdown popups
    addLog(`[STEP 2] Searching for dropdown list items matching '${valStr}'...`);
    
    function getVisibleOption() {
        // Strategy A: Search inside known dropdown containers first (cx-select, oj-listbox, etc.)
        const dropdownSelectors = [
            '.cx-select__options li',
            '.cx-select__options [role="gridcell"]',
            '.cx-select__options .cx-select__list-item',
            '.oj-listbox-drop li',
            '.oj-listbox-drop [role="option"]',
            '[role="listbox"] [role="option"]',
            '.oj-combobox-popup li'
        ];
        
        for (const selector of dropdownSelectors) {
            const items = Array.from(document.querySelectorAll(selector));
            for (const item of items) {
                // Skip items inside the extension UI
                if (item.closest && item.closest('#cv-agent-dashboard')) continue;
                
                const rect = item.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) continue;
                if (rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth || rect.top > window.innerHeight) continue;
                
                const style = window.getComputedStyle(item);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
                
                const text = (item.innerText || item.textContent || '').trim().toLowerCase();
                if (text === valStr || text.startsWith(valStr)) {
                    addLog(`[Strategy A] Found via selector '${selector}': "${text}"`);
                    addLog(`HTML: ${item.outerHTML.substring(0, 200)}`);
                    return item;
                }
            }
        }
        
        // Strategy B: Broad DOM search (fallback)
        addLog(`[Strategy A] No match. Falling back to Strategy B (broad DOM)...`);
        const elements = Array.from(document.querySelectorAll('*')).reverse();
        let matches = [];
        for (const e of elements) {
            if (e.closest && e.closest('#cv-agent-dashboard')) continue;
            if (['INPUT', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'HEAD'].includes(e.tagName)) continue;
            let text = (e.innerText !== undefined ? e.innerText : e.textContent || '').trim().toLowerCase();
            if (text === valStr) {
                matches.unshift(e);
            } else if (text.startsWith(valStr) || text.includes(valStr)) {
                matches.push(e);
            }
        }
        addLog(`[Strategy B] Found ${matches.length} elements (excluding extension UI).`);
        
        for (const e of matches) {
            const rect = e.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0 || rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth || rect.top > window.innerHeight) continue;
            const style = window.getComputedStyle(e);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
            
            let parent = e.parentElement, hidden = false;
            while(parent && parent.tagName !== 'HTML') {
                const pStyle = window.getComputedStyle(parent);
                if (pStyle.display === 'none' || pStyle.visibility === 'hidden' || pStyle.opacity === '0') { hidden = true; break; }
                parent = parent.parentElement;
            }
            if (hidden) continue;
            
            addLog(`[Strategy B] Accepted <${e.tagName} class="${e.className}">`);
            addLog(`HTML: ${e.outerHTML.substring(0, 200)}`);
            return e;
        }
        return null;
    }

    let target = getVisibleOption();

    // STEP 3: Fallback - force popup open
    if (!target) {
        addLog(`[STEP 3] Not found. Triggering ArrowDown to force popup...`);
        el.click(); el.focus();
        dispatchKey(el, 'keydown', 'ArrowDown', 'ArrowDown', 40);
        await new Promise(r => setTimeout(r, 800));
        target = getVisibleOption();
    }

    // STEP 4: Click the target
    if (target) {
        addLog(`[STEP 4] Target acquired. Attempting click...`);
        
        // Find the best clickable wrapper
        let clickTarget = target.closest('[role="gridcell"], [role="option"], li') || target;
        addLog(`Click target: <${clickTarget.tagName} id="${clickTarget.id}" class="${clickTarget.className}" role="${clickTarget.getAttribute('role')}">`);
        addLog(`Click target HTML: ${clickTarget.outerHTML.substring(0, 300)}`);
        
        clickTarget.scrollIntoView({ block: 'nearest' });
        
        // Dispatch a full event chain with composed:true (crucial for Shadow DOM / custom elements)
        const eventOpts = { bubbles: true, cancelable: true, composed: true, view: window, button: 0, buttons: 1 };
        const eventOptsUp = { bubbles: true, cancelable: true, composed: true, view: window, button: 0, buttons: 0 };
        
        clickTarget.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
        clickTarget.dispatchEvent(new MouseEvent('mousedown', eventOpts));
        await new Promise(r => setTimeout(r, 50));
        clickTarget.dispatchEvent(new PointerEvent('pointerup', eventOptsUp));
        clickTarget.dispatchEvent(new MouseEvent('mouseup', eventOptsUp));
        clickTarget.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, view: window }));
        addLog(`[DONE] Full event chain dispatched (with composed:true).`);
        
        // Also try Knockout programmatic hook as bonus
        const combobox = el.closest('oj-combobox-one, oj-combobox-many, oj-select-single, oj-select-many');
        if (combobox) {
            try {
                if (window.ko && window.ko.dataFor) {
                    const koData = window.ko.dataFor(clickTarget);
                    if (koData) {
                        let internalValue = koData.value !== undefined ? koData.value : (koData.key !== undefined ? koData.key : null);
                        if (internalValue === null && koData.data && koData.data.value !== undefined) internalValue = koData.data.value;
                        if (internalValue !== null) {
                            addLog(`[BONUS] Knockout hook: setting value to [${internalValue}]`);
                            combobox.value = internalValue;
                        }
                    }
                }
            } catch (e) { addLog(`[BONUS] Knockout hook error: ${e.message}`); }
        }
    } else {
        addLog(`[FAILED] Could not find any visible element for '${valStr}'!`);
    }
    
    // STEP 5: Always send logs
    addLog(`=== END ORACLE OPTION SELECTION ===`);
    fetch('http://localhost:3456/log', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: debugLogOutput.join('\n')
    }).catch(() => console.error("Logger server not running"));

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
