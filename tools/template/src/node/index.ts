import { Injectable, Provider } from '@Nuvio-MCP/di';
import { NodeModule } from '@Nuvio-MCP/ide-core-node';

@Injectable()
export class TemplateUpperNameModule extends NodeModule {
  providers: Provider[] = [];
}
