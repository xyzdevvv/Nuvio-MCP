import { NodeExtProcessService } from '@Nuvio-MCP/ide-extension/lib/browser/extension-node.service';

export class OverrideExtensionNodeService extends NodeExtProcessService {
  override getSpawnOptions() {
    return {
      env: {
        VSCODE_NLS: JSON.stringify({
          locale: 'zh-CN',
        }),
        CF_RUNTIME: 'codefuse-ide',
      },
    };
  }
}
