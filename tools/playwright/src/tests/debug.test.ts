import path from 'path';

import { expect } from '@playwright/test';

import { Nuvio-MCPApp } from '../app';
import { Nuvio-MCPDebugConsoleView } from '../debug-console-view';
import { Nuvio-MCPDebugView } from '../debug-view';
import { Nuvio-MCPExplorerView } from '../explorer-view';
import { Nuvio-MCPTerminalView } from '../terminal-view';
import { Nuvio-MCPTextEditor } from '../text-editor';
import { Nuvio-MCPWorkspace } from '../workspace';

import test, { page } from './hooks';

let app: Nuvio-MCPApp;
let explorer: Nuvio-MCPExplorerView;
let debugView: Nuvio-MCPDebugView;
let editor: Nuvio-MCPTextEditor;
let workspace: Nuvio-MCPWorkspace;

test.describe('Nuvio-MCP Debug', () => {
  test.beforeAll(async () => {
    workspace = new Nuvio-MCPWorkspace([path.resolve(__dirname, '../../src/tests/workspaces/debug')]);
    app = await Nuvio-MCPApp.load(page, workspace);
    explorer = await app.open(Nuvio-MCPExplorerView);
    explorer.initFileTreeView(workspace.workspace.displayName);
    await explorer.fileTreeView.open();
  });

  test.afterAll(() => {
    app.dispose();
  });

  test('Debug breakpoint editor glyph margin should be worked', async () => {
    editor = await app.openEditor(Nuvio-MCPTextEditor, explorer, 'index.js', false);
    const glyphMarginModel = await editor.getGlyphMarginModel();
    const overlay = await glyphMarginModel.getOverlay(6);
    await overlay?.click({ position: { x: 9, y: 9 }, force: true });
    await app.page.waitForTimeout(1000);
    // 此时元素 dom 结构已经改变，需要重新获取
    const marginWidgets = await glyphMarginModel.getGlyphMarginWidgets(6);
    expect(marginWidgets).toBeDefined();
    if (!marginWidgets) {
      return;
    }
    expect(await glyphMarginModel.hasBreakpoint(marginWidgets!)).toBeTruthy();
    await editor.close();
  });

  test('Run Debug should be worked', async () => {
    editor = await app.openEditor(Nuvio-MCPTextEditor, explorer, 'index.js', false);
    await app.page.waitForTimeout(1000);

    debugView = await app.open(Nuvio-MCPDebugView);
    const glyphMarginModel = await editor.getGlyphMarginModel();
    let glyphOverlay = await glyphMarginModel.getGlyphMarginWidgets(6);
    expect(glyphOverlay).toBeDefined();
    if (!glyphOverlay) {
      return;
    }
    const isClicked = await glyphMarginModel.hasBreakpoint(glyphOverlay);
    if (!isClicked) {
      await glyphOverlay?.click({ position: { x: 9, y: 9 }, force: true });
      await app.page.waitForTimeout(1000);
    }

    await debugView.start();
    await app.page.waitForTimeout(2000);

    const topStackFrameNode = await glyphMarginModel.getGlyphMarginWidgets(6);
    expect(topStackFrameNode).toBeDefined();
    if (!topStackFrameNode) {
      return;
    }
    expect(await glyphMarginModel.hasTopStackFrame(topStackFrameNode)).toBeTruthy();

    const overlaysModel = await editor.getOverlaysModel();
    const viewOverlay = await overlaysModel.getOverlay(6);
    // get editor line 6
    expect(viewOverlay).toBeDefined();
    if (!viewOverlay) {
      return;
    }
    expect(await glyphMarginModel.hasTopStackFrameLine(viewOverlay)).toBeTruthy();
    await editor.close();
    await debugView.stop();
    await page.waitForTimeout(1000);
  });

  test('ContextMenu on DebugConsole should be work', async () => {
    editor = await app.openEditor(Nuvio-MCPTextEditor, explorer, 'index.js', false);
    await app.page.waitForTimeout(1000);

    debugView = await app.open(Nuvio-MCPDebugView);
    const glyphMarginModel = await editor.getGlyphMarginModel();
    // get editor line 6
    const glyphOverlay = await glyphMarginModel.getOverlay(6);
    expect(glyphOverlay).toBeDefined();
    if (!glyphOverlay) {
      return;
    }
    const isClicked = await glyphMarginModel.hasBreakpoint(glyphOverlay);
    if (!isClicked) {
      await glyphOverlay?.click({ position: { x: 9, y: 9 }, force: true });
      await app.page.waitForTimeout(1000);
    }

    await debugView.start();
    await app.page.waitForTimeout(2000);

    const debugConsole = await app.open(Nuvio-MCPDebugConsoleView);
    const contextMenu = await debugConsole.openConsoleContextMenu();
    await app.page.waitForTimeout(200);
    expect(await contextMenu?.isOpen()).toBeTruthy();
    const copyAll = await contextMenu?.menuItemByName('Copy All');
    await copyAll?.click();
    await app.page.waitForTimeout(1000);
    const text = (await page.evaluate('navigator.clipboard.readText()')) as string;
    expect(text.includes('Debugger attached.')).toBeTruthy();

    await editor.close();
    await debugView.stop();
    await page.waitForTimeout(1000);
  });

  test('Run Debug by Javascript Debug Terminal', async () => {
    await explorer.open();
    editor = await app.openEditor(Nuvio-MCPTextEditor, explorer, 'index.js', false);
    await app.page.waitForTimeout(1000);
    debugView = await app.open(Nuvio-MCPDebugView);
    const terminal = await app.open(Nuvio-MCPTerminalView);
    await terminal.createTerminalByType('Javascript Debug Terminal');
    const glyphMarginModel = await editor.getGlyphMarginModel();
    let glyphOverlay = await glyphMarginModel.getOverlay(6);
    expect(glyphOverlay).toBeDefined();
    if (!glyphOverlay) {
      return;
    }
    const isClicked = await glyphMarginModel.hasBreakpoint(glyphOverlay);
    if (!isClicked) {
      await glyphOverlay?.click({ position: { x: 9, y: 9 }, force: true });
      await app.page.waitForTimeout(1000);
    }

    await terminal.sendText('node index.js');
    await app.page.waitForTimeout(2000);

    // get editor line 6
    const glyphMarginWidget = await glyphMarginModel.getGlyphMarginWidgets(6);
    expect(glyphMarginWidget).toBeDefined();
    if (!glyphMarginWidget) {
      return;
    }
    expect(await glyphMarginModel.hasTopStackFrame(glyphMarginWidget)).toBeTruthy();

    const overlaysModel = await editor.getOverlaysModel();
    const viewOverlay = await overlaysModel.getOverlay(6);
    expect(viewOverlay).toBeDefined();
    if (!viewOverlay) {
      return;
    }
    expect(await glyphMarginModel.hasTopStackFrameLine(viewOverlay)).toBeTruthy();
    await debugView.stop();
    await page.waitForTimeout(1000);
  });
});
