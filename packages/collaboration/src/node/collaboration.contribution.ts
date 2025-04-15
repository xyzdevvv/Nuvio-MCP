import { Autowired } from '@Nuvio-MCP/di';
import { Domain, INodeLogger, ServerAppContribution } from '@Nuvio-MCP/ide-core-node';

import { IYWebsocketServer } from '../common';

import { YWebsocketServerImpl } from './y-websocket-server';

@Domain(ServerAppContribution)
export class CollaborationNodeContribution implements ServerAppContribution {
  @Autowired(IYWebsocketServer)
  private server: YWebsocketServerImpl;

  @Autowired(INodeLogger)
  private logger: INodeLogger;

  initialize() {
    this.server.initialize();
  }

  onStop() {
    this.server.destroy();
  }
}
