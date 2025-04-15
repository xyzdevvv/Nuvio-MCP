import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { StartupContribution } from './startup.contribution';

@Injectable()
export class StartupModule extends BrowserModule {
  providers: Provider[] = [StartupContribution];
}
