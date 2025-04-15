import { IContextMenu } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';

import { ISCMProvider, ISCMResource, ISCMResourceGroup } from './scm';

export interface ISCMRepositoryMenus {
  readonly titleMenu: IContextMenu;
  readonly inputMenu: IContextMenu;
  getResourceGroupMenu(group: ISCMResourceGroup): IContextMenu;
  getResourceMenu(resource: ISCMResource): IContextMenu;
  getResourceFolderMenu(group: ISCMResourceGroup): IContextMenu;
}

export const ISCMMenus = Symbol('ISCMMenus');
export interface ISCMMenus {
  getRepositoryMenus(provider: ISCMProvider): ISCMRepositoryMenus;
}
