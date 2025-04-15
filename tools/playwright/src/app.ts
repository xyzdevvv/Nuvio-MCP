import { ElementHandle, Page } from '@playwright/test';

import { Disposable } from '@Nuvio-MCP/ide-utils';

import { IComponentEditorInfo } from './component-editor';
import { Nuvio-MCPEditor } from './editor';
import { Nuvio-MCPExplorerView } from './explorer-view';
import { Nuvio-MCPMenubar } from './menubar';
import { Nuvio-MCPPanel } from './panel';
import { Nuvio-MCPCommandPalette } from './quick-command-palette';
import { Nuvio-MCPQuickOpenPalette } from './quick-open-palette';
import { Nuvio-MCPTreeNode } from './tree-node';
import { Nuvio-MCPWorkspace } from './workspace';

export interface AppData {
  loadingSelector: string;
  mainSelector: string;
}

export const DefaultAppData: AppData = {
  loadingSelector: '.loading_indicator',
  mainSelector: '#main',
};

export class Nuvio-MCPApp extends Disposable {
  private _loaded = false;
  private _quickCommandPalette: Nuvio-MCPCommandPalette;
  private _quickOpenPalette: Nuvio-MCPQuickOpenPalette;
  private _menubar: Nuvio-MCPMenubar;

  static async load(page: Page, workspace: Nuvio-MCPWorkspace): Promise<Nuvio-MCPApp> {
    return this.loadApp(page, workspace, Nuvio-MCPApp);
  }

  static async loadApp<T extends Nuvio-MCPApp>(
    page: Page,
    workspace: Nuvio-MCPWorkspace,
    appFactory: new (page: Page) => T,
  ): Promise<T> {
    await workspace.initWorksapce();
    const app = new appFactory(page);
    await app.load(workspace);
    return app;
  }

  public constructor(public page: Page, protected appData = DefaultAppData) {
    super();
    this._quickCommandPalette = new Nuvio-MCPCommandPalette(this);
    this._quickOpenPalette = new Nuvio-MCPQuickOpenPalette(this);
    this._menubar = new Nuvio-MCPMenubar(this);
  }

  get quickCommandPalette() {
    return this._quickCommandPalette;
  }

  get quickOpenPalette() {
    return this._quickOpenPalette;
  }

  get menubar() {
    return this._menubar;
  }

  protected async load(workspace: Nuvio-MCPWorkspace): Promise<void> {
    this.disposables.push(workspace);
    const now = Date.now();
    await this.loadOrReload(this.page, `/?workspaceDir=${workspace.workspace.codeUri.fsPath}`);
    await this.page.waitForSelector(this.appData.loadingSelector, { state: 'detached' });
    const time = Date.now() - now;
    // eslint-disable-next-line no-console
    console.log(`Loading page cost ${time} ms`);
    await this.page.waitForSelector(this.appData.mainSelector);
    await this.waitForInitialized();
  }

  protected async loadOrReload(page: Page, url = '/') {
    if (!this._loaded) {
      const wasLoadedAlready = await page.isVisible(this.appData.mainSelector);
      await page.goto(url);
      if (wasLoadedAlready) {
        await page.reload();
      }
      this._loaded = true;
    } else {
      await page.reload();
    }
  }

  async isMainLayoutVisible(): Promise<boolean> {
    const contentPanel = await this.page.$('#main');
    return !!contentPanel && contentPanel.isVisible();
  }

  async open<T extends Nuvio-MCPPanel>(PanelConstruction: new (app: Nuvio-MCPApp) => T) {
    const panel = new PanelConstruction(this);
    if (await panel.isVisible()) {
      return panel;
    }
    await panel.open();
    return panel;
  }

  async openEditor<T extends Nuvio-MCPEditor>(
    EditorConstruction: new (app: Nuvio-MCPApp, element?: Nuvio-MCPTreeNode) => T,
    explorer: Nuvio-MCPExplorerView,
    filePath: string,
    preview = true,
  ) {
    await explorer.open();
    const node = await explorer.getFileStatTreeNodeByPath(filePath);
    if (!node || (await node?.isFolder())) {
      throw Error(`File ${filePath} could not be opened on the editor`);
    }
    const editor = new EditorConstruction(this, node);
    await editor.open(preview);
    return editor;
  }

  // use for component editors
  async openComponentEditor<T extends Nuvio-MCPEditor>(
    EditorConstruction: new (app: Nuvio-MCPApp, info: IComponentEditorInfo) => T,
    path: string,
    name: string,
    containerSelector: string,
  ) {
    const editor = new EditorConstruction(this, { path, name, containerSelector });
    await editor.open();
    return editor;
  }

  async getDialogButton(value: string): Promise<ElementHandle<SVGElement | HTMLElement> | void> {
    const buttonWrapper = await this.page.$('.kt-dialog-buttonWrap');
    const buttons = await buttonWrapper?.$$('.kt-button');
    if (buttons) {
      for (const button of buttons) {
        const text = await button.textContent();
        if (text === value) {
          return button;
        }
      }
    }
  }

  async waitForInitialized(): Promise<void> {
    // custom app initialize process.
    // empty by default
  }
}
