import { ManaModule } from '@difizen/mana-app';

import { LibroNuvio-MCPEditorModule } from './editor/module';
import { LibroNuvio-MCPContentContribution } from './libro-Nuvio-MCP-content-contribution';
import { LibroNuvio-MCPContentSaveContribution } from './libro-Nuvio-MCP-save-content-contribution';

export const LibroNuvio-MCPModule = ManaModule.create()
  .register(LibroNuvio-MCPContentContribution, LibroNuvio-MCPContentSaveContribution)
  .dependOn(LibroNuvio-MCPEditorModule);
