import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { VSXExtensionServicePath, VSXExtensionServiceToken } from '../common';

import { VSXExtensionContribution } from './vsx-extension.contribution';
import { VSXExtensionService } from './vsx-extension.service';

@Injectable()
export class OpenVsxExtensionManagerModule extends BrowserModule {
  providers: Provider[] = [
    VSXExtensionContribution,
    {
      token: VSXExtensionServiceToken,
      useClass: VSXExtensionService,
    },
  ];

  backServices = [
    {
      servicePath: VSXExtensionServicePath,
    },
  ];
}
