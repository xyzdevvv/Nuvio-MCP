import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { IGlobalStorageServer, IStoragePathServer, IWorkspaceStorageServer } from '../common';

import { StoragePathServer } from './storage-path';
import { DatabaseStorageContribution } from './storage.contribution';
import { GlobalStorageServer, WorkspaceStorageServer } from './storage.service';

@Injectable()
export class StorageModule extends BrowserModule {
  providers: Provider[] = [
    {
      token: IStoragePathServer,
      useClass: StoragePathServer,
    },
    {
      token: IGlobalStorageServer,
      useClass: GlobalStorageServer,
    },
    {
      token: IWorkspaceStorageServer,
      useClass: WorkspaceStorageServer,
    },
    DatabaseStorageContribution,
  ];
}
