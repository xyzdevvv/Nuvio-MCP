import { Injectable } from '@Nuvio-MCP/di';
import { NodeModule } from '@Nuvio-MCP/ide-core-node';

import { ILogServiceForClient, ILogServiceManager, LogServiceForClientPath } from '../common/';

import { LogServiceManager } from './log-manager';
import { LogServiceForClient } from './log.service';

export * from '../common/';

@Injectable()
export class LogServiceModule extends NodeModule {
  providers = [
    {
      token: ILogServiceForClient,
      useClass: LogServiceForClient,
    },
    {
      token: ILogServiceManager,
      useClass: LogServiceManager,
    },
  ];

  backServices = [
    {
      servicePath: LogServiceForClientPath,
      token: ILogServiceForClient,
    },
  ];
}
