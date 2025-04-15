import { LogLevel } from '@Nuvio-MCP/ide-core-common';
import { IBuiltInCommand, extProcessInit } from '@Nuvio-MCP/ide-extension/lib/hosted/ext.process-base';

const builtinCommands: IBuiltInCommand[] = [
  {
    id: 'test:builtinCommand:test',
    handler: {
      handler: (args) => 'fake token',
    },
  },
];

extProcessInit({
  builtinCommands,
  logLevel: LogLevel.Info,
});
