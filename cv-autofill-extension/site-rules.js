// =============================================================================
// SITE-SPECIFIC RULES — Platform Selectors & Custom Overrides
// =============================================================================
// ✅ THIS FILE IS SAFE TO MODIFY. Agents and scripts can freely add, update,
//    or remove entries here without user permission.
//
// PURPOSE:
// - CSS selector maps for known job application platforms
// - Oracle HCM specific combobox mappings
// - Any site-specific workarounds or overrides
//
// HOW TO ADD A NEW PLATFORM:
// 1. Add a detection regex in content.js → detectPlatform()
// 2. Add a selector map below in PLATFORM_SELECTORS
// 3. Test and verify
//
// HOW TO FIX A BROKEN SELECTOR:
// Just update the selector string here. No need to touch data.js.
// =============================================================================

const CV = window.__CV_APP.CV;

// =============================================================================
// PLATFORM SELECTORS — CSS selectors mapped to CV field values
// =============================================================================
// Each platform entry maps CSS selectors to the CV data that should fill them.
// The engine tries these FIRST (before smart scan) for known platforms.
// =============================================================================

window.__CV_APP.PLATFORM_SELECTORS = {

  // ───────────────────────────────────────
  // Greenhouse (boards.greenhouse.io)
  // ───────────────────────────────────────
  greenhouse: {
    '#first_name': CV.firstName,
    '#last_name': CV.lastName,
    '#email': CV.email,
    '#phone': CV.phone,
    'input[name="job_application[location]"]': CV.fullLocation,
    '#job_application_location': CV.fullLocation,
    'input[autocomplete="url"]': CV.portfolio,
  },

  // ───────────────────────────────────────
  // SmartRecruiters (jobs.smartrecruiters.com)
  // ───────────────────────────────────────
  smartrecruiters: {
    'input[name="firstName"]': CV.firstName,
    'input[name="lastName"]': CV.lastName,
    'input[name="email"]': CV.email,
    'input[name="phoneNumber"]': CV.phone,
    'input[name="location"]': CV.fullLocation,
    'input[name="currentCompany"]': CV.university,
  },

  // ───────────────────────────────────────
  // ZenATS (zenats.com)
  // ───────────────────────────────────────
  zenats: {
    'input[name*="first"]': CV.firstName,
    'input[name*="last"]': CV.lastName,
    'input[name*="email"]': CV.email,
    'input[name*="phone"]': CV.phone,
    'input[name*="city"]': CV.city,
    'input[name*="mobile"]': CV.phone,
  },

  // ───────────────────────────────────────
  // Oracle HCM (oraclecloud.com)
  // cx-select custom elements. See engine.js knowledge base for details.
  // ───────────────────────────────────────
  oracle_hcm: {
    'input[id*="FirstName"]': CV.firstName,
    'input[id*="LastName"]': CV.lastName,
    'input[id*="Email"]': CV.email,
    'input[id*="Phone"]': CV.phone,
    'input[id*="City"]': CV.city,
    'input[id*="PostalCode"]': CV.postalCode,
  },

  // ───────────────────────────────────────
  // Lever (jobs.lever.co)
  // ───────────────────────────────────────
  lever: {
    'input[name="name"]': CV.displayName,
    'input[name="email"]': CV.email,
    'input[name="phone"]': CV.phone,
    'input[name="org"]': CV.university,
    'input[name="urls[LinkedIn]"]': CV.linkedin,
    'input[name="urls[GitHub]"]': CV.github,
    'input[name="urls[Portfolio]"]': CV.portfolio,
  },

  // ───────────────────────────────────────
  // Workday (myworkdayjobs.com)
  // ───────────────────────────────────────
  workday: {
    'input[data-automation-id="legalNameSection_firstName"]': CV.firstName,
    'input[data-automation-id="legalNameSection_lastName"]': CV.lastName,
    'input[data-automation-id="email"]': CV.email,
    'input[data-automation-id="phone-number"]': CV.phoneClean,
    'input[data-automation-id="addressSection_city"]': CV.city,
    'input[data-automation-id="addressSection_postalCode"]': CV.postalCode,
  },

  // ───────────────────────────────────────
  // Jarir (jobapp.jarir.com)
  // ───────────────────────────────────────
  jarir: {
    'input[name="fn"]': CV.firstName,
    'input[name="mn"]': CV.middleName,
    'input[name="ln"]': CV.lastName,
    'input[name="em"]': CV.email,
    'input[name="mno"]': CV.phoneClean,
    'input[name="hcno"]': CV.nationalId,
    'input[name="zcode"]': CV.postalCode,
    'input[name="edu_institute_en_1"]': CV.university,
    'input[name="edu_major_en_1"]': CV.degree,
  },

  // ───────────────────────────────────────
  // Workable (apply.workable.com)
  // ───────────────────────────────────────
  workable: {
    'input[name="firstname"]': CV.firstName,
    'input[name="lastname"]': CV.lastName,
    'input[name="email"]': CV.email,
    'input[name="phone"]': CV.phone,
    'input[name="address"]': CV.city,
  },
};

// =============================================================================
// ORACLE HCM SPECIFIC — Combobox Mappings
// =============================================================================
// Oracle HCM uses cx-select custom elements for dropdowns.
// These mappings tell the engine what value to type into each combobox
// before triggering the option selection.
// See engine.js KNOWLEDGE BASE for the full technical details.
// =============================================================================

window.__CV_APP.ORACLE_COMBOBOX_MAP = {
  'input[name="startDate"][id^="month-"]': 'January',
  'input[name="startDate"][id^="year-"]': '2020',
  'input[name="contentItemId"]': 'Arabic',
};
