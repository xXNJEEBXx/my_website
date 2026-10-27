/**
 * send-emails.js
 * ─────────────────────────────────────────────────────────────────
 * سكريبت التقديم الرسمي عبر البريد الإلكتروني للتدريب التعاوني.
 * يرفق السيرة الذاتية وخطاب الجامعة تلقائياً من مجلد documents/.
 * 
 * 📌 قواعد الوكيل (AI Agent Rules):
 * 1. لا تؤلف أي بيانات من عندك؛ جميع البيانات تؤخذ حصراً من My CV.md.
 * 2. القالب الافتراضي المعتمد مبني على تخصص وخبرة نجيب الأساسية: تطوير المواقع والويب (Full-Stack).
 * 3. إذا طلبت الشركة رولاً محدداً (مثل ذكاء اصطناعي، أو نظم/دعم فني)، يطابق الوكيل نقاط القوة من My CV.md بما يناسب الرول فقط دون شطح.
 * 4. للمعاينة قبل الإرسال: `node send-emails.js --preview`
 * ─────────────────────────────────────────────────────────────────
 */

const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const SENDER_EMAIL = "najeebxalmusawi@gmail.com";
const SENDER_NAME = "Najeeb Almusawi";
const APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "ndazmcgmtfvspznr"; 
const DRY_RUN = process.argv.includes("--dry-run") || process.argv.includes("--preview");

// ─── قائمة الشركات المستهدفة ─────────────────────────────────────
// قم بتحديد الشركة والرول المطلوب (إن وجد) هنا قبل الإرسال
const targets = [
  {
    name: "حاضنة حي النرجس للذكاء الاصطناعي",
    email: "aforward29@gmail.com",
    role: "ai", // 'web' (افتراضي) | 'ai' | 'systems' | أو اتركها فارغة للافتراضي
    lang: "ar",
    subject: "طلب تدريب تعاوني — ذكاء اصطناعي ونظم برمجية — نجيب الموسوي"
  },
];

// ─── قالب الرسالة المرن (مبني مباشرة على My CV.md) ───────────────

function buildEmail(company) {
  const lang = company.lang || "ar";
  const role = (company.role || "").toLowerCase();

  // 1. إذا وُجد نص مخصص بالكامل من المستخدم، يُستخدم مباشرة
  if (company.customBody) {
    return {
      subject: company.subject || `طلب تدريب تعاوني — نجيب الموسوي`,
      body: company.customBody
    };
  }

  // 2. القالب الإنجليزي (عند الحاجة للشركات العالمية)
  if (lang === "en") {
    let points = company.points;
    if (!points) {
      if (role.includes("ai") || role.includes("data") || role.includes("ml")) {
        points = `- Developing AI applications, LLM integrations, and intelligent automation tools (Faheem AI & Flashcards)
- Google Labs Challenge Winner & certified in Deep Learning (NVIDIA) and Machine Learning (Google)
- Full-Stack web skills (React, Laravel, Python, APIs) to connect AI models with production interfaces`;
      } else if (role.includes("it") || role.includes("support") || role.includes("system") || role.includes("admin")) {
        points = `- Technical & IT support, digital workflow optimization, and office systems automation
- Database management, record keeping, and troubleshooting technical issues
- Strong adaptability, proactive communication, and full-time dedication to team goals`;
      } else {
        // Default Web / Software
        points = `- Building modern, scalable web applications (React.js, Laravel, PHP, JavaScript, MySQL)
- Robust backend development, RESTful APIs architecture, and responsive UI design
- 5 years of practical software development experience with deployed real-world projects`;
      }
    }

    const defaultSubject = (role.includes("ai") || role.includes("data"))
      ? `Co-op Training Request — AI & Software Engineering | Najeeb Almusawi`
      : `Co-op Training Request — Full-Stack Web Developer | Najeeb Almusawi`;

    const subject = company.subject || defaultSubject;

    const body = `Dear Hiring Team at ${company.name},

I am Najeeb Almusawi, a senior Computer Information Systems student at King Faisal University, seeking a 6-month Co-op placement starting January 17, 2027.

I bring 5 years of hands-on software and web development experience, specializing in React and Laravel alongside JavaScript, PHP, and MySQL, with deployed real-world applications.

What I can contribute to ${company.name}:
${points}

Note: The Co-op placement is an official graduation requirement from King Faisal University, and I will be fully dedicated full-time throughout the entire 6-month period.

I have attached my official CV and university Co-op letter. I would welcome the opportunity to interview and discuss how I can add immediate value to your team.

Best regards,
Najeeb Almusawi
📱 +966 568199827 | 📧 najeebxalmusawi@gmail.com
🔗 LinkedIn: https://www.linkedin.com/in/najeeb-almusawi-16516417b | GitHub: https://github.com/xXNJEEBXX
`;
    return { subject, body };
  }

  // 3. القالب العربي الافتراضي (مأخوذ حرفياً من سيرة نجيب في My CV.md)
  let points = company.points;
  if (!points) {
    if (role.includes("ai") || role.includes("data") || role.includes("ذكاء")) {
      // مواءمة مع الذكاء الاصطناعي من My CV.md
      points = `- تطوير تطبيقات الذكاء الاصطناعي وربط نماذج الـ LLMs وبناء الأدوات والوكلاء الذكية (AI Agents)
- خبرة بمشاريع AI عملية منشورة (مثل مساعد فهيم الحكومي الذكي ومنظومة Flashcards عبر Claude API و MCP)
- فائز بتحدي Google Labs ومجاز بشهادات تخصصية في الذكاء الاصطناعي والتعلم العميق من NVIDIA و Google
- مهارات برمجية كاملة (React, Laravel, Python, APIs) لربط النماذج الذكية بالأنظمة وقواعد البيانات`;
    } else if (role.includes("it") || role.includes("support") || role.includes("نظم") || role.includes("دعم") || role.includes("إدار")) {
      // مواءمة مع نظم المعلومات والدعم الفني والإدارة من My CV.md
      points = `- الدعم الفني والتقني وإدارة الأنظمة والملفات الرقمية بكفاءة عالية
- أتمتة وتطوير الأعمال المكتبية والتقارير الدورية لتقليص الجهد اليدوي وتسريع العمليات
- تنظيم وصيانة وتحديث قواعد البيانات (MySQL) والسجلات الإلكترونية
- الجاهزية التامة للعمل بروح الفريق الواحد والمرونة العالية في إنجاز المهام`;
    } else {
      // الافتراضي العام الأساسي (تطوير المواقع والبرمجيات Full-Stack)
      points = `- تطوير وتصميم مواقع وتطبيقات ويب متكاملة وسريعة (React.js + Laravel)
- بناء واجهات برمجية وخدمات خلفية قوية (RESTful APIs و PHP و MySQL)
- أتمتة مسارات العمل وتكامل الأنظمة وحل المشكلات البرمجية بكود نظيف وقابل للتوسع`;
    }
  }

  const defaultSubject = (role.includes("ai") || role.includes("ذكاء"))
    ? `طلب تدريب تعاوني — ذكاء اصطناعي ونظم برمجية — نجيب الموسوي`
    : (role.includes("it") || role.includes("support") || role.includes("نظم") || role.includes("دعم"))
      ? `طلب تدريب تعاوني — نظم معلومات حاسب وتقنية — نجيب الموسوي`
      : `طلب تدريب تعاوني — مطور برمجيات وويب — نجيب الموسوي`;

  const subject = company.subject || defaultSubject;

  const body = `السلام عليكم ورحمة الله وبركاته — تحية طيبة وبعد،

أنا نجيب الموسوي، طالب في قسم نظم معلومات الحاسب بجامعة الملك فيصل (المستوى الأخير)، وأبحث حالياً عن فرصة تدريب تعاوني لمدة 6 أشهر تبدأ من 17 يناير 2027.

أملك خبرة عملية 5 سنوات في البرمجة وتطوير المواقع والويب، ومتخصص في React و Laravel إلى جانب JavaScript و PHP و MySQL، مع مشاريع برمجية حقيقية منشورة.

ما يمكنني تقديمه لفريقكم في (${company.name}):
${points}

ملاحظة: التدريب التعاوني مطلب جامعي رسمي للتخرج، وسأتفرغ بالكامل للعمل لديكم طوال فترة الـ 6 أشهر.

أرفق لكم سيرتي الذاتية وخطاب الجامعة الرسمي المعتمد. يسعدني التواصل معكم وإجراء مقابلة شخصية.

مع خالص التقدير،
نجيب الموسوي
📱 0568199827 | 📧 najeebxalmusawi@gmail.com
🔗 LinkedIn: https://www.linkedin.com/in/najeeb-almusawi-16516417b | GitHub: https://github.com/xXNJEEBXX
`;

  return { subject, body };
}

// ─── منطق التنفيذ والإرسال ───────────────────────────────────────

async function main() {
  if (targets.length === 0) {
    console.log("⚠️ يرجى تحديد شركة واحدة على الأقل في مصفوفة 'targets'.");
    return;
  }

  const docsDir = fs.existsSync(path.join(__dirname, "documents")) ? path.join(__dirname, "documents") : __dirname;
  const files = fs.readdirSync(docsDir);
  const cvFileName = files.find(f => f.includes("My CV NAJEEB ALMUSAWI.pdf")) || "My CV NAJEEB ALMUSAWI.pdf";
  const cvPath = path.join(docsDir, cvFileName);
  const letterPath = path.join(docsDir, "KFU COOP Letter.pdf");

  if (!fs.existsSync(cvPath)) console.error("❌ ملف السيرة الذاتية غير موجود:", cvPath);
  if (!fs.existsSync(letterPath)) console.error("❌ خطاب الجامعة غير موجود:", letterPath);

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
      console.log(`   ✅ تم الإرسال بنجاح!`);
      console.log(`      🆔 معرّف الرسالة: ${info.messageId}`);
      console.log(`      📡 استجابة الخادم: ${info.response}`);
      console.log(`      📬 تم التسليم إلى: ${info.accepted.join(", ")}`);
      sent++;
    } catch (err) {
      console.error(`   ❌ فشل الإرسال: ${err.message}`);
      failed++;
    }

    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 2000));
  }

  if (!DRY_RUN) {
    console.log(`\n📊 النتيجة النهائية: تم إرسال ${sent} رسالة، وفشل ${failed}.`);
  }
}

main().catch(console.error);
