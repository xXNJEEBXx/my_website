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
    
    // STEP 2: Find Visible Option
    addLog(`[STEP 2] Searching DOM for visible text matching '${valStr}'...`);
    function getVisibleOption() {
        const elements = Array.from(document.querySelectorAll('*')).reverse();
        let matches = [];
        for (const e of elements) {
            // IGNORE THE EXTENSION'S OWN DASHBOARD UI! (To prevent clicking self-referential log messages)
            if (e.closest && e.closest('#cv-agent-dashboard')) continue;
            
            if (['INPUT', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'HEAD'].includes(e.tagName)) continue;
            let text = (e.innerText !== undefined ? e.innerText : e.textContent || '').trim().toLowerCase();
            
            // Prioritize exact matches over partial matches, but accept partials if they are the only ones
            if (text === valStr) {
                matches.unshift(e); // Put exact matches at the very front!
            } else if (text.startsWith(valStr) || text.includes(valStr)) {
                matches.push(e);
            }
        }
        addLog(`Found ${matches.length} elements containing text (excluding extension UI).`);
        
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
            
            return e;
        }
        return null;
    }

    let clickable = getVisibleOption();

    // STEP 3: Fallback ArrowDown if not found
    if (!clickable) {
        addLog(`[STEP 3] Not found. Triggering ArrowDown to force popup...`);
        el.click(); el.focus();
        dispatchKey(el, 'keydown', 'ArrowDown', 'ArrowDown', 40);
        await new Promise(r => setTimeout(r, 800));
        clickable = getVisibleOption();
    }

    // STEP 4: Execution
    if (clickable) {
        addLog(`[STEP 4] Target identified: <${clickable.tagName} class="${clickable.className}">`);
        // Log a truncated version of the HTML to see what we are dealing with
        const html = clickable.outerHTML;
        addLog(`HTML Snippet: ${html.substring(0, 150)}...`);

        const combobox = el.closest('oj-combobox-one, oj-combobox-many, oj-select-single, oj-select-many');
        let hookSuccess = false;

        if (combobox) {
            addLog(`Found parent Web Component: <${combobox.tagName}>`);
            try {
                if (window.ko && window.ko.dataFor) {
                    const koData = window.ko.dataFor(clickable);
                    if (koData) {
                        let internalValue = koData.value !== undefined ? koData.value : (koData.key !== undefined ? koData.key : null);
                        if (internalValue === null && koData.data && koData.data.value !== undefined) internalValue = koData.data.value;
                        
                        if (internalValue !== null) {
                            addLog(`[SUCCESS] Programmatic Hook (Knockout). Setting value to [${internalValue}]`);
                            combobox.value = internalValue;
                            hookSuccess = true;
                        } else {
                            addLog(`[WARN] Knockout data found, but no 'value' or 'key' property exists.`);
                        }
                    } else {
                        addLog(`[WARN] ko.dataFor returned null for this element.`);
                    }
                }
            } catch (e) { addLog(`[ERROR] Knockout hook threw: ${e.message}`); }
        } else {
            addLog(`[WARN] Parent Web Component not found. Skipping programmatic hook.`);
        }

        if (!hookSuccess) {
            addLog(`[STEP 5] Executing Physical Pointer/Mouse Click...`);
            // Ensure we click the semantic wrapper if we found a text span
            clickable = clickable.closest('li, tr, td, [role="option"]') || clickable;
            addLog(`Actually clicking on: <${clickable.tagName} class="${clickable.className}">`);
            
            clickable.scrollIntoView({ block: 'nearest' });
            clickable.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 }));
            clickable.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 1 }));
            clickable.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 0 }));
            clickable.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, button: 0, buttons: 0 }));
            clickable.click();
            addLog(`[SUCCESS] Physical click dispatched.`);
        }
    } else {
        addLog(`[FAILED] Could not find any visible element for '${valStr}'!`);
    }
    
    // STEP 6: Always upload logs to local server for debugging
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
