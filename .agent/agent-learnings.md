# Agent Learnings & Optimization Log

المرجع الفني الحالي الوحيد: [عقد تشغيل الإضافة والتحسن المستمر](../cv-autofill-extension/docs/agent-contract.md). اقرأه مع الدرس المتعلق بالمنصة؛ لا تمرر السجل الكامل في كل تشغيل.

هذا سجل تاريخي للحالات. أضف درسًا جديدًا فقط عند وجود سبب وحل واختبار جديد، مع توضيح الحدود. الأمثلة القديمة قد تصف v1 ولا تتجاوز العقد الحالي. لا يُعد نجاح اختبارات محلية تقديمًا فعليًا.

## Learned Tips

*(This section is updated automatically after each application attempt. Newer entries appear at the top.)*

<!-- AGENT: append new entries here after each session using the format below -->

**2026-10-26 — شركة توال (TAWAL) عبر منصة أوراكل Oracle Cloud HCM — (تم التقديم بنجاح ✅)**
- **Autonomous Auto-Snapshot & Deduplication:** بمجرد فتح نموذج التقديم، قامت الإضافة تلقائياً بالتقاط عينة النموذج وتطهيرها وتخزينها في `test-suite/fixtures/oracle_hcm.html` وفهرستها في `manifest.json` بدون أي تدخل يدوي، وارتفع رصيد جناح الاختبارات إلى 48/48 اختباراً ناجحاً (100%).
- **Talent Community Application Workflow:** بوابة التوظيف لشركة توال تتبع صندوق الاستثمارات العامة وSTC عبر Oracle Cloud Candidate Experience (`ialegs.fa.ocs.oraclecloud.com`). التقديم المفتوح للتدريب التعاوني والمواهب يتم عبر `Tawal Talent Community` [APPLY].
- **Section Commitment Logic:** في نماذج أوراكل HCM، يلزم تأكيد الحقول المضافة (مثل التعليم والخبرة) عبر النقر على زر الإضافة الخاص بالقسم (`ADD EDUCATION` / `ADD EXPERIENCE`) لتثبيتها في ملف المرشح قبل الضغط على `SUBSCRIBE`.
- **Category & Location Filtering:** تتطلب أوراكل تحديد فئة وظيفية واحدة على الأقل أو موقع؛ تم تحديد فئة `Engineering` وموقع `Saudi Arabia` بنجاح عبر محرك الإضافة.
- **Side Panel Overlay Handling:** القائمة الجانبية في أوراكل تفتح أحياناً وتغطي حيز الصفحة؛ يكتشف محرك الأزرار زر `Close menu` ويتيح إغلاقها بسلاسة.
- **Confirmation Screen:** تم إرسال الطلب بنجاح وظهرت شاشة الشكر الرسمية: *"Thank you for joining our talent community. You can go to your profile to manage your preferences or go back to the career site."*.
- **Tracker Update:** تم تسجيل التقديم رسمياً بنجاح وتحديث السجل إلى `✅ تم التقديم`.

**2026-10-26 — شركة زد (Zid) عبر منصة جسr (Jisr) — (تم التقديم والإرسال بنجاح ✅)**
- **Tool-First Execution:** تم إتمام التقديم بالكامل بنجاح 100% باستخدام إضافة CV AutoFill Extension عبر محرك الأزرار ووضع الحارس (Guardian Mode).
- **Guardian Mode Shield:** تم تفعيل شريط الحماية العلوي لحجب التعديلات اليدوية العشوائية وتوجيه الوكيل لاستخدام أدوات الإضافة الرسمية.
- **Button Detection Engine:** نجح المحرك في اكتشاف والتنقل عبر أزرار الصفحة (`window.__CV_AGENT.clickButton('التالي')` و `window.__CV_AGENT.clickButton('إرسال')`) دون استعلامات يدوية.
- **React-Select Exact Match:** تم حل مطابقة الجنسية والبلد باشتراط المطابقة التامة أو من البداية مع استبعاد الخيارات المنفية (`Non-Saudi`)، وتم اختيار `Saudi Arabia` بنجاح.
- **Clean PDF File Attachment:** تم إرفاق السيرة الذاتية الرسمية وشهادة الدورة بصيغة PDF أصلية (280KB) بنجاح عبر `DataTransfer` وحدث `Drop`.
- **Confirmation:** ظهرت شاشة الشكر الرسمية من منصة جسر: *"شكرًا لإرسالك طلب الوظيفة - سنتواصل معك في حال قرر الفريق البدء بمراحل واختبارات التوظيف"*.

- Fastest approach used: إضافة المنصة إلى `site-rules.js` تحت المفتاح `jisr`، مما يتيح التعبئة الفورية المباشرة بنقرة واحدة عبر `PLATFORM_SELECTORS`.
- Issues or tool limitations noticed: تم كشف خطأ تركيبي (SyntaxError) قديم في `engine.js` تسبب في تعليق المحرك في الجلسة السابقة وتم إصلاحه وتوثيقه بالكامل.
- Notes for next time: تم إدراج منصة `jisr.net` رسمياً ضمن كاشف المنصات ومحددات التعبئة لتعبئة أي فرصة قادمة على منصة جسر في أجزاء من الثانية.

**2026-10-18 — دولاب (Doolab) (https://www.doolab.sa/ar/jobs/ui-ux-designer)**
- JavaScript injection: تم تعبئة الحقول النصية بنجاح باستخدام React native value setter (`firstName`, `lastName`, `email`, `phone`, `portfolioLink`, `message`).
- Special handling needed: حقل تاريخ الميلاد لا يقبل الكتابة المباشرة، بل يتطلب النقر على أزرار التقويم التفاعلي (اختيار السنة 2001 ثم الشهر يناير ثم اليوم 2).
- Fastest approach used: النقر على "قدّم الآن" لفتح الـ Modal، ثم حقن القيم للأجهزة النصية، ومحاكاة النقر على مكون التقويم لتحديد تاريخ الميلاد، ثم إرفاق السيرة الذاتية عبر `input[type="file"]#cv`.
- Issues or tool limitations noticed: الوظيفة معروضة كـ "دوام كامل"، لذا تم توضيح طلب التدريب التعاوني صراحة في حقل "حدثنا عن نفسك". لم تواجهنا كابتشا أو تسجيل دخول.
- Notes for next time: نموذج دولاب يعتمد على Next.js، وهو سريع ومباشر ولا يتطلب إنشاء حساب. حقل رفع الـ CV يقبل PDF ومتاح عبر DOM بشكل مباشر.

**2026-05-26 — فلاورد (Floward) (https://floward.com/careers)**
- JavaScript injection: Handled most standard text fields and comboboxes.
- Special handling needed: System uses SAP SuccessFactors. The custom file upload UI hides the native `<input type="file">`, preventing automated file uploads (CV and Cover Letter). These must be uploaded manually by the user clicking the UI buttons.
- Fastest approach used: CV AutoFill Agent + manual UI file uploads.
- Issues or tool limitations noticed: SuccessFactors file uploads block automated DOM injection.
- Notes for next time: For SuccessFactors, instruct the user upfront that they will need to manually upload their files before submitting.

**2026-05-26 — يونيوفونيك (Unifonic) (https://unifonic.com/careers)**
- JavaScript injection: Used basic form completion via Simplify and manual injection where needed.
- Special handling needed: System included several custom questions regarding specific frameworks (React), testing, state management, and performance. Answered them by emphasizing the relevant React and Co-op experience. Selected 'Senior Frontend Engineer' due to lack of internship roles.
- Fastest approach used: CV AutoFill Agent + custom prompt instructions to handle domain-specific questions.
- Issues or tool limitations noticed: Custom text area questions required detailed generation based on the CV.
- Notes for next time: For roles with heavy custom technical questions, ensure the subagent's prompt includes strong guidelines on how to infer answers from the CV's Professional Summary and Projects.

**2026-05-26 — لين التقنية (Lean Technologies) (https://jobs.ashbyhq.com/lean)**
- JavaScript injection: Used `__CV_AGENT.fill()` for custom fields like Salary Expectations.
- Special handling needed: Form had no Cover Letter field, so Co-op details were appended to 'Additional Information'. AWS S3 backend returned a CORS/Fetch error when attempting direct CV upload; resolved by relying on the resume already uploaded by Simplify.
- Fastest approach used: Simplify extension combined with JS injection.
- Issues or tool limitations noticed: Direct file upload failed due to CORS on Ashby HQ.
- Notes for next time: For Ashby forms, if file upload fails due to CORS, check if Simplify has successfully attached a resume. Use Additional Information for missing specific fields like Cover Letter.

**2026-05-26 — مجموعة الشايع (Alshaya) (https://careers.alshaya.com/)**
- JavaScript injection: Required active triggering of text matching and events.
- Special handling needed: System uses PageUp. Custom combo boxes initially prevented progression, solved by triggering correct events.
- Fastest approach used: CV AutoFill Agent with custom PageUp event triggers.
- Issues or tool limitations noticed: PageUp combo boxes are tricky and require explicit event dispatching to register values. Both CV and Cover Letter uploaded successfully.
- Notes for next time: For PageUp systems, ensure the injection script properly fires all change/blur/input events on custom combo boxes.

**2026-05-26 — مكتبة جرير (Jarir) (https://jobapp.jarir.com/)**
- JavaScript injection: Data was filled directly into available form fields.
- Special handling needed: No specific Co-op or IT Developer positions were available, so 'Computer Technician' was selected as the closest technical match. No file upload fields were found, so all education and experience data was inserted directly into text fields.
- Fastest approach used: Form field injection based on CV mapping.
- Issues or tool limitations noticed: The lack of file upload meant the raw CV couldn't be attached directly in this stage.
- Notes for next time: For forms without upload fields, ensure the text data is as comprehensive as possible.

**2026-05-26 — حراج (Haraj) (https://haraj.com.sa/careers)**
- JavaScript injection: CV AutoFill Agent successfully handled the fields.
- Special handling needed: Original Google Form was closed, so navigated to careers-page.com/haraj. No Co-op role listed, so selected 'Product Designer'.
- Fastest approach used: CV AutoFill Agent.
- Issues or tool limitations noticed: Redirected from main site to careers-page.com.
- Notes for next time: If original link is closed or redirects, follow the redirect to the actual careers page.

**2026-05-18 — كريم / Careem (Greenhouse Portal)**
- JavaScript injection: تم الاعتماد على إضافة Simplify لتعبئة أغلب الحقول الأساسية بنجاح وسرعة.
- Special handling needed: لعدم وجود فرصة تدريب واضحة، تم اختيار أقرب شاغر تقني (Forward Deployment Engineer). واجهنا تحدياً في حقل الموقع الجغرافي (Location) الذي لم يستجب للكتابة المباشرة، فتم حله باستخدام النقر على زر التحديد التلقائي للموقع (Locate me).
- Fastest approach used: استخدام Simplify لتعبئة البيانات الأساسية وإرفاق السيرة الذاتية، متبوعاً بالضغط لتحديد الموقع الجغرافي والإجابة على الأسئلة الديموغرافية.
- Issues or tool limitations noticed: حقول الموقع الجغرافي المخصصة (Custom Location fields) في Greenhouse تحتاج تدخلاً يدوياً أو استخدام زر التحديد التلقائي.
- Notes for next time: في منصة Greenhouse، يجب التفاعل المباشر (Click) مع حقل المنطقة أو تفعيل زر (Locate me) إن وجد لتجاوز مشكلة الإدخال النصي المباشر.
**2026-05-17 — هنقرستيشن / HungerStation (Delivery Hero / SmartRecruiters)**
- JavaScript injection: تم الاعتماد بشكل رئيسي على أداة Simplify للتعبئة، ثم استخدام النقر والإدخال (Click + Type) للقوائم المنسدلة.
- Special handling needed: لم يتم العثور على فرص "تدريب تعاوني" شاغرة في قسم التقنية، لذا قام الوكيل بذكاء باختيار شاغر (Software Engineer II - Backend) كونه مخصصاً للسعوديين ولإدراج السيرة الذاتية ضمن قاعدة المرشحين.
- Fastest approach used: استخدام Simplify سرّع العملية جداً على منصة SmartRecruiters، واستكمل الوكيل الأسئلة الإضافية بالضغط المباشر.
- Issues or tool limitations noticed: لا يوجد، العملية كانت سلسة جداً.
- Notes for next time: خوارزمية Simplify ممتازة مع منصات التوظيف العالمية مثل SmartRecruiters. يجب دائماً التأكد من إكمال الأسئلة المخصصة للوظيفة (مثل الجنسية واللغة) لضمان عدم حدوث خطأ عند الإرسال.
**2026-05-17 — ماكدونالدز / Riyadh Foods (https://riyadhfoods.com/pages/careers)**
- JavaScript injection: فشل استخدام الحقن البرمجي المباشر لأن النموذج مدمج داخل إطار خارجي (iframe) محمي.
- Special handling needed: تم اللجوء للمستوى الثالث من التعليمات (Click + Type) لتعبئة جميع الحقول النصية والقوائم المنسدلة يدوياً (الضغط ثم الكتابة/الاختيار) لتجاوز حماية الـ iframe.
- Fastest approach used: المحاكاة اليدوية بالضغط المباشر أثبتت فعاليتها كبديل جذري عند منع الوصول عبر الـ DOM.
- Issues or tool limitations noticed: النماذج المدمجة (iframes) تتطلب تفاعلاً مرئياً، مما يزيد من عدد النقرات المسجلة. توقف الوكيل عند خطوة رفع الـ CV كالمعتاد.
- Notes for next time: عند استعصاء الـ JS Injection، يجب الانتقال فوراً للمحاكاة اليدوية (Click + Type). في القوائم المنسدلة، تم اختيار (Information Technology / Co-op) لضمان التوجيه الصحيح.
**2026-05-17 — شاورمر / Innovative Foods (ZenATS Platform)**
- JavaScript injection: تم استخدام الحقن بنجاح وسرعة لتعبئة كافة حقول النموذج.
- Special handling needed: الرابط الأساسي لشاورمر لم يعمل بشكل صحيح، فتم البحث والوصول للشركة الأم (Innovative Foods) التي تدير التوظيف عبر منصة ZenATS.
- Fastest approach used: استخدام الحقن البرمجي (JavaScript) مباشرة على الحقول كان سريعاً جداً ولم يواجه قيوداً.
- Issues or tool limitations noticed: توقف الوكيل عند خطوة رفع السيرة الذاتية لترك المجال للمستخدم تطبيقاً للقاعدة.
- Notes for next time: إذا كان رابط التوظيف المباشر معطلاً أو غير موجود، ابحث عن اسم الشركة على محركات البحث للوصول لصفحة التوظيف البديلة أو الشركة الأم.
**2026-05-17 — هرفي (https://www.herfy.com/ar/careers)**
- JavaScript injection: تم تعبئة البيانات بسلاسة وتحديد الخيارات من القوائم المنسدلة.
- Special handling needed: لم يتوفر خيار "تدريب تعاوني IT" بشكل صريح، فتم اختيار المسمى الأقرب "محلل بيانات (Data Analyst)" لضمان وصول ملفك لقاعدة البيانات التقنية لديهم.
- Fastest approach used: النموذج مكون من صفحة واحدة مما سرّع عملية تعبئة البيانات بالكامل.
- Issues or tool limitations noticed: توقف الوكيل عند خطوة رفع السيرة الذاتية (CV Upload) بناءً على القاعدة الإلزامية بترك الرفع اليدوي للمستخدم في حال لم يتم تعبئته تلقائياً.
- Notes for next time: اختيار أقرب تخصص تقني في القوائم المحدودة مفيد لإدراج السيرة الذاتية ضمن النظام. يجب دائماً الانتباه لحقول رفع الملفات الإلزامية لتجنب الفشل في الإرسال.
**2026-05-17 — كارفور / ماجد الفطيم (https://www.majidalfuttaim.com/en/careers)**
- JavaScript injection: تم استخدام الحقن البرمجي والنقرات لتعبئة القوائم المنسدلة بدقة (مثل الجنسية والمنطقة ومجال الاهتمام التقني).
- Special handling needed: استخدام إضافة Simplify ساهم في سرعة رفع السيرة الذاتية والبيانات الأساسية. القوائم المنسدلة المعقدة في نظام (Oracle HCM) تطلبت نقرات لفتحها.
- Fastest approach used: دمج أداة Simplify كخطوة أولى ثم استخدام الحقن البرمجي والنقر للحقول المتبقية.
- Issues or tool limitations noticed: لم تحدث أخطاء، النظام استجاب جيداً للحقن.
- Notes for next time: الاعتماد المستمر على Simplify في البداية يوفر وقتاً كبيراً جداً، وهو ممتاز للتعامل مع مواقع التوظيف المعتمدة على Oracle HCM.
**2026-05-17 — مجموعة بن داود (https://bindawood.com/careers)**
- JavaScript injection: لم يتم الإبلاغ عن مشاكل، الاعتماد على الاستيراد والتعبئة التلقائية.
- Special handling needed: قسم المُعرّفين (References) تطلب بيانات إلزامية غير موجودة في السيرة الذاتية (الاسم ورقم الجوال)، مما استدعى تدخل المستخدم.
- Fastest approach used: استيراد البيانات عبر LinkedIn لاختصار الوقت، ثم إكمال باقي الأقسام.
- Issues or tool limitations noticed: الوكيل توقف مبكراً قبل إكمال أقسام الخبرات والشهادات في المحاولة الأولى.
- Notes for next time: التأكد من المرور على **جميع** الأقسام الجانبية في الصفحة وتعبئتها قبل التوقف. إذا كان هناك حقل إلزامي ناقص (كالمُعرّفين)، يجب إكمال باقي الحقول أولاً ثم التوقف وطلب تدخل المستخدم.
### Template for new entries:
```
**[Date] — [Company Name] ([URL])**
- JavaScript injection: worked / failed on [which fields]
- Special handling needed: [describe]
- Fastest approach used: [describe]
- Issues or tool limitations noticed: [describe]
- Notes for next time: [anything useful]
```

---

*(No entries yet — will be populated after the first application attempt.)*