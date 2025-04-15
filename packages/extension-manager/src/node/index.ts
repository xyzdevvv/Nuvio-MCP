import { Injectable, Provider } from '@Nuvio-MCP/di';
import { NodeModule } from '@Nuvio-MCP/ide-core-node';

import { IOpenvsxMarketplaceService } from '../common';

import { OpenvsxMarketplaceService } from './marketplace';
import { VSXExtensionRemoteService } from './vsx-extension.service';

@Injectable()
export class OpenVsxExtensionManagerModule extends NodeModule {
  providers: Provider[] = [
    {
      token: IOpenvsxMarketplaceService,
      useClass: OpenvsxMarketplaceService,
    },
  ];

  remoteServices = [VSXExtensionRemoteService];
}
