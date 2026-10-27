(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  APP.Adapters.register({
    id: 'oracle_hcm',
    fields: {
      'input[id*="FirstName"]': { fieldKey: 'firstName', profileKey: 'firstName' },
      'input[id*="LastName"]': { fieldKey: 'lastName', profileKey: 'lastName' },
      'input[id*="Email"]': { fieldKey: 'email' },
      'input[type="tel"], input[name="phoneNumber"]': { fieldKey: 'phone', profileKey: 'phoneWithoutZero' },
      'input[id*="City"]': { fieldKey: 'city' }, 'input[id*="PostalCode"]': { fieldKey: 'postalCode' }
    },
    detect: url => APP.hostMatches(url, 'oraclecloud.com') && /\/hcmui|\.fa\.ocs\./i.test(url.href),
    resolve(el) {
      if (el.matches('input[name="startDate"][id^="month-"]')) {
        const month = Number(APP.CV.startDate.split('/')[0]);
        return { fieldKey: 'startDate.month', value: new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, month - 1, 1))), source: 'adapter:oracle_hcm', status: 'resolved' };
      }
      if (el.matches('input[name="startDate"][id^="year-"]')) return { fieldKey: 'startDate.year', value: APP.CV.startDate.split('/')[2], source: 'adapter:oracle_hcm', status: 'resolved' };
      if (el.matches('input[name="contentItemId"]')) return { ...APP.Profile.value('languageNative', el), source: 'adapter:oracle_hcm' };
      if (el.matches('input[type="checkbox"][id*="currentJobFlag"]')) return { fieldKey: 'currentJob', value: !APP.CV.endDate && !!APP.CV.companyName, source: 'adapter:oracle_hcm', status: 'resolved' };
      return null;
    },
    commits(root = document) {
      const seen = new Set();
      return [...root.querySelectorAll('fieldset, form, [role="dialog"], [class*="edit-form"], [class*="section-form"]')].flatMap(container => {
        if (!APP.DOM.visible(container)) return [];
        const related = [...container.querySelectorAll('input, select, textarea')].filter(el => APP.DOM.visible(el) && /education|experience|school|university|degree|employer|major|job.?title/i.test(APP.DOM.hints(el)));
        if (!related.length) return [];
        const button = APP.Commit.findCommitButton(container);
        if (!button || seen.has(button)) return [];
        seen.add(button);
        return [{ container, button }];
      });
    }
  });
})();
