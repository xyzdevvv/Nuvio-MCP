import { IContextKeyService } from '@Nuvio-MCP/ide-core-browser';
import { AbstractContextMenuService, ICtxMenuRenderer } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { Disposable } from '@Nuvio-MCP/ide-core-common';
import { IDebugSessionManager } from '@Nuvio-MCP/ide-debug';
import { DebugHoverSource } from '@Nuvio-MCP/ide-debug/lib/browser/editor/debug-hover-source';
import { DebugConsoleNode } from '@Nuvio-MCP/ide-debug/lib/browser/tree';
import { DebugViewModel } from '@Nuvio-MCP/ide-debug/lib/browser/view/debug-view-model';
import { DebugVariablesModelService } from '@Nuvio-MCP/ide-debug/lib/browser/view/variables/debug-variables-tree.model.service';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';

import styles from '../../../../src/browser/view/variables/debug-variables.module.less';

import { DebugContextKey } from './../../../../src/browser/contextkeys/debug-contextkey.service';

describe('Debug Variables Tree Model', () => {
  const mockInjector = createBrowserInjector([]);
  let debugVariablesModelService: DebugVariablesModelService;
  const mockDebugHoverSource = {
    onDidChange: jest.fn(() => Disposable.create(() => {})),
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

  const mockDebugSessionManager = {
    onDidDestroyDebugSession: jest.fn(() => Disposable.create(() => {})),
    onDidChangeActiveDebugSession: jest.fn(() => Disposable.create(() => {})),
  };

  const mockMenuService = {
    createMenu: jest.fn(() => ({
      getMergedMenuNodes: () => [],
      dispose: () => {},
    })),
  };

  const mockContextKeyService = {
    createScoped: jest.fn(),
  };

  const mockCtxMenuRenderer = {
    show: jest.fn(),
  } as any;

  const mockDebugViewModel = {
    onDidChange: jest.fn(),
  };

  beforeAll(() => {
    mockInjector.overrideProviders({
      token: DebugHoverSource,
      useValue: mockDebugHoverSource,
    });
    mockInjector.overrideProviders({
      token: IDebugSessionManager,
      useValue: mockDebugSessionManager,
    });
    mockInjector.overrideProviders({
      token: ICtxMenuRenderer,
      useValue: mockCtxMenuRenderer,
    });
    mockInjector.overrideProviders({
      token: AbstractContextMenuService,
      useValue: mockMenuService,
    });
    mockInjector.overrideProviders({
      token: ICtxMenuRenderer,
      useValue: mockCtxMenuRenderer,
    });
    mockInjector.overrideProviders({
      token: IContextKeyService,
      useValue: mockContextKeyService,
    });
    mockInjector.overrideProviders({
      token: DebugViewModel,
      useValue: mockDebugViewModel,
    });
    mockInjector.overrideProviders({
      token: DebugContextKey,
      useValue: {
        contextVariableEvaluateNamePresent: {
          set: jest.fn(),
        },
        contextDebugProtocolVariableMenu: {
          set: jest.fn(),
        },
        contextCanViewMemory: {
          set: jest.fn(),
        },
      },
    });

    debugVariablesModelService = mockInjector.get(DebugVariablesModelService);
  });

  afterAll(() => {
    debugVariablesModelService.dispose();
  });

  it('should have enough API', () => {
    expect(typeof debugVariablesModelService.listenTreeViewChange).toBe('function');
    expect(typeof debugVariablesModelService.dispose).toBe('function');
    expect(typeof debugVariablesModelService.onDidUpdateTreeModel).toBe('function');
    expect(typeof debugVariablesModelService.initTreeModel).toBe('function');
    expect(typeof debugVariablesModelService.initDecorations).toBe('function');
    expect(typeof debugVariablesModelService.activeNodeDecoration).toBe('function');
    expect(typeof debugVariablesModelService.activeNodeActivedDecoration).toBe('function');
    expect(typeof debugVariablesModelService.enactiveNodeDecoration).toBe('function');
    expect(typeof debugVariablesModelService.removeNodeDecoration).toBe('function');
    expect(typeof debugVariablesModelService.handleTreeHandler).toBe('function');
    expect(typeof debugVariablesModelService.handleTreeBlur).toBe('function');
    expect(typeof debugVariablesModelService.handleTwistierClick).toBe('function');
    expect(typeof debugVariablesModelService.toggleDirectory).toBe('function');
    expect(debugVariablesModelService.flushEventQueuePromise).toBeUndefined();
    expect(debugVariablesModelService.treeHandle).toBeUndefined();
    expect(debugVariablesModelService.decorations).toBeUndefined();
    expect(debugVariablesModelService.treeModel).toBeUndefined();
    expect(debugVariablesModelService.focusedNode).toBeUndefined();
    expect(Array.isArray(debugVariablesModelService.selectedNodes)).toBeTruthy();
  });

  it('should init success', () => {
    expect(mockDebugViewModel.onDidChange).toHaveBeenCalledTimes(1);
  });

  it('initTreeModel method should be work', () => {
    const mockSession = {
      on: jest.fn(),
    } as any;
    debugVariablesModelService.initTreeModel(mockSession);
    expect(debugVariablesModelService.treeModel).toBeDefined();
  });

  it('activeNodeDecoration method should be work', () => {
    const mockSession = {
      on: jest.fn(),
    } as any;
    debugVariablesModelService.initDecorations(mockRoot);
    const node = new DebugConsoleNode({ session: mockSession }, 'test', mockRoot);
    debugVariablesModelService.activeNodeDecoration(node);
    const decoration = debugVariablesModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected, styles.mod_focused]);
  });

  it('enactiveNodeDecoration method should be work', () => {
    const mockSession = {
      on: jest.fn(),
    } as any;
    debugVariablesModelService.initDecorations(mockRoot);
    const node = new DebugConsoleNode({ session: mockSession }, 'test', mockRoot);
    debugVariablesModelService.activeNodeDecoration(node);
    let decoration = debugVariablesModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected, styles.mod_focused]);
    debugVariablesModelService.enactiveNodeDecoration();
    decoration = debugVariablesModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected]);
  });

  it('removeNodeDecoration method should be work', () => {
    const mockSession = {
      on: jest.fn(),
    } as any;
    debugVariablesModelService.initDecorations(mockRoot);
    const node = new DebugConsoleNode({ session: mockSession }, 'test', mockRoot);
    debugVariablesModelService.activeNodeDecoration(node);
    let decoration = debugVariablesModelService.decorations.getDecorations(node);
    debugVariablesModelService.removeNodeDecoration();
    decoration = debugVariablesModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([]);
  });

  it('handleTreeHandler method should be work', () => {
    const treeHandle = { ensureVisible: () => {}, getModel: () => debugVariablesModelService.treeModel! } as any;
    debugVariablesModelService.handleTreeHandler(treeHandle);
    expect(debugVariablesModelService.treeHandle.getModel()).toEqual(treeHandle.getModel());
  });

  it('handleTreeBlur method should be work', () => {
    const mockSession = {
      on: jest.fn(),
    } as any;
    debugVariablesModelService.initDecorations(mockRoot);
    const node = new DebugConsoleNode({ session: mockSession }, 'test', mockRoot);
    debugVariablesModelService.initDecorations(mockRoot);
    debugVariablesModelService.activeNodeDecoration(node);
    let decoration = debugVariablesModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected, styles.mod_focused]);
    debugVariablesModelService.handleTreeBlur();
    decoration = debugVariablesModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected]);
  });

  it('handleTwistierClick method should be work', () => {
    const treeHandle = { collapseNode: jest.fn(), expandNode: jest.fn() } as any;
    let mockNode = { expanded: false, setExpanded: () => {}, setCollapsed: () => {}, getRawScope: () => {} };
    debugVariablesModelService.handleTreeHandler(treeHandle);
    debugVariablesModelService.toggleDirectory(mockNode as any);
    expect(treeHandle.expandNode).toHaveBeenCalledTimes(0);
    mockNode = { expanded: true, setExpanded: () => {}, setCollapsed: () => {}, getRawScope: () => {} };
    debugVariablesModelService.toggleDirectory(mockNode as any);
    expect(treeHandle.collapseNode).toHaveBeenCalledTimes(0);
  });

  it('handleContextMenu method should be work', () => {
    const mockNode = { expanded: false, toDebugProtocolObject: jest.fn() } as any;
    const mockEvent = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
      nativeEvent: {
        x: 1,
        y: 1,
      },
    } as any;
    debugVariablesModelService.handleContextMenu(mockEvent, mockNode);
    expect(mockCtxMenuRenderer.show).toHaveBeenCalledTimes(1);
    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
    expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
  });
});
