import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { OutputContribution } from './output-contribution';
import { bindOutputPreference } from './output-preference';

@Injectable()
export class OutputModule extends BrowserModule {
  providers: Provider[] = [OutputContribution];

  preferences = bindOutputPreference;
}
