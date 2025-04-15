import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { INodeLogger } from '@Nuvio-MCP/ide-core-node';

import { ICollaborationServiceForClient, IYWebsocketServer } from '../common';

@Injectable()
export class CollaborationServiceForClient implements ICollaborationServiceForClient {
  @Autowired(INodeLogger)
  private logger: INodeLogger;

  @Autowired(IYWebsocketServer)
  private server: IYWebsocketServer;

  async requestInitContent(uri: string): Promise<void> {
    await this.server.requestInitContent(uri);
  }
}
