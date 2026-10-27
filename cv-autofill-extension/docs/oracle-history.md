# Historical Oracle experiments

Preserved from the previous engine. These are historical observations, not guarantees about every Oracle deployment. Synthetic events remain untrusted even with composed:true. Current drivers verify the committed selection.

```text
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
```
