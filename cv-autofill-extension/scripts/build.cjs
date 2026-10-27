// No dependencies. The standalone is only an RPC client: no profile, PDF or second engine.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
fs.writeFileSync(path.join(root, 'ui-styles.js'), '// Generated from ui.css by scripts/build.cjs\n(() => { globalThis.__CV_APP.UI_CSS = ' + JSON.stringify(fs.readFileSync(path.join(root, 'ui.css'), 'utf8')) + '; })();\n');
const bridge = fs.readFileSync(path.join(root, 'page-bridge.js'), 'utf8');
fs.writeFileSync(path.join(root, 'standalone-autofill.js'), '// GENERATED. Requires the installed extension. No personal data is embedded.\n' + bridge + '\nwindow.__runCoopAutofill = options => window.__CV_AGENT.fill(options);\n');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
for (const entry of manifest.content_scripts) for (const file of entry.js) if (!fs.existsSync(path.join(root, file))) throw new Error('Missing source: ' + file);
let checked = 0;
function validate(directory) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(item.name)) continue;
    const file = path.join(directory, item.name);
    if (item.isDirectory()) validate(file);
    else if (/\.(?:js|cjs)$/.test(file)) { new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file }); checked++; }
  }
}
validate(root);
console.log('Built shared assets and checked ' + checked + ' JavaScript sources.');
