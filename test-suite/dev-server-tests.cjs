const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const { createDevServer } = require('../cv-autofill-extension/scripts/dev/server.cjs');
test('development server authenticates writes, bounds requests and saves distinct fixtures', async () => {
  const temporaryRoot = path.join(__dirname, '.temp'); fs.mkdirSync(temporaryRoot, { recursive: true });
  const directory = fs.mkdtempSync(path.join(temporaryRoot, 'cv-dev-test-'));
  const token = 'local-test-token-not-a-real-secret';
  const logFile = path.join(directory, 'debug.jsonl');
  const server = createDevServer({ token, fixturesDir: path.join(directory, 'fixtures'), logFile });
  // Exercise the actual HTTP handler in memory; no loopback/network permission is needed.
  const request = (route, body, method, headers = {}) => new Promise(resolve => {
    const incoming = Readable.from([Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]);
    incoming.url = route; incoming.method = method;
    incoming.headers = Object.fromEntries(Object.entries({ Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...headers }).map(([key, value]) => [key.toLowerCase(), value]));
    let status = 200;
    const response = { setHeader() {}, writeHead(code) { status = code; }, end(content = '') { resolve({ status, json: async () => JSON.parse(content || '{}') }); } };
    server.emit('request', incoming, response); incoming.resume();
  });
  const post = (route, body, headers) => request(route, body, 'POST', headers);
  try {
    assert.equal((await request('/health', {}, 'GET')).status, 200);
    const revision = (await (await request('/watch', {}, 'GET')).json()).revision;
    await post('/trigger-reload', {});
    assert.equal((await (await request('/watch?since=' + revision, {}, 'GET')).json()).reload, true);
    assert.equal((await post('/log', {}, { Authorization: '' })).status, 401);
    assert.equal((await post('/log', {}, { Origin: 'https://untrusted.invalid' })).status, 403);
    assert.equal((await post('/log', 'x'.repeat(1024 * 1024 + 1))).status, 413);
    assert.equal((await post('/log', { code: 'OPTION_NOT_FOUND', value: 'private-marker', html: 'private-marker' })).status, 200);
    assert.ok(!fs.readFileSync(logFile, 'utf8').includes('private-marker'));
    const fixture = { sanitized: true, name: 'generic-form', html: '<form><input name="field"></form>', signature: 'field-1', platform: 'generic', url: 'https://review.invalid/form' };
    const saved = await (await post('/save-fixture', fixture)).json();
    assert.equal(saved.saved, true, JSON.stringify(saved));
    assert.equal((await (await post('/save-fixture', fixture)).json()).duplicate, true);
    const second = await (await post('/save-fixture', { ...fixture, signature: 'field-2' })).json();
    assert.equal(second.saved, true, JSON.stringify(second));
    assert.equal(JSON.parse(fs.readFileSync(path.join(directory, 'fixtures/manifest.json'))).length, 2);
    assert.equal((await post('/save-fixture', { ...fixture, html: '<script>unsafe()</script>' })).status, 400);
  } finally {
    server.close();
    const actual = fs.realpathSync(directory), temp = fs.realpathSync(temporaryRoot);
    if (actual.startsWith(temp + path.sep) && path.basename(actual).startsWith('cv-dev-test-')) fs.rmSync(actual, { recursive: true, force: true });
  }
});
