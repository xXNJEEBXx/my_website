// ========== DATA ==========
const REGION_INFO = {
  sa: { flag: '🇸🇦', label: 'السعودية', visa: 'لا يحتاج', visaLevel: 'easy' },
  gulf: { flag: '🌴', label: 'الخليج', visa: 'سهلة للسعوديين', visaLevel: 'easy' },
  eu: { flag: '🇪🇺', label: 'أوروبا', visa: 'فيزا تدريب / شنغن', visaLevel: 'medium' },
  na: { flag: '🌎', label: 'أمريكا الشمالية', visa: 'J-1 / متوسطة الصعوبة', visaLevel: 'hard' },
  asia: { flag: '🌏', label: 'آسيا', visa: 'متفاوتة', visaLevel: 'medium' },
  remote: { flag: '💻', label: 'عن بعد', visa: 'لا يحتاج', visaLevel: 'easy' },
};

const DEFAULT_COMPANIES = [
  // 🌟 Top Tier Tech Opportunities (Full-Stack / Frontend / Software Engineering)
  { name: 'ByteDance (TikTok)', field: 'Frontend Web Dev', location: 'دبي، الإمارات', salary: 'تنافسية', link: 'https://www.linkedin.com/jobs/view/4365763756/', trackLink: 'https://jobs.bytedance.com/en/position/application', status: 'applied', region: 'gulf', notes: '💡 تم التقديم 16 مارس 2026 — Frontend Software Engineer Project Intern - 2026 Start (BS/MS).' },
  { name: 'Tabby', field: 'Frontend / Backend GO', location: 'الرياض، السعودية', salary: 'مكافأة تنافسية', link: 'https://www.linkedin.com/jobs/view/4383134603/', trackLink: '', status: 'applied', region: 'sa', notes: '💡 تم التقديم 16 مارس 2026. خيار سعودي ممتاز جداً! شاغران (واجهات أمامية وخلفية).' },
  { name: 'QatarEnergy LNG', field: 'IT / تقنية معلومات', location: 'الدوحة، قطر', salary: 'مكافأة مجزية', link: 'https://www.qatarenergylng.qa/english/careers/internship-programmes', trackLink: '', status: 'applied', region: 'gulf', notes: '💡 فرصة نادرة كبرنامج Co-op مخصص (8-24 أسبوع). ⚠️ يغلق 31 مارس 2026. يشترط معدل 3.2 لغير القطريين. تم التقديم 16 مارس 2026.' },
  { name: 'Amazon Web Services (AWS)', field: 'IT / تقنية', location: 'البحرين', salary: 'تنافسية', link: 'https://www.linkedin.com/jobs/view/4369008468/', trackLink: 'https://account.amazon.jobs/en-US/applicant', status: 'applied', region: 'gulf', notes: '💡 ميزتها الكبرى قريبة جداً من الأحساء. تدريب بنية تحتية ومسار توظيف مباشر (Intern-to-Full-Time). تم التقديم 16 مارس 2026.' },

  // ⭐ Mid Tier / FinTech / Analytics (Strong Local Brands)
  { name: 'Al-Raqeeb', field: 'تقنية معلومات / IT', location: 'السعودية', salary: 'غير محدد', link: '', trackLink: '', status: 'applied', region: 'sa', notes: 'تم التقديم بنجاح في 27 أبريل 2026.' },
  { name: 'Tamara', field: 'Product Engineer', location: 'الرياض، السعودية', salary: 'تنافسية', link: 'https://www.linkedin.com/jobs/view/4382371202/', trackLink: '', status: 'applied', region: 'sa', notes: 'برنامج Builders Program. فرصة قوية لمن يحب الـ FinTech وتطوير المنتجات التقنية. تم التقديم 16 مارس 2026.' },
  { name: 'Greenstone', field: 'Full-Stack / AI', location: 'دبي، الإمارات', salary: 'مدفوع', link: 'https://www.linkedin.com/jobs/view/4385378305/', trackLink: '', status: 'applied', region: 'gulf', notes: 'تدريب مدفوع وطويل (6-12 شهر) في الويب والذكاء الاصطناعي وتصميم المنتجات. تم التقديم 16 مارس 2026.' },
  { name: 'Zain Bahrain', field: 'Data Analytics', location: 'المنامة، البحرين', salary: 'غير محدد', link: 'https://www.linkedin.com/jobs/view/4378804032/', trackLink: 'https://careers.zain.com/app-center', status: 'applied', region: 'gulf', notes: 'قريبة من الأحساء. تدريب على استخراج وتحليل بيانات الشبكة الرقمية. تم التقديم 17 مارس 2026.' },
  { name: 'Aon', field: 'IT / Co-op Trainee', location: 'الرياض، السعودية', salary: 'غير محدد', link: 'https://www.linkedin.com/jobs/view/4344433208/', trackLink: '', status: 'applied', region: 'sa', notes: 'شاغر مصمم خصيصاً كـ التدريب التعاوني (Co-op Trainee 2026). تم التقديم 17 مارس 2026.' },

  // 🌍 General Tech / Ops / Remote (Good backup options)
  { name: 'Bosch', field: 'Software Development', location: 'الرياض، السعودية', salary: 'عالمية', link: 'https://jobs.smartrecruiters.com/BoschGroup/744000121713232-software-development-intern', trackLink: '', status: 'applied', region: 'sa', notes: 'تدريب برمجة في فرع شركة بوش التقنية في الرياض. تم التقديم 27 أبريل 2026.' },
  { name: 'Emirates Group', field: 'IT / أنظمة الطيران', location: 'دبي، الإمارات', salary: 'مكافأة', link: 'https://www.linkedin.com/jobs/view/4254325656/', trackLink: '', status: 'applied', region: 'gulf', notes: 'تدريب شامل يشمل هندسة البرمجيات والأنظمة. تم التقديم 17 مارس 2026.' },
  { name: 'EPAM Systems', field: 'Python / تطوير', location: 'الخبر / عن بُعد', salary: 'غير محدد', link: 'https://www.linkedin.com/jobs/view/4386705572/', trackLink: '', status: 'applied', region: 'sa', notes: 'تدريب تقني في الشرقية مع إمكانية العمل عن بُعد. تم التقديم 17 مارس 2026.' },
  { name: 'Parsons Corporation', field: 'Python Developer', location: 'دبي، الإمارات', salary: 'غير محدد', link: 'https://www.linkedin.com/jobs/view/4379991439/', trackLink: '', status: 'applied', region: 'gulf', notes: 'مسار تطوير بلغة بايثون للأنظمة الداخلية. تم التقديم 17 مارس 2026.' },
  { name: 'GAO Tek Inc.', field: 'Software / Web Dev', location: 'عن بُعد', salary: 'مرن', link: 'https://kw.gaotek.com/careers/internships/', trackLink: '', status: 'applied', region: 'remote', notes: 'خيارات تدريب متعددة عن بعد متاحة من الكويت والسعودية. تم التقديم 17 مارس 2026.' },

  // 🏢 Enterprise / Traditional (Banks, Corporate IT)
  { name: 'Raytheon', field: 'IT Analyst', location: 'جدة، السعودية', salary: 'عالمية', link: 'https://www.linkedin.com/jobs/view/4385104491/', trackLink: '', status: 'applied', region: 'sa', notes: 'تدريب كمحلل للأنظمة والتقنية. تم التقديم 18 مارس 2026.' },
  { name: 'SLB (Schlumberger)', field: 'تقنية / عمليات', location: 'البحرين', salary: 'غير محدد', link: 'https://www.linkedin.com/jobs/view/4376085090/', trackLink: '', status: 'applied', region: 'gulf', notes: 'برنامج Early Careers للعمليات الميدانية والأنظمة. تم التقديم 18 مارس 2026.' },
  { name: 'e& UAE (Etisalat)', field: 'IT / Data', location: 'أبوظبي / دبي', salary: 'غير محدد', link: 'https://www.linkedin.com/jobs/view/4214029898/', trackLink: '', status: 'applied', region: 'gulf', notes: 'برنامج "بداياتي" التابع لاتصالات الإمارات. تم التقديم 18 مارس 2026.' },

  { name: 'KUWAIT JOBS', field: 'IT Support / فني', location: 'الكويت', salary: 'غير محدد', link: 'https://www.linkedin.com/jobs/view/4379653410/', trackLink: '', status: 'applied', region: 'gulf', notes: 'وظائف دعم فني ميداني. تم التقديم عبر الإيميل 19 مارس 2026.' },

  // 🇺🇸 أمريكا و 🇩🇪 ألمانيا (تحديث 28 أبريل 2026)

  //  Global Guaranteed Paid Internships (March 22, 2026)
  { name: 'Stripe', field: 'Software Engineer Intern', location: 'سياتل، أمريكا', salary: '$123,500/سنة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4368899506/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 24 مارس 2026. تدريب صيفي مدفوع براتب ضخم. تقنيات: Java, Ruby, Go. شركة مدفوعات عالمية.' },
  { name: 'The Walt Disney Company', field: 'Cloud Governance SWE Intern', location: 'كاليفورنيا، أمريكا', salary: '$42/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4386170406/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 24 مارس 2026. تدريب صيفي على Cloud (AWS/GCP/Azure). راتب ممتاز.' },
  { name: 'Roku', field: 'SWE Intern (Observability/AI)', location: 'كامبريدج، بريطانيا', salary: 'paid 12-week internship', link: 'https://www.linkedin.com/jobs/view/4378632974/', trackLink: '', status: 'applied', region: 'eu', notes: '🌍 تم التقديم 24 مارس 2026. 12 أسبوع. يعمل على AI/LLM و Kubernetes.' },
  { name: 'SAP Germany', field: 'AI Engineer Intern (Working Student)', location: 'فالدورف، ألمانيا', salary: 'paid working student position', link: 'https://www.linkedin.com/jobs/view/4386888442/', trackLink: '', status: 'applied', region: 'eu', notes: '🌍 تم التقديم 24 مارس 2026. يعمل على Voice AI و LLM و Python. مذكورة مدفوعة صراحة.' },
  { name: 'Experian', field: 'AI SWE Summer Intern', location: 'عن بعد (أمريكا)', salary: 'Remote & Paid (مكتوبة بالعنوان)', link: 'https://www.linkedin.com/jobs/view/4388554686/', trackLink: '', status: 'applied', region: 'remote', notes: '🌍 تم التقديم 24 مارس 2026. شركة تحليلات بيانات عالمية. عن بعد بالكامل. يعمل على Python و AI chatbots.' },
  { name: 'Bill360', field: 'Software Engineer Intern', location: 'فلوريدا، أمريكا', salary: '$20/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4387986485/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 24 مارس 2026. تدريب صيفي مدفوع. يعمل على C#, .NET, AWS Serverless.' },
  { name: 'Capital Rx', field: 'Software Engineering Summer Intern', location: 'دنفر، أمريكا', salary: '$20 - $22/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4386880451/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 24 مارس 2026. تدريب صيفي هندسة برمجيات.' },
  { name: 'ByteDance (US)', field: 'Frontend SWE Intern (E-Commerce)', location: 'سياتل، أمريكا', salary: '$42.75/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4308040739/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 24 مارس 2026. الشركة المالكة لـ TikTok. تدريب صيفي 2026. يشترط BS/MS.' },
  { name: 'Enova International', field: 'Software Engineer Intern', location: 'شيكاغو، أمريكا', salary: '$33 - $37/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4386546591/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 24 مارس 2026. تقنيات Ruby و GoLang. تدريب صيفي 10 أسابيع (2026).' },
  // دفعة الفرص الجديدة المدفوعة صراحًة
  { name: 'ZoomInfo', field: 'Software Engineer Intern', location: 'ماتشوستس، أمريكا (هجين)', salary: '$30-35/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4398044905/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 8 أبريل 2026. شركة ذكاء أعمال، تدريب في تطوير البرمجيات.' },
  { name: 'Sentry', field: 'Software Engineer Intern', location: 'سان فرانسيسكو، أمريكا (مكتبي)', salary: '$53.13/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4395366725/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 8 أبريل 2026. شركة مراقبة أخطاء البرمجيات المعروفة. تدريب عملي قوي لمدة 12 أسبوع.' },

  // فرص 27 أبريل 2026 ضمن الدول المستهدفة فقط
  { name: 'Dassault Systèmes', field: 'Software Engineer Intern', location: 'سلاغور ماليزيا', salary: 'مدفوع', link: 'https://www.linkedin.com/jobs/view/4371400598/', trackLink: '', status: 'applied', region: 'asia', notes: '🇲🇾 شركة برمجيات أوروبية عملاقة، هجين. تم التقديم 27 أبريل 2026.' },
  { name: 'Ant International', field: 'Backend Software Eng Intern', location: 'كوالالمبور ماليزيا', salary: 'مدفوع', link: 'https://www.linkedin.com/jobs/view/4405059993/', trackLink: '', status: 'applied', region: 'asia', notes: '🇲🇾 شركة تابعة لـ Alibaba العالمية، حضوري' },
  { name: 'Experian', field: 'Software Engineering Intern', location: 'سايبرجايا ماليزيا', salary: 'مدفوع', link: 'https://www.linkedin.com/jobs/view/4398368470/', trackLink: '', status: 'applied', region: 'asia', notes: '🇲🇾 شركة عالمية في مجال تحليل البيانات، هجين' },
  { name: 'Bybit', field: 'Test Engineer Intern', location: 'كوالالمبور ماليزيا', salary: 'مدفوع', link: 'https://www.linkedin.com/jobs/view/4399629624/', trackLink: '', status: 'applied', region: 'asia', notes: '🇲🇾 منصة ضخمة لتجارة العملات المشفرة، حضوري' },
  { name: 'Averis', field: 'Software Engineer Intern', location: 'كوالالمبور ماليزيا', salary: 'مدفوع', link: 'https://www.linkedin.com/jobs/view/4395970307/', trackLink: '', status: 'applied', region: 'asia', notes: '🇲🇾 حضوري' },
  { name: 'AIA Digital+', field: 'Intern, Power Platform', location: 'كوالالمبور ماليزيا', salary: 'مدفوع', link: 'https://www.linkedin.com/jobs/view/4401817642/', trackLink: '', status: 'applied', region: 'asia', notes: '🇲🇾 الذراع التقني لشركة التأمين الضخمة AIA' },
  { name: 'Upvest', field: 'Trainee Software Engineer', location: 'تالين إستونيا', salary: 'Salaried', link: 'https://www.linkedin.com/jobs/view/4397554914/', trackLink: '', status: 'applied', region: 'eu', notes: '🇪🇪 شركة FinTech مدعومة من BlackRock و Tencent' },
  { name: 'Cisco Frontend', field: 'Frontend Software Engineer Intern', location: 'كراكوف بولندا', salary: 'مدفوع', link: 'https://www.linkedin.com/jobs/view/4404060928/', trackLink: '', status: 'applied', region: 'eu', notes: '🇵🇱 تركيز على הـ Frontend والـ React/TS' },
  { name: 'Cisco Backend', field: 'Backend/Fullstack Software Intern', location: 'كراكوف بولندا', salary: 'مدفوع', link: 'https://www.linkedin.com/jobs/view/4404068860/', trackLink: '', status: 'applied', region: 'eu', notes: '🇵🇱 تقبل الخبراء والمبتدئين، بيئة تطوير ممتازة. تم التقديم 28 أبريل 2026.' },
  { name: 'Visa', field: 'Cybersecurity Operations Intern', location: 'وارسو بولندا', salary: 'مدفوع', link: 'https://www.linkedin.com/jobs/view/4405802879/', trackLink: '', status: 'applied', region: 'eu', notes: '🇵🇱 فرصة استثنائية في الـ Cybersecurity. تم التقديم 28 أبريل 2026.' },
  { name: 'Sift', field: 'Software Engineer Intern', location: 'سان فرانسيسكو، أمريكا (هجين/مكتبي)', salary: '$50-60/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4380175135/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 8 أبريل 2026. شركة حماية من الاحتيال. فرصة للعمل مع أنظمة كبيرة.' },
  { name: 'G2', field: 'Software Engineer Intern', location: 'شيكاغو، أمريكا (هجين/عن بعد)', salary: '$24/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4378644108/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 8 أبريل 2026. منصة المراجعات الشهيرة G2. تدريب صيفي.' },
  { name: 'IXL Learning', field: 'Software Engineer Intern', location: 'نورث كارولينا، أمريكا (مكتبي)', salary: '$40-54.80/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4394710050/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 8 أبريل 2026. شركة تقنيات تعليمية.' },
  { name: 'Cadence', field: 'Software Engineering Intern', location: 'تكساس، أمريكا (مكتبي)', salary: '$44.23-66.35/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4389304044/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 8 أبريل 2026. شركة تقنيات وتصميم إلكتروني.' },
  { name: 'Arcesium', field: 'Software Engineer Intern', location: 'نيويورك، أمريكا (هجين)', salary: '$55.00/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4390238983/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 8 أبريل 2026. شركة تقنيات مالية وإدارة بيانات.' },
  { name: 'Ironclad', field: 'Software Engineer Intern', location: 'سان فرانسيسكو، أمريكا (هجين)', salary: '$50/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4367351581/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 8 أبريل 2026. شركة إدارة عقود بالذكاء الاصطناعي.' },
  { name: 'Adobe', field: 'Software Engineer Intern', location: 'كاليفورنيا، أمريكا (هجين)', salary: '$45-55/ساعة (مذكورة صراحة)', link: 'https://www.linkedin.com/jobs/view/4321224329/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 تم التقديم 8 أبريل 2026. تدريب صيفي شامل وتنافسي.' },

  // الدفعة الثالثة: فرص إضافية واضحة الدفع (10 فرص جديدة)
  { name: 'Whatnot', field: 'Software Engineer Intern', location: 'سياتل، أمريكا (هجين)', salary: '$65/ساعة (مذكورة)', link: 'https://www.linkedin.com/jobs/view/4381887798/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 أُضيفت 8 أبريل 2026. تم التقديم 8 أبريل 2026. تدريب صيفي مدفوع بأجر عالي، تقنيات البث المباشر.' },
  { name: 'Udemy', field: 'Front End SWE Intern', location: 'تكساس، أمريكا (مكتبي)', salary: '$52/ساعة (مذكورة)', link: 'https://www.linkedin.com/jobs/view/4383881023/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 أُضيفت 8 أبريل 2026. شركة يوديمي للتعليم، هندسة واجهات أمامية. تم التقديم.' },
  { name: 'Neuralink', field: 'SWE Intern, Internal Apps', location: 'كاليفورنيا، أمريكا (مكتبي)', salary: '$35/ساعة (مذكورة)', link: 'https://www.linkedin.com/jobs/view/4384617179/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 أُضيفت 8 أبريل 2026. شركة إيلون ماسك للتقنيات العصبية. تم التقديم.' },
  { name: 'Xometry', field: 'Software Engineer Intern', location: 'ماريلاند، أمريكا (هجين)', salary: '$27/ساعة (مذكورة)', link: 'https://www.linkedin.com/jobs/view/4345001825/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 أُضيفت 8 أبريل 2026. تطوير منصة تصنيع للأعمال. تم التقديم.' },
  { name: 'Stripe', field: 'Software Engineer Intern', location: 'نيويورك، أمريكا (هجين)', salary: 'مكافأة عالية (مذكورة)', link: 'https://www.linkedin.com/jobs/view/4369001494/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 أُضيفت 8 أبريل 2026. من أقوى التدريبات عالمياً وأعلاها أجراً. تم التقديم.' },
  { name: 'Farm Credit Financial', field: 'Software Engineer Intern', location: 'ماتشوستس، أمريكا (هجين)', salary: 'تنافسية/مدفوعة بالوصف', link: 'https://www.linkedin.com/jobs/view/4394993113/', trackLink: '', status: 'applied', region: 'na', notes: '🌍 أُضيفت 8 أبريل 2026. تطوير برمجيات في القطاع المالي. تم التقديم.' },
  { name: 'شركة حمد محمد الرقيب وأولاده', field: 'تدريب تعاوني وصيفي', location: 'عدة مدن (السعودية)', salary: 'غير محدد', link: 'https://careers.alrugaibsa.com/jobs/7488678-co-op-summer-internship', trackLink: '', status: 'applied', region: 'sa', notes: 'تخصصات غير محددة.' },
  { name: 'Bain & Company', field: 'Co-op Program', location: 'متعدد (الشرق الأوسط)', salary: 'غير محدد', link: 'https://www.bain.com/careers/work-with-us/internships-programs/coop/', trackLink: '', status: 'applied', region: 'gulf', notes: 'برنامج تدريب تعاوني في شركة استشارات عالمية.' },
  { name: 'FlxCode', field: 'Summer Training & Co-op', location: 'السعودية', salary: 'غير محدد', link: 'https://docs.google.com/forms/d/e/1FAIpQLScYXoogJavRUA1nt7-dkBdLbzKrqtDL7g7wRCxWrDxAfnyFHQ/viewform', trackLink: '', status: 'applied', region: 'sa', notes: 'نموذج جوجل.' },

  // 🇸🇦 فرص من Ranked_Jobs.md — الوظائف المتبقية (11 مايو 2026)
  { name: 'شركة الخريف لتقنية المياه والطاقة', field: 'تقنية معلومات / نظم معلومات', location: 'الأحساء / الرياض', salary: 'غير مذكور', link: 'https://q.me-qr.com/FJ28NlB0', trackLink: '', status: 'applied', region: 'sa', notes: 'تدريب تعاوني — فرع بالأحساء. توافق: 88. تم التقديم 12 مايو 2026' },
  { name: 'AVA (A Virtual Advantage)', field: 'FinTech / تقنية مالية', location: 'جدة / عن بُعد', salary: 'غير مذكور', link: 'https://forms.gle/ft7wDhcnUtmEZzsH7', trackLink: '', status: 'applied', region: 'sa', notes: 'شركة ناشئة توفر تدريب أونلاين في الـ FinTech. توافق: 85. تم التقديم 12 مايو 2026' },
  { name: 'كوقنا (Cognna)', field: 'أمن سيبراني (SOC)', location: 'الرياض / عن بعد', salary: 'يوجد مكافأة', link: 'https://forms.gle/xDn1YeqHQ2RpnxkL8', trackLink: '', status: 'applied', region: 'sa', notes: 'تدريب تقني عالي المستوى في مركز العمليات الأمنية. توافق: 82. تم التقديم 12 مايو 2026' },
  { name: 'Table Knight Games', field: 'تطوير ألعاب', location: 'عن بعد', salary: 'مكافأة شهرية', link: 'https://url.tableknightgames.com/jobs', trackLink: '', status: 'applied', region: 'remote', notes: 'تطوير ألعاب عن بعد. توافق: 78. تم التقديم 12 مايو 2026' },
  { name: 'Netways', field: 'تحليل أعمال / إدارة مشاريع تقنية', location: 'عن بعد', salary: 'غير مذكور', link: 'https://forms.gle/xGDkYzk9NAkruAVF7', trackLink: '', status: 'applied', region: 'remote', notes: 'شركة تقنية مميزة. توافق: 73. تم التقديم 12 مايو 2026' },
  { name: 'توقاذر (Together)', field: 'تدريب تعاوني', location: 'الأحساء', salary: 'غير مذكور', link: 'https://docs.google.com/forms/d/e/1FAIpQLSd2BO65EMePVy_wB0BmIhzSYLz4R9ERDIyFUqFxhyabmuacDA/viewform', trackLink: '', status: 'applied', region: 'sa', notes: 'شركة بالأحساء تطلب متدربين. توافق: 68. تم التقديم 12 مايو 2026' },
  { name: 'كير لينك (Careerlink)', field: 'تدريب تعاوني / مهني', location: 'عن بُعد', salary: 'غير مذكور', link: 'https://docs.google.com/forms/d/e/1FAIpQLSc7BlhYe5F6Ps3Jre8MUJvg4HecrXC1H7z32_ub3DM6or3MEw/viewform', trackLink: '', status: 'applied', region: 'remote', notes: 'برنامج تدريب تعاوني عن بعد. توافق: 45. تم التقديم 12 مايو 2026' },
  { name: 'مبادرة مِراس (Meras)', field: 'تدريب افتراضي', location: 'عن بُعد', salary: 'مجاني', link: 'http://joinmeras.com', trackLink: '', status: 'applied', region: 'remote', notes: 'مبادرة لتدريب الطلاب عن بعد مع شركات كبرى. توافق: 43. تم التقديم 12 مايو 2026' },
  { name: 'شركة نقطه صعود', field: 'تدريب تعاوني (Co-op)', location: 'عن بعد أو حضوري', salary: 'غير مذكور', link: 'https://forms.gle/avQLD8i81zs9PS3w5', trackLink: '', status: 'applied', region: 'sa', notes: 'برنامج تدريب تعاوني عام. توافق: 40. تم التقديم 12 مايو 2026' },
  { name: 'شركة التكامل الثلاثي', field: 'منسق علاقات مؤثرين', location: 'عن بُعد', salary: 'غير مذكور', link: 'https://forms.gle/49sjdQXuaGP2smLA8', trackLink: '', status: 'applied', region: 'remote', notes: 'عمل عن بعد، غير تقني. توافق: 35. تم التقديم 12 مايو 2026' },
  { name: 'HUMAN Organization', field: 'سوشيل ميديا', location: 'عن بعد', salary: 'غير مذكور', link: 'https://forms.gle/UT7ekoP5rg1UBHHQ8', trackLink: '', status: 'applied', region: 'remote', notes: 'إدارة حسابات تواصل اجتماعي عن بعد. توافق: 30. تم التقديم 12 مايو 2026' },
  { name: 'شركة إدارة مرافق كبرى', field: 'تقنية معلومات', location: 'الأحساء / مدن أخرى', salary: 'غير مذكور', link: 'https://docs.google.com/forms/d/15FSTAys_5glWlVmF1MrJfHOOEM0nbwjchpb2MnRFdso/viewform', trackLink: '', status: 'applied', region: 'sa', notes: 'تشمل تخصصات IT في الأحساء. توافق: 28. تم التقديم 12 مايو 2026' },
  { name: 'جايكُم (Jaicome)', field: 'تدريب مهني', location: 'المنطقة الشرقية', salary: 'مكافأة تخرج + عمولة', link: 'https://jaicome.com/career', trackLink: '', status: 'applied', region: 'sa', notes: 'برنامج تدريبي في المنطقة الشرقية. توافق: 15. تم التقديم 12 مايو 2026' },
  { name: 'تدريب قانون/إعلام (غير محدد)', field: 'قانون / إعلام', location: 'الخبر والأحساء', salary: 'غير مذكور', link: 'https://forms.gle/x8HHf8V53mAHHqTp8', trackLink: '', status: 'applied', region: 'sa', notes: 'الموقع ممتاز لكن التخصصات بعيدة عن IT. توافق: 10. تم التقديم 12 مايو 2026' },
  // --- شركات الأحساء والمنطقة الشرقية (التواصل المباشر) ---
  { name: 'كودو (Kudu)', field: 'تقنية معلومات / تدريب تعاوني', location: 'الأحساء', salary: 'غير مذكور', link: '', trackLink: '', status: 'applied', region: 'sa', notes: '📌 إيميل تدريب تعاوني مخصص. تم الإرسال إلى cooptraining@kudu.com.sa — 12 مايو 2026' },
  { name: 'مستشفيات المانع', field: 'تقنية معلومات / أنظمة مستشفيات', location: 'الأحساء', salary: 'غير مذكور', link: 'https://almanahospital.com.sa/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم الإرسال إلى Career@almanahospital.com.sa — 12 مايو 2026' },
  { name: 'أسواق العثيم', field: 'تقنية معلومات / دعم فني', location: 'الأحساء', salary: 'غير مذكور', link: 'https://www.othaim.com.sa/ar/join-us', trackLink: '', status: 'applied', region: 'sa', notes: '📌 سلسلة تجزئة كبرى — فروع بالأحساء. تم التقديم 12 مايو 2026' },
  { name: 'مجمع الموسى الطبي', field: 'تقنية معلومات / أنظمة مستشفيات', location: 'الأحساء', salary: 'غير مذكور', link: 'https://almoosa.com/en/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم الانضمام لـ Talent Community — بوابة Oracle Cloud. 12 مايو 2026' },
  { name: 'غرفة الأحساء التجارية', field: 'تقنية معلومات', location: 'الأحساء', salary: 'غير مذكور', link: 'https://www.hcci.org.sa', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم عبر النموذج الإلكتروني. 12 مايو 2026' },
  { name: 'مجموعة العامر', field: 'تقنية / إدارة أنظمة', location: 'الأحساء', salary: 'غير مذكور', link: '', trackLink: '', status: 'applied', region: 'sa', notes: '📌 مجموعة تجارية كبرى بالأحساء. تواصل مباشر (زيارة/واتساب). تم التقديم 18 مايو 2026.' },
  { name: 'بنك البلاد', field: 'تدريب تعاوني / IT', location: 'الأحساء', salary: 'غير مذكور', link: 'https://www.bankalbilad.com.sa', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم 12 مايو 2026. شرط المعدل 3/5 — قريب من معدلك.' },
  { name: 'بنك الإمارات دبي الوطني', field: 'تدريب تعاوني / IT', location: 'الأحساء', salary: 'غير مذكور', link: 'https://www.emiratesnbd.com/ar/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم عبر بوابة التوظيف. 12 مايو 2026' },
  { name: 'وادي الأحساء للاستثمار', field: 'تقنية معلومات', location: 'الأحساء', salary: 'غير مذكور', link: 'https://alahsavalley.com.sa/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 الذراع الاستثماري لجامعة الملك فيصل! تم الإرسال إلى info@avic.com.sa — 12 مايو 2026' },
  { name: 'أمانة الأحساء', field: 'تدريب تعاوني / IT', location: 'الأحساء', salary: 'غير مذكور', link: 'https://my.gov.sa', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم 12 مايو 2026.' },
  { name: 'هيئة الحكومة الرقمية (DGA)', field: 'برنامج ميدان - IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://dga.gov.sa', trackLink: '', status: 'applied', region: 'sa', notes: '📌 موقعهم يعلق (عبر بوابة Talentera).' },
  { name: 'البنك الأهلي السعودي (SNB)', field: 'تدريب تعاوني / IT', location: 'الشرقية / متعدد', salary: 'غير مذكور', link: 'https://www.alahli.com/ar-sa/pages/careers.aspx', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم عبر البوابة الرسمية.' },
  { name: 'مصرف الإنماء', field: 'تدريب تعاوني / IT', location: 'الشرقية / متعدد', salary: 'غير مذكور', link: 'https://careers.alinma.com/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم عبر البوابة الرسمية.' },
  { name: 'بنك الرياض', field: 'تدريب تعاوني / IT', location: 'الشرقية / متعدد', salary: 'غير مذكور', link: 'https://www.riyadbank.com/ar/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم عبر البوابة الرسمية.' },
  
  // --- شركات الاتصالات وبنوك إضافية ---
  { name: 'بنك الأول (SAB)', field: 'تدريب تعاوني / IT', location: 'الشرقية / متعدد', salary: 'غير مذكور', link: 'https://www.sab.com/ar/about-us/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم عبر بوابة التوظيف الرسمية لبنك ساب.' },
  { name: 'البنك العربي الوطني (ANB)', field: 'تدريب تعاوني / IT', location: 'الشرقية / متعدد', salary: 'غير مذكور', link: 'https://www.anb.com.sa/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التسجيل ورفع السيرة الذاتية في منصة البنك (Talent Pool).' },
  { name: 'البنك السعودي للاستثمار (SAIB)', field: 'تدريب تعاوني / IT', location: 'الشرقية / متعدد', salary: 'غير مذكور', link: 'https://www.saib.com.sa/ar/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التسجيل ورفع السيرة الذاتية في منصة البنك.' },
  { name: 'شركة STC', field: 'تدريب تعاوني / IT', location: 'الأحساء / الشرقية', salary: 'غير مذكور', link: 'https://www.stc.com.sa/content/stc/sa/en/careers.html', trackLink: '', status: 'applied', region: 'sa', notes: '📌 التقديم عبر بوابة STC للتوظيف. (تم التقديم)' },
  { name: 'موبايلي (Mobily)', field: 'تدريب تعاوني / IT', location: 'الأحساء / الشرقية', salary: 'غير مذكور', link: 'https://www.mobily.com.sa/wps/portal/web/personal/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 التقديم عبر بوابة موبايلي. (تم التقديم)' },
  { name: 'زين السعودية (Zain KSA)', field: 'تدريب تعاوني / IT', location: 'الأحساء / الشرقية', salary: 'غير مذكور', link: 'https://careers.sa.zain.com/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 التقديم عبر بوابة زين للتوظيف. (تم التقديم)' },
  
  // --- البنوك وشركات التقنية المالية (FinTech) المضافة حديثاً ---
  { name: 'مصرف الراجحي', field: 'تدريب تعاوني / IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://careers.alrajhibank.com.sa/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 التقديم عبر بوابة الراجحي للتوظيف. (تم التقديم)' },
  { name: 'البنك السعودي الفرنسي', field: 'تدريب تعاوني / IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://careers.alfransi.com.sa/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 التقديم عبر بوابة البنك السعودي الفرنسي. (الموقع متعطل - تم التجاوز)' },
  { name: 'بنك الجزيرة', field: 'تدريب تعاوني / IT', location: 'متعدد', salary: 'غير مذكور', link: 'https://careers.bankaljazira.com/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 التقديم عبر بوابة بنك الجزيرة. (تم التقديم)' },
  { name: 'الإنماء باي (AlinmaPay)', field: 'تدريب تعاوني / FinTech', location: 'الرياض', salary: 'غير مذكور', link: 'https://www.alinmapay.com/ar/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 التقنية المالية التابعة لمصرف الإنماء. (تم التقديم)' },
  { name: 'Urpay', field: 'تدريب تعاوني / FinTech', location: 'الرياض', salary: 'غير مذكور', link: 'https://urpay.com.sa/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 محفظة الراجحي الرقمية. (تجاوز - لا يوجد شواغر)' },
  { name: 'Stcpay', field: 'تدريب تعاوني / FinTech', location: 'الرياض', salary: 'غير مذكور', link: 'https://careers.stcpay.com.sa/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 المحفظة الرقمية التابعة لـ STC. (تجاوز - لا يوجد شواغر)' },
  { name: 'Tiqmo', field: 'تدريب تعاوني / FinTech', location: 'الرياض', salary: 'غير مذكور', link: 'https://tiqmo.com/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 منصة مدفوعات رقمية. (تجاوز - لا يوجد شواغر)' },
  { name: 'HALA', field: 'تدريب تعاوني / FinTech', location: 'الرياض', salary: 'غير مذكور', link: 'https://hala.com/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 منصة مالية رقمية. (تم التقديم في مسبح المواهب)' },
  { name: 'NEO', field: 'تدريب تعاوني / FinTech', location: 'الرياض', salary: 'غير مذكور', link: '', trackLink: '', status: 'applied', region: 'sa', notes: '📌 محفظة / بنك رقمي. تم التقديم 18 مايو 2026.' },
  { name: 'موبايلي باي (Mobily Pay)', field: 'تدريب تعاوني / FinTech', location: 'الرياض', salary: 'غير مذكور', link: 'https://mobilypay.com/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 المحفظة الرقمية الخاصة بموبايلي. (لا يوجد شواغر - تم التقديم 18 مايو 2026)' },
  { name: 'ميم (Meem)', field: 'تدريب تعاوني / IT', location: 'متعدد', salary: 'غير مذكور', link: 'https://meem.com.sa/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 البنك الرقمي التابع لبنك الخليج الدولي (GIB). (لا يوجد شواغر - تم التقديم 18 مايو 2026)' },
  { name: 'D360 Bank', field: 'تدريب تعاوني / FinTech', location: 'الرياض', salary: 'غير مذكور', link: 'https://d360.com/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 بنك رقمي تحت التأسيس. (تم التقديم في مسبح المواهب 16 مايو 2026)' },
  { name: 'TeleMoney', field: 'تدريب تعاوني / FinTech', location: 'متعدد', salary: 'غير مذكور', link: '', trackLink: '', status: 'applied', region: 'sa', notes: '📌 خدمات التحويل التابعة للبنك العربي (ANB). (مشمولة مع تقديم ANB)' },
  
  // --- شركات مضافة من الخطة المحلية (بوابات إلكترونية / أونلاين) ---
  { name: 'تجمع الأحساء الصحي', field: 'تقنية معلومات / IT', location: 'الأحساء', salary: 'حكومي', link: 'https://my.gov.sa', trackLink: '', status: 'applied', region: 'sa', notes: '📌 التقديم عبر بوابة وزارة الصحة / النفاذ الوطني. (البوابة غير متاحة - تم التقديم 18 مايو 2026)' },
  { name: 'مجموعة بن داود (بندة / الدانوب)', field: 'تقنية معلومات / IT', location: 'الأحساء', salary: 'غير مذكور', link: 'https://bindawood.com/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 سلسلة تجزئة ضخمة. (تم التسجيل في مسبح المواهب 17 مايو 2026)' },
  { name: 'كارفور (ماجد الفطيم)', field: 'تقنية معلومات / IT', location: 'الأحساء', salary: 'غير مذكور', link: 'https://www.majidalfuttaim.com/en/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 التقديم عبر بوابة ماجد الفطيم. (تم التسجيل بمجتمع المواهب 17 مايو 2026)' },
  { name: 'هرفي (Herfy)', field: 'دعم فني / IT', location: 'الشرقية / الأحساء', salary: 'غير مذكور', link: 'https://www.herfy.com/ar/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 التقديم عبر البوابة. (تم التقديم كـ محلل بيانات 17 مايو 2026)' },
  { name: 'شاورمر (Shawarmer)', field: 'تقنية معلومات', location: 'الشرقية / الأحساء', salary: 'غير مذكور', link: 'https://www.shawermaco.com/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 أنظمة رقمية وإدارة فروع. (تم التقديم عبر ZenATS 17 مايو 2026)' },
  { name: 'ماكدونالدز (الرياض الدولية)', field: 'تقنية معلومات', location: 'الشرقية / الأحساء', salary: 'غير مذكور', link: 'https://www.riyadh-foods.com/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 لها فروع متعددة بالمنطقة. (تم التقديم 17 مايو 2026)' },
  { name: 'سراكو للموارد البشرية', field: 'IT / توظيف', location: 'الشرقية', salary: 'غير مذكور', link: '', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تقديم عبر الإيميل: info@sracohr.com (تم الإرسال آلياً 17 مايو 2026)' },

  // --- شركات التوصيل والنقل (Delivery & Ride-hailing) ---
  { name: 'هنقرستيشن (HungerStation)', field: 'تقنية معلومات / IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://careers.hungerstation.com/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 شركة توصيل رائدة تابعة لـ Delivery Hero. (تم التقديم 18 مايو 2026)' },
  { name: 'كريم (Careem)', field: 'تقنية معلومات / IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://careers.careem.com', trackLink: '', status: 'applied', region: 'sa', notes: '📌 النقل التشاركي وتوصيل الطلبات. (تم التقديم 18 مايو 2026)' },
  { name: 'جيني (Jeeny)', field: 'تقنية معلومات / IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://jeeny.me/en/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تطبيق حجز المشاوير والتوصيل. تم التقديم 18 مايو 2026.' },
  { name: 'بولت (Bolt)', field: 'تقنية معلومات / IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://bolt.eu/en/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تطبيق النقل التشاركي. تم التقديم على Field Application Engineering Intern (Tallinn). 18 مايو 2026.' },
  { name: 'مرسول (Mrsool)', field: 'تقنية معلومات / IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://mrsool.co/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تطبيق توصيل محلي رائد. تم التقديم 18 مايو 2026.' },

  // 🛒 تجزئة إلكترونيات وهايبرماركت
  { name: 'إكسترا (eXtra)', field: 'تقنية معلومات / IT', location: 'الأحساء / الشرقية', salary: 'غير مذكور', link: 'https://www.extra.com/ar-sa/careers', trackLink: '', status: 'failed', region: 'sa', notes: '📌 فشل 25 مايو: الرابط يعطي 404 (Domain not resolved).' },
  { name: 'مكتبة جرير', field: 'تقنية معلومات / IT', location: 'الأحساء / الشرقية', salary: 'غير مذكور', link: 'https://www.jarir.com/sa-ar/careers', trackLink: '', status: 'draft_ready', region: 'sa', notes: '📌 فروع متعددة بالأحساء والمنطقة الشرقية. (تم تعبئة الفورم لكن لم يقدم)' },
  { name: 'ساكو (SACO)', field: 'تقنية معلومات / IT', location: 'الشرقية', salary: 'غير مذكور', link: 'https://www.saco.com.sa/en/careers', trackLink: '', status: 'failed', region: 'sa', notes: '📌 فشل 25 مايو: ERR_NAME_NOT_RESOLVED.' },
  { name: 'نون (Noon)', field: 'تقنية / تطوير برمجيات', location: 'الرياض', salary: 'غير مذكور', link: 'https://www.noon.com/saudi-en/careers/', trackLink: '', status: 'failed', region: 'sa', notes: '📌 فشل 25 مايو: يحول إلى صفحة 404 في موقع آخر.' },
  { name: 'نمشي (Namshi)', field: 'تقنية / تطوير برمجيات', location: 'الرياض / دبي', salary: 'غير مذكور', link: 'https://careers.namshi.com/', trackLink: '', status: 'failed', region: 'sa', notes: '📌 فشل 25 مايو: ERR_NAME_NOT_RESOLVED.' },

  // ☕ سلاسل القهوة والمطاعم (IT / رقمي)
  { name: 'مجموعة أمريكانا (Americana)', field: 'تقنية معلومات / IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://www.americanarestaurants.com/en/careers', trackLink: '', status: 'failed', region: 'sa', notes: '📌 فشل 25 مايو: يحول عشوائياً إلى بوابات جرير والشايع.' },
  { name: 'مجموعة الشايع (Alshaya)', field: 'تقنية معلومات / IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://careers.alshaya.com/', trackLink: '', status: 'draft_ready', region: 'sa', notes: '📌 تدير ستاربكس، كوستا، H&M، وعشرات العلامات التجارية.' },
  { name: 'فوديكس (Foodics)', field: 'SaaS / تطوير برمجيات', location: 'الرياض', salary: 'غير مذكور', link: 'https://foodics.com/careers/', trackLink: '', status: 'draft_ready', region: 'sa', notes: '📌 شركة تقنية سعودية رائدة في نظم إدارة المطاعم — فرص تقنية ممتازة.' },
  { name: 'جاهز (Jahez)', field: 'تقنية معلومات / IT', location: 'الرياض / متعدد', salary: 'غير مذكور', link: 'https://jahez.net/careers', trackLink: '', status: 'draft_ready', region: 'sa', notes: '📌 منصة توصيل طعام سعودية محلية مدرجة في تداول. (تتطلب تسجيل دخول)' },
  { name: 'ميل (Meal)', field: 'تقنية معلومات / IT', location: 'الأحساء / الشرقية', salary: 'غير مذكور', link: '', trackLink: '', status: 'none', region: 'sa', notes: '📌 تطبيق طعام محلي في الأحساء — تواصل مباشر.' },

  // 🛍️ تجارة إلكترونية ومنصات رقمية سعودية
  { name: 'سلة (Salla)', field: 'تطوير برمجيات / SaaS', location: 'الرياض', salary: 'غير مذكور', link: 'https://salla.com/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم.' },
  { name: 'زد (Zid)', field: 'تطوير برمجيات / SaaS', location: 'الرياض', salary: 'غير مذكور', link: 'https://zid.sa/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم.' },
  { name: 'رِواء (Rewaa)', field: 'تطوير برمجيات / SaaS', location: 'الرياض', salary: 'غير مذكور', link: 'https://rewaatech.com/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم.' },
  { name: 'حراج (Haraj)', field: 'تطوير برمجيات / IT', location: 'الرياض', salary: 'غير مذكور', link: 'https://haraj.com.sa/careers', trackLink: '', status: 'none', region: 'sa', notes: '📌 أكبر منصة بيع وشراء مستعمل سعودية.' },

  // 🏭 طاقة وصناعة كبرى
  { name: 'أرامكو السعودية (Aramco)', field: 'تقنية معلومات / IT', location: 'الأحساء / الدمام', salary: 'عالية جداً', link: 'https://www.aramco.com/en/careers/students-and-graduates', trackLink: '', status: 'applied', region: 'sa', notes: '📌 أكبر شركة في العالم — برنامج Co-op تنافسي جداً. الأحساء هي موطنها الأصلي! تم التقديم.' },
  { name: 'سابك (SABIC)', field: 'تقنية معلومات / IT', location: 'الجبيل / الشرقية', salary: 'مجزية', link: 'https://www.sabic.com/en/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التسجيل في Talent Community (IT). تم التقديم 18 مايو 2026.' },
  { name: 'الشركة السعودية للكهرباء (SEC)', field: 'تقنية معلومات / IT', location: 'الأحساء / الشرقية', salary: 'حكومي', link: 'https://careers.se.com.sa/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 لا يوجد شواغر حالياً — تم التقديم عبر برنامج التدريب الصناعي. 18 مايو 2026.' },
  { name: 'أكوا باور (ACWA Power)', field: 'تقنية / طاقة متجددة', location: 'الرياض', salary: 'تنافسية', link: 'https://www.acwapower.com/en/careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التسجيل في Talent Pool — بيانات شخصية وخبرات وتعليم مكتملة. 18 مايو 2026.' },

  // 🏛️ حكومي وشبه حكومي
  { name: 'شركة عِلم (Elm)', field: 'تقنية معلومات / برمجيات', location: 'الرياض / متعدد', salary: 'حكومي تنافسي', link: 'https://www.elm.sa/ar/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم الانضمام لـ Talent Community (SuccessFactors). 18 مايو 2026.' },
  { name: 'شركة NEOM', field: 'تقنية / ذكاء اصطناعي', location: 'تبوك', salary: 'عالية', link: 'https://www.neom.com/en-us/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم الانضمام لـ Talent Network. 18 مايو 2026.' },
  { name: 'رَوشن (Roshn)', field: 'تقنية / تحول رقمي', location: 'الرياض / متعدد', salary: 'تنافسية', link: 'https://careers.roshn.sa/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التقديم على Specialist, Data Steward — Oracle HCM. جميع الأقسام مكتملة. 18 مايو 2026.' },
  { name: 'هيئة الزكاة والضريبة (ZATCA)', field: 'تقنية معلومات / IT', location: 'الرياض / متعدد', salary: 'حكومي', link: 'https://zatca.gov.sa/ar/Careers/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم إنشاء حساب في بوابة ZATCA وإكمال التسجيل. 18 مايو 2026.' },
  { name: 'بنك التنمية الاجتماعية (SDB)', field: 'تقنية معلومات / IT', location: 'الرياض / متعدد', salary: 'حكومي', link: 'https://sdb.gov.sa/ar/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم تقديم السيرة الذاتية عبر بوابة SDB. 18 مايو 2026.' },

  // ✈️ طيران ولوجستيات
  { name: 'الخطوط السعودية (Saudia)', field: 'تقنية معلومات / IT', location: 'جدة / الشرقية', salary: 'غير مذكور', link: 'https://www.saudiairlines.com/ar/pages/careers.page', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم إنشاء حساب في بوابة الخطوط — يحتاج تفعيل عبر الإيميل. 18 مايو 2026.' },
  { name: 'فلاي أديل (flyadeal)', field: 'تقنية معلومات / IT', location: 'جدة / الرياض', salary: 'غير مذكور', link: 'https://www.flyadeal.com/en/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم إنشاء حساب في بوابة flyadeal — يحتاج تفعيل الإيميل ثم رفع السيرة الذاتية. 18 مايو 2026.' },
  { name: 'أرامكس (Aramex)', field: 'تقنية معلومات / لوجستيات', location: 'الشرقية / متعدد', salary: 'غير مذكور', link: 'https://www.aramex.com/us/en/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم إنشاء حساب في SuccessFactors وتعبئة البيانات. يحتاج رفع CV. 18 مايو 2026.' },
  { name: 'البريد السعودي (سبل / SPL)', field: 'تقنية معلومات / لوجستيات', location: 'الأحساء / متعدد', salary: 'حكومي', link: 'https://www.spl.com.sa/ar/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 برنامج إتمام مغلق حالياً — التقديم عبر جدارات (يتطلب نفاذ). 18 مايو 2026.' },

  // 💊 صحة وصيدليات
  { name: 'صيدليات النهدي', field: 'تقنية معلومات / IT', location: 'الأحساء / متعدد', salary: 'غير مذكور', link: 'https://www.nahdionline.com/ar/careers', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التسجيل والتقديم. 18 مايو 2026.' },
  { name: 'مجموعة د. سليمان الحبيب', field: 'تقنية معلومات / أنظمة صحية', location: 'الشرقية / متعدد', salary: 'غير مذكور', link: 'https://careers.hmg.com.sa/', trackLink: '', status: 'applied', region: 'sa', notes: '📌 تم التسجيل والتقديم. 18 مايو 2026.' },

  // 🏗️ مقاولات ومجموعات تجارية الأحساء
  { name: 'مجموعة البيت الخليجي', field: 'تقنية / أنظمة', location: 'الأحساء', salary: 'غير مذكور', link: '', trackLink: '', status: 'none', region: 'sa', notes: '📌 مجموعة تجارية بالأحساء — تواصل مباشر.' },
  { name: 'شركة المياه الوطنية (NWC)', field: 'تقنية معلومات / IT', location: 'الأحساء / الشرقية', salary: 'حكومي', link: 'https://www.nwc.com.sa/ar/careers', trackLink: '', status: 'none', region: 'sa', notes: '📌 الشركة الوطنية للمياه — لها مشاريع ضخمة بالأحساء.' },
];

const STATUS_MAP = {
  none: { label: '⬜ لم أقدم', cls: 'badge-none' },
  applied: { label: '📨 قدمت', cls: 'badge-applied' },
  interview: { label: '📞 مقابلة', cls: 'badge-interview' },
  accepted: { label: '✅ مقبول', cls: 'badge-accepted' },
  rejected: { label: '❌ مرفوض', cls: 'badge-rejected' },
  pending: { label: '⏸️ معلق', cls: 'badge-pending' },
};

// ========== STATE ==========
const DATA_VERSION = '78'; // bump this to reset localStorage with new defaults
if (localStorage.getItem('coopDataVersion') !== DATA_VERSION) {
  localStorage.removeItem('coopCompanies');
  localStorage.setItem('coopDataVersion', DATA_VERSION);
}
let companies = JSON.parse(localStorage.getItem('coopCompanies') || JSON.stringify(DEFAULT_COMPANIES));
let contacts = JSON.parse(localStorage.getItem('coopContacts') || '[]');
let currentRegion = 'all';

// ========== SAVE ==========
function save() {
  localStorage.setItem('coopCompanies', JSON.stringify(companies));
  localStorage.setItem('coopContacts', JSON.stringify(contacts));
}

// ========== NAVIGATION ==========
function navigate(sectionId) {
  // Always close modal when navigating
  closeModal();
  const sec = document.getElementById(sectionId);
  if (!sec) sectionId = 'profile'; // fallback

  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const activeSec = document.getElementById(sectionId);
  if (activeSec) { activeSec.classList.remove('hidden'); }
  const link = document.querySelector(`[data-section="${sectionId}"]`);
  if (link) link.classList.add('active');
  // close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  // update URL hash
  try {
    if (sectionId) {
      history.replaceState(null, '', '#' + sectionId);
    }
  } catch (e) {
    // Ignore CORS history state errors on file:// protocol
  }
}



// ========== COMPANIES TABLE ==========
function buildTable() {
  const wrap = document.getElementById('tableWrap');
  const empty = document.getElementById('emptyState');

  // Apply region filter
  const filtered = currentRegion === 'all' ? companies : companies.filter(c => c.region === currentRegion);

  if (filtered.length === 0) {
    if (empty) empty.style.display = 'block';
    wrap.innerHTML = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  const rows = filtered.map((c, i) => {
    // find real index in companies array
    const realIdx = companies.indexOf(c);
    const st = STATUS_MAP[c.status] || STATUS_MAP.none;
    const regionTag = REGION_INFO[c.region] ? `<span style="font-size:0.7rem;opacity:0.7">${REGION_INFO[c.region].flag}</span> ` : '';
    const linkHtml = c.link ? `<a href="${c.link}" target="_blank" style="color:var(--accent2);font-size:0.8rem;">رابط ↗</a>` : '—';
    const trackHtml = c.trackLink ? `<a href="${c.trackLink}" target="_blank" style="color:var(--accent);font-size:0.8rem;">متابعة ↗</a>` : '—';
    return `<tr>
      <td>${regionTag}<strong>${c.name}</strong></td>
      <td>${c.field || '—'}</td>
      <td>${c.location || '—'}</td>
      <td style="color:var(--accent2);font-weight:600">${c.salary || '—'}</td>
      <td>${linkHtml}</td>
      <td>${trackHtml}</td>
      <td><span class="badge ${st.cls}">${st.label}</span></td>
      <td style="max-width:150px;font-size:0.78rem;color:var(--text2)">${c.notes || '—'}</td>
      <td>
        <button class="action-btn" onclick="editCompany(${realIdx})">✏️</button>
        <button class="action-btn delete" onclick="deleteCompany(${realIdx})">🗑️</button>
      </td>
    </tr>`;
  }).join('');

  wrap.innerHTML = `<table class="data-table">
    <thead><tr>
      <th>الشركة</th><th>المجال</th><th>الموقع</th><th>المكافأة</th><th>التقديم</th><th>المتابعة</th><th>الحالة</th><th>ملاحظات</th><th>إجراءات</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderCompanies() {
  buildTable();
  updateProgress();
}

// ========== PROGRESS ==========
function updateProgress() {
  const all = companies;
  document.getElementById('totalCount').textContent = all.length;
  document.getElementById('appliedCount').textContent = all.filter(c => c.status === 'applied').length;
  document.getElementById('interviewCount').textContent = all.filter(c => c.status === 'interview').length;
  document.getElementById('acceptedCount').textContent = all.filter(c => c.status === 'accepted').length;
  document.getElementById('rejectedCount').textContent = all.filter(c => c.status === 'rejected').length;
}

// ========== MODAL ==========
function openAddModal() {
  document.getElementById('fEditIndex').value = '';
  document.getElementById('modalTitle').textContent = 'إضافة فرصة جديدة';
  document.getElementById('fName').value = '';
  document.getElementById('fField').value = '';
  document.getElementById('fLocation').value = '';
  document.getElementById('fSalary').value = '';
  document.getElementById('fLink').value = '';
  document.getElementById('fStatus').value = 'none';
  document.getElementById('fNotes').value = '';
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function editCompany(idx) {
  const c = companies[idx];
  document.getElementById('fEditIndex').value = idx;
  document.getElementById('modalTitle').textContent = 'تعديل الفرصة';
  document.getElementById('fName').value = c.name || '';
  document.getElementById('fField').value = c.field || '';
  document.getElementById('fLocation').value = c.location || '';
  document.getElementById('fSalary').value = c.salary || '';
  document.getElementById('fLink').value = c.link || '';
  document.getElementById('fTrackLink').value = c.trackLink || '';
  document.getElementById('fStatus').value = c.status || 'none';
  document.getElementById('fNotes').value = c.notes || '';
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function deleteCompany(idx) {
  if (!confirm('هل أنت متأكد من الحذف؟')) return;
  companies.splice(idx, 1);
  save(); renderCompanies();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

// Escape key closes modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function saveCompany() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { alert('يرجى إدخال اسم الشركة'); return; }
  const company = {
    name,
    field: document.getElementById('fField').value.trim(),
    location: document.getElementById('fLocation').value.trim(),
    salary: document.getElementById('fSalary').value.trim(),
    link: document.getElementById('fLink').value.trim(),
    trackLink: document.getElementById('fTrackLink').value.trim(),
    status: document.getElementById('fStatus').value,
    notes: document.getElementById('fNotes').value.trim(),
  };
  const editIdx = document.getElementById('fEditIndex').value;
  if (editIdx !== '') { companies[parseInt(editIdx)] = company; }
  else { companies.push(company); }
  save(); renderCompanies(); closeModal();
}

// ========== CONTACTS ==========
function renderContacts() {
  const tbody = document.getElementById('contactsBody');
  if (contacts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">لا توجد جهات تواصل بعد</td></tr>';
    return;
  }
  tbody.innerHTML = contacts.map((c, i) => `<tr>
    <td>${c.name}</td><td>${c.org}</td><td>${c.role}</td>
    <td>${c.method}</td><td>${c.date}</td>
    <td>${c.result}</td>
  </tr>`).join('');
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  // Navigation clicks
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      if (!link.dataset.section) return; // Allow normal link behavior for external links
      e.preventDefault();
      navigate(link.dataset.section);
    });
  });

  // Region filters — now filter both the summary cards AND the companies table
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRegion = btn.dataset.region;
      buildTable();
    });
  });

  // Add company buttons
  document.getElementById('addCompanyBtn').addEventListener('click', openAddModal);
  if (document.getElementById('emptyAddBtn')) {
    document.getElementById('emptyAddBtn').addEventListener('click', openAddModal);
  }

  // Modal controls
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalSave').addEventListener('click', saveCompany);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // Mobile menu
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Hash navigation
  const hash = window.location.hash.replace('#', '');
  navigate(hash || 'profile');

  // Initial renders
  renderCompanies();
  renderContacts();
  updateProgress();
});

