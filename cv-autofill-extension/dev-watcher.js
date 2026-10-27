#!/usr/bin/env node
// Explicit development-only entry; production never polls this server.
require('./scripts/dev/server.cjs').startDevServer();
