// Personal profile. Values preserved from the user's existing profile.
// Update personal facts only with the user's authorization. Matching rules live in core/.
(() => {
  'use strict';
  globalThis.__CV_APP = globalThis.__CV_APP || {};
globalThis.__CV_APP.CV = {
  firstName: 'Najeeb',
  firstNameAr: 'نجيب',
  middleName: 'Murtadha',
  middleNameAr: 'مرتضى',
  fatherName: 'Murtadha',
  fatherNameAr: 'مرتضى',
  grandfatherName: 'Abdulmohsen',
  grandfatherNameAr: 'عبدالمحسن',
  lastName: 'Almusawi',
  lastNameAr: 'الموسوي',
  fullName: 'Najeeb Murtadha Abdulmohsen Almusawi',
  fullNameAr: 'نجيب مرتضى عبدالمحسن الموسوي',
  displayName: 'Najeeb Almusawi',
  displayNameAr: 'نجيب الموسوي',
  email: 'najeebxalmusawi@gmail.com',
  phone: '+966568199827',
  phoneClean: '966568199827',
  phoneLocal: '0568199827',
  phoneWithoutZero: '568199827',
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
  countryAr: 'المملكة العربية السعودية',
  countryCode: 'SA',
  address: 'Building No. 3754, Street: Kharash Al Kalbi Alsaluli, District: Ar Rashidyah 1st, Postal Code: 36342',
  addressAr: 'مبنى 3754، شارع خراش الكلبي السلولي، حي الراشدية الأولى، الأحساء 36342',
  postalCode: '36342',
  shortAddress: 'FMAH3754',
  fullLocation: 'Al-Ahsa, Eastern Province, Saudi Arabia',
  fullLocationAr: 'الأحساء، المنطقة الشرقية، المملكة العربية السعودية',

  // ─────────────────────────────────────────────
  // SECTION 3: Education & Co-op Details
  // ─────────────────────────────────────────────
  university: 'King Faisal University',
  universityAr: 'جامعة الملك فيصل',
  college: 'College of Computer Science and Information Technology',
  collegeAr: 'كلية علوم الحاسب وتقنية المعلومات',
  degree: 'Bachelor of Computer Information Systems',
  degreeAr: 'بكالوريوس نظم المعلومات الحاسوبية',
  major: 'Computer Information Systems',
  majorAr: 'نظم المعلومات الحاسوبية',
  academicLevel: 'Senior (Expected Graduate)',
  academicLevelAr: 'سنة رابعة / متوقع تخرجه',
  gpa: '2.76',
  gpaScale: '4.0',
  graduationDate: '2026-12-07',
  graduationYear: '2026',
  trainingType: 'Co-op Training',
  trainingTypeAr: 'تدريب تعاوني',
  trainingDuration: '6 months (24 weeks)',
  trainingDurationAr: '6 أشهر (24 أسبوع)',
  trainingStartDate: '2027-01-17',

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
  summary: 'Full-Stack Web Developer with 5 years of hands-on coding experience, specializing for the past 3 years in React and Laravel alongside JavaScript, PHP, and MySQL. Backed by 1 year of professional experience at Vibcoding, I quickly adapt to new technologies and focus on delivering clean, scalable web solutions. Fully available for a 6-month Co-op placement starting January 17, 2027.',

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
  trainingPeriod: '6 months starting January 17, 2027',
  desiredSalary: '4000',

  // ─────────────────────────────────────────────
  // SECTION 11: File References
  // ─────────────────────────────────────────────
  coverLetterFileName: 'KFU COOP Letter.pdf',
  cvFileName: 'My CV NAJEEB ALMUSAWI.pdf',
};
})();
