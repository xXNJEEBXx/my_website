// ==============================================================
// CV AutoFill Agent — Chrome Extension Content Script
// Purpose: Exposes window.__CV_AGENT for browser agent to call
// Runs in MAIN world so it can interact with React/Vue state
// all_frames: true to penetrate iframes
// ==============================================================

(function () {
  'use strict';

  // Prevent double-init (important for iframes)
  if (window.__CV_AGENT) return;

  // ============================================================
  // CV DATA — All applicant information in one place
  // ============================================================
  const CV = {
    firstName: 'Najeeb',
    lastName: 'Almusawi',
    fullName: 'Najeeb Murtadha Abdulmohsen Almusawi',
    displayName: 'Najeeb Almusawi',
    email: 'najeebxalmusawi@gmail.com',
    phone: '+966568199827',
    phoneClean: '966568199827',
    phoneLocal: '0568199827',
    nationalId: '1112191778',

    // Date of Birth — multiple formats
    dob: '2001-01-02',
    dobSlash: '01/02/2001',
    dobDay: '02',
    dobMonth: '01',
    dobYear: '2001',

    // Location
    city: 'Al-Ahsa',
    cityAr: 'الأحساء',
    region: 'Eastern Province',
    regionAr: 'المنطقة الشرقية',
    country: 'Saudi Arabia',
    countryAr: 'السعودية',
    countryCode: 'SA',
    address: 'Building No. 3754, Street: Kharash Al Kalbi Alsaluli, District: Ar Rashidyah 1st, Postal Code: 36342',
    postalCode: '36342',
    shortAddress: 'FMAH3754',
    fullLocation: 'Al-Ahsa, Eastern Province, Saudi Arabia',

    // Education
    university: 'King Faisal University',
    universityAr: 'جامعة الملك فيصل',
    degree: 'Bachelor of Computer Information Systems',
    degreeAr: 'بكالوريوس نظم المعلومات الحاسوبية',
    gpa: '2.53',
    gpaScale: '4.0',
    graduationDate: '2026-12-07',
    graduationYear: '2026',

    // Links
    portfolio: 'https://xXNJEEBXx.github.io/my_website',
    linkedin: 'https://www.linkedin.com/in/najeeb-almusawi-16516417b',
    github: 'https://github.com/xXNJEEBXX',

    // Languages
    arabicLevel: 'Professional',
    englishLevel: 'Upper Intermediate',

    // Work
    noticePeriod: '2 weeks',
    trainingPeriod: '6 months starting June 7, 2026',
    desiredSalary: '4000',

    // Professional Summary
    summary: '5 years of freelance web development experience (HTML, CSS, JavaScript, PHP, MySQL), 3 years with React and Laravel, and 1 year at vibcoding. Highly adaptable and eager to learn. Actively seeking a 6-month hybrid Co-op placement starting from the upcoming summer.',

    // Skills
    mainSkills: 'HTML5, CSS, JavaScript, PHP, React.js, Laravel, MySQL, RESTful APIs, Full-Stack, GitHub & Git',
    otherSkills: 'Microsoft Office, VibeCoding, Agile, Docker, Node.js, AWS, Automation, Next.js, TypeScript, Express.js',

    // Nationality
    nationality: 'Saudi',
    nationalityAr: 'سعودي',
    gender: 'Male',
    genderAr: 'ذكر',
  };

  // ============================================================
  // PLATFORM DETECTION
  // ============================================================
  function detectPlatform() {
    const url = window.location.href.toLowerCase();
    const checks = [
      [/greenhouse\.io/, 'greenhouse'],
      [/smartrecruiters\.com/, 'smartrecruiters'],
      [/zenats\.com/, 'zenats'],
      [/oraclecloud\.com\/hcmui|fa\.ocs\.oraclecloud/, 'oracle_hcm'],
      [/lever\.co/, 'lever'],
      [/myworkdayjobs\.com|wd\d+\.myworkday/, 'workday'],
      [/successfactors\.com|sap\.com\/career/, 'successfactors'],
      [/docs\.google\.com\/forms/, 'google_forms'],
      [/icims\.com/, 'icims'],
      [/taleo\.net/, 'taleo'],
      [/bamboohr\.com/, 'bamboohr'],
    ];
    for (const [pattern, name] of checks) {
      if (pattern.test(url)) return name;
    }
    return 'unknown';
  }

  // ============================================================
  // PLATFORM-SPECIFIC SELECTOR MAPS
  // ============================================================
  const PLATFORM_SELECTORS = {
    greenhouse: {
      '#first_name': CV.firstName,
      '#last_name': CV.lastName,
      '#email': CV.email,
      '#phone': CV.phone,
      'input[name="job_application[location]"]': CV.fullLocation,
      '#job_application_location': CV.fullLocation,
      'input[autocomplete="url"]': CV.portfolio,
    },
    smartrecruiters: {
      'input[name="firstName"]': CV.firstName,
      'input[name="lastName"]': CV.lastName,
      'input[name="email"]': CV.email,
      'input[name="phoneNumber"]': CV.phone,
      'input[name="location"]': CV.fullLocation,
      'input[name="currentCompany"]': CV.university,
    },
    zenats: {
      'input[name*="first"]': CV.firstName,
      'input[name*="last"]': CV.lastName,
      'input[name*="email"]': CV.email,
      'input[name*="phone"]': CV.phone,
      'input[name*="city"]': CV.city,
      'input[name*="mobile"]': CV.phone,
    },
    oracle_hcm: {
      'input[id*="FirstName"]': CV.firstName,
      'input[id*="LastName"]': CV.lastName,
      'input[id*="Email"]': CV.email,
      'input[id*="Phone"]': CV.phone,
      'input[id*="City"]': CV.city,
      'input[id*="PostalCode"]': CV.postalCode,
    },
    lever: {
      'input[name="name"]': CV.displayName,
      'input[name="email"]': CV.email,
      'input[name="phone"]': CV.phone,
      'input[name="org"]': CV.university,
      'input[name="urls[LinkedIn]"]': CV.linkedin,
      'input[name="urls[GitHub]"]': CV.github,
      'input[name="urls[Portfolio]"]': CV.portfolio,
    },
    workday: {
      'input[data-automation-id="legalNameSection_firstName"]': CV.firstName,
      'input[data-automation-id="legalNameSection_lastName"]': CV.lastName,
      'input[data-automation-id="email"]': CV.email,
      'input[data-automation-id="phone-number"]': CV.phoneClean,
      'input[data-automation-id="addressSection_city"]': CV.city,
      'input[data-automation-id="addressSection_postalCode"]': CV.postalCode,
    },
  };

  // ============================================================
  // SMART FIELD MAPPER — For unknown platforms
  // ============================================================
  const FIELD_PATTERNS = [
    { pattern: /first.?name|fname|given.?name|الاسم.?الأول/i, value: CV.firstName },
    { pattern: /last.?name|lname|family.?name|surname|اسم.?العائلة/i, value: CV.lastName },
    { pattern: /full.?name|الاسم.?الكامل|your.?name/i, value: CV.displayName, exclude: /first|last|user|company|middle/ },
    { pattern: /middle.?name/i, value: 'Murtadha' },
    { pattern: /e.?mail|البريد/i, value: CV.email },
    { pattern: /phone|mobile|tel|هاتف|جوال/i, value: CV.phone },
    { pattern: /city|مدينة/i, value: CV.city, exclude: /country|state/ },
    { pattern: /country|بلد|دولة/i, value: CV.country },
    { pattern: /state|province|region|منطقة|ولاية/i, value: CV.region },
    { pattern: /postal|zip|الرمز.?البريدي/i, value: CV.postalCode },
    { pattern: /address|عنوان/i, value: CV.address, exclude: /email|e.?mail|ip/ },
    { pattern: /university|جامعة|school|institution|مؤسسة/i, value: CV.university },
    { pattern: /degree|الدرجة|qualification/i, value: CV.degree },
    { pattern: /gpa|المعدل|grade/i, value: CV.gpa },
    { pattern: /graduation|تخرج/i, value: CV.graduationYear },
    { pattern: /linkedin/i, value: CV.linkedin },
    { pattern: /github/i, value: CV.github },
    { pattern: /portfolio|website|موقع/i, value: CV.portfolio, exclude: /company/ },
    { pattern: /summary|about|نبذة|ملخص|cover.?letter/i, value: CV.summary },
    { pattern: /national.?id|هوية|رقم.?الهوية|id.?number/i, value: CV.nationalId },
    { pattern: /nationality|جنسية/i, value: CV.nationality },
    { pattern: /salary|راتب|مكافأة/i, value: CV.desiredSalary },
    { pattern: /notice.?period/i, value: CV.noticePeriod },
    { pattern: /experience|خبرة/i, value: '5' },
    { pattern: /skill|مهار/i, value: CV.mainSkills },
    { pattern: /date.?of.?birth|birth.?date|تاريخ.?الميلاد|dob/i, value: CV.dob },
  ];

  function getFieldHints(el) {
    const parts = [
      el.name || '',
      el.id || '',
      el.placeholder || '',
      el.getAttribute('aria-label') || '',
      el.getAttribute('autocomplete') || '',
      el.getAttribute('data-automation-id') || '',
      el.getAttribute('data-qa') || '',
    ];

    // Try to find associated label
    const labelEl =
      el.labels?.[0] ||
      (el.id && document.querySelector(`label[for="${el.id}"]`)) ||
      el.closest('label') ||
      el.closest('.form-group, .field-wrapper, .form-field')?.querySelector('label');

    if (labelEl) parts.push(labelEl.textContent.trim());

    return parts.filter(Boolean).join(' ');
  }

  function guessFieldValue(el) {
    const hints = getFieldHints(el);
    if (!hints) return null;

    for (const { pattern, value, exclude } of FIELD_PATTERNS) {
      if (pattern.test(hints)) {
        if (exclude && exclude.test(hints)) continue;
        return value;
      }
    }
    return null;
  }

  // ============================================================
  // CORE FILL ENGINE
  // ============================================================
  function setNativeValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;

    const nativeSet = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

    if (nativeSet) {
      nativeSet.call(el, value);
    } else {
      el.value = value;
    }

    el.dispatchEvent(new Event('focus', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));

    // React 16+ synthetic events
    const tracker = el._valueTracker;
    if (tracker) tracker.setValue('');
  }

  function fillBySelector(selector, value) {
    const el = document.querySelector(selector);
    if (!el) return { success: false, reason: 'not_found' };
    if (el.value && el.value.trim() !== '') return { success: true, reason: 'already_filled' };
    if (el.disabled || el.readOnly) return { success: false, reason: 'disabled' };

    setNativeValue(el, value);
    return { success: true, reason: 'filled' };
  }

  function fillByMap(selectorMap) {
    const report = { filled: [], skipped: [], failed: [] };

    for (const [selector, value] of Object.entries(selectorMap)) {
      const result = fillBySelector(selector, value);
      const entry = { selector, value: value.substring(0, 30), ...result };

      if (result.success && result.reason === 'filled') report.filled.push(entry);
      else if (result.success && result.reason === 'already_filled') report.skipped.push(entry);
      else report.failed.push(entry);
    }

    return report;
  }

  function smartScan() {
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea'
    );

    const report = { filled: [], skipped: [], failed: [], unmapped: [] };

    inputs.forEach((el) => {
      // Skip invisible elements
      if (el.offsetParent === null && !el.closest('[role="dialog"]')) return;
      // Skip already-filled
      if (el.value && el.value.trim() !== '') {
        report.skipped.push({ hints: getFieldHints(el).substring(0, 50), reason: 'already_filled' });
        return;
      }
      if (el.disabled || el.readOnly) return;

      const value = guessFieldValue(el);
      if (value) {
        setNativeValue(el, value);
        report.filled.push({ hints: getFieldHints(el).substring(0, 50), value: value.substring(0, 30) });
      } else {
        report.unmapped.push({ hints: getFieldHints(el).substring(0, 50), tag: el.tagName, type: el.type });
      }
    });

    return report;
  }

  // ============================================================
  // SELECT / DROPDOWN HELPERS
  // ============================================================
  function fillSelect(selector, valueOrText) {
    const sel = document.querySelector(selector);
    if (!sel) return { success: false, reason: 'not_found' };

    // Try by value first
    const optByVal = Array.from(sel.options).find(o =>
      o.value.toLowerCase() === valueOrText.toLowerCase()
    );
    // Then by text
    const optByText = Array.from(sel.options).find(o =>
      o.textContent.trim().toLowerCase().includes(valueOrText.toLowerCase())
    );

    const opt = optByVal || optByText;
    if (!opt) return { success: false, reason: 'option_not_found', available: Array.from(sel.options).map(o => o.textContent.trim()).slice(0, 10) };

    sel.value = opt.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return { success: true, selectedText: opt.textContent.trim() };
  }

  // ============================================================
  // VISUAL FEEDBACK
  // ============================================================
  function flashField(el, color) {
    const orig = el.style.outline;
    el.style.outline = `3px solid ${color}`;
    el.style.outlineOffset = '1px';
    setTimeout(() => {
      el.style.outline = orig;
      el.style.outlineOffset = '';
    }, 2000);
  }

  function highlightResults(report) {
    report.filled?.forEach((item) => {
      const el = item.selector ? document.querySelector(item.selector) : null;
      if (el) flashField(el, '#22c55e'); // green
    });
    report.failed?.forEach((item) => {
      const el = item.selector ? document.querySelector(item.selector) : null;
      if (el) flashField(el, '#ef4444'); // red
    });
  }

  // ============================================================
  // FILE UPLOAD SCANNER
  // ============================================================
  function scanFileInputs() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    return Array.from(fileInputs).map((el) => ({
      selector: el.id ? `#${el.id}` : (el.name ? `input[name="${el.name}"]` : null),
      label: getFieldHints(el).substring(0, 80),
      accept: el.accept || '*',
      required: el.required,
      hasFile: el.files?.length > 0,
    }));
  }

  // ============================================================
  // MAIN API — window.__CV_AGENT
  // ============================================================
  window.__CV_AGENT = {
    // Get CV data
    cv: CV,

    // Detect current platform
    detect: detectPlatform,

    /**
     * Main fill function — call this from the browser agent.
     *
     * Usage: window.__CV_AGENT.fill()
     *
     * Returns a detailed report object:
     * {
     *   platform: 'greenhouse',
     *   method: 'template' | 'smart_scan',
     *   filled: [...],
     *   skipped: [...],
     *   failed: [...],
     *   unmapped: [...],    // fields the mapper couldn't identify
     *   fileInputs: [...],  // file upload fields found
     *   timestamp: '...'
     * }
     */
    fill: function () {
      const platform = detectPlatform();
      let report;

      if (PLATFORM_SELECTORS[platform]) {
        // Known platform — use template
        report = fillByMap(PLATFORM_SELECTORS[platform]);
        report.method = 'template';

        // After template, also smart-scan for any fields the template missed
        const smartReport = smartScan();
        report.filled = report.filled.concat(smartReport.filled);
        report.unmapped = smartReport.unmapped;
      } else {
        // Unknown platform — smart scan all fields
        report = smartScan();
        report.method = 'smart_scan';
      }

      report.platform = platform;
      report.fileInputs = scanFileInputs();
      report.timestamp = new Date().toISOString();
      report.url = window.location.href;
      report.isIframe = window.self !== window.top;

      // Visual feedback
      if (report.method === 'template') highlightResults(report);

      console.log('%c[CV AutoFill Agent]', 'color: #22c55e; font-weight: bold', report);
      return report;
    },

    /**
     * Fill a specific field by selector.
     * Usage: window.__CV_AGENT.set('input#email', 'najeebxalmusawi@gmail.com')
     */
    set: function (selector, value) {
      return fillBySelector(selector, value);
    },

    /**
     * Fill multiple fields by selector map.
     * Usage: window.__CV_AGENT.bulk({ '#name': 'Najeeb', '#email': '...' })
     */
    bulk: function (map) {
      return fillByMap(map);
    },

    /**
     * Fill a <select> dropdown.
     * Usage: window.__CV_AGENT.select('select#country', 'Saudi Arabia')
     */
    select: fillSelect,

    /**
     * Smart scan only — detect and fill all unmapped fields.
     * Usage: window.__CV_AGENT.scan()
     */
    scan: smartScan,

    /**
     * Get info about file upload fields on the page.
     * Usage: window.__CV_AGENT.files()
     */
    files: scanFileInputs,

    /**
     * Get all field hints for debugging — shows what the mapper sees.
     * Usage: window.__CV_AGENT.debug()
     */
    debug: function () {
      const inputs = document.querySelectorAll(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'
      );
      return Array.from(inputs).map((el) => ({
        tag: el.tagName,
        type: el.type,
        hints: getFieldHints(el),
        value: el.value?.substring(0, 30) || '',
        guessedValue: guessFieldValue(el)?.substring(0, 30) || null,
        visible: el.offsetParent !== null,
      }));
    },

    // Version info
    version: '1.0.0',
  };

  // Log ready state
  console.log(
    '%c[CV AutoFill Agent] ✅ Ready — call window.__CV_AGENT.fill() to autofill',
    'color: #22c55e; font-weight: bold; font-size: 14px'
  );
  console.log(
    `%c  Platform detected: ${detectPlatform()} | iframe: ${window.self !== window.top}`,
    'color: #94a3b8'
  );
})();
