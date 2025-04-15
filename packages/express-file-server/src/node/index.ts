import { Injectable, Provider } from '@Nuvio-MCP/di';
import { NodeModule } from '@Nuvio-MCP/ide-core-node';

import { ExpressFileServerContribution } from './express-file-server.contribution';

@Injectable()
export class ExpressFileServerModule extends NodeModule {
  providers: Provider[] = [ExpressFileServerContribution];
}
