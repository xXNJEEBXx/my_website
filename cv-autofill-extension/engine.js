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
   ORACLE HCM / CX-SELECT DROPDOWN AUTOMATION — COMPLETE KNOWLEDGE BASE
   Last Updated: 2026-05-26
   =============================================================================

   PLATFORM DETAILS:
   - The Oracle HCM Talent Community pages use "cx-select" custom elements,
     NOT standard Oracle JET (oj-combobox-one). This is a critical distinction.
   - cx-select renders dropdowns as:
       <div class="cx-select__options position-bottom">
         <div class="cx-select-container cx-select-dropdown--open">
           <div role="row">
             <div role="gridcell" class="cx-select__list-item">Option Text</div>
           </div>
         </div>
       </div>
   - The dropdown popup is appended to <body>, NOT inside the input's parent.
   - The input field itself is a plain <input> inside a cx-select wrapper,
     not an oj-combobox-one Web Component.

   =============================================================================
   FAILED ATTEMPTS (7 total) — DO NOT REPEAT
   =============================================================================

   1. Simple DOM Click (targetItem.click())
      WHY FAILED: Oracle appends multiple "ghost" copies of the dropdown to
      the DOM. Some are hidden off-screen (left: -9999px) or have zero
      dimensions. A naive querySelectorAll('li') picks up the wrong (ghost)
      element and clicks it — nothing happens.

   2. Keyboard Simulation (ArrowDown → Enter)
      WHY FAILED: Dispatching ArrowDown triggers Oracle's internal fetch()
      which RESETS the filtered option list. By the time Enter fires, the
      list has changed and the wrong item (or no item) gets selected.

   3. Direct Enter + keyCode Spoofing (Object.defineProperty)
      WHY FAILED: Oracle/cx-select checks event.isTrusted. All synthetic
      KeyboardEvents have isTrusted=false (browser security — JS cannot
      forge this). The framework silently ignores the event.

   4. Robust Pointer Click + Visibility Filter (getBoundingClientRect)
      WHY FAILED: Even with visibility filtering to find the correct <li>,
      the dispatched PointerEvent/MouseEvent also has isTrusted=false.
      cx-select's click handler checks this and discards the event.
      Additionally, .click() sometimes steals focus, causing the dropdown
      to close before processing.

   5. Programmatic Framework Hooking (combobox.value = X)
      WHY FAILED: This approach tried to find an oj-combobox-one parent
      Web Component via el.closest('oj-combobox-one'). But this site uses
      cx-select, not oj-combobox-one. The closest() call returned null,
      so the code fell into the "else" branch and gave up entirely —
      it never even attempted the physical click fallback.
      LESSON: Always separate the programmatic hook attempt from the
      physical click fallback. Never gate the fallback behind a condition
      that depends on the hook succeeding.

   6. Knockout.js Data Extraction (ko.dataFor)
      WHY FAILED: Same root cause as #5 — the combobox variable was null
      because closest('oj-combobox-one') returned null. The Knockout hook
      was never reached. Even if it had been reached, cx-select does not
      use Knockout.js — it's a standalone custom element framework.

   7. ★ CLICKING THE EXTENSION'S OWN UI ★ (Critical Bug!)
      WHY FAILED: The search function scanned ALL elements in the DOM
      including the extension's own log panel (#cv-agent-dashboard).
      When the extension logged "Searching for 'Saudi Arabia'...", the
      log message ITSELF contained the text "Saudi Arabia". The search
      found this log <div> first (because it was the most recently added
      DOM element) and clicked it instead of the actual dropdown option.
      The extension was literally clicking on itself in an infinite loop
      of futility.
      FIX: Added `if (e.closest('#cv-agent-dashboard')) continue;` to
      exclude the extension's own UI from all DOM searches.

   =============================================================================
   WORKING SOLUTION (Current Implementation)
   =============================================================================

   The solution uses a two-strategy search with composed event dispatch:

   STRATEGY A (Targeted Selector Search):
   - Search directly inside known dropdown containers using CSS selectors:
     '.cx-select__options li', '.cx-select__options [role="gridcell"]',
     '.oj-listbox-drop li', '[role="listbox"] [role="option"]', etc.
   - This finds the EXACT list item inside the REAL dropdown, avoiding
     ghost elements because ghost dropdowns have display:none or zero dims.
   - Match by exact text first, then startsWith, then includes.

   STRATEGY B (Broad DOM Fallback):
   - If Strategy A finds nothing, fall back to scanning ALL DOM elements
     in reverse order (deepest-first), excluding the extension's own UI.
   - Apply strict visibility checks: dimensions, viewport bounds, CSS
     display/visibility/opacity, and parent chain visibility.

   EVENT DISPATCH:
   - Use composed:true on ALL events (PointerEvent, MouseEvent, click).
     This is crucial for cx-select custom elements that may use Shadow DOM
     or event delegation across component boundaries.
   - Dispatch the full chain: pointerdown → mousedown → (50ms pause) →
     pointerup → mouseup → click.
   - The 50ms pause between down/up mimics real human timing.

   DEBUG LOGGING:
   - All attempts (success AND failure) send detailed logs to the local
     logger server at http://localhost:3456/log via POST request.
   - The logger server (logger.js) saves logs to debug_logs.txt in the
     extension's own directory for easy review.
   - Logs include: strategy used, number of matches found, HTML snippets
     of the clicked element, and the full event chain dispatched.
   - To start the logger: `node cv-autofill-extension/logger.js`

   =============================================================================
   KEY LESSONS FOR FUTURE DEVELOPMENT
   =============================================================================

   1. NEVER search the entire DOM without excluding #cv-agent-dashboard.
      The extension's own UI contains text from previous actions and will
      always match search terms, causing the extension to click itself.

   2. ALWAYS prefer targeted CSS selectors (Strategy A) over broad DOM
      scans. Broad scans are slow, error-prone, and pick up false matches.

   3. ALWAYS use composed:true in dispatched events. Without it, events
      don't cross Shadow DOM boundaries and custom elements ignore them.

   4. NEVER gate the physical click fallback behind a programmatic hook
      condition. The two should be independent — try the hook first, and
      if it fails or doesn't apply, ALWAYS attempt the physical click.

   5. ALWAYS log to the local server regardless of success/failure.
      Without logs on successful runs, you can't verify the solution
      is working for the RIGHT reasons (vs. coincidental success).

   6. Oracle HCM has MULTIPLE dropdown frameworks. Don't assume one
      approach works everywhere. Check the actual HTML structure:
      - cx-select (Talent Community pages)
      - oj-combobox-one (internal HCM apps)
      - Standard <select> (rare, but possible)

   7. Ghost elements are REAL. Oracle keeps old dropdown DOM in the page
      with display:none or position:absolute; left:-9999px. Always filter
      by getBoundingClientRect() AND getComputedStyle() AND parent chain.

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
