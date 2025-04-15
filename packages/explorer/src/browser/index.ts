import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { ExplorerContribution } from './explorer-contribution';

@Injectable()
export class ExplorerModule extends BrowserModule {
  providers: Provider[] = [ExplorerContribution];
}
