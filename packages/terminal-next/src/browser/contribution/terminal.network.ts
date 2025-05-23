import { Autowired } from '@Nuvio-MCP/di';
import { ClientAppContribution, Domain } from '@Nuvio-MCP/ide-core-browser';
import {
  BrowserConnectionCloseEvent,
  BrowserConnectionOpenEvent,
  OnEvent,
  WithEventBus,
} from '@Nuvio-MCP/ide-core-common';

import { ITerminalInternalService, ITerminalNetwork, TerminalNetworkStatus } from '../../common';

@Domain(ClientAppContribution)
export class TerminalNetworkContribution extends WithEventBus implements ClientAppContribution {
  @Autowired(ITerminalNetwork)
  protected readonly network: ITerminalNetwork;

  @Autowired(ITerminalInternalService)
  protected readonly service: ITerminalInternalService;

  onStart() {
    this.network.bindErrors();
  }

  @OnEvent(BrowserConnectionOpenEvent)
  handleBrowserConnectionOpen(_e: BrowserConnectionOpenEvent) {
    this.network.setStatus(TerminalNetworkStatus.CONNECTED);
  }

  @OnEvent(BrowserConnectionCloseEvent)
  handleBrowserConnectionClose(_e: BrowserConnectionCloseEvent) {
    this.network.setStatus(TerminalNetworkStatus.DISCONNECTED);
  }
}
