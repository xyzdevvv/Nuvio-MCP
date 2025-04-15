import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { ILoggerManagerClient, LogServiceForClientPath } from '../common/';

import { LoggerManagerClient } from './log-manager';

export * from '../common/';
export { LogServiceClient } from './log.service';

@Injectable()
export class LogModule extends BrowserModule {
  providers: Provider[] = [
    {
      token: ILoggerManagerClient,
      useClass: LoggerManagerClient,
    },
  ];

  backServices = [
    {
      servicePath: LogServiceForClientPath,
      clientToken: ILoggerManagerClient,
    },
  ];
}
