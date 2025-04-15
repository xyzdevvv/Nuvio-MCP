import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { GlobalBrowserStorageService } from '@Nuvio-MCP/ide-core-browser/lib/services';
import { FileStat } from '@Nuvio-MCP/ide-file-service';

import { IWorkspaceService, IWorkspaceStorageService } from '../common';

/*
 * 为存在 Browser (LocalStorage) 的数据添加命名空间
 * @Deprecated
 */
@Injectable()
export class WorkspaceStorageService implements IWorkspaceStorageService {
  private prefix: string;
  private initialized: Promise<void>;

  @Autowired(GlobalBrowserStorageService)
  protected globalStorageService: GlobalBrowserStorageService;

  @Autowired(IWorkspaceService)
  protected workspaceService: IWorkspaceService;

  constructor() {
    this.init();
  }

  protected init() {
    this.initialized = this.workspaceService.roots.then(() => {
      this.updatePrefix();
      this.workspaceService.onWorkspaceLocationChanged(() => this.updatePrefix());
    });
  }

  async setData<T>(key: string, data: T): Promise<void> {
    if (!this.prefix) {
      await this.initialized;
    }
    const fullKey = this.prefixWorkspaceURI(key);
    return this.globalStorageService.setData(fullKey, data);
  }

  async getData<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    await this.initialized;
    const fullKey = this.prefixWorkspaceURI(key);
    return this.globalStorageService.getData(fullKey, defaultValue);
  }

  async removeData(key: string): Promise<void> {
    await this.initialized;
    const fullKey = this.prefixWorkspaceURI(key);
    return this.globalStorageService.removeData(fullKey);
  }

  protected prefixWorkspaceURI(originalKey: string): string {
    return `${this.prefix}:${originalKey}`;
  }

  protected getPrefix(workspaceStat: FileStat | undefined): string {
    return workspaceStat ? workspaceStat.uri : '_global_';
  }

  private updatePrefix(): void {
    this.prefix = this.getPrefix(this.workspaceService.workspace);
  }
}
