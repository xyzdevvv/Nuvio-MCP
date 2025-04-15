import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';
import { IStatusBarService } from '@Nuvio-MCP/ide-core-browser/lib/services';

import { StatusBarContribution } from './status-bar.contribution';
// import { IStatusBarService } from '../common';
import { StatusBarService } from './status-bar.service';

@Injectable()
export class StatusBarModule extends BrowserModule {
  providers: Provider[] = [
    {
      token: IStatusBarService,
      useClass: StatusBarService,
    },
    StatusBarContribution,
  ];
}
