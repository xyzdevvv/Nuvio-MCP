import { Autowired } from '@Nuvio-MCP/di';
import { ClientAppContribution, Domain, formatLocalize, getIcon, localize } from '@Nuvio-MCP/ide-core-browser';
import { EXPLORER_CONTAINER_ID } from '@Nuvio-MCP/ide-core-browser/lib/common/container-id';
import { browserViews } from '@Nuvio-MCP/ide-core-browser/lib/extensions/schema/browserViews';
import { ComponentContribution, ComponentRegistry } from '@Nuvio-MCP/ide-core-browser/lib/layout';
import { IExtensionsSchemaService } from '@Nuvio-MCP/ide-core-common';

export { EXPLORER_CONTAINER_ID };

@Domain(ClientAppContribution, ComponentContribution)
export class ExplorerContribution implements ClientAppContribution, ComponentContribution {
  @Autowired(IExtensionsSchemaService)
  protected readonly extensionsSchemaService: IExtensionsSchemaService;

  /**
   * register `explorer` component container
   */
  registerComponent(registry: ComponentRegistry) {
    registry.register('@Nuvio-MCP/ide-explorer', [], {
      iconClass: getIcon('explorer'),
      title: localize('explorer.title'),
      priority: 10,
      containerId: EXPLORER_CONTAINER_ID,
      activateKeyBinding: 'ctrlcmd+shift+e',
    });
  }

  onStart() {
    this.extensionsSchemaService.appendExtensionPoint(['browserViews', 'properties'], {
      extensionPoint: EXPLORER_CONTAINER_ID,
      frameworkKind: ['Nuvio-MCP'],
      jsonSchema: {
        ...browserViews.properties,
        description: formatLocalize('sumiContributes.browserViews.location.custom', localize('explorer.title')),
      },
    });
  }
}
