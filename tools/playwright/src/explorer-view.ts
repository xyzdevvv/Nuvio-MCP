import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPFileTreeView } from './filetree-view';
import { Nuvio-MCPOpenedEditorView } from './opened-editor-view';
import { Nuvio-MCPOutlineView } from './outline-view';
import { Nuvio-MCPPanel } from './panel';
import { Nuvio-MCPTreeNode } from './tree-node';

export class Nuvio-MCPExplorerFileStatNode extends Nuvio-MCPTreeNode {
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

  async open(preview = true) {
    if (!preview) {
      await this.elementHandle?.dblclick();
    } else {
      await this.elementHandle?.click();
    }
  }

  async isDirty() {
    const classname = await this.elementHandle.getAttribute('class');
    if (classname?.includes('dirty__')) {
      return true;
    }
    return false;
  }
}

export class Nuvio-MCPExplorerOpenedEditorNode extends Nuvio-MCPTreeNode {
  async getRelativePath() {
    return await (await this.elementHandle.$('[class*="opened_editor_node_description__"]'))?.textContent();
  }

  async getFsPath() {
    return await this.elementHandle.getAttribute('title');
  }

  async isGroup() {
    const icon = await this.elementHandle.waitForSelector("[class*='file_icon___']");
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
}

export class Nuvio-MCPExplorerView extends Nuvio-MCPPanel {
  private _fileTreeView: Nuvio-MCPFileTreeView;
  private _openedEditorView: Nuvio-MCPOpenedEditorView;
  private _outlineView: Nuvio-MCPOutlineView;

  constructor(app: Nuvio-MCPApp) {
    super(app, 'EXPLORER');
    this._openedEditorView = new Nuvio-MCPOpenedEditorView(this.app);
    this._outlineView = new Nuvio-MCPOutlineView(this.app);
  }

  initFileTreeView(name: string) {
    this._fileTreeView = new Nuvio-MCPFileTreeView(this.app, name);
  }

  get fileTreeView() {
    return this._fileTreeView;
  }

  get openedEditorView() {
    return this._openedEditorView;
  }

  get outlineView() {
    return this._outlineView;
  }

  async getFileStatTreeNodeByPath(path: string) {
    const treeItems = await (await this.fileTreeView.getViewElement())?.$$('[class*="file_tree_node__"]');
    if (!treeItems) {
      return;
    }
    let node;
    for (const item of treeItems) {
      const title = await item.getAttribute('title');
      if (title?.startsWith('Group')) {
        if (title === path) {
          node = item;
          break;
        }
      } else {
        // The title maybe `~/a.js • Untracked`
        if (title?.split(' ')[0]?.endsWith(path)) {
          node = item;
          break;
        }
      }
    }
    if (node) {
      return new Nuvio-MCPExplorerFileStatNode(node, this.app);
    }
  }

  async getOpenedEditorTreeNodeByPath(path: string) {
    const treeItems = await (await this.openedEditorView.getViewElement())?.$$('[class*="opened_editor_node__"]');
    if (!treeItems) {
      return;
    }
    let node;
    for (const item of treeItems) {
      const title = await item.getAttribute('title');
      if (title?.startsWith('GROUP')) {
        if (title === path) {
          node = item;
          break;
        }
      } else {
        // The title maybe `~/a.js • Untracked`
        if (title?.split(' ')[0]?.endsWith(path)) {
          node = item;
          break;
        }
      }
    }
    if (node) {
      return new Nuvio-MCPExplorerFileStatNode(node, this.app);
    }
  }
}
