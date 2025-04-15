import { Domain, Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { CollaborationModuleContribution, CollaborationServiceForClientPath, ICollaborationService } from '../common';

import { CollaborationContribution } from './collaboration.contribution';
import { CollaborationService } from './collaboration.service';

@Injectable()
export class CollaborationModule extends BrowserModule {
  contributionProvider: Domain | Domain[] = [CollaborationModuleContribution];
  providers: Provider[] = [
    CollaborationContribution,
    {
      token: ICollaborationService,
      useClass: CollaborationService,
    },
  ];

  backServices = [
    {
      servicePath: CollaborationServiceForClientPath,
    },
  ];
}
