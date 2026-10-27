(() => {
  'use strict';
  const cv = globalThis.__CV_APP.CV;
  const status = document.getElementById('status');
  const fields = {
    firstName: ['الاسم الأول بالإنجليزية'], firstNameAr: ['الاسم الأول بالعربية'], middleName: ['الاسم الأوسط بالإنجليزية'], middleNameAr: ['الاسم الأوسط بالعربية'],
    lastName: ['اسم العائلة بالإنجليزية'], lastNameAr: ['اسم العائلة بالعربية'], fullName: ['الاسم الكامل بالإنجليزية'], fullNameAr: ['الاسم الكامل بالعربية'],
    email: ['البريد الإلكتروني', 'email'], phone: ['الهاتف مع رمز الدولة', 'tel'], dob: ['تاريخ الميلاد', 'date'],
    city: ['المدينة بالإنجليزية'], cityAr: ['المدينة بالعربية'], university: ['الجامعة بالإنجليزية'], universityAr: ['الجامعة بالعربية'],
    gpa: ['المعدل', 'number'], gpaScale: ['نظام المعدل', 'number'], graduationDate: ['تاريخ التخرج', 'date'], trainingStartDate: ['بداية التدريب', 'date'],
    linkedin: ['رابط LinkedIn', 'url'], github: ['رابط GitHub', 'url'], portfolio: ['رابط معرض الأعمال', 'url']
  };
  let overrides = {};
  const show = message => { status.textContent = message; };
  async function load() {
    overrides = (await chrome.storage.local.get('profileOverrides')).profileOverrides || {};
    const container = document.getElementById('fields'); container.replaceChildren();
    for (const [key, [title, type = 'text']] of Object.entries(fields)) {
      const label = document.createElement('label'); label.textContent = title;
      const input = document.createElement('input'); input.name = key; input.type = type; input.value = overrides[key] ?? cv[key];
      if (type === 'number') { input.step = '0.01'; input.min = '0'; }
      label.append(input); container.append(label);
    }
  }
  document.getElementById('profile-form').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const values = Object.fromEntries(new FormData(event.target));
      if (Number(values.gpa) > Number(values.gpaScale)) throw new Error('المعدل أكبر من نظام المعدل');
      if (!/^\+\d{8,15}$/.test(values.phone)) throw new Error('اكتب الهاتف مع + ورمز الدولة');
      const digits = values.phone.replace(/\D/g, '');
      const countryDigits = cv.phoneClean.slice(0, -cv.phoneWithoutZero.length);
      if (!digits.startsWith(countryDigits)) throw new Error('رمز الدولة مختلف؛ راجع إعدادات الهاتف كاملة قبل التغيير');
      const local = digits.slice(countryDigits.length);
      const changed = { ...overrides, ...values, phoneClean: digits, phoneWithoutZero: local, phoneLocal: '0' + local,
        dobYear: values.dob.slice(0, 4), dobMonth: values.dob.slice(5, 7), dobDay: values.dob.slice(8, 10),
        dobSlash: values.dob.slice(5, 7) + '/' + values.dob.slice(8, 10) + '/' + values.dob.slice(0, 4),
        graduationYear: values.graduationDate.slice(0, 4), links: [values.linkedin, values.github, values.portfolio].filter(Boolean) };
      await chrome.storage.local.set({ profileOverrides: changed }); show('تم حفظ البيانات. حدّث صفحة النموذج قبل المتابعة.');
    } catch (error) { show(error.message); }
  });
  document.getElementById('reset-profile').addEventListener('click', async () => { await chrome.storage.local.remove('profileOverrides'); await load(); show('تمت استعادة القيم الأصلية.'); });
  async function attachments() {
    const container = document.getElementById('attachments'); container.replaceChildren();
    for (const [key, title] of [['cv', 'السيرة الذاتية'], ['coverLetter', 'خطاب الجامعة'], ['certificate', 'الشهادة']]) {
      const stored = await CVAttachmentStore.get(key);
      const row = document.createElement('div'); row.className = 'attachment';
      const name = document.createElement('div'); name.textContent = title + ': ' + (stored?.name || (key === 'cv' ? 'السيرة الأصلية' : 'لم يُحدد ملف'));
      const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf'; input.setAttribute('aria-label', title);
      input.addEventListener('change', async () => {
        if (!input.files[0]) return;
        try { await CVAttachmentStore.set(key, input.files[0]); await attachments(); show('تم حفظ المرفق.'); } catch (error) { show(error.message); }
      });
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'إزالة النسخة المخصصة';
      remove.addEventListener('click', async () => { await CVAttachmentStore.remove(key); await attachments(); });
      row.append(name, input, remove); container.append(row);
    }
  }
  async function renderRules() {
    const all = (await chrome.storage.local.get('approvedFieldRulesV1')).approvedFieldRulesV1 || [];
    const container = document.getElementById('rules'); container.replaceChildren();
    for (const rule of all) {
      const row = document.createElement('div'); row.className = 'rule';
      const title = document.createElement('div'); title.textContent = rule.hints;
      const detail = document.createElement('small'); detail.textContent = `${rule.origin} • ${rule.form} • ${rule.kind === 'profile' ? 'بيانات السيرة: ' + rule.fieldKey : rule.value} • ${rule.automatic ? 'ربط متعلم بعد التحقق' : 'قاعدة معتمدة'}`;
      const remove = document.createElement('button'); remove.textContent = 'حذف'; remove.type = 'button';
      remove.addEventListener('click', async () => { await chrome.runtime.sendMessage({ action: 'learning_mutation', operation: 'remove', key: rule.key }); await renderRules(); });
      row.append(title, detail, remove); container.append(row);
    }
    if (!all.length) container.textContent = 'لا توجد قواعد معتمدة.';
  }
  document.getElementById('export-rules').addEventListener('click', async () => {
    const data = (await chrome.storage.local.get('approvedFieldRulesV1')).approvedFieldRulesV1 || [];
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'cv-autofill-approved-rules.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  Promise.all([load(), attachments(), renderRules()]).catch(error => show(error.message));
})();
