(() => {
  'use strict';
  const APP = globalThis.__CV_APP;
  APP.Adapters.register({
    id: 'jisr',
    fields: {
      '#candidate_profile_name_ar': { fieldKey: 'fullName', profileKey: 'fullNameAr' },
      '#candidate_profile_name_en': { fieldKey: 'fullName', profileKey: 'fullName' },
      '#candidate_profile_email': { fieldKey: 'email' },
      '#candidate_profile_phone_number': { fieldKey: 'phone', profileKey: 'phoneWithoutZero' },
      '#candidate_profile_current_role': { fieldKey: 'jobTitle' },
      '#candidate_profile_city': { fieldKey: 'city', profileKey: 'cityAr' },
      '#candidate_profile_address': { fieldKey: 'address', profileKey: 'fullLocationAr' }
    },
    detect: url => APP.hostMatches(url, 'jisr.net'),
    resolve(el) {
      const inferred = APP.Profile.infer(el);
      if (inferred && ['nationality', 'country'].includes(inferred.fieldKey)) return { ...inferred, value: APP.CV.country, source: 'adapter:jisr' };
      return null;
    }
  });
})();
