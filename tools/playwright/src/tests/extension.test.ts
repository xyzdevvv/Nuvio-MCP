import path from 'path';

import { expect } from '@playwright/test';

import { Nuvio-MCPApp } from '../app';
import { Nuvio-MCPExplorerView } from '../explorer-view';
import { Nuvio-MCPSCMView } from '../scm-view';
import { Nuvio-MCPTerminalView } from '../terminal-view';
import { Nuvio-MCPWorkspace } from '../workspace';

import test, { page } from './hooks';

let app: Nuvio-MCPApp;
let explorer: Nuvio-MCPExplorerView;
let scm: Nuvio-MCPSCMView;
let workspace: Nuvio-MCPWorkspace;

test.describe('Nuvio-MCP Extension', () => {
  // 用 git 插件来验证扩展相关功能
  test.beforeAll(async () => {
    workspace = new Nuvio-MCPWorkspace([path.resolve(__dirname, '../../src/tests/workspaces/git-workspace')]);
    app = await Nuvio-MCPApp.load(page, workspace);
    explorer = await app.open(Nuvio-MCPExplorerView);
    explorer.initFileTreeView(workspace.workspace.displayName);
    const terminal = await app.open(Nuvio-MCPTerminalView);
    // There should have GIT on the PATH
    await terminal.sendText('git init');
  });

  test.afterAll(() => {
    app.dispose();
  });

  test('The scm TreeNode view need show', async () => {
    scm = await app.open(Nuvio-MCPSCMView);
    await scm.open();
    await app.page.waitForTimeout(2000);
    const node = await scm.scmView.getTreeNode();
    expect(node).toBeTruthy();
  });

  test('The scm TreeNode view need reShow', async () => {
    scm = await app.open(Nuvio-MCPSCMView);
    await scm.open();
    await app.quickCommandPalette.trigger('Restart Extension Host Process');
    await app.page.waitForTimeout(1000);
    const node = await scm.scmView.getTreeNode();
    expect(node).toBeNull();
    await app.page.waitForTimeout(4000);
    const newNode = await scm.scmView.getTreeNode();
    expect(newNode).toBeTruthy();
  });
});
