import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPContextMenu } from './context-menu';
import { Nuvio-MCPEditor } from './editor';
import { isElementVisible } from './utils';

export interface IComponentEditorInfo {
  path: string;
  name: string;
  containerSelector: string;
}

export class Nuvio-MCPComponentEditor extends Nuvio-MCPEditor {
  constructor(app: Nuvio-MCPApp, private readonly info: IComponentEditorInfo) {
    super(app);
  }

  async openTabContextMenu() {
    const view = await this.getTab();
    if (!view) {
      return;
    }
    return Nuvio-MCPContextMenu.open(this.app, async () => view);
  }

  async close() {
    const contextMenu = await this.openTabContextMenu();
    await contextMenu?.isOpen();
    const close = await contextMenu?.menuItemByName('Close');
    await close?.click();
  }

  async getTab() {
    const tabsItems = await (await this.getTabElement())?.$$("[class*='kt_editor_tab___']");

    if (!tabsItems) {
      return;
    }

    for (const item of tabsItems) {
      const uri = await item.getAttribute('data-uri');
      if (uri?.includes(this.info.path)) {
        return item;
      }
    }
  }

  async getContainer() {
    return await super.getContainer(this.info.containerSelector);
  }

  async isVisible() {
    const container = await this.getContainer();
    if (!container) {
      return false;
    }
    return await isElementVisible(Promise.resolve(container));
  }

  async open() {
    const tab = await this.getTab();
    await tab?.click();
    return this;
  }
}
