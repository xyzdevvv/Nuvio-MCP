import path from 'path';

import { expect } from '@playwright/test';

import { Nuvio-MCPApp } from '../app';
import { Nuvio-MCPDiffEditor } from '../diff-editor';
import { Nuvio-MCPExplorerView } from '../explorer-view';
import { Nuvio-MCPFileTreeView } from '../filetree-view';
import { Nuvio-MCPSCMView } from '../scm-view';
import { Nuvio-MCPTerminalView } from '../terminal-view';
import { Nuvio-MCPWorkspace } from '../workspace';

import test, { page } from './hooks';

let app: Nuvio-MCPApp;
let explorer: Nuvio-MCPExplorerView;
let scm: Nuvio-MCPSCMView;
let fileTreeView: Nuvio-MCPFileTreeView;
let workspace: Nuvio-MCPWorkspace;

test.describe('Nuvio-MCP SCM Panel', () => {
  test.beforeAll(async () => {
    workspace = new Nuvio-MCPWorkspace([path.resolve(__dirname, '../../src/tests/workspaces/git-workspace')]);
    app = await Nuvio-MCPApp.load(page, workspace);
    explorer = await app.open(Nuvio-MCPExplorerView);
    explorer.initFileTreeView(workspace.workspace.displayName);
    fileTreeView = explorer.fileTreeView;
    const terminal = await app.open(Nuvio-MCPTerminalView);
    // There should have GIT on the PATH
    await terminal.sendText('git init');
  });

  test.afterAll(() => {
    app.dispose();
  });

  test('The "U" charset should on the files tail after git initialized', async () => {
    await explorer.fileTreeView.open();
    const action = await fileTreeView.getTitleActionByName('Refresh');
    await action?.click();
    // Reinitialize
    const terminal = await app.open(Nuvio-MCPTerminalView);
    await terminal.sendText('git init');
    await app.page.waitForTimeout(2000);
    const node = await explorer.getFileStatTreeNodeByPath('a.js');
    const badge = await node?.badge();
    expect(badge).toBe('U');
  });

  test('The "U" charset should on the files tail on SCM view', async () => {
    scm = await app.open(Nuvio-MCPSCMView);
    await scm.open();
    await app.page.waitForTimeout(2000);
    const node = await scm.getFileStatTreeNodeByPath('a.js');
    const badge = await node?.getBadge();
    expect(badge).toBe('U');
  });

  test('Open file from context menu', async () => {
    scm = await app.open(Nuvio-MCPSCMView);
    await scm.open();
    const node = await scm.getFileStatTreeNodeByPath('a.js');
    const item = await node?.getMenuItemByName('Open File');
    await item?.click();
    await app.page.waitForTimeout(1000);
    if (node) {
      const editor = new Nuvio-MCPDiffEditor(app, node);
      const currentTab = await editor.getCurrentTab();
      const dataUri = await currentTab?.getAttribute('data-uri');
      expect(dataUri?.startsWith('file')).toBeTruthy();
    }
  });

  test('Open file with diff editor', async () => {
    scm = await app.open(Nuvio-MCPSCMView);
    await scm.open();
    const node = await scm.getFileStatTreeNodeByPath('a.js');
    await node?.open();
    await app.page.waitForTimeout(1000);
    if (node) {
      const editor = new Nuvio-MCPDiffEditor(app, node);
      const currentTab = await editor.getCurrentTab();
      const dataUri = await currentTab?.getAttribute('data-uri');
      expect(dataUri?.startsWith('diff')).toBeTruthy();
    }
  });

  test('SCM list view mode is work', async () => {
    scm = await app.open(Nuvio-MCPSCMView);
    await scm.open();
    const actionDom = await scm.scmView.getTitleActionById('workbench.scm.action.setListViewMode');
    await actionDom?.click();
    const stageAllAction = await scm.scmView.getTreeNodeActionById('git.stageAll');
    await stageAllAction?.click();
    await app.page.waitForTimeout(1000);
    const treeItems = await scm.getTreeItems();
    if (treeItems) {
      expect(treeItems.length).toBe(3);
      const firstTreeNode = treeItems[0];
      const nodeTail = await firstTreeNode.getNodeTail();
      expect(nodeTail).toBe('1');
    }
  });
});
