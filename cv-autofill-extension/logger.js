const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const logFile = path.join(__dirname, 'debug_logs.txt');

const server = http.createServer((req, res) => {
    // Add CORS headers so the extension can send requests from any page
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/log') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const timestamp = new Date().toISOString();
            const logEntry = `\n\n=========================================\n--- LOG AT ${timestamp} ---\n${body}\n=========================================\n`;
            
            fs.appendFile(logFile, logEntry, (err) => {
                if (err) {
                    console.error('Failed to write to log file', err);
                    res.writeHead(500);
                    res.end('Error writing log');
                } else {
                    console.log(`[${timestamp}] Log received and saved to debug_logs.txt!`);
                    res.writeHead(200);
                    res.end('Log saved successfully');
                }
            });
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Local logger server running at http://localhost:${PORT}`);
    console.log(`Waiting for extension logs... They will be saved directly to:`);
    console.log(logFile);
});
