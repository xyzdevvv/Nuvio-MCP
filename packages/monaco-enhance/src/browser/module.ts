import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule, ClientAppContribution, Domain } from '@Nuvio-MCP/ide-core-browser';

@Domain(ClientAppContribution)
class MonacoEnhanceContribution implements ClientAppContribution {
  onDidStart() {}
}

@Injectable()
export class MonacoEnhanceModule extends BrowserModule {
  providers: Provider[] = [MonacoEnhanceContribution];
}
