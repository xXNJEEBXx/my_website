(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  const required = ['firstName', 'lastName', 'email', 'phone', 'country', 'dob'];
  const missing = required.filter(key => !APP.CV?.[key]);
  if (missing.length) throw new Error('PROFILE_SCHEMA_INVALID: ' + missing.join(', '));
  const arabic = hints => /(?:name_ar|\barabic\b|بالعربي)/i.test(hints) || (!/(?:name_en|\benglish\b|بالإنجليزي|بالانجليزي)/i.test(hints) && /[\u0600-\u06ff]/.test(hints));
  function value(fieldKey, el, hints = APP.DOM.hints(el), overrideKey) {
    const cv = APP.CV;
    const localeKey = arabic(hints) && cv[fieldKey + 'Ar'] ? fieldKey + 'Ar' : fieldKey;
    let resolved = cv[overrideKey || localeKey];
    if (fieldKey === 'countryCode' || fieldKey === 'phoneCountryCode') resolved = fieldKey === 'phoneCountryCode' || /dial|phone|هاتف/i.test(hints) ? '+' + cv.phoneClean.slice(0, -cv.phoneWithoutZero.length) : cv.countryCode;
    if (fieldKey === 'phone' && !overrideKey) {
      const separateCode = APP.DOM.scope(el).querySelector('input[name*="countryCode" i], select[name*="dial" i], select[name*="phoneCountry" i], [class*="country-code"], [class*="flag-dropdown"], .iti__selected-flag');
      resolved = separateCode || el.maxLength === 9 ? cv.phoneWithoutZero : /local|محلي/i.test(hints) ? cv.phoneLocal : cv.phone;
    }
    if (fieldKey === 'experienceYears') resolved = cv.summary.match(/^(\d+) years?\b/)?.[1];
    if (['availability', 'mandatoryTraining', 'coopLetter', 'coopEligible'].includes(fieldKey)) {
      if (/\b(?:not|unable|unavailable|ineligible)\b|غير|عدم/i.test(hints)) return { status: 'blocked', code: 'QUESTION_POLARITY_NEEDS_REVIEW', fieldKey };
      resolved = arabic(hints) ? 'نعم' : 'Yes';
    }
    if (fieldKey === 'dob' && !overrideKey && /year|سنة/i.test(hints) && el.type !== 'date') resolved = cv.dobYear;
    if (fieldKey === 'dob' && !overrideKey && el.type !== 'date' && !/year|سنة/i.test(hints)) resolved = cv.dob;
    if (el.type === 'date' && resolved) {
      const slash = String(resolved).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (slash) resolved = `${slash[3]}-${slash[1]}-${slash[2]}`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(resolved)) return { status: 'blocked', code: 'DATE_FORMAT_UNKNOWN', fieldKey };
    }
    if (el.type === 'month' && resolved) resolved = String(resolved).slice(0, 7);
    if (fieldKey === 'trainingStartDate' && resolved < new Date().toISOString().slice(0, 10)) return { status: 'blocked', code: 'PROFILE_DATE_NEEDS_REVIEW', fieldKey };
    return resolved === undefined || resolved === '' ? { status: 'blocked', code: 'PROFILE_VALUE_MISSING', fieldKey } : { status: 'resolved', fieldKey, value: String(resolved), source: 'profile', confidence: 1 };
  }
  function infer(el, { group = false } = {}) {
    const hints = APP.DOM.hints(el, { group });
    if (/emergency|referee|supervisor|reference.?contact|الطوارئ|مشرف|المعرّف/i.test(hints)) return { status: 'blocked', code: 'OTHER_PERSON_CONTEXT', hints };
    const standard = { name: 'fullName', 'given-name': 'firstName', 'additional-name': 'middleName', 'family-name': 'lastName', email: 'email',
      tel: 'phone', 'tel-national': ['phone', 'phoneLocal'], 'tel-country-code': 'phoneCountryCode', 'street-address': 'address',
      'postal-code': 'postalCode', 'address-level1': 'region', 'address-level2': 'city', country: 'countryCode', 'country-name': 'country',
      bday: 'dob', 'bday-day': ['dob', 'dobDay'], 'bday-month': ['dob', 'dobMonth'], 'bday-year': ['dob', 'dobYear'], organization: 'companyName', 'organization-title': 'jobTitle', url: 'portfolio', sex: 'gender' };
    const metadata = standard[String(el.autocomplete || '').trim().split(/\s+/).pop()];
    if (metadata) { const [key, override] = Array.isArray(metadata) ? metadata : [metadata]; return { ...value(key, el, hints, override), source: 'autocomplete', hints }; }
    for (const rule of APP.FIELD_CATALOG) {
      if (rule.pattern.test(hints) && !rule.exclude?.test(hints)) return { ...value(rule.fieldKey, el, hints), hints };
    }
    return null;
  }
  // Aliases refer to semantic groups, with exact keys and no broad substring lookup.
  function setAliases() { APP.SELECT_SYNONYMS = {
    [APP.CV.country]: ['Saudi', 'SA', 'KSA', APP.CV.countryAr, APP.CV.nationalityAr, APP.CV.nationality],
    [APP.CV.gender]: ['M', APP.CV.genderAr],
    [APP.CV.university]: ['KFU', APP.CV.universityAr, 'King Faisal'],
    [APP.CV.degree]: [APP.CV.degreeAr, "Bachelor's Degree", 'Bachelor', 'BSc', 'BS', 'بكالوريوس'],
    [APP.CV.major]: [APP.CV.majorAr, 'CIS', 'نظم معلومات'],
    [APP.CV.city]: [APP.CV.cityAr, 'Al Ahsa', 'Ahsa', 'Hofuf', 'الهفوف', 'الاحساء'],
    Yes: ['نعم', 'true', '1'], No: ['لا', 'false', '0'],
    Arabic: ['العربية', 'عربي'], English: ['الإنجليزية', 'انجليزي']
  }; }
  setAliases();
  const storage = globalThis.chrome?.storage?.local;
  const ready = storage ? storage.get('profileOverrides').then(data => {
    for (const [key, candidate] of Object.entries(data.profileOverrides || {})) {
      if (!Object.hasOwn(APP.CV, key)) continue;
      if (typeof APP.CV[key] === 'string' && typeof candidate === 'string') APP.CV[key] = candidate;
      if (key === 'links' && Array.isArray(candidate) && candidate.every(link => typeof link === 'string' && /^https?:\/\//.test(link))) APP.CV.links = candidate;
    }
    setAliases();
  }) : Promise.resolve();
  APP.Profile = Object.freeze({ value, infer, schemaVersion: 1, ready });
  // Kept for read-only integrations; all planning uses FIELD_CATALOG + Profile.
  APP.FIELD_PATTERNS = APP.FIELD_CATALOG.map(rule => ({ ...rule, get value() { return APP.CV[rule.fieldKey]; } }));
})();
