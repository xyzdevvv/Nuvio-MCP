import 'tsconfig-paths/register';

import { Injector } from '@Nuvio-MCP/di';
import { AIBackSerivceToken } from '@Nuvio-MCP/ide-core-common';
import { startServer } from '@Nuvio-MCP/ide-dev-tool/src/server';
import { ExpressFileServerModule } from '@Nuvio-MCP/ide-express-file-server/lib/node';
import { OpenerModule } from '@Nuvio-MCP/ide-remote-opener/lib/node';

import { CommonNodeModules } from '../../src/node/common-modules';
import { AIBackService } from '../sample-modules/ai-native/ai.back.service';

const injector = new Injector([
  {
    token: AIBackSerivceToken,
    useClass: AIBackService,
  },
]);

startServer({
  modules: [...CommonNodeModules, ExpressFileServerModule, OpenerModule],
  injector,
});
