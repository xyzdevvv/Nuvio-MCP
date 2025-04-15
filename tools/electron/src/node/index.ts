import { AddonsModule } from '@Nuvio-MCP/ide-addons/lib/node';
import { ConstructorOf, NodeModule, ServerCommonModule } from '@Nuvio-MCP/ide-core-node';
import { ExtensionModule } from '@Nuvio-MCP/ide-extension/lib/node';
import { OpenVsxExtensionManagerModule } from '@Nuvio-MCP/ide-extension-manager/lib/node';
import { FileSchemeNodeModule } from '@Nuvio-MCP/ide-file-scheme/lib/node';
import { FileSearchModule } from '@Nuvio-MCP/ide-file-search/lib/node';
import { FileServiceModule } from '@Nuvio-MCP/ide-file-service/lib/node';
import { LogServiceModule } from '@Nuvio-MCP/ide-logs/lib/node';
import { ProcessModule } from '@Nuvio-MCP/ide-process/lib/node';
import { SearchModule } from '@Nuvio-MCP/ide-search/lib/node';
import { TerminalNodePtyModule } from '@Nuvio-MCP/ide-terminal-next/lib/node';

import { startServer } from './server';

export const CommonNodeModules: ConstructorOf<NodeModule>[] = [
  ServerCommonModule,
  LogServiceModule,
  FileServiceModule,
  ProcessModule,
  FileSearchModule,
  SearchModule,
  TerminalNodePtyModule,
  ExtensionModule,
  OpenVsxExtensionManagerModule,
  FileSchemeNodeModule,
  AddonsModule,
];

startServer({
  modules: [...CommonNodeModules],
}).then(() => {
  // eslint-disable-next-line no-console
  console.log('ready');
  if (process.send) {
    process.send('ready');
  }
});
