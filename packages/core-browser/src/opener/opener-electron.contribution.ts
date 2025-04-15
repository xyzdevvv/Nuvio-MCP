import { Autowired, INJECTOR_TOKEN, Injector } from '@Nuvio-MCP/di';
import { Domain } from '@Nuvio-MCP/ide-core-common';
import { IElectronRendererURLService, IElectronURLService } from '@Nuvio-MCP/ide-core-common/lib/electron';

import { ClientAppContribution } from '../common/common.define';
import { electronEnv } from '../utils/electron';

import { IOpenerService } from '.';

@Domain(ClientAppContribution)
export class ElectronOpenerContributionClient implements ClientAppContribution {
  @Autowired(INJECTOR_TOKEN)
  private readonly injector: Injector;

  @Autowired(IOpenerService)
  private readonly openerService: IOpenerService;

  onStart() {
    const electronRendererURLService: IElectronRendererURLService = this.injector.get(IElectronURLService);
    electronRendererURLService.on('open-url', (payload) => {
      if (electronEnv.currentWindowId === payload.windowId) {
        this.openerService.open(payload.url);
      }
    });
  }
}
