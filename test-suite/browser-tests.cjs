// Tests the installed unpacked extension in a disposable Chrome profile.
// All HTTP(S) requests are fulfilled from local fixtures or aborted.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let playwright;
try { playwright = require(path.join(root, 'cv-autofill-extension/node_modules/playwright')); }
catch { playwright = require(path.join(root, 'archive/custom-playwright-mcp/node_modules/playwright')); }
const extensionDir = path.join(root, 'cv-autofill-extension');
const results = [];

(async () => {
  const profileBase = path.join(__dirname, '.profiles'); fs.mkdirSync(profileBase, { recursive: true });
  const profile = fs.mkdtempSync(path.join(profileBase, 'cv-test-'));
  const context = await playwright.chromium.launchPersistentContext(profile, {
    channel: process.env.CV_TEST_BROWSER || 'chrome', headless: true,
    ignoreDefaultArgs: ['--disable-extensions'], args: ['--enable-unsafe-extension-debugging']
  });
  const browserCDP = await context.browser().newBrowserCDPSession();
  const { id: extensionId } = await browserCDP.send('Extensions.loadUnpacked', { path: extensionDir });
  // Match the documented unpacked setup: CDP alone loads it once even when Developer Mode is off.
  const management = await context.newPage(); await management.goto('chrome://extensions/');
  await management.evaluate(() => new Promise((resolve, reject) => chrome.developerPrivate.updateProfileConfiguration({ inDeveloperMode: true }, () => chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve())));
  await management.close();
  const routes = new Map(); let sequence = 0;
  await context.route('**/*', route => {
    const url = route.request().url();
    if (routes.has(url)) return route.fulfill({ contentType: 'text/html; charset=utf-8', body: routes.get(url) });
    if (url.startsWith('chrome-extension://')) return route.continue();
    return route.abort();
  });
  async function fixture(html, origin = 'https://cv-review.invalid') {
    const url = origin + '/cv-test-' + (++sequence); routes.set(url, '<!doctype html><html><head><meta charset="utf-8"></head><body>' + html + '</body></html>');
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.waitForFunction(() => window.__CV_AGENT?.version === '2.0.0');
    const cdp = await context.newCDPSession(page); const worlds = [];
    cdp.on('Runtime.executionContextCreated', ({ context }) => worlds.push(context));
    await cdp.send('Runtime.enable');
    let contextId;
    for (const world of worlds.filter(world => !world.auxData?.isDefault)) {
      const check = await cdp.send('Runtime.evaluate', { contextId: world.id, expression: `globalThis.chrome?.runtime?.id === ${JSON.stringify(extensionId)} && !!globalThis.__CV_APP?.Agent`, returnByValue: true });
      if (check.result.value) { contextId = world.id; break; }
    }
    assert.ok(contextId, 'The installed extension must have its own isolated execution context');
    async function evaluate(fn, ...args) {
      const response = await cdp.send('Runtime.evaluate', { contextId, expression: '(' + fn.toString() + ')(...' + JSON.stringify(args) + ')', awaitPromise: true, returnByValue: true });
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
      return response.result.value;
    }
    await evaluate(() => __CV_APP.ready);
    return { page, evaluate, errors, url };
  }
  async function test(name, html, fn, origin) {
    const started = Date.now(); let f;
    try {
      f = await fixture(html, origin); await fn(f);
      assert.deepEqual(f.errors, [], 'No page or extension initialization errors');
      results.push({ name, passed: true, ms: Date.now() - started }); console.log('PASS ' + name);
    } catch (error) { results.push({ name, passed: false, error: error.stack }); console.error('FAIL ' + name + ': ' + error.message); }
    finally { await f?.page.close(); }
  }
  try {
    await test('real manifest loads and isolates profile/PDF from MAIN', '<input name="email"><input name="first_name">', async ({ page, evaluate }) => {
      assert.equal(await page.evaluate(() => window.__CV_APP), undefined);
      assert.equal(await evaluate(() => !!__CV_APP.CV && !__CV_APP.CV_PDF_BASE64), true);
      assert.equal((await page.evaluate(() => __CV_AGENT.fill())).code, 'ACTIVATE_FROM_EXTENSION_FIRST');
      assert.equal((await page.evaluate(() => __CV_AGENT.unlock())).code, 'TRUSTED_CHANNEL_REQUIRED');
      assert.equal(await page.evaluate(() => document.getElementById('cv-agent-host')?.shadowRoot), null);
      const outputDir = path.join(root, 'scratch/cv-autofill-implementation'); fs.mkdirSync(outputDir, { recursive: true });
      await page.screenshot({ path: path.join(outputDir, 'dashboard.png') });
    });
    await test('native dropdown matching does not invert nationality/gender', '<select id="nat"><option value="">Choose</option><option value="non">Non-Saudi</option><option value="saudi">Saudi Arabia</option></select><select id="gender"><option value="">Choose</option><option value="female">Female</option><option value="male">Male</option></select>', async ({ evaluate }) => {
      const data = await evaluate(async () => {
        const a = await __CV_APP.Engine.executeSelectSet(document.getElementById('nat'), 'سعودي');
        const b = await __CV_APP.Engine.executeSelectSet(document.getElementById('gender'), 'Male');
        return { a: a.status, b: b.status, nat: document.getElementById('nat').value, gender: document.getElementById('gender').value };
      });
      assert.deepEqual(data, { a: 'verified', b: 'verified', nat: 'saudi', gender: 'male' });
    });
    await test('failed action is not counted as a filled field', '', async ({ evaluate }) => {
      const result = await evaluate(async () => { __CV_APP.Engine.clear(); __CV_APP.Engine.enqueue({ label: 'failure', execute() { throw new Error('LOCAL_TEST_FAILURE'); } }); return __CV_APP.Engine.play(1); });
      assert.equal(result.success, false); assert.equal(result.filled, 0); assert.equal(result.failedActions, 1);
    });
    await test('cancel clears the wait before the next action', '', async ({ evaluate }) => {
      const data = await evaluate(async () => {
        const e = __CV_APP.Engine; e.clear(); let count = 0;
        for (let i = 0; i < 2; i++) e.enqueue({ id: 'cancel-' + i, execute() { count++; return { status: 'verified' }; } });
        const running = e.play(150); await __CV_APP.wait(15); const cancelled = await e.cancel(); await running; await __CV_APP.wait(180);
        return { count, cancelled: cancelled.cancelled };
      });
      assert.deepEqual(data, { count: 1, cancelled: true });
    });
    await test('concurrent play shares one promise and executes once', '', async ({ evaluate }) => {
      const data = await evaluate(async () => {
        const e = __CV_APP.Engine; e.clear(); let count = 0;
        e.enqueue({ execute: async ({ signal }) => { count++; await __CV_APP.wait(50, signal); return { status: 'verified' }; } });
        const first = e.play(1), second = e.play(1); const same = first === second; await Promise.all([first, second]); return { same, count };
      }); assert.deepEqual(data, { same: true, count: 1 });
    });
    await test('clear cannot silently replace an active queue', '', async ({ evaluate }) => {
      const code = await evaluate(async () => { const e = __CV_APP.Engine; e.clear(); e.enqueue({ execute: async ({ signal }) => { await __CV_APP.wait(100, signal); return { status: 'verified' }; } }); const running = e.play(1); const code = e.clear().code; await e.cancel(); await running; return code; }); assert.equal(code, 'EXECUTION_BUSY');
    });
    await test('Jisr selects one eligibility answer and leaves unknown questions', '<form><div class="form-group"><label>مؤهل لبرنامج التدريب التعاوني؟</label><label><input type="radio" name="eligible" value="نعم">نعم</label><label><input type="radio" name="eligible" value="لا">لا</label></div><fieldset><legend>هل لديك متجر إلكتروني؟</legend><label><input type="radio" name="store" value="نعم">نعم</label><label><input type="radio" name="store" value="لا">لا</label></fieldset></form>', async ({ evaluate }) => {
      const data = await evaluate(async () => { const result = await __CV_AGENT.fill({ delay: 1 }); return { answer: document.querySelector('[name="eligible"]:checked')?.value, store: !!document.querySelector('[name="store"]:checked'), actions: result.actions.filter(action => action.type === 'radio').length }; });
      assert.deepEqual(data, { answer: 'نعم', store: false, actions: 1 });
    }, 'https://www.jisr.net');
    await test('required values and required files block preflight', '<form><input required name="unknown_required"><input required type="file"></form>', async ({ evaluate }) => {
      const result = await evaluate(() => __CV_AGENT.validate()); assert.equal(result.valid, false); assert.ok(result.issues.some(issue => issue.code === 'REQUIRED_VALUE_MISSING')); assert.ok(result.issues.some(issue => issue.code === 'REQUIRED_ATTACHMENT_MISSING'));
    });
    await test('unselected nationality options do not cause a false rejection', '<label>Nationality<select id="nationality-select"><option selected>Saudi Arabia</option><option>Non-Saudi</option></select></label>', async ({ evaluate }) => assert.equal((await evaluate(() => __CV_AGENT.validate())).valid, true));
    await test('one requested button click fires once and its index round trips', '<button hidden>Hidden</button><button type="button" id="next">Next</button><script>window.clicks=0;document.getElementById("next").onclick=()=>{window.clicks++;document.getElementById("next").hidden=true;};</script>', async ({ page, evaluate }) => {
      const data = await evaluate(async () => { const button = __CV_AGENT.getButtons()[0]; const result = await __CV_AGENT.clickButton(button.index); return { index: button.index, success: result.success }; }); assert.equal(data.index, 0); assert.equal(data.success, true); assert.equal(await page.evaluate(() => window.clicks), 1);
    });
    await test('repeated previews do not consume profile links', '<input name="link" placeholder="URL">', async ({ evaluate }) => assert.equal(await evaluate(() => { __CV_AGENT.plan(); const first = __CV_APP.Engine.getQueue()[0].value; __CV_AGENT.plan(); return first === __CV_APP.Engine.getQueue()[0].value && document.querySelector('input').value === ''; }), true));
    await test('DOB date input accepts ISO and is verified', '<input type="date" name="dob">', async ({ evaluate }) => {
      const data = await evaluate(async () => { const result = await __CV_AGENT.fill({ delay: 1 }); return { filled: result.filledCount, matches: document.querySelector('input').value === __CV_APP.CV.dob, failed: result.failedActions }; }); assert.deepEqual(data, { filled: 1, matches: true, failed: 0 });
    });
    await test('preview exclusions remain excluded during fill', '<input name="email"><input name="first_name">', async ({ evaluate }) => {
      const data = await evaluate(async () => { __CV_AGENT.plan(); __CV_APP.Engine.getQueue().find(action => action.fieldKey === 'email').enabled = false; const result = await __CV_AGENT.fill({ useCurrentPlan: true, delay: 1 }); return { emailUntouched: document.querySelector('[name="email"]').value === '', nameFilled: !!document.querySelector('[name="first_name"]').value, count: result.verifiedFields }; }); assert.deepEqual(data, { emailUntouched: true, nameFilled: true, count: 1 });
    });
    await test('existing user values are preserved', '<input name="email" value="existing-local-value"><input name="first_name">', async ({ evaluate }) => {
      const data = await evaluate(async () => { await __CV_AGENT.fill({ delay: 1 }); return document.querySelector('[name="email"]').value; }); assert.equal(data, 'existing-local-value');
    });
    await test('new conditional fields are discovered before fill completes', '<input name="email"><script>document.querySelector("input").addEventListener("change",()=>{if(!document.querySelector("[name=first_name]")){const input=document.createElement("input");input.name="first_name";document.body.append(input);}});</script>', async ({ evaluate }) => {
      const data = await evaluate(async () => { const result = await __CV_AGENT.fill({ delay: 1 }); return { filled: result.verifiedFields, nameFilled: !!document.querySelector('[name="first_name"]').value }; }); assert.deepEqual(data, { filled: 2, nameFilled: true });
    });
    await test('a moved DOM node is not followed into another form', '<form id="original"><input id="first_name" name="first_name"></form><form id="other"></form>', async ({ evaluate }) => {
      assert.equal(await evaluate(() => { const input = document.querySelector('input'); const target = __CV_APP.DOM.locator(input); document.getElementById('other').append(input); const replacement = input.cloneNode(); document.getElementById('original').append(replacement); return __CV_APP.DOM.resolve(target) === replacement; }), true);
    });
    await test('required question markers are checked even without required attributes', '<form><div class="form-group"><label>سؤال مطلوب *</label><label><input type="radio" name="unknown" value="نعم">نعم</label><label><input type="radio" name="unknown" value="لا">لا</label></div></form>', async ({ evaluate }) => {
      const result = await evaluate(() => __CV_AGENT.validate()); assert.equal(result.valid, false); assert.ok(result.issues.some(issue => issue.code === 'REQUIRED_CHOICE_MISSING'));
    });
    await test('password and OTP are not learned or persisted in page storage', '<input type="password" name="password"><input name="otp_code" autocomplete="one-time-code">', async ({ page, evaluate }) => {
      const data = await evaluate(async () => { const password = document.querySelector('input'); password.value = 'local-test-marker'; password.dispatchEvent(new Event('change', { bubbles: true })); const result = await __CV_AGENT.learn('input[type="password"]', password.value); return { blocked: result.status, rules: __CV_AGENT.learned().length, queued: __CV_APP.Engine.getQueue().length }; }); assert.deepEqual(data, { blocked: 'blocked', rules: 0, queued: 0 }); assert.equal(await page.evaluate(() => localStorage.length), 0);
    });
    await test('ordinary Apply is not a subform commit', '<section id="section" style="height:100px"><button style="position:relative;top:60px" type="button">Apply</button></section>', async ({ evaluate }) => assert.equal(await evaluate(() => __CV_APP.Commit.findCommitButton(document.getElementById('section'))), null));
    await test('Oracle preview does not modify navigation and fills before saving', '<header><a id="nav" href="/">Home</a></header><main><form id="education"><input name="university" required><select name="degree" required><option value="">Choose</option><option value="bachelor">Bachelor\'s Degree</option></select><button type="button" id="save">Save</button></form></main><script>window.commits=0;document.getElementById("save").onclick=()=>{window.commits++;document.getElementById("education").remove();const card=document.createElement("div");card.className="summary-card";document.querySelector("main").append(card);};</script>', async ({ page, evaluate }) => {
      const before = await evaluate(() => { __CV_AGENT.plan(); return { pointer: getComputedStyle(document.getElementById('nav')).pointerEvents, types: __CV_APP.Engine.getQueue().map(action => action.type) }; }); assert.notEqual(before.pointer, 'none'); assert.deepEqual(before.types, ['text', 'select', 'commit']);
      const result = await evaluate(() => __CV_AGENT.fill({ delay: 1 })); assert.equal(result.verifiedFields, 2); assert.equal(result.failedActions, 0); assert.equal(await page.evaluate(() => window.commits), 1);
    }, 'https://review.fa.ocs.oraclecloud.com');
    await test('sanitized snapshot removes textarea text and input metadata values', '<form><textarea name="notes">local-test-marker</textarea><input name="unknown" value="local-test-marker" data-secret="local-test-marker"><div>local-test-marker</div><input type="hidden" name="csrf" value="csrf-secret"></form>', async ({ evaluate }) => {
      const data = await evaluate(() => ({ html: __CV_AGENT.captureFixture().html, auto: __CV_AGENT.autoSnapshot().code })); assert.ok(!data.html.includes('local-test-marker')); assert.ok(!data.html.includes('csrf-secret')); assert.equal(data.auto, 'AUTOMATIC_CAPTURE_DISABLED');
    });
    await test('sanitized snapshot also redacts profile values inside attributes', '<form><input name="unknown"></form>', async ({ evaluate }) => {
      assert.equal(await evaluate(() => { document.querySelector('input').id = __CV_APP.CV.email; return __CV_AGENT.captureFixture().html.includes(__CV_APP.CV.email); }), false);
    });
    await test('pre-existing invalid values prevent a complete fill result', '<input type="email" name="email" value="invalid-local-value" required>', async ({ evaluate }) => {
      const result = await evaluate(() => __CV_AGENT.fill({ delay: 1 })); assert.equal(result.success, false); assert.ok(result.issues.some(issue => issue.code === 'FIELD_CONSTRAINT_FAILED'));
    });
    await test('Jisr saved fixture fills real fields, selects both menus, and attaches the actual PDF', fs.readFileSync(path.join(__dirname, 'fixtures/jisr-step2.html'), 'utf8'), async ({ evaluate }) => {
      const data = await evaluate(async () => { const result = await __CV_AGENT.fill({ delay: 1 }); return { role: document.getElementById('candidate_profile_current_role').value === __CV_APP.CV.jobTitle, nationality: document.getElementById('react-select-2-input').value, country: document.getElementById('react-select-3-input').value, fileSize: document.getElementById('cv-file-input').files[0]?.size, eligible: document.querySelector('[name="q_eligible"]:checked')?.value, unknownStoreUnanswered: !document.querySelector('[name="q_store"]:checked'), failed: result.failedActions, blocked: result.blockedActions }; }); assert.equal(data.role, true); assert.equal(data.nationality, 'Saudi Arabia'); assert.equal(data.country, 'Saudi Arabia'); assert.ok(data.fileSize > 200000); assert.equal(data.eligible, 'نعم'); assert.equal(data.unknownStoreUnanswered, true); assert.equal(data.failed, 0); assert.ok(data.blocked > 0);
    }, 'https://www.jisr.net');
    await test('an explicitly approved rule persists across page reloads via extension storage', '<form id="custom"><label for="ref">Referral detail</label><input id="ref" name="referral"></form>', async ({ page, evaluate }) => {
      assert.equal((await evaluate(() => __CV_AGENT.learn('#ref', 'explicit local answer'))).status, 'verified');
      await page.reload(); await page.waitForFunction(() => !!window.__CV_AGENT);
      const reply = await page.evaluate(() => __CV_AGENT.inspect()); assert.equal(reply.ready, true);
      const client = await context.newCDPSession(page); const worlds = []; client.on('Runtime.executionContextCreated', ({ context }) => worlds.push(context)); await client.send('Runtime.enable');
      const world = worlds.find(world => world.origin === 'chrome-extension://' + extensionId || world.name.includes(extensionId)); assert.ok(world);
      const response = await client.send('Runtime.evaluate', { contextId: world.id, expression: '__CV_AGENT.fill({delay:1})', awaitPromise: true, returnByValue: true }); assert.ok(!response.exceptionDetails);
      assert.equal(await page.inputValue('#ref'), 'explicit local answer');
    });
    await test('final submit requires explicit review and dispatches only once', '<form><input name="email" required><button type="submit" id="submit">Submit</button></form><script>window.submits=0;document.querySelector("form").onsubmit=event=>{event.preventDefault();window.submits++;document.getElementById("submit").hidden=true;};</script>', async ({ page, evaluate }) => {
      const before = await evaluate(() => __CV_AGENT.clickButton('submit')); assert.equal(before.code, 'SUBMIT_REVIEW_REQUIRED');
      const result = await evaluate(async () => { await __CV_AGENT.fill({ delay: 1 }); return __CV_AGENT.clickButton('submit', { confirmSubmit: true }); }); assert.equal(result.success, true); assert.equal(await page.evaluate(() => window.submits), 1);
    });
    await test('changing profile settings blocks stale plans until refresh', '<input name="email"><input name="first_name">', async ({ evaluate }) => {
      await evaluate(async () => { await chrome.storage.local.set({ profileOverrides: { firstName: __CV_APP.CV.firstName } }); await __CV_APP.wait(50); });
      assert.equal((await evaluate(() => __CV_AGENT.fill({ delay: 1 }))).code, 'PROFILE_UPDATED_REFRESH_PAGE');
    });
    await test('generic engine fills nested open shadow DOM', '<div id="host"></div><script>const root=document.getElementById("host").attachShadow({mode:"open"});root.innerHTML=\'<form><label>First Name<input autocomplete="given-name" required></label><div id="nested"></div></form>\';root.getElementById("nested").attachShadow({mode:"open"}).innerHTML=\'<label>Email<input autocomplete="email" type="email" required></label>\';</script>', async ({ evaluate }) => {
      const data = await evaluate(async () => { const result = await __CV_AGENT.fill({ delay: 1 }); return { success: result.success, count: result.verifiedFields, filled: __CV_APP.DOM.controls().filter(el => el.matches('input')).every(el => !!el.value) }; }); assert.deepEqual(data, { success: true, count: 2, filled: true });
    });
    await test('generic engine fills contenteditable text fields', '<div role="textbox" contenteditable="true" aria-label="First Name" aria-required="true"></div>', async ({ evaluate }) => {
      const data = await evaluate(async () => { const result = await __CV_AGENT.fill({ delay: 1 }); return { success: result.success, matches: document.querySelector('[contenteditable]').textContent === __CV_APP.CV.firstName }; }); assert.deepEqual(data, { success: true, matches: true });
    });
    await test('button combobox with ARIA options is selected and verified', '<label id="country-label">Country</label><button type="button" role="combobox" aria-labelledby="country-label" aria-controls="country-menu" aria-expanded="false">Select country</button><div role="listbox" id="country-menu" hidden><div role="option">Non-Saudi</div><div role="option">Saudi Arabia</div></div><script>const button=document.querySelector("button");const menu=document.getElementById("country-menu");button.onclick=()=>{menu.hidden=false;button.setAttribute("aria-expanded","true");};menu.onclick=e=>{button.textContent=e.target.textContent;menu.hidden=true;button.setAttribute("aria-expanded","false");};</script>', async ({ evaluate }) => {
      const data = await evaluate(async () => { const result = await __CV_AGENT.fill({ delay: 1 }); return { success: result.success, selected: document.querySelector('button[role="combobox"]').textContent }; }); assert.deepEqual(data, { success: true, selected: 'Saudi Arabia' });
    });
    await test('split birthdate uses HTML autocomplete metadata', '<input name="one" autocomplete="bday-day"><input name="two" autocomplete="bday-month"><input name="three" autocomplete="bday-year">', async ({ evaluate }) => {
      assert.equal(await evaluate(async () => { await __CV_AGENT.fill({ delay: 1 }); const inputs = [...document.querySelectorAll('input')]; return inputs[0].value === __CV_APP.CV.dobDay && inputs[1].value === __CV_APP.CV.dobMonth && inputs[2].value === __CV_APP.CV.dobYear; }), true);
    });
    await test('approved mapping overrides a generic guess and follows current profile', '<form id="semantic"><label for="contact">Email</label><input id="contact"></form>', async ({ evaluate }) => {
      const data = await evaluate(async () => { const original = __CV_APP.CV.firstName; const approval = await __CV_AGENT.learn('#contact', original); __CV_APP.CV.firstName = __CV_APP.CV.firstNameAr; const result = await __CV_AGENT.fill({ delay: 1 }); const follows = document.getElementById('contact').value === __CV_APP.CV.firstName; __CV_APP.CV.firstName = original; return { kind: approval.kind, follows, source: result.actions[0].fieldKey }; }); assert.deepEqual(data, { kind: 'profile', follows: true, source: 'firstName' });
    });
    await test('approved field survives a generated ID change', '<form id="stable"><label for="generated-1">Referral detail</label><input id="generated-1"></form>', async ({ evaluate }) => {
      assert.equal(await evaluate(async () => { await __CV_AGENT.learn('#generated-1', 'confirmed local answer'); document.querySelector('input').id = 'generated-99'; document.querySelector('label').htmlFor = 'generated-99'; await __CV_AGENT.fill({ delay: 1 }); return document.querySelector('input').value === 'confirmed local answer'; }), true);
    });
    await test('negated screening and another person fields stay for review', '<fieldset><legend>Emergency contact</legend><input name="first_name"></fieldset><input aria-label="Are you unavailable for full-time training?">', async ({ evaluate }) => {
      const data = await evaluate(async () => { const result = await __CV_AGENT.fill({ delay: 1 }); return { untouched: [...document.querySelectorAll('input')].every(el => !el.value), codes: result.issues.map(issue => issue.code) }; }); assert.equal(data.untouched, true); assert.ok(data.codes.includes('OTHER_PERSON_CONTEXT')); assert.ok(data.codes.includes('QUESTION_POLARITY_NEEDS_REVIEW'));
    });
    await test('parallel approved rules and per-run evidence are retained', '<form id="parallel"><input id="alpha" aria-label="Custom alpha"><input id="beta" aria-label="Custom beta"></form>', async ({ evaluate }) => {
      const data = await evaluate(async () => { await Promise.all([__CV_AGENT.learn('#alpha', 'answer alpha'), __CV_AGENT.learn('#beta', 'answer beta')]); await __CV_AGENT.fill({ delay: 1 }); const report = await __CV_AGENT.improvementReport(); return { a: document.getElementById('alpha').value, b: document.getElementById('beta').value, runs: report.runs }; }); assert.equal(data.a, 'answer alpha'); assert.equal(data.b, 'answer beta'); assert.ok(data.runs > 0);
    });
    await test('verified adapter bindings improve the next generic scan automatically', '<form id="auto"><label for="candidate_profile_email">Personal email</label><input id="candidate_profile_email"></form>', async ({ evaluate }) => {
      const data = await evaluate(async () => { await __CV_AGENT.fill({ delay: 1 }); const rule = __CV_AGENT.learned().find(rule => rule.automatic && rule.fieldKey === 'email'); document.querySelector('input').id = 'new-instance'; document.querySelector('label').htmlFor = 'new-instance'; document.querySelector('input').value = ''; const plan = __CV_AGENT.plan(); return { semantic: rule?.kind, source: plan.actions[0]?.source }; }); assert.deepEqual(data, { semantic: 'profile', source: 'approved-rule' });
    }, 'https://www.jisr.net');
    // Background/iframe coordination is triggered from an extension-origin page, as the popup does.
    await test('popup command fills top document and cross-origin iframe', '<input name="email"><iframe src="https://frame-review.invalid/inside"></iframe>', async ({ page }) => {
      routes.set('https://frame-review.invalid/inside', '<!doctype html><input name="first_name">');
      await page.reload(); await page.waitForFunction(() => !!window.__CV_AGENT);
      const optionsPage = await context.newPage(); await optionsPage.goto('chrome-extension://' + extensionId + '/options.html');
      await page.bringToFront();
      const result = await optionsPage.evaluate(() => chrome.runtime.sendMessage({ action: 'run_in_tab', method: 'fill', args: [{ delay: 1 }] }));
      assert.equal(result.ok, true); assert.ok(result.frames.length >= 2); assert.ok((await page.inputValue('[name="email"]')).includes('@')); const frame = page.frames().find(frame => frame.url().includes('frame-review.invalid')); assert.ok(await frame.inputValue('[name="first_name"]'));
      const targets = await browserCDP.send('Target.getTargets');
      const worker = targets.targetInfos.find(target => target.type === 'service_worker' && target.url === 'chrome-extension://' + extensionId + '/background.js');
      assert.ok(worker, 'The event-driven worker is running after a command');
      await browserCDP.send('Target.closeTarget', { targetId: worker.targetId });
      const restarted = await optionsPage.evaluate(() => chrome.runtime.sendMessage({ action: 'run_in_tab', method: 'inspect' }));
      await optionsPage.close(); assert.equal(restarted.ok, true); assert.ok(restarted.frames.length >= 2);
    });
    await test('installed updater waits for dirty data then reloads only its pristine form', '<input name="email" value="existing-local-value">', async ({ page, evaluate }) => {
      await evaluate(() => __CV_AGENT.plan());
      const worker = context.serviceWorkers().find(worker => worker.url().endsWith('/background.js')); assert.ok(worker);
      assert.equal(await worker.evaluate(() => CVDev.tryApply('test-dirty')), false);
      assert.equal(await page.inputValue('input[name="email"]'), 'existing-local-value');
      await evaluate(() => { document.querySelector('input[name="email"]').value = ''; });
      const navigation = page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame(), timeout: 15000 });
      await worker.evaluate(() => CVDev.tryApply('test-pristine')).catch(error => { if (!/closed|destroyed|Target/i.test(error.message)) throw error; });
      await navigation; await page.waitForFunction(() => !!window.__CV_AGENT);
      assert.equal((await page.evaluate(() => __CV_AGENT.inspect())).ready, true);
      assert.equal(await page.evaluate(() => !!window.__CV_APP), false);
    });
    await test('large plans reuse each form signature without changing form values', Array.from({ length: 120 }, (_, index) => '<input name="email" id="email-' + index + '">').join(''), async ({ evaluate }) => {
      const result = await evaluate(() => { const original = __CV_APP.Scanner; let calls = 0; __CV_APP.Scanner = { ...original, signature(...args) { calls++; return original.signature(...args); } }; const start = performance.now(); const plan = __CV_AGENT.plan(); __CV_APP.Scanner = original; return { calls, actions: plan.totalActions, untouched: [...document.querySelectorAll('input')].every(el => !el.value), elapsedMs: performance.now() - start }; }); assert.equal(result.actions, 120); assert.ok(result.calls <= 3); assert.equal(result.untouched, true);
    });
    await test('page API waits for isolated runtime during document startup', '<script>window.earlyRead=window.__CV_AGENT.inspect();</script><input name="email">', async ({ page }) => {
      const data = await page.evaluate(() => Promise.race([window.earlyRead, new Promise(resolve => setTimeout(() => resolve({ ready: false }), 1000))])); assert.equal(data.ready, true);
    });
    await test('plan/play also closes the learning evidence loop', '<input name="first_name">', async ({ evaluate }) => {
      assert.equal(await evaluate(async () => { const before = await __CV_AGENT.improvementReport(); __CV_AGENT.plan(); await __CV_AGENT.play(1); const after = await __CV_AGENT.improvementReport(); return after.runs === before.runs + 1; }), true);
    });
    const passed = results.filter(result => result.passed).length;
    const output = { browser: context.browser().version(), installedExtension: true, network: 'HTTP(S) fulfilled from local fixtures or aborted', passed, total: results.length, results };
    fs.writeFileSync(path.join(__dirname, 'browser-results.json'), JSON.stringify(output, null, 2) + '\n');
    console.log(`Browser: ${passed}/${results.length} passed`);
    if (passed !== results.length) process.exitCode = 1;
  } finally {
    await context.close();
    // Only remove the disposable profile created by this run, after verifying its actual parent.
    const actual = fs.realpathSync(profile), base = fs.realpathSync(profileBase);
    if (actual.startsWith(base + path.sep) && /^cv-test-/.test(path.basename(actual))) fs.rmSync(actual, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
