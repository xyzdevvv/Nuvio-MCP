import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

@Injectable()
export class TemplateUpperNameModule extends BrowserModule {
  providers: Provider[] = [];
}
