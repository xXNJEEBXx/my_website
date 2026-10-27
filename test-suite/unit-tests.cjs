const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '../cv-autofill-extension');
const context = vm.createContext({ console, setTimeout, clearTimeout, DOMException, URL });
for (const file of ['core/events.js', 'data.js', 'core/matching.js', 'core/field-catalog.js', 'core/profile.js', 'adapters/registry.js', 'adapters/sites.js', 'adapters/jisr.js', 'adapters/oracle.js', 'site-rules.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
const app = context.__CV_APP;
const options = values => values.map(value => ({ textContent: value, value }));

for (const [target, values, expected] of [
  ['سعودي', ['Non-Saudi', 'Saudi Arabia', 'Kuwait'], 'Saudi Arabia'],
  ['Saudi', ['Non-Saudi', 'Saudi Arabia'], 'Saudi Arabia'],
  ['Saudi Arabia', ['Saudi Arabian Islands', 'Saudi Arabia'], 'Saudi Arabia'],
  ['Non-Saudi', ['Saudi Arabia', 'Non-Saudi'], 'Non-Saudi'],
  ['Male', ['Female', 'Male'], 'Male'],
  ['ذكر', ['Female', 'Male'], 'Male'],
  ['Yes', ['No', 'Yes'], 'Yes'],
  ['لا', ['نعم', 'لا'], 'لا'],
  ['سعودي', ['غير سعودي', 'سعودي'], 'سعودي'],
  ['Saudi', ['Non-Saudi'], null],
  ['Male', ['Female'], null],
  ['Male', ['Male or Female'], null],
  ['Saudi', ['Saudi resident'], null],
  ['M', ['Company', 'Female'], null],
  ['CIS', ['Citizenship', 'Computer Information Systems'], 'Computer Information Systems'],
  ['Arabic', ['English', 'العربية'], 'العربية'],
  ['Al-Ahsa', ['Al Ahsa', 'Riyadh'], 'Al Ahsa'],
  ["Bachelor's Degree", ['Master', 'Bachelor of Computer Information Systems'], 'Bachelor of Computer Information Systems']
]) test(`shared matcher: ${target} selects ${expected || 'nothing'}`, () => {
  const result = app.Matching.choose(options(values), target);
  assert.equal(result.option?.textContent || null, expected);
});
test('equal best matches are blocked rather than guessed', () => assert.equal(app.Matching.choose(options(['Saudi', 'Saudi']), 'Saudi').code, 'AMBIGUOUS_OPTION'));
test('disabled exact option is not selected', () => assert.equal(app.Matching.choose([{ textContent: 'Male', value: 'Male', disabled: true }], 'Male').status, 'blocked'));
test('empty labels are never matched', () => assert.equal(app.Matching.rank('', 'Male'), 0));
test('Arabic normalization preserves semantic matching', () => assert.equal(app.Matching.rank('العَرَبِيّة', 'Arabic'), 90));
test('CV and adapters load in the same lexical context without collisions', () => assert.ok(app.PLATFORM_SELECTORS.jisr));
test('profile phone representations are consistent', () => {
  assert.equal(app.CV.phone.replace(/\D/g, ''), app.CV.phoneClean);
  assert.ok(app.CV.phoneClean.endsWith(app.CV.phoneWithoutZero));
  assert.equal(app.CV.phoneLocal, '0' + app.CV.phoneWithoutZero);
});
test('profile GPA fits its scale', () => assert.ok(Number(app.CV.gpa) <= Number(app.CV.gpaScale)));
test('DOB is ISO for native date fields', () => assert.equal(app.Profile.value('dob', { type: 'date' }, 'date of birth').value, app.CV.dob));
test('English name hints resolve English data', () => assert.equal(app.Profile.value('firstName', { type: 'text' }, 'First Name').value, app.CV.firstName));
test('Arabic name hints resolve Arabic data', () => assert.equal(app.Profile.value('firstName', { type: 'text' }, 'الاسم الأول').value, app.CV.firstNameAr));
test('explicit English override takes precedence over Arabic labels', () => assert.equal(app.Profile.value('fullName', { type: 'text' }, 'الاسم بالإنجليزي name_en', 'fullName').value, app.CV.fullName));
test('expired training date requires review without modifying the profile', () => {
  const before = app.CV.trainingStartDate;
  if (before < new Date().toISOString().slice(0, 10)) assert.equal(app.Profile.value('trainingStartDate', { type: 'date' }, 'training start').code, 'PROFILE_DATE_NEEDS_REVIEW');
  assert.equal(app.CV.trainingStartDate, before);
});
for (const [url, expected] of [
  ['https://www.jisr.net/ar/company/careers/1', 'jisr'],
  ['https://example.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/1', 'oracle_hcm'],
  ['https://boards.greenhouse.io/company', 'greenhouse'],
  ['https://example.invalid/?next=https://jisr.net', 'generic'],
  ['https://eviljisr.net/form', 'generic'],
  ['https://docs.google.com/forms/d/1', 'google_forms']
]) test(`adapter detection: ${expected} for ${new URL(url).hostname}`, () => assert.equal(app.Adapters.current(url).id, expected));
test('Jisr phone rule derives from the profile', () => assert.equal(app.Adapters.get('jisr').fields['#candidate_profile_phone_number'].profileKey, 'phoneWithoutZero'));
test('real PDF asset exists and has a PDF signature', () => assert.equal(fs.readFileSync(path.join(root, 'assets/resume.pdf')).subarray(0, 5).toString(), '%PDF-'));
test('MAIN world only receives a non-sensitive bridge', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.deepEqual(manifest.content_scripts.filter(item => item.world === 'MAIN').flatMap(item => item.js), ['page-bridge.js']);
  assert.ok(!manifest.content_scripts.flatMap(item => item.js).includes('cv-pdf-data.js'));
  assert.deepEqual(manifest.host_permissions, ['http://127.0.0.1:8989/*']);
  assert.ok(!manifest.host_permissions.includes('<all_urls>'));
});
test('standalone is generated from the bridge and has no profile/PDF', () => {
  const content = fs.readFileSync(path.join(root, 'standalone-autofill.js'), 'utf8');
  assert.ok(content.includes(fs.readFileSync(path.join(root, 'page-bridge.js'), 'utf8')));
  assert.ok(!content.includes(app.CV.email));
  assert.ok(!content.includes('JVBERi'));
  assert.ok(!content.includes('FIELD_CATALOG'));
});
test('all manifest source files exist and are valid JavaScript', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  for (const file of manifest.content_scripts.flatMap(item => item.js)) new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
});
test('saved fixtures exist and do not contain extension overlays', () => {
  const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/manifest.json'), 'utf8'));
  assert.ok(fixtures.length > 0);
  for (const fixture of fixtures) {
    const html = fs.readFileSync(path.join(__dirname, 'fixtures', fixture.file), 'utf8');
    assert.ok(html.length > 100);
    assert.ok(!html.includes('id="cv-agent-dashboard"'));
  }
});
