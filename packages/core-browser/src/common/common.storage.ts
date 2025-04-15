import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IStorage, STORAGE_NAMESPACE, StorageProvider } from '@Nuvio-MCP/ide-core-common';

@Injectable()
export class RecentStorage {
  @Autowired(StorageProvider)
  private getStorage: StorageProvider;

  private recentStorage: IStorage;
  private recentGlobalStorage: IStorage;

  public async getScopeStorage() {
    this.recentStorage = this.recentStorage || (await this.getStorage(STORAGE_NAMESPACE.RECENT_DATA));
    return this.recentStorage;
  }

  public async getGlobalStorage() {
    this.recentGlobalStorage =
      this.recentGlobalStorage || (await this.getStorage(STORAGE_NAMESPACE.GLOBAL_RECENT_DATA));
    return this.recentGlobalStorage;
  }
}
