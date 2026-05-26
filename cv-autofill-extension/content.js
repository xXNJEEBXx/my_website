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
      if (el && (!el.value || el.value.trim() === '')) {
        Engine.enqueue({
          el, value, label: selector,
          execute: async () => {
            if (el.classList.contains('oj-combobox-input')) {
              await Engine.executeOracleUIEvent(el, value);
            } else {
              Engine.executeNativeSet(el, value);
            }
          }
        });
      }
    }
  }

  function planSmartScan() {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea');
    inputs.forEach(el => {
      if (el.offsetParent === null) return;
      if (el.value && el.value.trim() !== '') return;
      const value = guessFieldValue(el);
      if (value) {
        Engine.enqueue({
          el, value, label: getFieldHints(el).substring(0, 30),
          execute: async () => {
            if (el.classList.contains('oj-combobox-input')) {
              await Engine.executeOracleUIEvent(el, value);
            } else {
              Engine.executeNativeSet(el, value);
            }
          }
        });
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
  }

  window.__CV_APP.expandedPatterns = window.__CV_APP.expandedPatterns || new Set();

  function planExpansions() {
    const clickPatterns = [
      /edit personal information/i,
      /add experience/i,
      /add education/i,
      /add certificate/i,
      /add language/i,
      /\+ add another link/i,
      /add link/i
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

      planTemplate(platform);
      planSmartScan();

      if (platform === 'oracle_hcm') {
        planOracleSpecifics();
      }

      planExpansions();

      const count = Engine.getQueue().length;
      APP.UI.updateProgress(Engine.getCurrentIndex(), count);
      
      if (count > Engine.getCurrentIndex()) {
        APP.UI.log(`Generated ${count - Engine.getCurrentIndex()} new actions.`, "success");
      } else if (!append) {
        APP.UI.log("No actions needed. All fields filled.", "info");
      }
    }
  };

  // Alias fill to plan for backwards compatibility with popup.js
  window.__CV_AGENT.fill = () => window.__CV_AGENT.plan(false);
  window.__CV_AGENT.expandAndFill = window.__CV_AGENT.fill;

  // Auto-plan on load
  setTimeout(() => window.__CV_AGENT.plan(false), 1000);

})();
