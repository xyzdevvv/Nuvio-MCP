import { Autowired } from '@Nuvio-MCP/di';
import { getIcon } from '@Nuvio-MCP/ide-components';
import { MenuContribution } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { IMenuRegistry } from '@Nuvio-MCP/ide-core-browser/lib/menu/next/base';
import { MenuId } from '@Nuvio-MCP/ide-core-browser/lib/menu/next/menu-id';
import { LabelService } from '@Nuvio-MCP/ide-core-browser/lib/services';
import { Domain, URI, localize } from '@Nuvio-MCP/ide-core-common';
import {
  BrowserEditorContribution,
  EditorComponentRegistry,
  EditorComponentRenderMode,
  IResource,
  ResourceService,
} from '@Nuvio-MCP/ide-editor/lib/browser/types';
import { IconService } from '@Nuvio-MCP/ide-theme/lib/browser';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace/lib/common';

import { MCPConfigView } from './components/mcp-config.view';
import { MCPConfigCommands } from './mcp-config.commands';

const COMPONENTS_ID = 'Nuvio-MCP-mcp-config-viewer';
export const MCP_CONFIG_COMPONENTS_SCHEME_ID = 'mcp-config';

export type IMCPConfigResource = IResource<{ configType: string }>;

@Domain(BrowserEditorContribution, MenuContribution)
export class MCPConfigContribution implements BrowserEditorContribution, MenuContribution {
  @Autowired(IWorkspaceService)
  protected readonly workspaceService: IWorkspaceService;

  @Autowired(IconService)
  protected readonly iconService: IconService;

  @Autowired()
  labelService: LabelService;

  registerEditorComponent(registry: EditorComponentRegistry) {
    registry.registerEditorComponent({
      uid: COMPONENTS_ID,
      scheme: MCP_CONFIG_COMPONENTS_SCHEME_ID,
      component: MCPConfigView,
      renderMode: EditorComponentRenderMode.ONE_PER_WORKBENCH,
    });

    registry.registerEditorComponentResolver(MCP_CONFIG_COMPONENTS_SCHEME_ID, (resource, results) => {
      results.push({
        type: 'component',
        componentId: COMPONENTS_ID,
      });
    });
  }

  registerResource(service: ResourceService) {
    service.registerResourceProvider({
      scheme: MCP_CONFIG_COMPONENTS_SCHEME_ID,
      provideResource: async (uri: URI): Promise<IMCPConfigResource> => {
        const { configType } = uri.getParsedQuery();

        return {
          uri,
          name: localize('ai.native.mcp.config.title'),
          icon: getIcon('mcp'),
          metadata: {
            configType,
          },
        };
      },
    });
  }

  registerMenus(menus: IMenuRegistry) {
    menus.registerMenuItem(MenuId.EditorTitle, {
      command: MCPConfigCommands.OPEN_MCP_CONFIG_FILE.id,
      iconClass: getIcon('open'),
      group: 'navigation',
      order: 4,
      when: `resourceScheme == ${MCP_CONFIG_COMPONENTS_SCHEME_ID}`,
    });

    menus.registerMenuItem(MenuId.EditorTitle, {
      command: MCPConfigCommands.OPEN_MCP_CONFIG.id,
      iconClass: getIcon('open'),
      group: 'navigation',
      order: 4,
      when: 'resourceFilename =~ /mcp.json/',
    });
  }
}
