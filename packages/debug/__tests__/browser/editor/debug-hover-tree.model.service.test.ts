import { ICtxMenuRenderer } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { Disposable } from '@Nuvio-MCP/ide-core-common';
import { IDebugSessionManager } from '@Nuvio-MCP/ide-debug';
import { DebugHoverSource } from '@Nuvio-MCP/ide-debug/lib/browser/editor/debug-hover-source';
import { DebugHoverTreeModelService } from '@Nuvio-MCP/ide-debug/lib/browser/editor/debug-hover-tree.model.service';
import { ExpressionContainer } from '@Nuvio-MCP/ide-debug/lib/browser/tree';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';

import styles from '../../../src/browser/editor/debug-hover.module.less';

describe('Debug Hover Model', () => {
  const mockInjector = createBrowserInjector([]);
  let debugHoverTreeModelService: DebugHoverTreeModelService;
  const mockDebugHoverSource = {
    onDidChange: jest.fn(() => Disposable.create(() => {})),
  } as any;

  const mockCtxMenuRenderer = {
    show: jest.fn(),
  } as any;

  const mockWatcher = {
    callback: jest.fn(),
  };
  const mockRoot = {
    watcher: {
      on: jest.fn(() => Disposable.create(() => {})),
    },
    watchEvents: {
      get: jest.fn(() => mockWatcher),
    },
    path: 'testRoot',
    ensureLoaded: jest.fn(),
  } as any;

  beforeAll(() => {
    mockInjector.overrideProviders({
      token: DebugHoverSource,
      useValue: mockDebugHoverSource,
    });
    mockInjector.overrideProviders({
      token: IDebugSessionManager,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: ICtxMenuRenderer,
      useValue: mockCtxMenuRenderer,
    });

    debugHoverTreeModelService = mockInjector.get(DebugHoverTreeModelService);
  });

  afterAll(() => {
    debugHoverTreeModelService.dispose();
  });

  it('should have enough API', () => {
    expect(typeof debugHoverTreeModelService.listenTreeViewChange).toBe('function');
    expect(typeof debugHoverTreeModelService.dispose).toBe('function');
    expect(typeof debugHoverTreeModelService.onDidUpdateTreeModelOrVariable).toBe('function');
    expect(typeof debugHoverTreeModelService.initTreeModel).toBe('function');
    expect(typeof debugHoverTreeModelService.initDecorations).toBe('function');
    expect(typeof debugHoverTreeModelService.activeNodeDecoration).toBe('function');
    expect(typeof debugHoverTreeModelService.activeNodeFocusedDecoration).toBe('function');
    expect(typeof debugHoverTreeModelService.enactiveNodeDecoration).toBe('function');
    expect(typeof debugHoverTreeModelService.removeNodeDecoration).toBe('function');
    expect(typeof debugHoverTreeModelService.handleTreeHandler).toBe('function');
    expect(typeof debugHoverTreeModelService.handleTreeBlur).toBe('function');
    expect(typeof debugHoverTreeModelService.handleTwistierClick).toBe('function');
    expect(typeof debugHoverTreeModelService.toggleDirectory).toBe('function');
    expect(typeof debugHoverTreeModelService.refresh).toBe('function');
    expect(typeof debugHoverTreeModelService.flushEventQueue).toBe('function');
    expect(debugHoverTreeModelService.flushEventQueuePromise).toBeUndefined();
    expect(debugHoverTreeModelService.treeHandle).toBeUndefined();
    expect(debugHoverTreeModelService.decorations).toBeUndefined();
    expect(debugHoverTreeModelService.treeModel).toBeUndefined();
    expect(debugHoverTreeModelService.whenReady).toBeUndefined();
    expect(debugHoverTreeModelService.focusedNode).toBeUndefined();
    expect(Array.isArray(debugHoverTreeModelService.selectedNodes)).toBeTruthy();
  });

  it('initTreeModel method should be work', () => {
    debugHoverTreeModelService.initTreeModel(mockRoot);
    expect(mockRoot.watcher.on).toHaveBeenCalledTimes(8);
  });

  it('activeNodeDecoration method should be work', () => {
    const mockSession = jest.fn() as any;
    const node = new ExpressionContainer({ session: mockSession }, mockRoot, undefined, 'test');
    debugHoverTreeModelService.activeNodeDecoration(node);
    const decoration = debugHoverTreeModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected, styles.mod_focused]);
  });

  it('enactiveNodeDecoration method should be work', () => {
    const mockSession = jest.fn() as any;
    const node = new ExpressionContainer({ session: mockSession }, mockRoot, undefined, 'test');
    debugHoverTreeModelService.activeNodeDecoration(node);
    let decoration = debugHoverTreeModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected, styles.mod_focused]);
    debugHoverTreeModelService.enactiveNodeDecoration();
    decoration = debugHoverTreeModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected]);
  });

  it('removeNodeDecoration method should be work', () => {
    const mockSession = jest.fn() as any;
    const node = new ExpressionContainer({ session: mockSession }, mockRoot, undefined, 'test');
    debugHoverTreeModelService.activeNodeDecoration(node);
    let decoration = debugHoverTreeModelService.decorations.getDecorations(node);
    debugHoverTreeModelService.removeNodeDecoration();
    decoration = debugHoverTreeModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([]);
  });

  it('handleTreeHandler method should be work', () => {
    const treeHandle = { ensureVisible: () => {} } as any;
    debugHoverTreeModelService.handleTreeHandler(treeHandle);
    expect(debugHoverTreeModelService.treeHandle).toEqual(treeHandle);
  });

  it('handleTreeBlur method should be work', () => {
    const mockSession = jest.fn() as any;
    const node = new ExpressionContainer({ session: mockSession }, mockRoot, undefined, 'test');
    debugHoverTreeModelService.initDecorations(mockRoot);
    debugHoverTreeModelService.activeNodeDecoration(node);
    let decoration = debugHoverTreeModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected, styles.mod_focused]);
    debugHoverTreeModelService.handleTreeBlur();
    decoration = debugHoverTreeModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected]);
  });

  it('handleTwistierClick method should be work', () => {
    const treeHandle = { collapseNode: jest.fn(), expandNode: jest.fn() } as any;
    let mockNode = { expanded: false };
    debugHoverTreeModelService.handleTreeHandler(treeHandle);
    debugHoverTreeModelService.toggleDirectory(mockNode as any);
    expect(treeHandle.expandNode).toHaveBeenCalledTimes(1);
    mockNode = { expanded: true };
    debugHoverTreeModelService.toggleDirectory(mockNode as any);
    expect(treeHandle.collapseNode).toHaveBeenCalledTimes(1);
  });

  it('refresh method should be work', (done) => {
    debugHoverTreeModelService.onDidRefreshed(() => {
      expect(mockWatcher.callback).toHaveBeenCalledTimes(1);
      done();
    });
    debugHoverTreeModelService.refresh();
  });
});
