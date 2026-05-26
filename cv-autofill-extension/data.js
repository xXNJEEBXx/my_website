// =============================================================================
// ⛔ CORE CV DATA — DO NOT MODIFY WITHOUT EXPLICIT USER PERMISSION ⛔
// =============================================================================
// This file contains the user's personal CV data and the universal field
// matching patterns. It is the single source of truth for all autofill data.
//
// WHY IS THIS LOCKED?
// Any accidental modification (wrong email, wrong phone, typo in a regex)
// will silently corrupt ALL future job applications across ALL platforms.
//
// RULES:
// 1. Agents/scripts MUST NOT edit this file unless the user explicitly says so.
// 2. To add site-specific selectors or platform rules, use `site-rules.js`.
// 3. To add new CV fields, ASK the user first, then add here.
// =============================================================================

window.__CV_APP = window.__CV_APP || {};

// ─────────────────────────────────────────────
// SECTION 1: Personal Information
// ─────────────────────────────────────────────
window.__CV_APP.CV = {
  firstName: 'Najeeb',
  lastName: 'Almusawi',
  fullName: 'Najeeb Murtadha Abdulmohsen Almusawi',
  middleName: 'Murtadha',
  displayName: 'Najeeb Almusawi',
  email: 'najeebxalmusawi@gmail.com',
  phone: '+966568199827',
  phoneClean: '966568199827',
  phoneLocal: '0568199827',
  nationalId: '1112191778',
  nationality: 'Saudi',
  nationalityAr: 'سعودي',
  gender: 'Male',
  genderAr: 'ذكر',

  // Date of Birth (multiple formats for different form types)
  dob: '2001-01-02',
  dobSlash: '01/02/2001',
  dobDay: '02',
  dobMonth: '01',
  dobYear: '2001',

  // ─────────────────────────────────────────────
  // SECTION 2: Location & Address
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // SECTION 3: Education
  // ─────────────────────────────────────────────
  university: 'King Faisal University',
  universityAr: 'جامعة الملك فيصل',
  degree: 'Bachelor of Computer Information Systems',
  degreeAr: 'بكالوريوس نظم المعلومات الحاسوبية',
  gpa: '2.53',
  gpaScale: '4.0',
  graduationDate: '2026-12-07',
  graduationYear: '2026',

  // ─────────────────────────────────────────────
  // SECTION 4: Links
  // ─────────────────────────────────────────────
  portfolio: 'https://xXNJEEBXx.github.io/my_website',
  linkedin: 'https://www.linkedin.com/in/najeeb-almusawi-16516417b',
  github: 'https://github.com/xXNJEEBXX',
  links: [
    'https://www.linkedin.com/in/najeeb-almusawi-16516417b',
    'https://github.com/xXNJEEBXX',
    'https://xXNJEEBXx.github.io/my_website'
  ],

  // ─────────────────────────────────────────────
  // SECTION 5: Languages
  // ─────────────────────────────────────────────
  languageNative: 'Arabic',
  languageSecond: 'English',
  arabicLevel: 'Professional',
  englishLevel: 'Upper Intermediate',

  // ─────────────────────────────────────────────
  // SECTION 6: Work Experience
  // ─────────────────────────────────────────────
  jobTitle: 'Independent Software Developer',
  companyName: 'Freelance / Self-Employed',
  startDate: '01/01/2020',
  endDate: '',
  responsibilities: 'Designed and developed responsive web applications using HTML5, CSS3, JavaScript, React.js, and Laravel. Built and maintained RESTful APIs with PHP and Node.js. Managed MySQL databases and implemented CRUD operations. Deployed projects using Git/GitHub and handled CI/CD pipelines. Collaborated with clients to gather requirements and deliver solutions on time.',

  // ─────────────────────────────────────────────
  // SECTION 7: Professional Summary
  // ─────────────────────────────────────────────
  summary: '5 years of freelance web development experience (HTML, CSS, JavaScript, PHP, MySQL), 3 years with React and Laravel, and 1 year at vibcoding. Highly adaptable and eager to learn. Actively seeking a 6-month hybrid Co-op placement starting from the upcoming summer.',

  // ─────────────────────────────────────────────
  // SECTION 8: Skills
  // ─────────────────────────────────────────────
  mainSkills: 'HTML5, CSS, JavaScript, PHP, React.js, Laravel, MySQL, RESTful APIs, Full-Stack, GitHub & Git',
  otherSkills: 'Microsoft Office, VibeCoding, Agile, Docker, Node.js, AWS, Automation, Next.js, TypeScript, Express.js',

  // ─────────────────────────────────────────────
  // SECTION 9: Certificates (leave empty if none)
  // ─────────────────────────────────────────────
  certificateName: '',
  issuingOrg: '',

  // ─────────────────────────────────────────────
  // SECTION 10: Job Preferences
  // ─────────────────────────────────────────────
  noticePeriod: '2 weeks',
  trainingPeriod: '6 months starting June 7, 2026',
  desiredSalary: '4000',

  // ─────────────────────────────────────────────
  // SECTION 11: File References
  // ─────────────────────────────────────────────
  coverLetterFileName: 'KFU COOP Letter.pdf',
  cvFileName: 'My CV NAJEEB ALMUSAWI.pdf',
};

const CV = window.__CV_APP.CV;

// =============================================================================
// UNIVERSAL FIELD PATTERNS — Smart Scan Matching Rules
// =============================================================================
// These patterns match against field hints (name, id, placeholder, label, aria-label).
// They work across ALL platforms. Ordered by specificity (most specific first).
// The `exclude` regex prevents false matches (e.g. "email address" ≠ "address").
//
// ⛔ DO NOT MODIFY without user permission. Add site-specific rules in site-rules.js.
// =============================================================================

window.__CV_APP.FIELD_PATTERNS = [
  // --- Identity ---
  { pattern: /first.?name|fname|\bfn\b|given.?name|الاسم.?الأول/i, value: CV.firstName },
  { pattern: /last.?name|lname|\bln\b|family.?name|surname|اسم.?العائلة/i, value: CV.lastName },
  { pattern: /full.?name|الاسم.?الكامل|your.?name/i, value: CV.displayName, exclude: /first|last|user|company|middle/ },
  { pattern: /middle.?name|\bmn\b/i, value: CV.middleName },
  { pattern: /e.?mail|\bem\b|البريد/i, value: CV.email },
  { pattern: /phone|mobile|tel|\bmno\b|هاتف|جوال/i, value: CV.phone },

  // --- Location ---
  { pattern: /city|مدينة/i, value: CV.city, exclude: /country|state/ },
  { pattern: /country|بلد|دولة/i, value: CV.country },
  { pattern: /state|province|region|منطقة|ولاية/i, value: CV.region },
  { pattern: /postal|zip|postcode|الرمز.?البريدي/i, value: CV.postalCode },
  { pattern: /address|عنوان/i, value: CV.address, exclude: /email|e.?mail|ip/ },

  // --- Education ---
  { pattern: /university|جامعة|school|institution|مؤسسة/i, value: CV.university },
  { pattern: /degree|الدرجة|qualification/i, value: CV.degree },
  { pattern: /gpa|المعدل|grade/i, value: CV.gpa },
  { pattern: /graduation|تخرج/i, value: CV.graduationYear },

  // --- Links ---
  { pattern: /linkedin/i, value: CV.linkedin },
  { pattern: /github/i, value: CV.github },
  { pattern: /portfolio|website|موقع/i, value: CV.portfolio, exclude: /company/ },

  // --- Work ---
  { pattern: /responsibilities|المسؤوليات|duties|job.?description|وصف/i, value: CV.responsibilities, exclude: /team|project.?name/ },
  { pattern: /summary|about|why|نبذة|ملخص|cover.?letter/i, value: CV.summary },
  { pattern: /job.?title|title|المسمى/i, value: CV.jobTitle },
  { pattern: /employer|company|الشركة/i, value: CV.companyName },
  { pattern: /start.?date|من.?تاريخ/i, value: CV.startDate },

  // --- Personal ---
  { pattern: /national.?id|هوية|رقم.?الهوية|id.?number/i, value: CV.nationalId },
  { pattern: /nationality|جنسية/i, value: CV.nationality },
  { pattern: /date.?of.?birth|birth.?date|تاريخ.?الميلاد|dob/i, value: CV.dob },
  { pattern: /gender|sex|الجنس|النوع/i, value: CV.gender },

  // --- Preferences ---
  { pattern: /salary|راتب|مكافأة/i, value: CV.desiredSalary },
  { pattern: /notice.?period/i, value: CV.noticePeriod },
  { pattern: /experience|خبرة/i, value: '5' },

  // --- Skills ---
  { pattern: /skill|مهار/i, value: CV.mainSkills },

  // --- Misc ---
  { pattern: /issuing|جهة|organization/i, value: CV.issuingOrg },
  { pattern: /language|لغة/i, value: CV.languageNative },
];

// =============================================================================
// SELECT / DROPDOWN SYNONYMS
// =============================================================================
// When matching dropdown <option> text, these synonyms help find the right one.
// =============================================================================

window.__CV_APP.SELECT_SYNONYMS = {
  [CV.country]: ['saudi', 'ksa', 'arabia', 'السعودية'],
  [CV.nationality]: ['saudi', 'سعودي', 'saudian'],
  [CV.gender]: ['male', 'm', 'ذكر'],
  [CV.university]: ['king faisal', 'kfu', 'فيصل'],
  [CV.degree]: ['bachelor', 'bs', 'bsc', 'undergrad', 'بكالوريوس'],
};
