import path from 'path';

import { expect } from '@playwright/test';

import { Nuvio-MCPApp } from '../app';
import { Nuvio-MCPComponentEditor } from '../component-editor';
import { Nuvio-MCP_VIEW_CONTAINERS } from '../constans';
import { Nuvio-MCPContextMenu } from '../context-menu';
import { Nuvio-MCPExplorerView } from '../explorer-view';
import { keypressWithCmdCtrl } from '../utils';
import { Nuvio-MCPWorkspace } from '../workspace';

import test, { page } from './hooks';

let app: Nuvio-MCPApp;
let explorer: Nuvio-MCPExplorerView;
let workspace: Nuvio-MCPWorkspace;

test.describe('Nuvio-MCP Shortcuts', () => {
  test.beforeAll(async () => {
    workspace = new Nuvio-MCPWorkspace([path.resolve(__dirname, '../../src/tests/workspaces/default')]);
    app = await Nuvio-MCPApp.load(page, workspace);
    explorer = await app.open(Nuvio-MCPExplorerView);
    explorer.initFileTreeView(workspace.workspace.displayName);
  });

  test.afterAll(() => {
    app.dispose();
  });

  const openSettingsView = async () => {
    const leftTabbar = await app.page.waitForSelector(`#${Nuvio-MCP_VIEW_CONTAINERS.LEFT_TABBAR}`);
    const settingsButton = await leftTabbar.$('[class*="titleActions___"] span');
    await settingsButton?.click();
    const menu = new Nuvio-MCPContextMenu(app);
    await menu.clickMenuItem('Settings');
  };

  test('open Settings by keybinding', async () => {
    await explorer.fileTreeView.focus();
    await app.page.keyboard.press(keypressWithCmdCtrl(','), { delay: 200 });
    const editor = await app.openComponentEditor(
      Nuvio-MCPComponentEditor,
      'pref:/',
      'Settings',
      "[class*='preferences___']",
    );
    expect(await editor.isVisible()).toBeTruthy();
    await editor.close();
    await app.page.waitForTimeout(1000);
    expect(await editor.isVisible()).toBeFalsy();
  });

  test('open Settings by settings button', async () => {
    await openSettingsView();
    const editor = await app.openComponentEditor(
      Nuvio-MCPComponentEditor,
      'pref:/',
      'Settings',
      "[class*='preferences___']",
    );
    expect(await editor.isVisible()).toBeTruthy();
    await editor.close();
  });

  test('edit settings in settings.json', async () => {
    await openSettingsView();
    const editor = await app.openComponentEditor(
      Nuvio-MCPComponentEditor,
      'pref:/',
      'Settings',
      "[class*='preferences___']",
    );
    expect(await editor.isVisible()).toBeTruthy();
    const editorContainer = await editor.getContainer();
    // Settings => View => Search => Search > Include
    const tabs = (await editorContainer?.$$('[class*="group_item__"]')) || [];
    let viewTab;
    for (const tab of tabs) {
      const title = await tab.textContent();
      if (title === 'View') {
        viewTab = tab;
        break;
      }
    }
    await viewTab.click();
    await app.page.waitForTimeout(50);
    const subTabs = (await editorContainer?.$$('[class*="index_item__"]')) || [];
    let searchSetting;
    for (const tab of subTabs) {
      const title = await tab.textContent();
      if (title === 'Search') {
        searchSetting = tab;
        break;
      }
    }
    await searchSetting.click();
    await app.page.waitForTimeout(1000);
    const items = (await editorContainer?.$$('[class*="preference_item___"]')) || [];
    let searchIncludeItem;
    for (const item of items) {
      const key = await (await item.$('[class*="key___"]'))?.textContent();
      if (key?.trim() === 'Search > Include') {
        searchIncludeItem = item;
        break;
      }
    }
    const editButton = await searchIncludeItem.$('[class*="control_wrap___"] a');
    expect(editButton).toBeDefined();
    await editButton.click();
    await app.page.waitForTimeout(2000);
    const currentTab = await editor.getCurrentTab();
    expect(await currentTab?.textContent()).toBe(' settings.json');
  });
});
