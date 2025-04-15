import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPOpenedEditorView } from './opened-editor-view';
import { Nuvio-MCPPanel } from './panel';
import { Nuvio-MCPSourceControlView } from './source-control-view';
import { Nuvio-MCPTreeNode } from './tree-node';

export class Nuvio-MCPSCMFileStatNode extends Nuvio-MCPTreeNode {
  async getFsPath() {
    return await this.elementHandle.getAttribute('title');
  }

  async isFolder() {
    const icon = await this.elementHandle.$("[class*='file_icon___']");
    if (!icon) {
      return false;
    }
    const className = await icon.getAttribute('class');
    return className?.includes('folder-icon');
  }

  async getMenuItemByName(name: string) {
    const contextMenu = await this.openContextMenu();
    const menuItem = await contextMenu.menuItemByName(name);
    return menuItem;
  }

  async open() {
    await this.elementHandle.click();
  }

  async getBadge() {
    const status = await this.elementHandle.$('[class*="scm_tree_node_status___"]');
    return await status?.textContent();
  }

  async getNodeTail() {
    const tail = await this.elementHandle.$('[class*="scm_tree_node_tail___"]');
    return await tail?.textContent();
  }
}

export class Nuvio-MCPSCMView extends Nuvio-MCPPanel {
  private _scmView: Nuvio-MCPSourceControlView;
  private _openedEditorView: Nuvio-MCPOpenedEditorView;

  constructor(app: Nuvio-MCPApp) {
    super(app, 'SCM');
    this._scmView = new Nuvio-MCPSourceControlView(app, 'SOURCE CONTROL');
  }

  get scmView() {
    return this._scmView;
  }

  get openedEditorView() {
    return this._openedEditorView;
  }

  async getTreeItems() {
    const treeItems = await (await this.scmView.getViewElement())?.$$('[class*="scm_tree_node___"]');
    const node: Nuvio-MCPSCMFileStatNode[] = [];

    if (treeItems) {
      for (const item of treeItems) {
        node.push(new Nuvio-MCPSCMFileStatNode(item, this.app));
      }
    }

    return node;
  }

  async getFileStatTreeNodeByPath(path: string) {
    const treeItems = await (await this.scmView.getViewElement())?.$$('[class*="scm_tree_node___"]');
    if (!treeItems) {
      return;
    }
    let node;
    for (const item of treeItems) {
      const title = await item.getAttribute('title');
      // title maybe `a.js • Untracked`
      if (title?.split(' ')[0]?.endsWith(path)) {
        node = item;
        break;
      }
    }
    if (node) {
      return new Nuvio-MCPSCMFileStatNode(node, this.app);
    }
  }
}
