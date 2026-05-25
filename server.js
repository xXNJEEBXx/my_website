const fs = require('fs');
const http = require('http');

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, {'Content-Type': 'application/javascript'});
  const content = fs.readFileSync('cv-autofill-extension/content.js', 'utf8');
  res.end(content);
}).listen(8080);
console.log('Server started on 8080 serving content.js');
