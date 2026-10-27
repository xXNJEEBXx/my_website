// One authenticated, loopback-only development server for logs, fixtures and watch signals.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
function createDevServer({ token, fixturesDir, logFile, extDir, watch = false, allowedOrigin = '' }) {
  if (!token || token.length < 16) throw new Error('A development token of at least 16 characters is required');
  const clients = new Set(); let watcher, debounce;
  let sequence = 0, revision = Date.now() + '-0';
  const broadcast = file => {
    revision = Date.now() + '-' + (++sequence);
    for (const response of clients) { response.end(JSON.stringify({ reload: true, file, revision })); clients.delete(response); }
  };
  const server = http.createServer((request, response) => {
    const send = (code, body) => { response.writeHead(code, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(body)); };
    const url = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'GET' && url.pathname === '/health') return send(200, { ok: true, developmentOnly: true });
    const permittedOrigin = request.headers.origin === allowedOrigin || (!allowedOrigin && /^chrome-extension:\/\/[a-p]{32}$/.test(request.headers.origin || ''));
    if (request.headers.origin && !permittedOrigin) return send(403, { code: 'ORIGIN_NOT_ALLOWED' });
    if (request.headers.origin && permittedOrigin) response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      return send(204, {});
    }
    const supplied = Buffer.from((request.headers.authorization || '').replace(/^Bearer /, ''));
    const expected = Buffer.from(token);
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return send(401, { code: 'AUTH_REQUIRED' });
    if (url.pathname === '/watch' && request.method === 'GET') {
      const since = url.searchParams.get('since');
      if (!since || since !== revision) return send(200, { reload: !!since, revision });
      response.writeHead(200, { 'Content-Type': 'application/json' }); clients.add(response);
      const timer = setTimeout(() => { if (clients.delete(response)) response.end(JSON.stringify({ reload: false, revision })); }, 20000);
      request.on('close', () => { clearTimeout(timer); clients.delete(response); }); return;
    }
    if (url.pathname === '/trigger-reload' && request.method === 'POST') { broadcast('manual'); return send(200, { ok: true }); }
    if (request.method !== 'POST' || !['/save-fixture', '/log'].includes(url.pathname)) return send(404, { code: 'NOT_FOUND' });
    let bytes = 0, chunks = [], rejected = false;
    request.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 1024 * 1024) { if (!rejected) send(413, { code: 'BODY_TOO_LARGE' }); rejected = true; chunks = []; return; }
      if (!rejected) chunks.push(chunk);
    });
    request.on('end', () => {
      if (rejected) return;
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (url.pathname === '/log') {
          if (!logFile) return send(404, { code: 'LOGGING_DISABLED' });
          const entry = { time: new Date().toISOString(), platform: String(data.platform || '').slice(0, 50), code: String(data.code || '').replace(/[^A-Z0-9_-]/gi, '').slice(0, 80), count: Number(data.count) || 0 };
          fs.mkdirSync(path.dirname(logFile), { recursive: true }); fs.appendFileSync(logFile, JSON.stringify(entry) + '\n'); return send(200, { ok: true });
        }
        if (data.sanitized !== true || typeof data.html !== 'string' || typeof data.signature !== 'string' || data.signature.length > 30000) return send(400, { code: 'SANITIZED_FIXTURE_REQUIRED' });
        if (/<script\b|\bon\w+\s*=|<input[^>]+type\s*=\s*["']?(?:password|hidden)/i.test(data.html)) return send(400, { code: 'UNSAFE_FIXTURE_MARKUP' });
        const hash = crypto.createHash('sha256').update(data.signature + '|' + data.url).digest('hex').slice(0, 12);
        const name = String(data.name || 'fixture').replace(/[^a-z0-9_-]/gi, '-').slice(0, 90) + '-' + hash;
        fs.mkdirSync(fixturesDir, { recursive: true });
        const manifestPath = path.join(fixturesDir, 'manifest.json');
        const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
        if (!Array.isArray(manifest)) throw new Error('Invalid fixture manifest');
        const duplicate = manifest.some(item => item.signature === data.signature && item.platform === data.platform && item.url === data.url);
        if (duplicate) return send(200, { ok: true, saved: false, duplicate: true });
        fs.writeFileSync(path.join(fixturesDir, name + '.html'), data.html);
        manifest.push({ id: name, file: name + '.html', signature: data.signature, platform: String(data.platform || 'generic'), url: String(data.url || ''), fieldCount: Number(data.fieldCount) || 0, capturedAt: new Date().toISOString() });
        const temporary = manifestPath + '.tmp'; fs.writeFileSync(temporary, JSON.stringify(manifest, null, 2));
        try { fs.renameSync(temporary, manifestPath); }
        catch (error) { if (!['EACCES', 'EPERM'].includes(error.code) || !fs.existsSync(manifestPath)) throw error; fs.copyFileSync(temporary, manifestPath); fs.unlinkSync(temporary); }
        send(200, { ok: true, saved: true, name });
      } catch (error) { send(400, { code: 'INVALID_DEVELOPMENT_PAYLOAD', message: error.message }); }
    });
  });
  if (watch && extDir) watcher = fs.watch(extDir, { recursive: true }, (_type, filename) => {
    if (!filename || /node_modules|standalone-autofill|ui-styles|\.git|package-lock|\.dev-runtime/.test(filename) || !/\.(js|json|html|css)$/.test(filename)) return;
    clearTimeout(debounce); debounce = setTimeout(() => {
      try {
        execFileSync(process.execPath, [path.join(extDir, 'scripts/build.cjs')], { stdio: 'pipe' });
        broadcast(filename);
      } catch (error) { console.error('Update deferred: build/syntax check failed. ' + error.message); }
    }, 250);
  });
  server.on('close', () => { watcher?.close(); clearTimeout(debounce); for (const response of clients) response.end(); clients.clear(); });
  return server;
}
function startDevServer({ port = 8989, watch = true } = {}) {
  const extDir = path.resolve(__dirname, '../..');
  const token = process.env.CV_DEV_TOKEN || crypto.randomBytes(24).toString('base64url');
  if (process.argv[2] === 'reload') {
    if (!process.env.CV_DEV_TOKEN) throw new Error('Set CV_DEV_TOKEN to the running server token');
    const request = http.request({ hostname: '127.0.0.1', port, path: '/trigger-reload', method: 'POST', headers: { Authorization: 'Bearer ' + token } }, response => { response.resume(); process.exitCode = response.statusCode === 200 ? 0 : 1; });
    request.on('error', error => { console.error(error.message); process.exitCode = 1; }); request.end(); return;
  }
  const server = createDevServer({ token, extDir, watch, fixturesDir: path.join(extDir, '../test-suite/fixtures'), logFile: path.join(extDir, '../scratch/cv-autofill-dev/debug.jsonl'), allowedOrigin: process.env.CV_DEV_ORIGIN || '' });
  server.listen(port, '127.0.0.1', () => {
    if (watch && port === 8989) {
      const configPath = path.join(extDir, '.dev-runtime.json');
      fs.writeFileSync(configPath, JSON.stringify({ enabled: true, token }));
      server.on('close', () => { try { if (JSON.parse(fs.readFileSync(configPath)).token === token) fs.unlinkSync(configPath); } catch {} });
      const shutdown = () => { server.closeAllConnections(); server.close(() => process.exit(0)); };
      process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
    }
    console.log(`Development server: http://127.0.0.1:${port}`);
    console.log(`CV_DEV_TOKEN=${token}`);
    console.log('Development auto-update enabled. Reload the extension once to connect; subsequent valid edits reload automatically when forms are idle and empty.');
  });
  return server;
}
module.exports = { createDevServer, startDevServer };
