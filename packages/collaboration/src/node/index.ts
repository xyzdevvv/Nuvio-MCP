import { Injectable, Provider } from '@Nuvio-MCP/di';
import { NodeModule } from '@Nuvio-MCP/ide-core-node';

import { CollaborationServiceForClientPath, ICollaborationServiceForClient, IYWebsocketServer } from '../common';

import { CollaborationNodeContribution } from './collaboration.contribution';
import { CollaborationServiceForClient } from './collaboration.service';
import { YWebsocketServerImpl } from './y-websocket-server';

@Injectable()
export class CollaborationModule extends NodeModule {
  providers: Provider[] = [
    CollaborationNodeContribution,
    {
      token: IYWebsocketServer,
      useClass: YWebsocketServerImpl,
    },
    {
      token: ICollaborationServiceForClient,
      useClass: CollaborationServiceForClient,
    },
  ];

  backServices = [
    {
      servicePath: CollaborationServiceForClientPath,
      token: ICollaborationServiceForClient,
    },
  ];
}
