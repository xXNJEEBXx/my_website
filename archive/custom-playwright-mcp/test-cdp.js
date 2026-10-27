const { chromium } = require('playwright');

(async () => {
    try {
        console.log('Connecting to existing Chrome via CDP...');
        const browser = await chromium.connectOverCDP('http://localhost:9222');
        console.log('Connected!');
        const contexts = browser.contexts();
        const page = contexts[0].pages()[0] || await contexts[0].newPage();
        await page.goto('https://www.google.com');
        console.log('Navigated successfully.');
        await browser.close();
    } catch (e) {
        console.error('Error:', e.message);
    }
})();
