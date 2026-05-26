// ==============================================================
// CV AutoFill Agent — Chrome Extension Content Script (Modularized)
// ==============================================================

(function () {
  'use strict';
  if (window.__CV_AGENT_INITIALIZED) return;
  window.__CV_AGENT_INITIALIZED = true;

  const APP = window.__CV_APP;
  const Engine = APP.Engine;
  
  // Initialize UI
  APP.UI.init();

  function detectPlatform() {
    const url = window.location.href.toLowerCase();
    if (/greenhouse\.io/.test(url)) return 'greenhouse';
    if (/smartrecruiters\.com/.test(url)) return 'smartrecruiters';
    if (/zenats\.com/.test(url)) return 'zenats';
    if (/oraclecloud\.com\/hcmui|fa\.ocs\.oraclecloud/.test(url)) return 'oracle_hcm';
    if (/lever\.co/.test(url)) return 'lever';
    if (/myworkdayjobs\.com|wd\d+\.myworkday/.test(url)) return 'workday';
    if (/successfactors\.com|sap\.com\/career/.test(url)) return 'successfactors';
    if (/jobapp\.jarir\.com/.test(url)) return 'jarir';
    if (/apply\.workable\.com/.test(url)) return 'workable';
    return 'unknown';
  }

  function getFieldHints(el) {
    const parts = [
      el.name || '', el.id || '', el.placeholder || '', el.getAttribute('aria-label') || '',
      el.getAttribute('data-automation-id') || ''
    ];
    const labelEl = el.labels?.[0] || el.closest('label') || el.closest('.form-group')?.querySelector('label');
    if (labelEl) parts.push(labelEl.textContent.trim());
    return parts.filter(Boolean).join(' ');
  }

  function guessFieldValue(el) {
    const hints = getFieldHints(el);
    if (!hints) return null;
    for (const { pattern, value, exclude } of APP.FIELD_PATTERNS) {
      if (pattern.test(hints)) {
        if (exclude && exclude.test(hints)) continue;
        return value;
      }
    }
    return null;
  }

  function planTemplate(platform) {
    const map = APP.PLATFORM_SELECTORS[platform];
    if (!map) return;
    for (const [selector, value] of Object.entries(map)) {
      const el = document.querySelector(selector);
      if (el && (!el.value || el.value.trim() === '') && !Engine.isProcessed(el)) {
        if (el.matches('.oj-combobox-input, [role="combobox"]')) {
          Engine.enqueue({
            el, value, label: `Type: ${selector}`,
            execute: async () => Engine.executeOracleTextInput(el, value)
          });
          Engine.enqueue({
            el, value: 'Clicked Option', label: `Confirm: ${value}`,
            execute: async () => Engine.executeOracleOptionClick(el, value)
          });
        } else {
          Engine.enqueue({
            el, value, label: selector,
            execute: async () => Engine.executeNativeSet(el, value)
          });
        }
      }
    }
  }

  function planSmartScan() {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea');
    inputs.forEach(el => {
      if (el.offsetParent === null) return;
      if (el.value && el.value.trim() !== '') return;
      if (Engine.isProcessed(el)) return;
      
      const value = guessFieldValue(el);
      if (value) {
        if (el.matches('.oj-combobox-input, [role="combobox"]')) {
          const hint = getFieldHints(el).substring(0, 20);
          Engine.enqueue({
            el, value, label: `Type: ${hint}`,
            execute: async () => Engine.executeOracleTextInput(el, value)
          });
          Engine.enqueue({
            el, value: 'Clicked Option', label: `Confirm: ${value}`,
            execute: async () => Engine.executeOracleOptionClick(el, value)
          });
        } else {
          Engine.enqueue({
            el, value, label: getFieldHints(el).substring(0, 30),
            execute: async () => Engine.executeNativeSet(el, value)
          });
        }
      } else {
        // Track unmapped fields for future reference
        const hints = getFieldHints(el);
        if (hints && hints.trim()) {
          window.__CV_APP.unmappedFields = window.__CV_APP.unmappedFields || [];
          window.__CV_APP.unmappedFields.push({
            tag: el.tagName,
            type: el.type || '',
            hints: hints.substring(0, 80),
            id: el.id || '',
            name: el.name || ''
          });
        }
      }
    });
  }

  function planOracleSpecifics() {
    // Current Job Checkbox
    const currentJobCb = document.querySelector('input[type="checkbox"][id*="currentJobFlag"]');
    if (currentJobCb && !currentJobCb.checked) {
      Engine.enqueue({
        el: currentJobCb, value: 'checked', label: 'Current Job Checkbox',
        execute: async () => currentJobCb.click()
      });
    }

    // Language Pill
    const languageSpans = document.querySelectorAll('button span.cx-select-pill-name');
    for (const span of languageSpans) {
      if (/native|fluent|عالي|أصلي/i.test((span.innerText || span.textContent).trim())) {
        Engine.enqueue({
          el: span.parentElement, value: 'Native', label: 'Language Level Button',
          execute: async () => span.parentElement.click()
        });
        break;
      }
    }

    // Knockout Comboboxes (Month, Year, Language Dropdown)
    // Mappings defined in site-rules.js → ORACLE_COMBOBOX_MAP
    const oracleComboboxSelectors = window.__CV_APP.ORACLE_COMBOBOX_MAP || {};
    
    const comboboxes = Array.from(document.querySelectorAll('.oj-combobox-input, input[role="combobox"]'));
    for (const box of comboboxes) {
      let targetValue = null;
      for (const [selector, value] of Object.entries(oracleComboboxSelectors)) {
        if (box.matches(selector)) {
          targetValue = value;
          break;
        }
      }
      if (targetValue && (!box.value || box.value.trim() === '') && !Engine.isProcessed(box)) {
        Engine.enqueue({
          el: box, value: targetValue, label: `Type Oracle Combobox (${targetValue})`,
          execute: async () => Engine.executeOracleTextInput(box, targetValue)
        });
        Engine.enqueue({
          el: box, value: 'Clicked Option', label: `Confirm Oracle Combobox (${targetValue})`,
          execute: async () => Engine.executeOracleOptionClick(box, targetValue)
        });
      }
    }
  }

  window.__CV_APP.linksAdded = window.__CV_APP.linksAdded || 0;

  function planLinks() {
    const CV = APP.CV;
    if (!CV.links || CV.links.length === 0) return;

    // Find all currently visible link input fields
    const linkInputs = Array.from(document.querySelectorAll('input')).filter(el => {
      if (el.offsetParent === null) return false;
      if (Engine.isProcessed(el)) return false;
      const hints = getFieldHints(el).toLowerCase();
      return /link|url|رابط/.test(hints);
    });

    // Fill each empty link input
    for (const input of linkInputs) {
      if (input.value && input.value.trim() !== '') continue;
      if (window.__CV_APP.linksAdded >= CV.links.length) break;

      const linkValue = CV.links[window.__CV_APP.linksAdded];
      Engine.enqueue({
        el: input, value: linkValue, label: `Link ${window.__CV_APP.linksAdded + 1}`,
        execute: async () => Engine.executeNativeSet(input, linkValue)
      });
      window.__CV_APP.linksAdded++;
    }

    // If we have more links to add, click "+ Add Another Link" button
    if (window.__CV_APP.linksAdded < CV.links.length) {
      const addLinkBtn = Array.from(document.querySelectorAll('button, a, div[role="button"]'))
        .find(b => /\+ add another link|add link|إضافة رابط/i.test(b.innerText || b.textContent) && b.offsetParent !== null);
      
      if (addLinkBtn) {
        Engine.enqueue({
          el: addLinkBtn, value: 'Add Link', label: `Add Link ${window.__CV_APP.linksAdded + 1}`,
          execute: async () => {
            addLinkBtn.click();
            await new Promise(r => setTimeout(r, 800));
            planLinks(); // Recursively fill the new link field
          }
        });
      }
    }
  }

  window.__CV_APP.expandedPatterns = window.__CV_APP.expandedPatterns || new Set();

  function planExpansions() {
    const clickPatterns = [
      /edit personal information/i,
      /add experience/i,
      /add education/i,
      /add language/i,
    ];

    const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));

    for (const regex of clickPatterns) {
      if (window.__CV_APP.expandedPatterns.has(regex.toString())) continue;

      const btn = buttons.find(b => regex.test(b.innerText || b.textContent) && b.offsetParent !== null);
      if (btn) {
        window.__CV_APP.expandedPatterns.add(regex.toString());
        Engine.enqueue({
          el: btn, 
          value: 'Clicked', 
          label: `Expand Form: ${btn.innerText.trim()}`,
          execute: async () => {
            btn.click();
            APP.UI.log(`Waiting for form to expand...`, "info");
            await new Promise(r => setTimeout(r, 1500)); // Wait for Knockout/React to render the new fields
            APP.UI.log(`Rescanning page for new fields...`, "info");
            window.__CV_AGENT.plan(true); // True means append new empty fields to current queue!
          }
        });
      }
    }
  }

  window.__CV_AGENT = {
    plan: function(append = false) {
      if (!append) {
        Engine.clear();
        window.__CV_APP.expandedPatterns.clear();
        APP.UI.log("Scanning page to generate plan...", "info");
      }
      
      const platform = detectPlatform();
      if (!append) APP.UI.log(`Platform detected: ${platform}`, "info");

      if (platform === 'oracle_hcm') {
        planOracleSpecifics();
      }

      planTemplate(platform);
      planSmartScan();
      planLinks();
      planExpansions();

      const count = Engine.getQueue().length;
      APP.UI.updateProgress(Engine.getCurrentIndex(), count);
      
      if (count > Engine.getCurrentIndex()) {
        APP.UI.log(`Generated ${count - Engine.getCurrentIndex()} new actions.`, "success");
      } else if (!append) {
        APP.UI.log("No actions needed. All fields filled.", "info");
      }

      // Report unmapped fields & attach learning watchers
      if (window.__CV_APP.unmappedFields && window.__CV_APP.unmappedFields.length > 0) {
        APP.UI.log(`⚠ ${window.__CV_APP.unmappedFields.length} unmapped fields found. Watching for user input...`, "warning");
        fetch('http://localhost:3456/log', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: '=== UNMAPPED FIELDS ===\n' + window.__CV_APP.unmappedFields.map(f => 
            `[${f.tag}] type=${f.type} id="${f.id}" name="${f.name}" hints="${f.hints}"`
          ).join('\n')
        }).catch(() => {});

        // Attach blur watchers to learn from user input
        watchUnmappedFields();
      }
    }
  };

  // =============================================================================
  // SELF-LEARNING SYSTEM
  // =============================================================================
  // When the extension encounters a field it can't fill (unmapped), it attaches
  // a "blur" listener. When the user manually fills that field and moves away,
  // the extension captures the field's hints + the user's value and saves it
  // to localStorage. Next time the extension sees a field with similar hints,
  // it will auto-fill it with the learned value.
  //
  // Storage key: '__cv_learned_fields'
  // Format: Array of { hints: string, value: string, learnedAt: ISO date }
  // =============================================================================

  const LEARNED_STORAGE_KEY = '__cv_learned_fields';

  function getLearnedPatterns() {
    try {
      return JSON.parse(localStorage.getItem(LEARNED_STORAGE_KEY) || '[]');
    } catch { return []; }
  }

  function saveLearnedPattern(hints, value) {
    const patterns = getLearnedPatterns();
    
    // Don't save duplicates — update existing if same hints
    const existing = patterns.find(p => p.hints === hints);
    if (existing) {
      existing.value = value;
      existing.learnedAt = new Date().toISOString();
    } else {
      patterns.push({ hints, value, learnedAt: new Date().toISOString() });
    }
    
    localStorage.setItem(LEARNED_STORAGE_KEY, JSON.stringify(patterns));
    APP.UI.log(`🧠 Learned: "${hints.substring(0, 30)}" → "${value.substring(0, 30)}"`, "success");

    // Also send to logger server for permanent record
    fetch('http://localhost:3456/log', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: `=== NEW LEARNED FIELD ===\nhints: ${hints}\nvalue: ${value}\nlearnedAt: ${new Date().toISOString()}`
    }).catch(() => {});
  }

  function matchLearnedValue(el) {
    const hints = getFieldHints(el).toLowerCase();
    if (!hints) return null;

    const patterns = getLearnedPatterns();
    for (const p of patterns) {
      // Match if the field hints contain the learned hints (or vice versa)
      const learnedHints = p.hints.toLowerCase();
      if (hints === learnedHints || hints.includes(learnedHints) || learnedHints.includes(hints)) {
        return p.value;
      }
    }
    return null;
  }

  // Attach blur watchers to unmapped fields
  const watchedElements = new WeakSet();

  function watchUnmappedFields() {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea');
    
    inputs.forEach(el => {
      if (watchedElements.has(el)) return; // Already watching
      if (el.offsetParent === null) return; // Hidden
      if (Engine.isProcessed(el)) return;   // Already handled by extension
      if (el.value && el.value.trim() !== '') return; // Already has a value

      // Only watch fields that the extension couldn't fill
      const value = guessFieldValue(el);
      const learnedValue = matchLearnedValue(el);
      if (value || learnedValue) return; // Extension knows this field

      watchedElements.add(el);

      el.addEventListener('blur', function onBlur() {
        const userValue = el.value?.trim();
        if (!userValue) return; // User didn't type anything

        const hints = getFieldHints(el);
        if (!hints) return;

        saveLearnedPattern(hints, userValue);
        el.removeEventListener('blur', onBlur); // Only learn once per field
      });
    });
  }

  // Apply learned patterns during smart scan (called inside planSmartScan)
  // This is integrated into planSmartScan's else branch — when guessFieldValue
  // returns null, we check learned patterns before marking as unmapped.

  // Override planSmartScan's unmapped tracking to check learned patterns first
  const _originalPlanSmartScan = planSmartScan;

  planSmartScan = function() {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea');
    inputs.forEach(el => {
      if (el.offsetParent === null) return;
      if (el.value && el.value.trim() !== '') return;
      if (Engine.isProcessed(el)) return;
      
      // Step 1: Try built-in patterns
      let value = guessFieldValue(el);
      
      // Step 2: Try learned patterns (from user's previous manual input)
      if (!value) {
        value = matchLearnedValue(el);
        if (value) {
          APP.UI.log(`🧠 Auto-filling from memory: "${getFieldHints(el).substring(0, 25)}"`, "success");
        }
      }

      if (value) {
        if (el.matches('.oj-combobox-input, [role="combobox"]')) {
          const hint = getFieldHints(el).substring(0, 20);
          Engine.enqueue({
            el, value, label: `Type: ${hint}`,
            execute: async () => Engine.executeOracleTextInput(el, value)
          });
          Engine.enqueue({
            el, value: 'Clicked Option', label: `Confirm: ${value}`,
            execute: async () => Engine.executeOracleOptionClick(el, value)
          });
        } else {
          Engine.enqueue({
            el, value, label: getFieldHints(el).substring(0, 30),
            execute: async () => Engine.executeNativeSet(el, value)
          });
        }
      } else {
        // Track unmapped fields for future reference
        const hints = getFieldHints(el);
        if (hints && hints.trim()) {
          window.__CV_APP.unmappedFields = window.__CV_APP.unmappedFields || [];
          window.__CV_APP.unmappedFields.push({
            tag: el.tagName,
            type: el.type || '',
            hints: hints.substring(0, 80),
            id: el.id || '',
            name: el.name || ''
          });
        }
      }
    });
  };

  // Alias fill to plan for backwards compatibility with popup.js
  window.__CV_AGENT.fill = () => window.__CV_AGENT.plan(false);
  window.__CV_AGENT.expandAndFill = window.__CV_AGENT.fill;

  // Expose learned patterns for debugging
  window.__CV_AGENT.learned = () => getLearnedPatterns();
  window.__CV_AGENT.clearLearned = () => { localStorage.removeItem(LEARNED_STORAGE_KEY); APP.UI.log("🧠 Learned patterns cleared.", "info"); };

  // Auto-plan on load
  setTimeout(() => window.__CV_AGENT.plan(false), 1000);

})();
