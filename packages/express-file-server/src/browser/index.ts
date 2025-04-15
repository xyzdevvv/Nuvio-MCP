import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { ExpressFileServerContribution } from './file-server.contribution';

@Injectable()
export class ExpressFileServerModule extends BrowserModule {
  providers: Provider[] = [ExpressFileServerContribution];
}
