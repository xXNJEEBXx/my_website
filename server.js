const fs = require('fs');
const http = require('http');
const file = fs.readdirSync('.').find(f => f.includes('My CV') && f.endsWith('.pdf'));
const b64 = fs.readFileSync(file, 'base64');
const js = `window.__CV_AGENT.uploadBase64('input[type="file"]', '${b64}', 'My CV.pdf', 'application/pdf');`;

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, {'Content-Type': 'application/javascript'});
  res.end(js);
}).listen(8080);
console.log('Server started on 8080');
