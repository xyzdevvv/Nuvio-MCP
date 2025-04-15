import { Autowired } from '@Nuvio-MCP/di';
import { ClientAppContribution, Domain, Schemes } from '@Nuvio-MCP/ide-core-browser';
import { IFileServiceClient } from '@Nuvio-MCP/ide-file-service';
import { FileServiceClient } from '@Nuvio-MCP/ide-file-service/lib/browser/file-service-client';

import { IUserStorageService } from '../../common';

@Domain(ClientAppContribution)
export class UserStorageContribution implements ClientAppContribution {
  @Autowired(IUserStorageService)
  private readonly userStorageService: IUserStorageService;

  @Autowired(IFileServiceClient)
  protected readonly fileSystem: FileServiceClient;

  initialize() {
    this.fileSystem.registerProvider(Schemes.userStorage, this.userStorageService);
  }
}
