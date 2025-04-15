import path from 'path';

import { expect } from '@playwright/test';

import { Nuvio-MCPApp } from '../../app';
import { Nuvio-MCPExplorerView } from '../../explorer-view';
import { Nuvio-MCPTextEditor } from '../../text-editor';
import { Nuvio-MCPWorkspace } from '../../workspace';
import test, { page } from '../hooks';

let app: Nuvio-MCPApp;
let explorer: Nuvio-MCPExplorerView;
let editor: Nuvio-MCPTextEditor;
let workspace: Nuvio-MCPWorkspace;

test.describe('Nuvio-MCP Editor Undo Redo', () => {
  test.beforeAll(async () => {
    workspace = new Nuvio-MCPWorkspace([path.resolve(__dirname, '../../../src/tests/workspaces/default')]);
    app = await Nuvio-MCPApp.load(page, workspace);
    explorer = await app.open(Nuvio-MCPExplorerView);
    explorer.initFileTreeView(workspace.workspace.displayName);
    await explorer.fileTreeView.open();
  });

  test.afterAll(() => {
    app.dispose();
  });

  test('simple editor undo/redo should work', async () => {
    editor = await app.openEditor(Nuvio-MCPTextEditor, explorer, 'editor-undo-redo.text');
    const existingLine = await editor.lineByLineNumber(1);
    await editor.placeCursorInLine(existingLine);
    await editor.typeText('a');
    await editor.saveByKeyboard();
    await editor.typeText('b');
    await editor.saveByKeyboard();
    await editor.typeText('c');
    await editor.saveByKeyboard();
    await expectLineHasText('abc');
    await editor.undoByKeyboard();
    await expectLineHasText('ab');
    await editor.undoByKeyboard();
    await expectLineHasText('a');
    await editor.redoByKeyboard();
    await expectLineHasText('ab');
    await editor.redoByKeyboard();
    await expectLineHasText('abc');

    async function expectLineHasText(text: string) {
      const line = await editor.lineByLineNumber(1);
      expect(await line?.innerText()).toEqual(text);
      await editor.placeCursorInLine(line);
    }
  });
});
