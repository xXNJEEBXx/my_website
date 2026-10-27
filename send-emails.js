/**
 * send-emails.js
 * ─────────────────────────────────────────────────────────────────
 * Official script to send Co-op training applications via Email.
 * Automatically attaches the CV and KFU COOP Letter.
 *
 * Usage for AI Agent:
 *   1. Update the `targets` array below with the specific companies.
 *   2. Run `node send-emails.js`
 * ─────────────────────────────────────────────────────────────────
 */

const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const SENDER_EMAIL = "najeebxalmusawi@gmail.com";
const SENDER_NAME = "Najeeb Almusawi";
const APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "ndazmcgmtfvspznr"; 
const DRY_RUN = process.argv.includes("--dry-run");

// ─── Targets ───────────────────────────────────────────────────
// AGENT: Update this array with the target emails before running the script
const targets = [
  {
    name: "مكتب المحامي عبدالله بن سليم",
    email: "meetings054@gmail.com",
    lang: "ar",
    subject: 'تدريب - قانون او إدارة — نجيب الموسوي (طالب نظم معلومات حاسب)'
  },
];

// ─── Email Templates ─────────────────────────────────────────────

function buildEmail(company) {
  let subject, body;

  if (company.lang === "en") {
    subject = company.subject || `Co-op Training Request — CIS Student | King Faisal University`;
    body = company.customBody || `Dear Hiring Manager / HR Department at ${company.name},

I am Najeeb Almusawi, a senior Computer Information Systems student at King Faisal University, seeking a 6-month co-op placement starting January 17, 2027.

What I bring: 5 years web development (React, Laravel, PHP, JS, MySQL), deployed projects (AI assistant, e-commerce), Google Labs Winner & NVIDIA certified. Full-time dedication.

I'd welcome visiting your office to discuss how I can add value.

Best regards,
Najeeb Almusawi
📱 +966 568199827 | 📧 najeebxalmusawi@gmail.com
🔗 LinkedIn: https://www.linkedin.com/in/najeeb-almusawi-16516417b | GitHub: https://github.com/xXNJEEBXX
`;
  } else {
    // Default Arabic
    subject = company.subject || `طلب تدريب تعاوني — طالب نظم معلومات حاسب | جامعة الملك فيصل`;
    body = company.customBody || `السلام عليكم ورحمة الله وبركاته — تحية طيبة وبعد،

أنا نجيب الموسوي، طالب في قسم نظم معلومات الحاسب بجامعة الملك فيصل — المستوى الأخير، وأبحث حالياً عن فرصة تدريب تعاوني لمدة 6 أشهر تبدأ من 17 يناير 2027.

ما أقدر أقدمه لمكتبكم الكريم (${company.name}):
- الدعم الفني والتقني وإدارة الأنظمة والملفات
- أتمتة وتطوير الأعمال المكتبية والإدارية والتقارير
- بناء وصيانة قواعد البيانات وتنظيم السجلات
- الالتزام والجاهزية التامة للعمل الإداري والتقني

أملك خبرة عملية ممتازة في التعامل مع الأنظمة الرقمية وأدوات التقنية وإدارة البيانات، وأنا مستعد لتقديم قيمة فعلية ومباشرة لفريقكم من اليوم الأول.

ملاحظة: التدريب التعاوني مطلب جامعي رسمي، وسأتفرغ بالكامل للعمل لديكم طوال الفترة.

أرفق لكم سيرتي الذاتية وخطاب الجامعة الرسمي. يسعدني الحضور لمقركم شخصياً في الخبر في حال رغبتم بإجراء مقابلة.

مع خالص التقدير،
نجيب الموسوي
📱 0568199827 | 📧 najeebxalmusawi@gmail.com
🔗 LinkedIn: https://www.linkedin.com/in/najeeb-almusawi-16516417b | GitHub: https://github.com/xXNJEEBXX
`;
  }

  return { subject, body };
}

// ─── Send Logic ─────────────────────────────────────────────────

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
    console.log(`Sending to: ${company.name} (${company.email})...`);

    if (DRY_RUN) {
      console.log("✅ [DRY RUN] Would send successfully.");
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
  console.log(`\n📊 Results: ${sent} sent, ${failed} failed.`);
}

main().catch(console.error);
