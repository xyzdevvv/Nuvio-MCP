import { Injectable, Provider } from '@Nuvio-MCP/di';
import { AIBackSerivcePath, AIBackSerivceToken } from '@Nuvio-MCP/ide-core-common';
import { NodeModule } from '@Nuvio-MCP/ide-core-node';
import { BaseAIBackService } from '@Nuvio-MCP/ide-core-node/lib/ai-native/base-back.service';

import { SumiMCPServerProxyServicePath, TokenMCPServerProxyService } from '../common';
import { ToolInvocationRegistryManager, ToolInvocationRegistryManagerImpl } from '../common/tool-invocation-registry';

import { SumiMCPServerBackend } from './mcp/sumi-mcp-server';

@Injectable()
export class AINativeModule extends NodeModule {
  providers: Provider[] = [
    {
      token: AIBackSerivceToken,
      useClass: BaseAIBackService,
    },
    {
      token: ToolInvocationRegistryManager,
      useClass: ToolInvocationRegistryManagerImpl,
    },
    {
      token: TokenMCPServerProxyService,
      useClass: SumiMCPServerBackend,
    },
  ];

  backServices = [
    {
      servicePath: AIBackSerivcePath,
      token: AIBackSerivceToken,
    },
    // {
    //   servicePath: MCPServerManagerPath,
    //   token: MCPServerManager,
    // },
    {
      servicePath: SumiMCPServerProxyServicePath,
      token: TokenMCPServerProxyService,
    },
  ];
}
