// Tests import the production matcher/profile and exercise development I/O.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const result = spawnSync(process.execPath, ['--test', path.join(__dirname, 'unit-tests.cjs'), path.join(__dirname, 'dev-server-tests.cjs'), path.join(__dirname, 'dev-runtime-tests.cjs')], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
