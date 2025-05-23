import path from 'path';

import { expect } from '@playwright/test';

import { isLinux } from '@Nuvio-MCP/ide-utils';

import { Nuvio-MCPApp } from '..';
import { Nuvio-MCPDiffEditor } from '../diff-editor';
import { Nuvio-MCPExplorerView } from '../explorer-view';
import { Nuvio-MCPSearchView } from '../search-view';
import { Nuvio-MCPTextEditor } from '../text-editor';
import { keypressWithCmdCtrlAndShift } from '../utils/key';
import { Nuvio-MCPWorkspace } from '../workspace';

import test, { page } from './hooks';

let app: Nuvio-MCPApp;
let search: Nuvio-MCPSearchView;
let editor: Nuvio-MCPTextEditor;
let explorer: Nuvio-MCPExplorerView;
let workspace: Nuvio-MCPWorkspace;

test.describe('Nuvio-MCP Search Panel', () => {
  test.beforeAll(async () => {
    workspace = new Nuvio-MCPWorkspace([path.resolve(__dirname, '../../src/tests/workspaces/search')]);
    app = await Nuvio-MCPApp.load(page, workspace);
    search = await app.open(Nuvio-MCPSearchView);
  });

  test('Can search files by simple text', async () => {
    const searchText = 'hello';
    expect(await search.isVisible()).toBeTruthy();
    await search.search({
      search: searchText,
    });
    await app.page.waitForTimeout(1000);
    const result = await search.getSearchResult();
    expect(result).toBeDefined();
    if (result) {
      const { results, files } = result;
      expect(results).toBe(1);
      expect(files).toBe(1);
    }
  });

  test('Open file with editor', async () => {
    const searchText = 'hello';
    expect(await search.isVisible()).toBeTruthy();
    await search.search({
      search: searchText,
    });
    await app.page.waitForTimeout(1000);
    const result = await search.getSearchResult();
    expect(result).toBeDefined();
    if (result) {
      const { results, files } = result;
      expect(results).toBe(1);
      expect(files).toBe(1);
    }

    const fileNode = await search.getTreeNodeByIndex(0);
    const contentNode = await search.getTreeNodeByIndex(1);

    expect(await fileNode?.isFile()).toBeTruthy();
    expect(await contentNode?.isFile()).toBeFalsy();

    expect(contentNode).toBeDefined();
    if (contentNode) {
      await contentNode?.open();
      await app.page.waitForTimeout(1000);

      const editor = new Nuvio-MCPTextEditor(app, contentNode);
      const currentTab = await editor.getCurrentTab();
      const dataUri = await currentTab?.getAttribute('data-uri');
      expect(dataUri?.startsWith('file')).toBeTruthy();
    }
  });

  test('Open file with diffEditor', async () => {
    const searchText = 'hello';
    const replaceText = 'Hello';
    expect(await search.isVisible()).toBeTruthy();
    await search.search({
      search: searchText,
    });
    const input = await search.focusOnReplace();
    await page.keyboard.type(replaceText);

    const contentNode = await search.getTreeNodeByIndex(1);
    expect(contentNode).toBeDefined();
    if (contentNode) {
      await contentNode.open();
      await app.page.waitForTimeout(1000);
      const editor = new Nuvio-MCPDiffEditor(app, contentNode);
      const currentTab = await editor.getCurrentTab();
      const dataUri = await currentTab?.getAttribute('data-uri');
      expect(dataUri?.startsWith('file')).toBeFalsy();
    }
    await input?.fill('');
  });

  test('Open search rules view', async () => {
    expect(await search.isVisible()).toBeTruthy();
    await search.toggleDisplaySearchRules();
    // Include input and Exclude input should be shown.
    expect((await search.getIncludeInput())?.isVisible()).toBeTruthy();
    expect((await search.getExcludeInput())?.isVisible()).toBeTruthy();
    await search.toggleDisplaySearchRules();
    expect((await search.getIncludeInput())?.isVisible()).toBeFalsy();
    expect((await search.getExcludeInput())?.isVisible()).toBeFalsy();
  });

  test('Replace search result with RegExp', async () => {
    const searchText = 'const (.+) = require((.*))';
    const replaceText = '$1...$2';

    await search.search({
      search: searchText,
      useRegexp: true,
    });

    await app.page.waitForTimeout(1000);
    let result = await search.getSearchResult();
    expect(result).toBeDefined();
    if (result) {
      const { results, files } = result;
      expect(results).toBe(1);
      expect(files).toBe(1);
    }

    const input = await search.focusOnReplace();
    await page.keyboard.type(replaceText);

    const replaceButton = await search.getReplaceAllButton();

    expect(await replaceButton?.isEnabled()).toBeTruthy();
    await replaceButton?.click();
    const confirmed = await app.getDialogButton('Replace');
    await confirmed?.click();
    await app.page.waitForTimeout(1000);

    await search.search({
      search: "fs...('fs')",
      useRegexp: false,
    });
    await app.page.waitForTimeout(1000);
    result = await search.getSearchResult();
    expect(result).toBeDefined();
    if (result) {
      const { results, files } = result;
      expect(results).toBe(1);
      expect(files).toBe(1);
    }
    await input?.fill('');
  });

  test('Search content with MatchCase', async () => {
    const searchText = 'abcd';

    await search.search({
      search: searchText,
      isMatchCase: true,
    });
    await app.page.waitForTimeout(1000);
    let result = await search.getSearchResult();
    await app.page.waitForTimeout(1000);

    expect(result.results).toBe(1);
    expect(result.files).toBe(1);

    await search.search({
      search: searchText,
      isMatchCase: false,
    });
    await app.page.waitForTimeout(1000);

    result = await search.getSearchResult();
    expect(result.results).toBe(2);
    expect(result.files).toBe(1);
  });

  test('Search content with editor selection', async () => {
    explorer = await app.open(Nuvio-MCPExplorerView);
    explorer.initFileTreeView(workspace.workspace.displayName);
    editor = await app.openEditor(Nuvio-MCPTextEditor, explorer, 'index.js');
    await editor.selectLineContainingText('hello');
    await app.page.keyboard.press(keypressWithCmdCtrlAndShift('KeyF'), { delay: 200 });

    await app.page.waitForTimeout(1000);
    const result = await search.getSearchResult();
    expect(result).toBeDefined();
    if (result) {
      const { results, files } = result;
      expect(results).toBe(1);
      expect(files).toBe(1);
    }
  });

  test('File content can not be search after deleted', async () => {
    const searchText = 'console.log';
    await search.search({
      search: searchText,
      useRegexp: false,
    });
    await app.page.waitForTimeout(1000);
    let result = await search.getSearchResult();
    expect(result).toBeDefined();
    if (result) {
      const { results, files } = result;
      expect(results).toBe(4);
      expect(files).toBe(2);
    }

    // Delete `index2.js` file
    if (!(await explorer.isVisible())) {
      await explorer.open();
    }
    const file = await explorer.getFileStatTreeNodeByPath('index2.js');
    expect(file).toBeDefined();
    const menu = await file?.openContextMenu();
    const deleteMenu = await menu?.menuItemByName('Delete');
    await deleteMenu?.click();
    await app.page.waitForTimeout(200);
    const confirmed = await app.getDialogButton(!isLinux ? 'Move to Trash' : 'Delete');
    await confirmed?.click();
    await app.page.waitForTimeout(2000);

    await search.search({
      search: searchText,
      useRegexp: false,
    });
    await app.page.waitForTimeout(1000);
    result = await search.getSearchResult();
    expect(result).toBeDefined();
    if (result) {
      const { results, files } = result;
      expect(results).toBe(3);
      expect(files).toBe(1);
    }
  });
});
