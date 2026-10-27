# Job Application Profile — Najeeb Almusawi

Read the personal facts below when preparing an authorized application. The single technical procedure is [the extension agent contract](cv-autofill-extension/docs/agent-contract.md). Company processing and delegation follow [the application workflow](.agent/workflows/coop-apply-bot.md). Read only relevant platform lessons from [.agent/agent-learnings.md](.agent/agent-learnings.md).

When delegating an authorized application, supply the company URL, access to these facts, the contract, and relevant platform lessons.

Fill out user profile/application forms using the following CV data:

Personal Information

First Name: Najeeb
Last Name: Almusawi
Full Name: Najeeb Murtadha Abdulmohsen Almusawi
email: najeebxalmusawi@gmail.com
National ID: 1112191778
Date of Birth: 2001/01/02
Phone: +966 568199827
Location: AL MUBARRAZ, Al-Ahsa, Eastern Province, Saudi Arabia
Address: Building No. 3754, Street: Kharash Al Kalbi Alsaluli, District: Ar Rashidyah 1st, Postal Code: 36342
Short Address: FMAH3754
Training Period: 6 months starting January 17, 2027
Notice Period: 2 weeks
Desired Salary: 4,000 SAR (Al-Ahsa) / 6,000 SAR (outside Al-Ahsa) — Negotiable

Education

University: King Faisal University, Al-Ahsa, Saudi Arabia
Degree: Bachelor of Computer Information Systems
Expected Graduation: December 7, 2026
GPA: 2.76 / 4.0

Links

Portfolio: https://xXNJEEBXx.github.io/my_website
LinkedIn: https://www.linkedin.com/in/najeeb-almusawi-16516417b
GitHub: https://github.com/xXNJEEBXX

Languages

Arabic: Professional
English: Upper Intermediate

Professional Summary

Full-Stack Web Developer with 5 years of hands-on coding experience, specializing for the past 3 years in React and Laravel alongside JavaScript, PHP, and MySQL. Backed by 1 year of professional experience at Vibcoding, I quickly adapt to new technologies and focus on delivering clean, scalable web solutions. I am fully available for a six-month Co-op placement starting January 17, 2027.


Work Experience
Independent Software Developer — 2020–Present
Key Qualifications & Responsibilities

Architected and developed multiple full-stack applications from concept to deployment, demonstrating the ability to independently manage the complete software development lifecycle.

Engineered creative workflow automations, such as integrating bots for remote system management and building API connections for automated data extraction, streamlining operations and reducing manual intervention.

Simulated real-world business requirements through self-directed projects, designing scalable architectures and integrating advanced features to solve complex technical challenges.

Key Achievement:
Successfully conceptualized and deployed comprehensive web solutions with creative architectural designs, proving readiness to transition seamlessly into an enterprise-level engineering team and deliver immediate value.

Skills
Main skills: HTML5, CSS, JavaScript, PHP, React.js, Laravel, MySQL, RESTful APIs, Full-Stack, GitHub & Git
Familiar with: Microsoft Office, VibeCoding, Agile, Docker, Node.js, AWS, Automation, Next.js, TypeScript, Express.js

Awards & Certifications

Challenge Winner — Google Labs Challenge (GDSC)
Google Machine Learning Challenge Certification
Secrets of Cybercrime — GDSC Certification
Fundamentals of Deep Learning — NVIDIA Certification
Qiyas Aptitude Test — 83%
Qiyas Achievement Test — 89%

Technical Projects Portfolio

E-Commerce Website — 2021–2023 — HTML, CSS, JS, PHP, Laravel, React
Progressive educational project from raw frontend/backend to Laravel then React. Reached 80% completion; stopped after achieving the learning goal (non-commercial from the start).

Automated Crypto Trading — 2023–2025 — Laravel, Chrome Extension, Telegram Bot, MacroDroid, REST APIs
Fully automated trading and buy/sell ad management. Invented a workaround for the lack of Saudi bank APIs by using MacroDroid to read SMS messages and pass transfer data as an API. Generated 15,000+ SAR in revenue. Paused due to capital constraints. Repo private (sensitive keys & strategies).

Automatic Ads Update Tool on Haraj — 2024 — Chrome Extension
Browser extension to auto-update ads and keep them at the top of search results via direct UI interaction (no public API). Stopped after ROI evaluation. Repo private.

Faheem AI Government Digital Assistant — 2025–2026 — React, Tailwind CSS, Laravel, MySQL, LLM APIs
Natural-language assistant for government services (Absher Hackathon). Designed a blind Turing test inside the app as a reward signal for RLHF — an unprecedented approach in this context. Role: idea owner & lead technical developer within a team. Live: https://faheem-teal.vercel.app

AI-Powered Flashcards Ecosystem — 2025–2026 — Python, React, Laravel, Claude API, MCP Tool
Two-tool system: first converts course files into flashcards (summarize, translate, generate); second is a flashcard app with an MCP tool letting the LLM add cards directly, eliminating manual entry. Generated 1,955 flashcards; reviewed 1,278 — directly impacted academic performance before graduation. Live: https://flash-cards-ten-ochre.vercel.app

---

## Applicant-specific preferences & Agent Instructions

1. **Target Selection & Priority Order (أولوية الاختيار)**
   - When selecting companies to apply to from `jobs-dashboard.html`, always start from the newest announcement date first (Newest First / الأحدث تاريخاً) and proceed chronologically.
   - Always use the built-in project tools (`node data/tracker.js`, `send-emails.js`, telegram-pipeline/scratch data tools) to look up job announcements, verify requirements, and manage records.

2. **Web Applications & CV AutoFill Extension Execution (التقديم عبر المواقع والأداة أولاً)**
   - When applying on web portals, career pages, or job forms, the agent MUST use the official project extension (`cv-autofill-extension`) as the primary execution engine:
     * Inspect/scan the form: `await window.__CV_AGENT.inspect()` or `await window.__CV_AGENT.plan()`.
     * Run the auto-fill engine: `await window.__CV_AGENT.fill({ useCurrentPlan: true })` or trigger via extension buttons.
     * The extension's data source is [data.js](file:///c:/Users/xxnje/OneDrive%20-%20King%20Faisal%20University/الجامعة/coop%20training/cv-autofill-extension/data.js) (aligned strictly with this CV).
     * If there are unmapped fields or custom questions, answer them strictly and authentically from this CV (Zero Mock Data / لا تأليف).

3. **Login / Account Creation (تسجيل الدخول وإنشاء الحسابات)**
   - Try Google sign-in first, then LinkedIn.
   - Manual credentials if needed:
     * Email: `najeebxalmusawi@gmail.com`
     * Password: `Nn58565452` (Fallback: `@Nn0568199827`)
   - If a Google Form or application page shows an active signed-in Google account at the top that is different from `najeebxalmusawi@gmail.com` (e.g., `xxnjeebxx@gmail.com`), the agent MUST click "تبديل الحساب" (Switch account) and sign in using `najeebxalmusawi@gmail.com`.
   - If CAPTCHA, OTP, or manual 2FA appears — STOP immediately and notify the user.

4. **Official Documents Upload (المستندات الرسمية المعتمدة)**
   - Real documents are stored under `documents/`:
     * CV: `documents/My CV NAJEEB ALMUSAWI.pdf`
     * University Co-op Letter: `documents/KFU COOP Letter.pdf`
   - Use browser file chooser or extension file attachment mechanisms; NEVER fabricate document bytes.

5. **Missing Information (المعلومات الناقصة)**
   - If a required field cannot be determined with certainty from this CV — STOP and ask the user. Do not guess personal data.

6. **Never Submit (التوقف التام عند زر الإرسال)**
   - Do NOT click Submit or Apply under ANY circumstances!
   - Once all fields are filled and files are attached, reach the final submit button, STOP, take a clear full-page screenshot of the completed form, and wait for the user's explicit confirmation.

7. **Email Applications (التقديم عبر الإيميل)**
   - When asked to apply via email, use `send-emails.js`.
   - **القالب المعتمد والمرن (Flexible Template):** The email is grounded in Najeeb's core profile: Senior Computer Information Systems student at King Faisal University with 5 years of practical web & software development experience (React, Laravel, PHP, JS, MySQL), seeking a 6-month Co-op placement starting January 17, 2027.
   - **المواءمة بدون تأليف:** If the company requests a specific role (e.g. AI or Systems/Support), adapt bullet points directly from this CV without inventing. If no role is specified, follow the default web development template.
   - **المعاينة قبل الإرسال:** Run `node send-emails.js --preview` to display the draft for user review before sending.
   - Attachments: `My CV NAJEEB ALMUSAWI.pdf` and `KFU COOP Letter.pdf` are attached automatically from `documents/`.

8. **Tracking & Post-Application Record (التوثيق في التراكر)**
   - After the user confirms submission, update the tracker via:
     `node data/tracker.js apply --company "<Company Name>" --notes "<Notes>"`
   - Verify update in `jobs-dashboard.html` and commit/push changes.
