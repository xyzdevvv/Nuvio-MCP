import { Autowired } from '@Nuvio-MCP/di';
import { Domain, localize } from '@Nuvio-MCP/ide-core-browser';
import { EXPLORER_CONTAINER_ID } from '@Nuvio-MCP/ide-explorer/lib/browser/explorer-contribution';
import { IMainLayoutService, MainLayoutContribution } from '@Nuvio-MCP/ide-main-layout';

import { TocPanel } from './toc.panel';

@Domain(MainLayoutContribution)
export class TocContribution implements MainLayoutContribution {
  @Autowired(IMainLayoutService)
  private mainLayoutService: IMainLayoutService;

  onDidRender() {
    this.mainLayoutService.collectViewComponent(
      {
        component: TocPanel,
        collapsed: true,
        id: 'outline-view',
        name: localize('outline.title'),
      },
      EXPLORER_CONTAINER_ID,
    );
  }
}
