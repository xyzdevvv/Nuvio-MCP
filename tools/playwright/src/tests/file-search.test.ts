import path from 'path';

import { expect } from '@playwright/test';

import { URI } from '@Nuvio-MCP/ide-utils';

import { Nuvio-MCPApp } from '../app';
import { Nuvio-MCPExplorerView } from '../explorer-view';
import { Nuvio-MCPFileTreeView } from '../filetree-view';
import { Nuvio-MCPTextEditor } from '../text-editor';
import { Nuvio-MCPWorkspace } from '../workspace';

import test, { page } from './hooks';

let app: Nuvio-MCPApp;
let explorer: Nuvio-MCPExplorerView;
let fileTreeView: Nuvio-MCPFileTreeView;
let workspace: Nuvio-MCPWorkspace;

test.describe('Nuvio-MCP File Search', () => {
  test.beforeAll(async () => {
    workspace = new Nuvio-MCPWorkspace([path.resolve(__dirname, '../../src/tests/workspaces/default')]);
    app = await Nuvio-MCPApp.load(page, workspace);
    explorer = await app.open(Nuvio-MCPExplorerView);
    explorer.initFileTreeView(workspace.workspace.displayName);
    fileTreeView = explorer.fileTreeView;
  });

  test.afterAll(() => {
    app.dispose();
  });

  test('open editor.js file', async () => {
    await explorer.open();
    expect(await explorer.isVisible()).toBeTruthy();
    await fileTreeView.open();
    expect(await fileTreeView.isVisible()).toBeTruthy();
    // Open editor3.js first
    const testFilePath = 'editor3.js';
    const editor = await app.openEditor(Nuvio-MCPTextEditor, explorer, testFilePath);
    let currentTab = await editor.getCurrentTab();
    let dataUri = await currentTab?.getAttribute('data-uri');
    expect(dataUri).toBeDefined();
    if (dataUri) {
      expect(new URI(dataUri).displayName).toBe(testFilePath);
    }

    const openFileName = 'editor.js';
    await app.quickOpenPalette.open();
    await app.quickOpenPalette.type(openFileName);
    // Just enter
    await app.page.keyboard.press('Enter');
    await app.page.waitForTimeout(500);

    currentTab = await editor.getCurrentTab();
    dataUri = await currentTab?.getAttribute('data-uri');
    expect(dataUri).toBeDefined();
    if (dataUri) {
      expect(new URI(dataUri).displayName).toBe(openFileName);
    }
  });
});
