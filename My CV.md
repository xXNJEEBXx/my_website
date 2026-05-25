Job Application Agent — Instructions
⚠️ Instructions for the Main Agent (Read Before Launching Browser Agent)
Every time you launch the browser agent, you MUST pass the following to it in full — do NOT summarize or skip any section:

The complete CV data (all sections below: Personal Information, Education, Links, Languages, Summary, Work Experience, Skills, Awards)
The target job application URL
All the rules listed at the bottom of this file
The full contents of agent-learnings.md — read it before every session and pass its "Learned Tips" and "JavaScript Injection Strategy" sections to the browser agent so it benefits from past experience

After every application attempt, update agent-learnings.md with the browser agent's findings.
Never assume the browser agent remembers anything from previous sessions. Always pass everything from scratch, every single time.

Fill out the user profile/application form fields using the following CV data:

Personal Information

First Name: Najeeb
Last Name: Almusawi
Full Name: Najeeb Murtadha Abdulmohsen Almusawi
National ID: 1112191778
Date of Birth: 2001/01/02
Phone: +966 568199827
Location: AL MUBARRAZ, Al-Ahsa, Eastern Province, Saudi Arabia
Address: Building No. 3754, Street: Kharash Al Kalbi Alsaluli, District: Ar Rashidyah 1st, Postal Code: 36342
Short Address: FMAH3754
Training Period: 6 months starting June 7, 2026
Notice Period: 2 weeks
Desired Salary: 4,000 SAR (Al-Ahsa) / 6,000 SAR (outside Al-Ahsa) — Negotiable

Education

University: King Faisal University, Al-Ahsa, Saudi Arabia
Degree: Bachelor of Computer Information Systems
Expected Graduation: December 7, 2026
GPA: 2.53 / 4.0

Links

Portfolio: https://xXNJEEBXx.github.io/my_website
LinkedIn: https://www.linkedin.com/in/najeeb-almusawi-16516417b
GitHub: https://github.com/xXNJEEBXX

Languages

Arabic: Professional
English: Upper Intermediate

Professional Summary
5 years of freelance web development experience (HTML, CSS, JavaScript, PHP, MySQL), 3 years with React and Laravel, and 1 year at vibcoding. Highly adaptable and eager to learn. Actively seeking a 6-month hybrid Co-op placement starting from the upcoming summer.

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

## JavaScript Helper Functions

> ⚠️ These MUST be included in every JS injection script. Copy them as-is before any fill logic.

```javascript
// Helper: Sets value on React/Vue/Angular controlled inputs
function setReactValue(el, value) {
    const nativeSet = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
    )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
    )?.set;
    if (nativeSet) nativeSet.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
}

// Helper: Fill a field by any selector (id, name, placeholder, label text)
function fillField(selector, value) {
    const el = document.querySelector(selector);
    if (!el) return false;
    el.focus();
    setReactValue(el, value);
    return true;
}

// Helper: Fill all matching fields in one call
function bulkFill(mappings) {
    const results = { filled: [], failed: [] };
    for (const [selector, value] of Object.entries(mappings)) {
        if (fillField(selector, value)) results.filled.push(selector);
        else results.failed.push(selector);
    }
    return results;
}
```

---

## Platform Detection & Templates

> Before filling ANY form, the agent MUST identify the platform first.

### How to Detect

| Platform | Detection Signal |
|---|---|
| Greenhouse | URL contains `boards.greenhouse.io` or `greenhouse.io` |
| SmartRecruiters | URL contains `jobs.smartrecruiters.com` |
| ZenATS | URL contains `zenats.com` or form has `.zen-` classes |
| Oracle HCM | URL contains `oraclecloud.com/hcmUI` or `fa.ocs.oraclecloud` |
| Lever | URL contains `jobs.lever.co` |
| Workday | URL contains `myworkdayjobs.com` or `wd5.myworkday` |
| SuccessFactors | URL contains `successfactors.com` or `sap.com/career` |
| Google Forms | URL contains `docs.google.com/forms` |
| Custom/Unknown | None of the above — build a new JS script by scanning the DOM |

### Platform Templates

When a known platform is detected, use the corresponding JS template BEFORE any manual interaction:

**Greenhouse:**
```javascript
bulkFill({
    '#first_name': 'Najeeb',
    '#last_name': 'Almusawi',
    '#email': 'najeebxalmusawi@gmail.com',
    '#phone': '+966568199827',
    'input[name="job_application[location]"]': 'Al-Ahsa, Saudi Arabia'
});
```

**SmartRecruiters:**
```javascript
bulkFill({
    'input[name="firstName"]': 'Najeeb',
    'input[name="lastName"]': 'Almusawi',
    'input[name="email"]': 'najeebxalmusawi@gmail.com',
    'input[name="phoneNumber"]': '+966568199827',
    'input[name="location"]': 'Al-Ahsa, Saudi Arabia'
});
```

**ZenATS:**
```javascript
bulkFill({
    'input[name*="first"]': 'Najeeb',
    'input[name*="last"]': 'Almusawi',
    'input[name*="email"]': 'najeebxalmusawi@gmail.com',
    'input[name*="phone"]': '+966568199827',
    'input[name*="city"]': 'Al-Ahsa'
});
```

**Oracle HCM:**
```javascript
bulkFill({
    'input[id*="FirstName"]': 'Najeeb',
    'input[id*="LastName"]': 'Almusawi',
    'input[id*="Email"]': 'najeebxalmusawi@gmail.com',
    'input[id*="Phone"]': '+966568199827'
});
```

> **If the platform is NEW:** scan all visible `<input>`, `<textarea>`, and `<select>` elements, map them to CV data fields, build a custom `bulkFill({...})` script, execute it, then report the platform name + selectors back so they can be added as a template for next time.

---

## Rules

1. **Autofill Strategy (إلزامي — اتبع الترتيب)**

   **Step A — Simplify Extension (الخيار الأول)**
   If the Simplify extension is available and active, trigger it first. It handles basic fields and CV upload well on supported platforms.

   **Step B — CV AutoFill Extension (إلزامي بعد Simplify)**
   After Simplify finishes (or if it's unavailable), the agent MUST call the CV AutoFill extension:
   ```javascript
   // One command — fills everything
   const report = window.__CV_AGENT.fill();
   ```
   The extension will:
   1. Auto-detect the platform (Greenhouse, Oracle HCM, SmartRecruiters, etc.)
   2. Use the matching template if known, otherwise smart-scan all fields
   3. Fill ALL empty fields at once with React/Vue-compatible value setting
   4. Return a detailed report of what was filled, skipped, and failed

   **Other available commands:**
   - `window.__CV_AGENT.set(selector, value)` — fill one specific field
   - `window.__CV_AGENT.bulk({ '#name': 'X', '#email': 'Y' })` — fill multiple fields
   - `window.__CV_AGENT.select('select#country', 'Saudi Arabia')` — fill a `<select>` dropdown
   - `window.__CV_AGENT.scan()` — smart-scan only (no template)
   - `window.__CV_AGENT.files()` — list file upload fields on the page
   - `window.__CV_AGENT.debug()` — show all fields and what the mapper sees

   **Step C — Click + Type (آخر حل)**
   Use Click + Type ONLY for specific fields that failed BOTH Simplify and the extension (e.g., custom UI components, heavily protected inputs). Do NOT default to this method.

   ⛔ **Typing field-by-field from the start is FORBIDDEN.** Always attempt Simplify → `__CV_AGENT.fill()` first.

2. **File Uploads (السيرة الذاتية والخطابات)**

   The agent MUST upload files by itself — do NOT ask the user.

   | File | Purpose | Path |
   |---|---|---|
   | `‏‏My CV NAJEEB ALMUSAWI.pdf` | CV / Resume | Same project directory |
   | `KFU COOP Letter.pdf` | Cover Letter | Same project directory |

   - For **CV/Resume upload fields**: upload `‏‏My CV NAJEEB ALMUSAWI.pdf`
   - For **Cover Letter upload fields**: upload `KFU COOP Letter.pdf`
   - For **combined upload fields** (single field for all documents): upload the CV first, then the Cover Letter if the field accepts multiple files
   - If upload fails via JavaScript file input setter, use the browser's file chooser dialog

3. **Login / Account Creation**

   Try Google sign-in first, then LinkedIn.
   Manual credentials if needed:

   If a Google Form or application page shows an active signed-in Google account at the top that is different from the target email `najeebxalmusawi@gmail.com` (e.g., `xxnjeebxx@gmail.com`), the agent MUST click "تبديل الحساب" (Switch account) and sign in using the target email `najeebxalmusawi@gmail.com` to ensure the form is associated with the correct applicant.

   Email: najeebxalmusawi@gmail.com
   Password: Nn58565452
   Fallback: @Nn0568199827

   If CAPTCHA, OTP, or manual verification appears — STOP immediately and notify the user.

4. **Dropdowns & Autocomplete**

   **Try JavaScript first for standard `<select>` elements:**
   ```javascript
   const sel = document.querySelector('select[name="country"]');
   sel.value = 'SA';
   sel.dispatchEvent(new Event('change', { bubbles: true }));
   ```

   **If the dropdown is a custom UI component** (React Select, MUI Autocomplete, etc.):
   1. Click to open the dropdown
   2. Wait for options to fully render
   3. Click the correct option

   ⛔ Never type directly into dropdown fields without opening them first.

5. **Missing Information**
   If a required field cannot be filled from the CV above — STOP and ask the user.

6. **Never Submit**
   Do NOT click Submit or Apply under any circumstances. Once all fields are filled, take a screenshot and wait for the user's final confirmation.

7. **After Confirmed Submission**
   Update the application tracking file (app.js) and mark the company status as Applied before moving to the next application.

8. **Email Applications**
   When asked to apply via email, use the `send-emails.js` script.
   First, edit `send-emails.js` to update the `targets` array with the target company name, email, and language (e.g. `{ name: "Company", email: "info@company.com", lang: "ar" }`).
   Then execute the script using the terminal. The script will automatically attach `My CV NAJEEB ALMUSAWI.pdf` and `KFU COOP Letter.pdf`.

9. **Post-Fill Verification (إلزامي)**
   After every JS injection or Simplify autofill, the agent MUST:
   1. Scroll through the entire form visually
   2. Check every field has the correct value (not empty, not corrupted)
   3. Fix any empty or incorrect fields using Click + Type as fallback
   4. Take a final screenshot of the completed form

10. **Extension Self-Improvement (إلزامي بعد كل تقديم)**

    After EVERY application attempt, the agent MUST check the `__CV_AGENT.fill()` report and update the extension code if needed:

    **If `report.failed` has items** (selectors that didn't match):
    → Find the correct selectors on the page, then update `PLATFORM_SELECTORS` in `cv-autofill-extension/content.js`

    **If `report.unmapped` has items** (fields the mapper couldn't identify):
    → Determine the field type, then add a new pattern to `FIELD_PATTERNS` in `cv-autofill-extension/content.js`

    **If `report.platform === 'unknown'`** (new platform):
    → Add the platform to `detectPlatform()` and create a new entry in `PLATFORM_SELECTORS` in `cv-autofill-extension/content.js`

    **If a selector changed** (platform redesigned their form):
    → Update the old selector in `PLATFORM_SELECTORS` to the new one

    ⚠️ The extension MUST get smarter after every use. Never ignore failures — always fix the extension code.

---

## Parallel Subagent Coordination (تنسيق التقديم المتوازي)

> When applying to multiple companies, the main agent MUST use subagents for efficiency.

### Rules for the Main Agent:

1. **Batch Size:** Each subagent handles **at most 3 companies**
2. **Assignment:** Before launching subagents, divide companies into batches and assign each batch to a subagent. No two subagents share the same company.
3. **Tab Isolation:** Each subagent MUST work in its **own dedicated browser tab**. Before switching to a new company, complete or pause the current one.
4. **No Page Conflicts:** Subagents must NOT navigate away from their active tab to avoid overwriting another subagent's work. If a subagent needs to open a new page, it opens a **new tab** — never navigates within an existing active tab.
5. **Sequential within Subagent:** Each subagent processes its companies **one at a time** (not in parallel within itself).
6. **Reporting:** Each subagent reports back to the main agent with:
   - Which companies were completed
   - Which fields needed manual intervention
   - Any new platform learnings (for `agent-learnings.md`)
   - Any extension updates needed (failed/unmapped fields from `__CV_AGENT.fill()` report)
7. **Main Agent Coordination:** The main agent:
   - Waits for all subagents to finish
   - Collects all reports
   - Updates `app.js` with all completed applications
   - Updates `agent-learnings.md` with new findings
   - **Updates `cv-autofill-extension/content.js`** with all collected selector fixes and new patterns

### Launch Template for the Main Agent:

```
Subagent 1: [Company A, Company B, Company C]
Subagent 2: [Company D, Company E, Company F]
Subagent 3: [Company G, Company H]

Each subagent receives:
- Full CV data from this file
- The company URLs from its assigned batch
- All rules from this file
- Relevant tips from agent-learnings.md
- Instruction: "Open a NEW TAB for each company. Do NOT navigate within another agent's tab."
- Instruction: "After each fill, report the __CV_AGENT.fill() results including failed/unmapped fields."
```

---

## Extension Self-Improvement Protocol

> This section defines HOW to update `cv-autofill-extension/content.js` after learning from failures.

### When to Update

| Trigger | What to Update | Where in `content.js` |
|---|---|---|
| New platform discovered | Add detection regex + selector map | `detectPlatform()` + `PLATFORM_SELECTORS` |
| Selector failed on known platform | Fix/add selectors | `PLATFORM_SELECTORS[platform]` |
| Smart scan couldn't identify a field | Add field pattern | `FIELD_PATTERNS` array |
| New field type not in CV data | Add to `CV` object | `const CV = { ... }` |
| A selector works on multiple platforms | Add to multiple platform entries | `PLATFORM_SELECTORS` |

### How to Update (Examples)

**Adding a new platform:**
```javascript
// In detectPlatform():
[/newplatform\.com/, 'newplatform'],

// In PLATFORM_SELECTORS:
newplatform: {
    'input#firstName': CV.firstName,
    'input#lastName': CV.lastName,
    // ... discovered selectors
},
```

**Adding a new field pattern:**
```javascript
// In FIELD_PATTERNS:
{ pattern: /new_field_hint|arabic_hint/i, value: CV.someField },
```

**Fixing a broken selector:**
```javascript
// Before (broken):
'#old_selector': CV.firstName,
// After (fixed):
'input[data-field="name"]': CV.firstName,
```

### Update Checklist (بعد كل تقديم)

```
- [ ] Read __CV_AGENT.fill() report
- [ ] Any failed selectors? → Fix in PLATFORM_SELECTORS
- [ ] Any unmapped fields? → Add to FIELD_PATTERNS
- [ ] New platform? → Add to detectPlatform() + PLATFORM_SELECTORS
- [ ] Log the update in agent-learnings.md
```

