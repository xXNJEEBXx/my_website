const playwright = require('playwright');

// Override the launch function before the MCP server imports it
const originalLaunch = playwright.chromium.launch;

playwright.chromium.launch = async function (options) {
    console.error("[Custom MCP] Intercepted browser launch!");
    console.error("[Custom MCP] Changing from new context to CDP connection -> http://localhost:9222");

    try {
        // We connect to the user's running Chrome via CDP
        const browser = await playwright.chromium.connectOverCDP('http://localhost:9222');
        
        // Minor patch: mcp-playwright uses newContext(), but connectOverCDP returns a browser
        // where we already have a contexts() array with our main profile context.
        // It helps to override newContext so it returns the default context instead
        // of throwing or creating a blank one that doesn't share sessions.
        
        const originalNewContext = browser.newContext.bind(browser);
        browser.newContext = async function(contextOptions) {
            console.error("[Custom MCP] Returning existing persistent context to keep user sessions!");
            return browser.contexts()[0] || await originalNewContext(contextOptions);
        };
        
        return browser;
    } catch (e) {
        console.error("[Custom MCP Error] Failed to connect to CDP. Make sure Chrome is running with --remote-debugging-port=9222");
        console.error(e.message);
        throw e;
    }
};

console.error("[Custom MCP] Playwright patch applied successfully.");

// Now start the original MCP server normally!
require('@executeautomation/playwright-mcp-server/dist/index.js');
