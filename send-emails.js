/**
 * =============================================================================
 * 📧 Co-op Training Email Application Engine (send-emails.js)
 * =============================================================================
 * 
 * 🤖 دليل وقواعد الوكيل الذكي (AI Agent Playbook) لكتابة وتخصيص رسائل الإيميل:
 * ─────────────────────────────────────────────────────────────────────────────
 * عند تكليف الوكيل بالتقديم على شركة عبر البريد الإلكتروني، يجب اتباع الخطوات
 * والقواعد الصارمة التالية لمنع الشطح أو اختلاق أي بيانات:
 * 
 * 1. المرجعية الصارمة لسيرة نجيب الموسوي (Strict CV Grounding):
 *    - جميع المعلومات الشخصية والأكاديمية تؤخذ حصراً وبدقة 100% من ملف `My CV.md`:
 *      • الاسم الكامل: نجيب مرتضى عبدالمحسن الموسوي (Najeeb Almusawi)
 *      • الجامعة: جامعة الملك فيصل بالأحساء (King Faisal University - KFU)
 *      • التخصص والدرجة: بكالوريوس نظم معلومات الحاسب (Computer Information Systems)
 *      • تاريخ التخرج المتوقع: 7 ديسمبر 2026
 *      • فترة التدريب التعاوني: 6 أشهر تبدأ من 17 يناير 2027 (January 17, 2027)
 *      • بيانات التواصل: جوال 0568199827 | بريد najeebxalmusawi@gmail.com
 *      • الروابط الرسمية: LinkedIn و GitHub الموثقة بالملف.
 * 
 * 2. تحديد المسار ومواءمة القيمة المضافة (Domain Matching without Hallucination):
 *    يحدد الوكيل المسار الأنسب لطبيعة الشركة من بين المسارات المعيارية الثلاثة:
 *    • 'tech_web' (تطوير الويب والبرمجيات):
 *      - التركيز على: 5 سنوات خبرة في تطوير المواقع، التخصص في React و Laravel و PHP و JS و MySQL،
 *        بناء واجهات برمجية RESTful APIs، والعمل وفق معايير هندسية نظيفة.
 *    • 'tech_ai' (الذكاء الاصطناعي وهندسة البيانات):
 *      - التركيز على: الفوز بتحدي Google Labs Challenge، شهادات الذكاء الاصطناعي من NVIDIA و Google،
 *        مشاريع LLM المنشورة مثل المساعد الذكي للخدمات الحكومية (Faheem AI) ومنظومة الفلاش كاردز المعتمدة على Claude API و MCP Tools.
 *    • 'admin_systems' (النظم الإدارية والتقنية والدعم الفني والقانوني):
 *      - التركيز على: تخصص نظم معلومات الحاسب الذي يدمج التقنية بالإدارة، إدارة وتنظيم الأنظمة الرقمية والملفات،
 *        أتمتة الأعمال المكتبية والتقارير لتقليص الجهد اليدوي، إدارة وصيانة قواعد البيانات والسجلات، والجاهزية التامة للعمل الجماعي.
 * 
 * 3. صياغة عنوان الرسالة (Subject Line Rules):
 *    - الالتزام التام بأي شرط وارد في إعلان الشركة (مثال: "مع ذكر التخصص في العنوان"، أو "تدريب - قانون او إدارة").
 *    - الصياغة الافتراضية المهنية:
 *      `طلب تدريب تعاوني — [المسار/التخصص] — نجيب الموسوي (جامعة الملك فيصل)`
 * 
 * 4. هيكل الرسالة المعتمد (Email Anatomy):
 *    - التحية الرسمية المهنية باللغة المناسبة (`ar` أو `en`).
 *    - التعريف بالاسم والتخصص الأكاديمي والجامعة وتاريخ بدء التدريب (17 يناير 2027) ومدته (6 أشهر).
 *    - قائمة نقطية موجزة ومباشرة (3-4 نقاط) بما يمكن تقديمه للجهة.
 *    - التنويه بأن التدريب التعاوني متطلب جامعي رسمي وأن المتقدم متفرغ تفرغاً تاماً طوال الفترة.
 *    - الإشارة إلى إرفاق السيرة الذاتية الرسمية وخطاب الجامعة المعتمد (`documents/`).
 *    - الترحيب بإجراء مقابلة شخصية (أو الحضور للمقر إن كان في نطاق الشرقية/الرياض).
 *    - التوقيع الرسمي بمعلومات الاتصال والروابط المعتمدة.
 * 
 * 5. أوامر التشغيل والمراجعة:
 *    - لمعاينة المسودة دون إرسال: `node send-emails.js --preview` أو `--dry-run`
 *    - للإرسال الفعلي المعتمد: `node send-emails.js`
 * =============================================================================
 */

const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const SENDER_EMAIL = "najeebxalmusawi@gmail.com";
const SENDER_NAME = "Najeeb Almusawi";
const APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "ndazmcgmtfvspznr"; 
const DRY_RUN = process.argv.includes("--dry-run") || process.argv.includes("--preview");

// ─── Targets Configuration ───────────────────────────────────────────────────
// AGENT: قم بتحديث هذا الكائن بالشركة المستهدفة ومسارها قبل التشغيل
const targets = [
  {
    name: "شركة الطباعة العالمية (IPC)",
    email: "rahaf@ipcsa.com",
    domain: "admin_systems", // 'tech_web' | 'tech_ai' | 'admin_systems'
    lang: "ar",
    subject: "طلب تدريب تعاوني — نظم معلومات حاسب وتقنية — نجيب الموسوي"
  },
];

// ─── Domain-Aware Template Engine Grounded in My CV.md ─────────────────────────

function buildEmail(company) {
  const domain = company.domain || "admin_systems";
  const lang = company.lang || "ar";

  // 1. If custom body is explicitly provided, use it directly
  if (company.customBody) {
    return {
      subject: company.subject || (lang === "en" ? `Co-op Training Request — CIS Student | King Faisal University` : `طلب تدريب تعاوني — طالب نظم معلومات حاسب | جامعة الملك فيصل`),
      body: company.customBody
    };
  }

  // 2. English Templates
  if (lang === "en") {
    let subject = company.subject;
    let points = "";

    if (domain === "tech_web") {
      subject = subject || `Co-op Training Request — Full-Stack Web Developer | King Faisal University`;
      points = `- Full-Stack Web Development (5 years practical experience with React, Laravel, PHP, JS, MySQL)
- Building robust RESTful APIs, modern dashboard interfaces, and responsive web applications
- Workflow automations, system integrations, and scalable database architecture
- Fast learner, experienced in Agile & Git teamwork, with live production projects`;
    } else if (domain === "tech_ai") {
      subject = subject || `Co-op Training Request — AI & Software Engineering | King Faisal University`;
      points = `- AI application development, LLM API integrations, and prompt/agent engineering (Faheem AI & Flashcards)
- Google Labs Challenge Winner & certified in Deep Learning (NVIDIA) and Machine Learning (Google)
- Full-stack web capabilities (React, Laravel, Python) to deploy and serve intelligent models
- Strong foundation in data processing, modern APIs, and autonomous agent workflows`;
    } else {
      // admin_systems
      subject = subject || `Co-op Training Request — Computer Information Systems | King Faisal University`;
      points = `- Technical and IT systems support, digital file management, and office workflow optimization
- Routine task automation and reporting to streamline departmental operations
- Database management, electronic records maintenance, and data verification
- Strong technical adaptability, problem-solving mindset, and full-time dedication`;
    }

    const body = `Dear Hiring Team / HR Department at ${company.name},

I am Najeeb Almusawi, a senior Computer Information Systems student at King Faisal University, seeking a 6-month Co-op placement starting January 17, 2027.

What I can contribute to ${company.name}:
${points}

Note: The Co-op training is an official graduation requirement from King Faisal University, and I will be fully dedicated full-time throughout the entire 6-month placement.

I have attached my official CV and university Co-op letter. I would welcome the opportunity to discuss how I can contribute to your team.

Best regards,
Najeeb Almusawi
📱 +966 568199827 | 📧 najeebxalmusawi@gmail.com
🔗 LinkedIn: https://www.linkedin.com/in/najeeb-almusawi-16516417b | GitHub: https://github.com/xXNJEEBXX
`;
    return { subject, body };
  }

  // 3. Arabic Templates (الافتراضي)
  let subject = company.subject;
  let points = "";

  if (domain === "tech_web") {
    subject = subject || `طلب تدريب تعاوني — مطور برمجيات وويب (React / Laravel) — نجيب الموسوي`;
    points = `- تطوير وتصميم مواقع وتطبيقات ويب متكاملة (خبرة 5 سنوات في React و Laravel و PHP و JavaScript و MySQL)
- بناء واجهات برمجية قوية (RESTful APIs) ولوحات تحكم تفاعلية متجاوبة
- أتمتة مسارات العمل البرمجية وهندسة تكامل الأنظمة وقواعد البيانات
- التزام تام بكتابة كود نظيف وقابل للتوسع والعمل باحترافية ضمن فرق التطوير عبر Git`;
  } else if (domain === "tech_ai") {
    subject = subject || `طلب تدريب تعاوني — ذكاء اصطناعي ونظم برمجية — نجيب الموسوي`;
    points = `- تطوير تطبيقات الذكاء الاصطناعي وربط نماذج الـ LLMs وبناء الأدوات الذكية (Faheem AI ومنظومة Flashcards)
- الفوز بتحدي Google Labs Challenge وشهادات معتمدة في الذكاء الاصطناعي من NVIDIA و Google
- مهارات برمجية كاملة (React, Laravel, Python, APIs) لنشر وربط النماذج الذكية بالواجهات
- شغف عالٍ بالتعلم السريع والبحث والتطوير والعمل على مشاريع تقنية مبتكرة`;
  } else {
    // admin_systems (النظم الإدارية والتقنية والدعم الفني والقانوني)
    subject = subject || `طلب تدريب تعاوني — نظم معلومات حاسب وتقنية — نجيب الموسوي`;
    points = `- الدعم الفني والتقني وإدارة الأنظمة والملفات الرقمية بكفاءة عالية
- أتمتة وتطوير الأعمال المكتبية والإدارية والتقارير لتقليص الجهد اليدوي وتسريع الإجراءات
- تنظيم وصيانة وتحديث قواعد البيانات والسجلات الإلكترونية
- الجاهزية التامة للعمل بروح الفريق الواحد والمرونة العالية في إنجاز المهام`;
  }

  const body = `السلام عليكم ورحمة الله وبركاته — تحية طيبة وبعد،

أنا نجيب الموسوي، طالب في قسم نظم معلومات الحاسب بجامعة الملك فيصل — المستوى الأخير، وأبحث حالياً عن فرصة تدريب تعاوني لمدة 6 أشهر تبدأ من 17 يناير 2027.

ما أقدر أقدمه لشركتكم الكريمة (${company.name}):
${points}

أملك خبرة عملية مثبتة مع مشاريع حقيقية منشورة، ومستعد لتقديم قيمة فعلية ومباشرة لفريقكم من اليوم الأول.

ملاحظة: التدريب التعاوني مطلب جامعي رسمي للتخرج، وسأتفرغ بالكامل للعمل لديكم طوال فترة الـ 6 أشهر.

أرفق لكم سيرتي الذاتية وخطاب الجامعة الرسمي المعتمد. يسعدني التواصل معكم وإجراء مقابلة شخصية.

مع خالص التقدير،
نجيب الموسوي
📱 0568199827 | 📧 najeebxalmusawi@gmail.com
🔗 LinkedIn: https://www.linkedin.com/in/najeeb-almusawi-16516417b | GitHub: https://github.com/xXNJEEBXX
`;

  return { subject, body };
}

// ─── Execution Logic ──────────────────────────────────────────────────────────

async function main() {
  if (targets.length === 0) {
    console.log("⚠️ No targets specified in the 'targets' array.");
    return;
  }

  const docsDir = fs.existsSync(path.join(__dirname, "documents")) ? path.join(__dirname, "documents") : __dirname;
  const files = fs.readdirSync(docsDir);
  const cvFileName = files.find(f => f.includes("My CV NAJEEB ALMUSAWI.pdf")) || "My CV NAJEEB ALMUSAWI.pdf";
  const cvPath = path.join(docsDir, cvFileName);
  const letterPath = path.join(docsDir, "KFU COOP Letter.pdf");

  if (!fs.existsSync(cvPath)) console.error("❌ Missing CV:", cvPath);
  if (!fs.existsSync(letterPath)) console.error("❌ Missing Letter:", letterPath);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: SENDER_EMAIL,
      pass: APP_PASSWORD,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const company of targets) {
    const { subject, body } = buildEmail(company);
    console.log(`\n=============================================================================`);
    console.log(`🏢 الشركة المستهدفة: ${company.name} (${company.email})`);
    console.log(`📌 المسار المعتمد: [${company.domain || 'admin_systems'}] | اللغة: [${company.lang || 'ar'}]`);
    console.log(`📝 عنوان الإيميل: ${subject}`);
    console.log(`-----------------------------------------------------------------------------`);
    console.log(`📜 نص الرسالة:\n${body}`);
    console.log(`📎 المرفقات: [${path.basename(cvPath)}], [${path.basename(letterPath)}]`);
    console.log(`=============================================================================`);

    if (DRY_RUN) {
      console.log("ℹ️ [معاينة / PREVIEW] تم عرض مسودة الإيميل بنجاح دون إرسال.");
      continue;
    }

    try {
      const info = await transporter.sendMail({
        from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
        to: company.email,
        subject: subject,
        text: body,
        attachments: [
          { filename: "My CV NAJEEB ALMUSAWI.pdf", path: cvPath },
          { filename: "KFU COOP Letter.pdf", path: letterPath }
        ]
      });
      console.log(`   ✅ Sent successfully!`);
      console.log(`      🆔 Message ID: ${info.messageId}`);
      console.log(`      📡 SMTP Response: ${info.response}`);
      console.log(`      📬 Delivered to: ${info.accepted.join(", ")}`);
      sent++;
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      failed++;
    }

    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 2000));
  }

  if (!DRY_RUN) {
    console.log(`\n📊 النتيجة النهائية: تم إرسال ${sent} رسالة، وفشل ${failed}.`);
  }
}

main().catch(console.error);
