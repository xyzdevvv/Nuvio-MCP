import { Injectable } from '@Nuvio-MCP/di';
import { NodeModule } from '@Nuvio-MCP/ide-core-node';

import { FileSearchServicePath, IFileSearchService } from '../common';

import { FileSearchService } from './file-search.service';

@Injectable()
export class FileSearchModule extends NodeModule {
  providers = [
    {
      token: IFileSearchService,
      useClass: FileSearchService,
    },
  ];

  backServices = [
    {
      token: IFileSearchService,
      servicePath: FileSearchServicePath,
    },
  ];
}
