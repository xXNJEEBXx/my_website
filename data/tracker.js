#!/usr/bin/env node
/**
 * =============================================================================
 * 🚀 Co-op Training Job Tracker CLI (data/tracker.js)
 * =============================================================================
 * Professional management and query engine for job applications.
 * Directly interfaces with data/current-applied-companies.json & data/previous-applied-companies.json
 *
 * Designed for both automated AI Agent execution and direct terminal usage.
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CURRENT_FILE = path.join(__dirname, 'current-applied-companies.json');
const PREVIOUS_FILE = path.join(__dirname, 'previous-applied-companies.json');

// Region metadata
const REGIONS = {
  sa: { flag: '🇸🇦', name: 'السعودية', label: 'Saudi Arabia' },
  gulf: { flag: '🌴', name: 'الخليج', label: 'Gulf Countries' },
  eu: { flag: '🇪🇺', name: 'أوروبا', label: 'Europe' },
  na: { flag: '🌎', name: 'أمريكا', label: 'North America' },
  asia: { flag: '🌏', name: 'آسيا', label: 'Asia' },
  remote: { flag: '💻', name: 'عن بعد', label: 'Remote' },
};

const STATUS_MAP = {
  applied: { label: 'تم التقديم', icon: '✅' },
  pending: { label: 'قيد الانتظار', icon: '⏳' },
  interview: { label: 'مقابلة', icon: '📞' },
  accepted: { label: 'تم القبول', icon: '🎉' },
  rejected: { label: 'تم الرفض', icon: '❌' },
  failed: { label: 'ملغي/معطل', icon: '⚠️' }
};

// ─── Standardized Presets (Zero Error Rate for Agents & Users) ────────────────
const STANDARD_ROLES = {
  'fullstack': 'Full-Stack Web Developer',
  'full-stack': 'Full-Stack Web Developer',
  'frontend': 'Frontend Developer (React / Next.js)',
  'front-end': 'Frontend Developer (React / Next.js)',
  'backend': 'Backend Developer (Laravel / Node.js / Python)',
  'back-end': 'Backend Developer (Laravel / Node.js / Python)',
  'intern': 'Software Engineer Intern',
  'swe': 'Software Engineer Intern',
  'software': 'Software Engineer Intern',
  'mobile': 'Mobile App Developer (Flutter / React Native)',
  'flutter': 'Mobile App Developer (Flutter / React Native)',
  'data': 'Data Analyst / BI Specialist',
  'bi': 'Data Analyst / BI Specialist',
  'cyber': 'Cybersecurity Analyst (SOC / Security)',
  'security': 'Cybersecurity Analyst (SOC / Security)',
  'ai': 'AI / Machine Learning Engineer',
  'ml': 'AI / Machine Learning Engineer',
  'devops': 'Cloud & DevOps Engineer',
  'cloud': 'Cloud & DevOps Engineer',
  'it': 'IT Support & Systems Specialist',
  'ui': 'UI/UX Designer',
  'ux': 'UI/UX Designer'
};

const CITY_LOOKUP = {
  // Saudi
  'الأحساء': { region: 'sa', location: 'الأحساء' },
  'الهفوف': { region: 'sa', location: 'الأحساء' },
  'المبرز': { region: 'sa', location: 'الأحساء' },
  'ahsa': { region: 'sa', location: 'الأحساء' },
  'hofuf': { region: 'sa', location: 'الأحساء' },
  'الرياض': { region: 'sa', location: 'الرياض' },
  'riyadh': { region: 'sa', location: 'الرياض' },
  'الدمام': { region: 'sa', location: 'الدمام / الخبر' },
  'الخبر': { region: 'sa', location: 'الدمام / الخبر' },
  'الظهران': { region: 'sa', location: 'الدمام / الخبر' },
  'dammam': { region: 'sa', location: 'الدمام / الخبر' },
  'khobar': { region: 'sa', location: 'الدمام / الخبر' },
  'dhahran': { region: 'sa', location: 'الدمام / الخبر' },
  'الجبيل': { region: 'sa', location: 'الجبيل' },
  'jubail': { region: 'sa', location: 'الجبيل' },
  'جدة': { region: 'sa', location: 'جدة' },
  'jeddah': { region: 'sa', location: 'جدة' },
  'مكة': { region: 'sa', location: 'جدة / مكة' },
  'المدينة': { region: 'sa', location: 'المدينة المنورة' },
  'medina': { region: 'sa', location: 'المدينة المنورة' },
  'نيوم': { region: 'sa', location: 'نيوم' },
  'neom': { region: 'sa', location: 'نيوم' },

  // Gulf
  'دبي': { region: 'gulf', location: 'دبي، الإمارات' },
  'dubai': { region: 'gulf', location: 'دبي، الإمارات' },
  'أبوظبي': { region: 'gulf', location: 'أبوظبي، الإمارات' },
  'abu dhabi': { region: 'gulf', location: 'أبوظبي، الإمارات' },
  'الشارقة': { region: 'gulf', location: 'الشارقة، الإمارات' },
  'الدوحة': { region: 'gulf', location: 'الدوحة، قطر' },
  'doha': { region: 'gulf', location: 'الدوحة، قطر' },
  'المنامة': { region: 'gulf', location: 'المنامة، البحرين' },
  'manama': { region: 'gulf', location: 'المنامة، البحرين' },
  'الكويت': { region: 'gulf', location: 'مدينة الكويت، الكويت' },
  'kuwait': { region: 'gulf', location: 'مدينة الكويت، الكويت' },
  'مسقط': { region: 'gulf', location: 'مسقط، عمان' },
  'muscat': { region: 'gulf', location: 'مسقط، عمان' },

  // Global & Tech Hubs
  'tallinn': { region: 'eu', location: 'Tallinn, Estonia' },
  'تالين': { region: 'eu', location: 'Tallinn, Estonia' },
  'إستونيا': { region: 'eu', location: 'Estonia' },
  'estonia': { region: 'eu', location: 'Estonia' },
  'berlin': { region: 'eu', location: 'Berlin, Germany' },
  'برلين': { region: 'eu', location: 'Berlin, Germany' },
  'ألمانيا': { region: 'eu', location: 'Germany' },
  'germany': { region: 'eu', location: 'Germany' },
  'warsaw': { region: 'eu', location: 'Warsaw, Poland' },
  'وارسو': { region: 'eu', location: 'Warsaw, Poland' },
  'بولندا': { region: 'eu', location: 'Poland' },
  'poland': { region: 'eu', location: 'Poland' },
  'london': { region: 'eu', location: 'London, UK' },
  'لندن': { region: 'eu', location: 'London, UK' },
  'uk': { region: 'eu', location: 'UK' },
  'بريطانيا': { region: 'eu', location: 'UK' },
  'san francisco': { region: 'na', location: 'San Francisco, CA' },
  'new york': { region: 'na', location: 'New York, NY' },
  'austin': { region: 'na', location: 'Austin, TX' },
  'seattle': { region: 'na', location: 'Seattle, WA' },
  'usa': { region: 'na', location: 'USA' },
  'أمريكا': { region: 'na', location: 'USA' },
  'singapore': { region: 'asia', location: 'Singapore' },
  'سنغافورة': { region: 'asia', location: 'Singapore' }
};

function normalizeRole(input) {
  if (!input) return 'Software Engineer Intern';
  const clean = String(input).trim().toLowerCase();
  for (const [key, val] of Object.entries(STANDARD_ROLES)) {
    if (clean === key || clean.includes(key)) return val;
  }
  return String(input).trim();
}

function normalizeLocation(flags) {
  let rawCity = (flags.city || flags.location || '').trim();
  let country = (flags.country || '').trim().toLowerCase();
  let workMode = (flags['work-mode'] || flags.workmode || '').trim().toLowerCase();
  let isRemote = flags.remote || workMode.includes('remote') || workMode.includes('عن بعد');
  let isHybrid = flags.hybrid || workMode.includes('hybrid') || workMode.includes('هجين');

  let detectedRegion = (flags.region || '').toLowerCase();
  let finalLocation = '';

  const cityKey = rawCity.toLowerCase();
  if (CITY_LOOKUP[cityKey]) {
    detectedRegion = detectedRegion || CITY_LOOKUP[cityKey].region;
    finalLocation = CITY_LOOKUP[cityKey].location;
  } else if (rawCity) {
    finalLocation = rawCity;
  }

  if (!finalLocation) {
    if (country === 'sa' || country.includes('سعود')) {
      detectedRegion = detectedRegion || 'sa';
      finalLocation = 'السعودية';
    } else if (country === 'ae' || country.includes('إمارات')) {
      detectedRegion = detectedRegion || 'gulf';
      finalLocation = 'الإمارات';
    } else if (country === 'us' || country.includes('أمريك')) {
      detectedRegion = detectedRegion || 'na';
      finalLocation = 'USA';
    } else if (country === 'de' || country.includes('ألمان')) {
      detectedRegion = detectedRegion || 'eu';
      finalLocation = 'Germany';
    } else if (country === 'ee' || country.includes('إستون')) {
      detectedRegion = detectedRegion || 'eu';
      finalLocation = 'Estonia';
    } else if (country === 'pl' || country.includes('بولند')) {
      detectedRegion = detectedRegion || 'eu';
      finalLocation = 'Poland';
    } else if (country === 'uk' || country.includes('بريطان')) {
      detectedRegion = detectedRegion || 'eu';
      finalLocation = 'UK';
    } else if (country === 'sg' || country.includes('سنغافور')) {
      detectedRegion = detectedRegion || 'asia';
      finalLocation = 'Singapore';
    } else {
      detectedRegion = detectedRegion || 'sa';
      finalLocation = 'السعودية';
    }
  }

  if (!REGIONS[detectedRegion]) {
    detectedRegion = isRemote ? 'remote' : 'sa';
  }

  if (isRemote && !finalLocation.includes('عن بعد') && !finalLocation.toLowerCase().includes('remote')) {
    finalLocation += ' (عن بعد)';
  } else if (isHybrid && !finalLocation.includes('هجين') && !finalLocation.toLowerCase().includes('hybrid')) {
    finalLocation += ' (هجين)';
  }

  return { location: finalLocation, region: detectedRegion };
}

function normalizeSalary(flags, defaultRegion = 'sa') {
  if (flags['competitive'] || flags['salary-type'] === 'competitive') {
    return 'مكافأة تنافسية';
  }
  if (flags['unspecified'] || flags['salary-type'] === 'unspecified') {
    return 'غير مذكور';
  }
  if (flags['unpaid'] || flags['salary-type'] === 'unpaid') {
    return 'غير مدفوع (تطوعي)';
  }

  const isHourly = flags['hourly'] || flags['salary-type'] === 'hourly';
  const rawAmt = flags['amount'] !== undefined ? flags['amount'] : flags['salary'];

  if (rawAmt && !isNaN(parseFloat(String(rawAmt).replace(/,/g, '')))) {
    const num = parseFloat(String(rawAmt).replace(/,/g, ''));
    const cur = (flags['currency'] || (isHourly ? 'USD' : (defaultRegion === 'sa' ? 'SAR' : 'USD'))).toUpperCase();
    if (isHourly) {
      if (cur === 'USD') return `$${num}/hr`;
      if (cur === 'EUR') return `€${num}/hr`;
      return `${num} ${cur}/ساعة`;
    } else {
      if (cur === 'SAR') return `${num.toLocaleString('en-US')} ريال/شهر`;
      if (cur === 'USD') return `$${num.toLocaleString('en-US')} / شهر`;
      if (cur === 'EUR') return `€${num.toLocaleString('en-US')} / شهر`;
      return `${num.toLocaleString('en-US')} ${cur}/شهر`;
    }
  }

  if (flags.salary) return String(flags.salary).trim();
  return 'غير مذكور';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) return [];
    return JSON.parse(content);
  } catch (err) {
    console.error(`❌ Error reading ${filePath}:`, err.message);
    return [];
  }
}

const DATA_JS_FILE = path.join(__dirname, 'companies-data.js');

function syncJsFile(currentData) {
  try {
    const prev = fs.existsSync(PREVIOUS_FILE) ? fs.readFileSync(PREVIOUS_FILE, 'utf8') : '[]';
    const content = `window.__PREVIOUS_COMPANIES = ${prev};\nwindow.__CURRENT_COMPANIES = ${JSON.stringify(currentData, null, 2)};\n`;
    fs.writeFileSync(DATA_JS_FILE, content, 'utf8');
  } catch(e) {}
}

function saveCurrentJson(data) {
  try {
    fs.writeFileSync(CURRENT_FILE, JSON.stringify(data, null, 2), 'utf8');
    syncJsFile(data);
    return true;
  } catch (err) {
    console.error(`❌ Error saving ${CURRENT_FILE}:`, err.message);
    return false;
  }
}

function getTodayDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseArgs(args) {
  const parsed = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        parsed[key] = args[i + 1];
        i++;
      } else {
        parsed[key] = true;
      }
    } else {
      parsed._.push(arg);
    }
  }
  return parsed;
}

function isHighSalary(salaryStr) {
  if (!salaryStr) return false;
  const s = String(salaryStr).toLowerCase();
  
  // Specific keywords indicating competitive or high pay
  if (/تنافسية|مجزية|عالية|salaried|competitive/i.test(s)) return true;
  if (/bonus|\$60k|\$70k|\$80k|\$90k|\$100k|\$120k|\$123k/i.test(s)) return true;

  // Hourly rates >= $20/hr
  const hourlyMatch = s.match(/\$(\d+(\.\d+)?)\s*\/?\s*(hr|ساعة|hour)?/i);
  if (hourlyMatch && parseFloat(hourlyMatch[1]) >= 20) return true;

  // Monthly SAR >= 4000
  const sarMatch = s.match(/(\d+[\d,]*)\s*(sar|ر\.س|ريال)?/i);
  if (sarMatch) {
    const num = parseFloat(sarMatch[1].replace(/,/g, ''));
    if (num >= 4000) return true;
  }

  // Monthly EUR >= 800
  const eurMatch = s.match(/€\s*(\d+)|(\d+)\s*eur/i);
  if (eurMatch) {
    const num = parseFloat(eurMatch[1] || eurMatch[2]);
    if (num >= 800) return true;
  }

  return false;
}

function isPaid(salaryStr) {
  if (!salaryStr) return false;
  const s = String(salaryStr).toLowerCase();
  if (/غير مذكور|غير محدد|مجاني|volunteer/i.test(s)) return false;
  return /مدفوع|مدفوعة|paid|راتب|مكافأة|\$|€|sar|ر\.س|\d+/i.test(s);
}

// ─── Format Table Output ─────────────────────────────────────────────────────

function printCompaniesTable(companies, title = "النتائج") {
  if (!companies || companies.length === 0) {
    console.log(`\n🔍 ${title}: لا توجد فرص تطابق المعايير.\n`);
    return;
  }

  console.log(`\n📊 ${title} (${companies.length} فرصة):\n`);
  console.log('='.repeat(110));
  console.log(
    '#'.padEnd(4) +
    'الشركة'.padEnd(26) +
    'التخصص'.padEnd(24) +
    'الموقع'.padEnd(18) +
    'تاريخ الإعلان'.padEnd(16) +
    'المكافأة'.padEnd(14) +
    'الحالة'
  );
  console.log('-'.repeat(110));

  companies.forEach((c, idx) => {
    const flag = REGIONS[c.region]?.flag || '🌐';
    const name = `${flag} ${(c.name || 'غير محدد')}`.substring(0, 24).padEnd(26);
    const field = (c.field || '-').substring(0, 22).padEnd(24);
    const location = (c.location || '-').substring(0, 16).padEnd(18);
    const postDate = (c.postDate || c.date || '-').padEnd(16);
    const salary = (c.salary || '-').substring(0, 12).padEnd(14);
    const statusObj = STATUS_MAP[c.status] || { icon: '⚪', label: c.status || 'unknown' };
    const status = `${statusObj.icon} ${statusObj.label}`;

    console.log(`${String(idx + 1).padEnd(4)}${name}${field}${location}${postDate}${salary}${status}`);
    if (c.link) {
      console.log(`    🔗 الرابط: ${c.link}`);
    }
    if (c.notes) {
      console.log(`    💡 ملاحظات: ${c.notes}`);
    }
  });
  console.log('='.repeat(110) + '\n');
}

// ─── Command Handlers ────────────────────────────────────────────────────────

function cmdAdd(flags) {
  const name = flags.name || flags.company;
  if (!name) {
    console.error('❌ يرجى تحديد اسم الشركة باستخدام --name "اسم الشركة"');
    console.log('💡 لعرض جميع الخيارات المعيارية: node data/tracker.js options');
    process.exit(1);
  }

  const current = loadJson(CURRENT_FILE);
  const exists = current.find(c => c.name.toLowerCase() === name.toLowerCase());

  if (exists && !flags.force) {
    console.log(`⚠️ الشركة "${name}" مسجلة مسبقاً في تقديمات هذا السمستر.`);
    console.log(`   الحالة الحالية: ${exists.status} (${exists.notes || 'بدون ملاحظات'})`);
    console.log(`   استخدم --force إذا كنت ترغب بإضافتها مجدداً.`);
    return;
  }

  const { location, region } = normalizeLocation(flags);
  const field = normalizeRole(flags.field || flags.role);
  const salary = normalizeSalary(flags, region);
  const rawStatus = (flags.status || 'pending').toLowerCase();
  const status = STATUS_MAP[rawStatus] ? rawStatus : 'pending';
  const postDate = (flags.postDate || flags['post-date'] || flags.date || flags['announcement-date'] || getTodayDate()).trim();

  const newCompany = {
    name: name.trim(),
    field,
    location,
    salary,
    postDate,
    link: (flags.link || flags.url || '').trim(),
    trackLink: (flags.trackLink || '').trim(),
    status,
    region,
    notes: (flags.notes || `أضيفت في ${getTodayDate()}`).trim()
  };

  current.push(newCompany);
  if (saveCurrentJson(current)) {
    console.log(`✅ تمت إضافة الشركة بنجاح بخيارات نموذجية موحدة:`);
    console.log(`   🏢 الاسم: ${newCompany.name}`);
    console.log(`   💼 المسمى: ${newCompany.field}`);
    console.log(`   📍 الموقع: ${newCompany.location} (${REGIONS[newCompany.region]?.flag || '🌐'})`);
    console.log(`   📅 تاريخ الإعلان: ${newCompany.postDate}`);
    console.log(`   💰 المكافأة: ${newCompany.salary}`);
    console.log(`   📊 الحالة: ${STATUS_MAP[newCompany.status]?.icon} ${STATUS_MAP[newCompany.status]?.label}`);
  }
}

function cmdApply(flags) {
  const name = flags.name || flags.company;
  if (!name) {
    console.error('❌ يرجى تحديد اسم الشركة باستخدام --name "اسم الشركة"');
    process.exit(1);
  }

  const current = loadJson(CURRENT_FILE);
  const target = current.find(c => c.name.toLowerCase().includes(name.toLowerCase()));

  if (!target) {
    console.log(`⚠️ لم يتم العثور على شركة باسم "${name}" في التقديمات الحالية.`);
    console.log(`   💡 هل تبحث في أرشيف السمستر الماضي؟ جرب: node data/tracker.js copy-previous --name "${name}"`);
    return;
  }

  target.status = 'applied';
  const today = getTodayDate();
  const applyNote = flags.notes ? `تم التقديم في ${today}: ${flags.notes}` : `تم التقديم بنجاح في ${today}.`;
  
  if (target.notes) {
    target.notes += ` | ${applyNote}`;
  } else {
    target.notes = applyNote;
  }

  if (saveCurrentJson(current)) {
    console.log(`🎉 تم تسجيل التقديم بنجاح!`);
    console.log(`   🏢 الشركة: ${target.name}`);
    console.log(`   📅 التاريخ: ${today}`);
    console.log(`   📊 الحالة: ${STATUS_MAP.applied.icon} ${STATUS_MAP.applied.label}`);
    console.log(`   💡 ملاحظات: ${target.notes}`);
  }
}

function cmdStatus(flags) {
  const name = flags.name || flags.company;
  const newStatus = (flags.status || '').toLowerCase();

  if (!name) {
    console.error('❌ يرجى تحديد اسم الشركة: node data/tracker.js update --company "اسم الشركة" [--status ...] [--link ...] [--notes ...]');
    process.exit(1);
  }

  if (newStatus && !STATUS_MAP[newStatus]) {
    console.error(`❌ الحالة غير صالحة. الحالات المقبولة: ${Object.keys(STATUS_MAP).join(', ')}`);
    process.exit(1);
  }

  const current = loadJson(CURRENT_FILE);
  const target = current.find(c => c.name.toLowerCase().includes(name.toLowerCase()));

  if (!target) {
    console.log(`⚠️ لم يتم العثور على شركة باسم "${name}" في تقديمات السمستر الحالي.`);
    return;
  }

  if (newStatus && STATUS_MAP[newStatus]) {
    target.status = newStatus;
  }
  if (flags.link || flags.url) {
    target.link = (flags.link || flags.url).trim();
  }
  if (flags.trackLink) {
    target.trackLink = flags.trackLink.trim();
  }
  if (flags.notes) {
    target.notes = target.notes ? `${target.notes} | ${flags.notes}` : flags.notes;
  }
  if (flags.date || flags.postDate || flags['post-date']) {
    target.postDate = (flags.date || flags.postDate || flags['post-date']).trim();
  }

  if (saveCurrentJson(current)) {
    const statusInfo = STATUS_MAP[target.status] ? `${STATUS_MAP[target.status].icon} ${STATUS_MAP[target.status].label}` : target.status;
    console.log(`✅ تم تحديث بيانات "${target.name}" بنجاح! (الحالة: ${statusInfo})`);
    if (target.link) console.log(`   🔗 الرابط: ${target.link}`);
  }
}

function cmdSearch(flags) {
  const isArchive = flags.archive || false;
  const isAll = flags.all || false;

  let pool = [];
  if (isAll) {
    pool = [...loadJson(CURRENT_FILE), ...loadJson(PREVIOUS_FILE)];
  } else if (isArchive) {
    pool = loadJson(PREVIOUS_FILE);
  } else {
    pool = loadJson(CURRENT_FILE);
  }

  let results = pool;

  // Filter query across name, field, location, notes
  if (flags.query || flags._[1]) {
    const q = (flags.query || flags._[1]).toLowerCase();
    results = results.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.field && c.field.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  }

  // Region filter
  if (flags.region) {
    const reg = flags.region.toLowerCase();
    results = results.filter(c => c.region === reg);
  }

  // Status filter
  if (flags.status) {
    const st = flags.status.toLowerCase();
    results = results.filter(c => c.status === st);
  }

  // High salary filter
  if (flags['high-salary'] || flags.highSalary) {
    results = results.filter(c => isHighSalary(c.salary));
  }

  // Paid only filter
  if (flags['paid-only'] || flags.paidOnly) {
    results = results.filter(c => isPaid(c.salary));
  }

  // Output formatting
  if (flags.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const srcTitle = isArchive ? 'أرشيف السمستر الماضي' : (isAll ? 'السمستر الحالي + الأرشيف' : 'السمستر الحالي');
    printCompaniesTable(results, `نتائج البحث في ${srcTitle}`);
  }
}

function cmdList(flags) {
  cmdSearch({ ...flags, query: '' });
}

function cmdStats() {
  const current = loadJson(CURRENT_FILE);
  const previous = loadJson(PREVIOUS_FILE);

  console.log('\n📊 إحصائيات التقديم على التدريب التعاوني (Co-op Stats):\n');
  console.log('='.repeat(60));
  console.log(`📌 تقديمات السمستر الحالي: ${current.length} شركة`);
  
  const statusCounts = {};
  current.forEach(c => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  Object.entries(STATUS_MAP).forEach(([key, meta]) => {
    const count = statusCounts[key] || 0;
    console.log(`   ${meta.icon} ${meta.label.padEnd(16)}: ${count}`);
  });

  console.log('-'.repeat(60));
  console.log('🌍 التوزيع الجغرافي للسمستر الحالي:');
  const regionCounts = {};
  current.forEach(c => {
    regionCounts[c.region] = (regionCounts[c.region] || 0) + 1;
  });

  Object.entries(REGIONS).forEach(([reg, meta]) => {
    const count = regionCounts[reg] || 0;
    if (count > 0) {
      console.log(`   ${meta.flag} ${meta.name.padEnd(14)}: ${count}`);
    }
  });

  console.log('-'.repeat(60));
  console.log(`📦 أرشيف السمستر الماضي: ${previous.length} شركة جاهزة للاستيراد.`);
  console.log('='.repeat(60) + '\n');
}

function cmdCopyPrevious(flags) {
  const name = flags.name || flags.company;
  if (!name) {
    console.error('❌ يرجى تحديد اسم الشركة المراد نسخها من الأرشيف: --name "اسم الشركة"');
    process.exit(1);
  }

  const previous = loadJson(PREVIOUS_FILE);
  const matches = previous.filter(c => c.name.toLowerCase().includes(name.toLowerCase()));

  if (matches.length === 0) {
    console.log(`⚠️ لم يتم العثور على "${name}" في أرشيف السمستر الماضي.`);
    return;
  }

  const match = matches[0];
  const current = loadJson(CURRENT_FILE);
  const exists = current.find(c => c.name.toLowerCase() === match.name.toLowerCase());

  if (exists && !flags.force) {
    console.log(`⚠️ الشركة "${match.name}" مضافة بالفعل في قائمة السمستر الحالي!`);
    return;
  }

  const cloned = {
    ...match,
    status: 'pending',
    notes: `نُقلت من أرشيف السمستر الماضي في ${getTodayDate()} للتقديم مجدداً.`
  };

  current.push(cloned);
  if (saveCurrentJson(current)) {
    console.log(`🚀 تم تفعيل الشركة ونقلها للسمستر الجديد بنجاح!`);
    console.log(`   🏢 الاسم: ${cloned.name}`);
    console.log(`   💼 المسمى: ${cloned.field}`);
    console.log(`   📍 الموقع: ${cloned.location} (${REGIONS[cloned.region]?.flag})`);
    console.log(`   📊 الحالة الآن: ⏳ قيد الانتظار للتقديم.`);
  }
}

function cmdClear() {
  saveCurrentJson([]);
  console.log('✅ تم مسح جميع تقديمات السمستر الحالي من لوحة التحكم بنجاح.');
}

function cmdOptions() {
  console.log(`
🎯 الخيارات والأنماط المعيارية المعتمدة (Zero-Error Presets)
=============================================================================

1. المجالات والتخصصات المعيارية (--role / --field):
   - fullstack  -> Full-Stack Web Developer
   - frontend   -> Frontend Developer (React / Next.js)
   - backend    -> Backend Developer (Laravel / Node.js / Python)
   - intern     -> Software Engineer Intern (افتراضي)
   - mobile     -> Mobile App Developer (Flutter / React Native)
   - data       -> Data Analyst / BI Specialist
   - cyber      -> Cybersecurity Analyst (SOC / Security)
   - ai         -> AI / Machine Learning Engineer
   - devops     -> Cloud & DevOps Engineer
   - it         -> IT Support & Systems Specialist

2. المدن والدول المدعومة تلقائياً (--city / --country):
   🇸🇦 السعودية (sa): الأحساء, الرياض, الدمام, الخبر, الظهران, الجبيل, جدة, نيوم
   🌴 الخليج (gulf): دبي, أبوظبي, الشارقة, الدوحة, المنامة, الكويت, مسقط
   🇪🇺 أوروبا (eu): Tallinn (إستونيا), Berlin (ألمانيا), Warsaw (بولندا), London (بريطانيا)
   🌎 أمريكا (na): San Francisco, New York, Austin, Seattle
   🌏 آسيا (asia): Singapore
   💻 نمط العمل عن بعد (--remote أو --work-mode remote): يدمج تلقائياً مع الموقع

3. خيارات المكافأة والتعويض المالي (--amount / --currency / --salary-type):
   - مبالغ شهرية معيارية: --amount 1500, 3000, 4000, 5000, 6000 (بالريال الافتراضي)
   - مكافأة بالساعة: --amount 25 --hourly          -> $25/hr
   - مكافأة تنافسية: --competitive                  -> مكافأة تنافسية
   - غير معلن: --unspecified                        -> غير مذكور
   - تدريب غير مدفوع: --unpaid                      -> غير مدفوع (تطوعي)

4. حالات التقديم (--status):
   - pending (قيد الانتظار) | applied (تم التقديم) | interview (مقابلة)
   - accepted (تم القبول)   | rejected (تم الرفض)  | failed (معطل/ملغي)
=============================================================================
`);
}

function cmdHelp() {
  console.log(`
🚀 Co-op Job Tracker CLI — أداة إدارة وتتبع فرص التدريب التعاوني
=============================================================================

الأوامر المتاحة:

  1. إضافة فرصة جديدة بخيارات نموذجية:
     node data/tracker.js add --name "Elm" --city "الرياض" --amount 5000 --role "fullstack"
     node data/tracker.js add --name "Stripe" --city "seattle" --amount 50 --hourly --role "swe"
     node data/tracker.js add --name "Aramco" --city "الظهران" --competitive --role "cyber"

  2. عرض قائمة الخيارات والأنماط المعيارية الكاملة:
     node data/tracker.js options

  3. تسجيل التقديم على شركة:
     node data/tracker.js apply --company "Elm" --notes "تم التقديم عبر بوابة التدريب وإرفاق السيرة"

  4. تحديث حالة شركة:
     node data/tracker.js status --company "Elm" --status "interview|applied|pending|rejected"

  5. البحث والفلترة الذكية:
     node data/tracker.js search --high-salary                    # الشركات ذات الرواتب العالية
     node data/tracker.js search --region "sa" --status "pending"  # شواغر السعودية المعلقة
     node data/tracker.js search --query "React"                   # بحث بالكلمة المفتاحية
     node data/tracker.js search --archive --high-salary          # البحث في أرشيف الـ 160 شركة السابقة

  6. عرض كل الشركات:
     node data/tracker.js list
     node data/tracker.js list --archive

  7. إحصائيات التقديم:
     node data/tracker.js stats

  8. إعادة تفعيل شركة من أرشيف السمستر الماضي:
     node data/tracker.js copy-previous --company "Tamara"

رموز المناطق المتاحة (--region):
  sa (السعودية 🇸🇦) | gulf (الخليج 🌴) | eu (أوروبا 🇪🇺) | na (أمريكا 🌎) | asia (آسيا 🌏) | remote (عن بعد 💻)

الحالات المتاحة (--status):
  applied (تم التقديم) | pending (قيد الانتظار) | interview (مقابلة) | accepted (قبول) | rejected (رفض) | failed (معطل)
`);
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'help';
const flags = parseArgs(args.slice(1));

switch (command) {
  case 'add':
    cmdAdd(flags);
    break;
  case 'clear':
  case 'reset':
    cmdClear();
    break;
  case 'options':
  case 'presets':
    cmdOptions();
    break;
  case 'apply':
    cmdApply(flags);
    break;
  case 'status':
  case 'update':
    cmdStatus(flags);
    break;
  case 'search':
  case 'find':
    cmdSearch(flags);
    break;
  case 'list':
  case 'ls':
    cmdList(flags);
    break;
  case 'stats':
    cmdStats();
    break;
  case 'copy-previous':
  case 'reapply':
    cmdCopyPrevious(flags);
    break;
  case 'help':
  default:
    cmdHelp();
    break;
}
