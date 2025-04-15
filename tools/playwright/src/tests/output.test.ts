import path from 'path';

import { expect } from '@playwright/test';

import { Nuvio-MCPApp } from '../app';
import { Nuvio-MCPExplorerView } from '../explorer-view';
import { Nuvio-MCPFileTreeView } from '../filetree-view';
import { Nuvio-MCPOutputView } from '../output-view';
import { keypressWithCmdCtrl } from '../utils/key';
import { Nuvio-MCPWorkspace } from '../workspace';

import test, { page } from './hooks';

let app: Nuvio-MCPApp;
let explorer: Nuvio-MCPExplorerView;
let fileTreeView: Nuvio-MCPFileTreeView;
let workspace: Nuvio-MCPWorkspace;
let output: Nuvio-MCPOutputView;

test.describe('Nuvio-MCP Output View', () => {
  test.beforeAll(async () => {
    workspace = new Nuvio-MCPWorkspace([path.resolve(__dirname, '../../src/tests/workspaces/language')]);
    app = await Nuvio-MCPApp.load(page, workspace);
    explorer = await app.open(Nuvio-MCPExplorerView);
    explorer.initFileTreeView(workspace.workspace.displayName);
    fileTreeView = explorer.fileTreeView;
    output = await app.open(Nuvio-MCPOutputView);
  });

  test.afterAll(() => {
    app.dispose();
  });

  test('should show file explorer and output panel', async () => {
    expect(await output.isVisible()).toBeTruthy();
    await fileTreeView.open();
    expect(await fileTreeView.isVisible()).toBeTruthy();
  });

  test('get `TypeScript` channel output content', async () => {
    const node = await explorer.getFileStatTreeNodeByPath('reference.ts');
    await node?.open();
    await page.waitForTimeout(1000);

    await output.setChannel('TypeScript');
    const content = await output.getCurrentContent();
    expect(content?.includes('tsserver')).toBeTruthy();
  });

  test('can search text from output', async () => {
    // Focus Output content
    await output.focus();
    const box = await output.view?.boundingBox();
    if (box) {
      await output.app.page.mouse.click(box.x + box?.width / 2, box.y + box?.height / 2);
    }
    await app.page.keyboard.press(keypressWithCmdCtrl('KeyF'));
    const textArea = await output.view?.$('.monaco-inputbox textarea');
    await textArea?.focus();
    await textArea?.type('tsserver', { delay: 200 });

    let selected = await output.view?.$('.selected-text');
    expect(selected).toBeDefined();

    await textArea?.focus();
    await app.page.keyboard.press('Escape');
    if (box) {
      await output.app.page.mouse.click(box.x + box?.width / 2, box.y + box?.height / 2);
    }
    selected = await output.view?.$('.selected-text');
    expect(selected).toBeNull();
  });

  test('clean output content', async () => {
    const node = await explorer.getFileStatTreeNodeByPath('definition.ts');
    await node?.open();
    await page.waitForTimeout(1000);

    await output.setChannel('TypeScript');
    let content = await output.getCurrentContent();
    expect(content?.includes('tsserver')).toBeTruthy();

    await output.clean();
    content = await output.getCurrentContent();
    expect(content?.includes('tsserver')).toBeFalsy();
  });
});
