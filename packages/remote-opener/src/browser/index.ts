import { Injectable } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { RemoteOpenerBrowserServiceToken, RemoteOpenerConverterContribution, RemoteOpenerServicePath } from '../common';

import { RemoteOpenerContributionClient } from './remote.opener.contribution';
import { RemoteOpenerBrowserServiceImpl } from './remote.opener.service';

export * from './remote.opener.service';

@Injectable()
export class RemoteOpenerModule extends BrowserModule {
  contributionProvider = [RemoteOpenerConverterContribution];
  providers = [
    {
      token: RemoteOpenerBrowserServiceToken,
      useClass: RemoteOpenerBrowserServiceImpl,
    },
    RemoteOpenerContributionClient,
  ];
  backServices = [
    {
      servicePath: RemoteOpenerServicePath,
      clientToken: RemoteOpenerBrowserServiceToken,
    },
  ];
}
