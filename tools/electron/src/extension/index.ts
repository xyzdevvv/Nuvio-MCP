import { extProcessInit } from '@Nuvio-MCP/ide-extension/lib/hosted/ext.process-base.js';

import LogServiceClass from './mock-log-service';

(async () => {
  await extProcessInit({ LogServiceClass, builtinCommands: [] });
})();
