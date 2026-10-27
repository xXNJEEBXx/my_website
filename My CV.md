# Job Application Profile

Read the personal facts below when preparing an authorized application. The single technical procedure is [the extension agent contract](cv-autofill-extension/docs/agent-contract.md). Company processing and delegation follow [the application workflow](.agent/workflows/coop-apply-bot.md). Read only relevant platform lessons from [.agent/agent-learnings.md](.agent/agent-learnings.md).

When delegating an authorized application, supply the company URL, access to these facts (or the complete personal-data section when needed), the contract and relevant platform lessons. Do not copy obsolete injection helpers or the entire history into every task.

Personal Information, Education, Links, Languages, Summary, Work Experience, Skills, Awards)
The target job application URL
All the rules listed at the bottom of this file
The full contents of .agent/agent-learnings.md — read it before every session and pass its "Learned Tips" and "JavaScript Injection Strategy" sections to the browser agent so it benefits from past experience

After every application attempt, update .agent/agent-learnings.md with the browser agent's findings.
Never assume the browser agent remembers anything from previous sessions. Always pass everything from scratch, every single time.

Fill out the user profile/application form fields using the following CV data:

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

## Applicant-specific preferences

1. **Target Selection & Priority Order**
   - When selecting companies to apply to from `jobs-dashboard.html`, always start from the newest announcement date first (Newest First / الأحدث تاريخاً) and proceed chronologically.
   - Always use the built-in project tools (`node data/tracker.js`, `send-emails.js`, telegram-pipeline/scratch data tools) to look up job announcements, verify requirements, and manage records.

3. **Login / Account Creation**

   Try Google sign-in first, then LinkedIn.
   Manual credentials if needed:

   If a Google Form or application page shows an active signed-in Google account at the top that is different from the target email `najeebxalmusawi@gmail.com` (e.g., `xxnjeebxx@gmail.com`), the agent MUST click "تبديل الحساب" (Switch account) and sign in using the target email `najeebxalmusawi@gmail.com` to ensure the form is associated with the correct applicant.

   Email: najeebxalmusawi@gmail.com
   Password: Nn58565452
   Fallback: @Nn0568199827

   If CAPTCHA, OTP, or manual verification appears — STOP immediately and notify the user.

5. **Missing Information**
   If a required field cannot be filled from the CV above — STOP and ask the user.

6. **Never Submit**
   Do NOT click Submit or Apply under any circumstances. Once all fields are filled, take a screenshot and wait for the user's final confirmation.

8. **Email Applications (التقديم عبر الإيميل)**
   - When asked to apply via email, use `send-emails.js`.
   - **القالب المعتمد والمرن (Flexible Template):** The email is grounded in Najeeb's core profile: Senior Computer Information Systems student at King Faisal University with 5 years of practical web & software development experience (React, Laravel, PHP, JS, MySQL), seeking a 6-month Co-op placement starting January 17, 2027.
   - **المواءمة بدون تأليف:** If the company requests a specific role (e.g. AI or Systems/Support), adapt the bullet points directly from this CV without inventing. If no role is specified, follow the default web development template.
   - **المعاينة قبل الإرسال:** Run `node send-emails.js --preview` to display the exact draft for review.
   - Attachments: `My CV NAJEEB ALMUSAWI.pdf` and `KFU COOP Letter.pdf` are attached automatically from `documents/`.

## Documents and tracking

The real CV and university letter are under documents/. Use the extension attachment settings or the authorized browser file chooser; never fabricate document bytes. After an explicitly authorized submission reaches its official confirmation screen, update the tracker with node data/tracker.js, not the retired app.js. For extension code, learning, automatic updates and regression checks, use the contract linked above.
