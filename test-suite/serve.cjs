const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
http.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const relative = url.pathname === '/' ? 'sandbox.html' : url.pathname.slice(1);
  if (!/^(?:sandbox\.(?:html|css|js)|fixtures\/[a-zA-Z0-9_-]+\.html)$/.test(relative)) { response.writeHead(404); return response.end(); }
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(target)) { response.writeHead(404); return response.end(); }
  response.setHeader('Content-Type', target.endsWith('.css') ? 'text/css' : target.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8');
  response.setHeader('Content-Security-Policy', "default-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'none'; frame-src 'self'");
  fs.createReadStream(target).pipe(response);
}).listen(8091, '127.0.0.1', () => console.log('Local fixture viewer: http://127.0.0.1:8091'));
