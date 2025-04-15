import path from 'path';

import { expect } from '@playwright/test';

import { isMacintosh } from '@Nuvio-MCP/ide-utils';

import { Nuvio-MCPApp } from '../app';
import { Nuvio-MCPExplorerView } from '../explorer-view';
import { Nuvio-MCPTextEditor } from '../text-editor';
import { Nuvio-MCPWorkspace } from '../workspace';

import test, { page } from './hooks';

let app: Nuvio-MCPApp;
let explorer: Nuvio-MCPExplorerView;
let editor: Nuvio-MCPTextEditor;
let workspace: Nuvio-MCPWorkspace;

test.describe('Nuvio-MCP Language', () => {
  test.beforeAll(async () => {
    workspace = new Nuvio-MCPWorkspace([path.resolve(__dirname, '../../src/tests/workspaces/language')]);
    app = await Nuvio-MCPApp.load(page, workspace);
    explorer = await app.open(Nuvio-MCPExplorerView);
    explorer.initFileTreeView(workspace.workspace.displayName);
    await explorer.fileTreeView.open();
  });

  test.afterAll(() => {
    app.dispose();
  });

  test('Go to Defination by cmd + click', async () => {
    const folder = await explorer.getFileStatTreeNodeByPath('language');
    await folder?.open();

    editor = await app.openEditor(Nuvio-MCPTextEditor, explorer, 'reference.ts', false);
    await editor.activate();
    await app.page.waitForTimeout(2000);
    await editor.placeCursorInLineWithPosition(4, 20);
    let cursorHandle = await editor.getCursorElement();
    await cursorHandle?.click({ modifiers: [isMacintosh ? 'Meta' : 'Control'] });
    await app.page.waitForTimeout(2000);
    const definitionTree = await explorer.getFileStatTreeNodeByPath('definition.ts');
    expect(await definitionTree?.isSelected()).toBeTruthy();
    const currentTab = await editor.getCurrentTab();
    expect(await currentTab?.textContent()).toStrictEqual(' definition.ts');

    cursorHandle = await editor.getCursorElement();
    const cursorLineNumber = await editor.getCursorLineNumber(cursorHandle?.asElement());
    expect(cursorLineNumber).toBe(1);
    expect(await editor.textContentOfLineByLineNumber(cursorLineNumber!)).toBe('export class Definition {');

    await editor.close();
  });
});
