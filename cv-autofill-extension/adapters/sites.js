// Platform rules reference profile keys; values are resolved when a plan is created.
(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  const sites = [
    ['greenhouse', 'greenhouse.io', {
      '#first_name': 'firstName', '#last_name': 'lastName', '#email': 'email', '#phone': 'phone',
      'input[name="job_application[location]"]': 'fullLocation', '#job_application_location': 'fullLocation', 'input[autocomplete="url"]': 'portfolio'
    }],
    ['smartrecruiters', 'smartrecruiters.com', {
      'input[name="firstName"]': 'firstName', 'input[name="lastName"]': 'lastName', 'input[name="email"]': 'email',
      'input[name="phoneNumber"]': 'phone', 'input[name="location"]': 'fullLocation', 'input[name="currentCompany"]': 'companyName'
    }],
    ['zenats', 'zenats.com', {
      'input[name*="first"]': 'firstName', 'input[name*="last"]': 'lastName', 'input[name*="email"]': 'email',
      'input[name*="phone"]': 'phone', 'input[name*="mobile"]': 'phone', 'input[name*="city"]': 'city'
    }],
    ['lever', 'lever.co', {
      'input[name="name"]': 'fullName', 'input[name="email"]': 'email', 'input[name="phone"]': 'phone', 'input[name="org"]': 'companyName',
      'input[name="urls[LinkedIn]"]': 'linkedin', 'input[name="urls[GitHub]"]': 'github', 'input[name="urls[Portfolio]"]': 'portfolio'
    }],
    ['workday', 'myworkdayjobs.com', {
      'input[data-automation-id="legalNameSection_firstName"]': 'firstName', 'input[data-automation-id="legalNameSection_lastName"]': 'lastName',
      'input[data-automation-id="email"]': 'email', 'input[data-automation-id="phone-number"]': { fieldKey: 'phone', profileKey: 'phoneWithoutZero' },
      'input[data-automation-id="addressSection_city"]': 'city', 'input[data-automation-id="addressSection_postalCode"]': 'postalCode'
    }],
    ['jarir', 'jobapp.jarir.com', {
      'input[name="fn"]': 'firstName', 'input[name="mn"]': 'middleName', 'input[name="ln"]': 'lastName', 'input[name="em"]': 'email',
      'input[name="mno"]': { fieldKey: 'phone', profileKey: 'phoneWithoutZero' }, 'input[name="hcno"]': 'nationalId',
      'input[name="zcode"]': 'postalCode', 'input[name="edu_institute_en_1"]': 'university', 'input[name="edu_major_en_1"]': 'major'
    }],
    ['workable', 'workable.com', {
      'input[name="firstname"]': 'firstName', 'input[name="lastname"]': 'lastName', 'input[name="email"]': 'email', 'input[name="phone"]': 'phone', 'input[name="address"]': 'address'
    }]
  ];
  for (const [id, host, fields] of sites) APP.Adapters.register({
    id, fields: Object.fromEntries(Object.entries(fields).map(([selector, rule]) => [selector, typeof rule === 'string' ? { fieldKey: rule, profileKey: rule } : rule])),
    detect: url => APP.hostMatches(url, host) || (id === 'workday' && /\.myworkday\.com$/.test(url.hostname))
  });
  APP.Adapters.register({ id: 'google_forms', fields: {}, detect: url => APP.hostMatches(url, 'forms.gle') || (url.hostname === 'docs.google.com' && url.pathname.startsWith('/forms/')) });
  APP.Adapters.register({ id: 'successfactors', fields: {}, detect: url => APP.hostMatches(url, 'successfactors.com') || (APP.hostMatches(url, 'sap.com') && /career/i.test(url.pathname)) });
})();
