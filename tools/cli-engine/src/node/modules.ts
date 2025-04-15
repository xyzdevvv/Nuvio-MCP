import { ConstructorOf, NodeModule } from '@Nuvio-MCP/ide-core-node';
import { ExpressFileServerModule } from '@Nuvio-MCP/ide-express-file-server/lib/node';
import { CommonNodeModules } from '@Nuvio-MCP/ide-startup/lib/node/common-modules';

export const modules: ConstructorOf<NodeModule>[] = [...CommonNodeModules, ExpressFileServerModule];
