import { WSChannelHandler } from '@Nuvio-MCP/ide-connection/lib/browser/ws-channel-handler';
import { IContextKeyService } from '@Nuvio-MCP/ide-core-browser';
import { QuickPickService } from '@Nuvio-MCP/ide-core-browser';
import { AbstractContextMenuService, ICtxMenuRenderer } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { Disposable, IFileServiceClient } from '@Nuvio-MCP/ide-core-common';
import {
  DebugModelFactory,
  DebugSessionOptions,
  IDebugServer,
  IDebugSession,
  IDebugSessionManager,
} from '@Nuvio-MCP/ide-debug';
import { DebugContextKey } from '@Nuvio-MCP/ide-debug/lib/browser/contextkeys/debug-contextkey.service';
import { DebugPreferences } from '@Nuvio-MCP/ide-debug/lib/browser/debug-preferences';
import {
  DebugSessionContributionRegistry,
  DebugSessionFactory,
} from '@Nuvio-MCP/ide-debug/lib/browser/debug-session-contribution';
import { DebugHoverSource } from '@Nuvio-MCP/ide-debug/lib/browser/editor/debug-hover-source';
import { DebugConsoleNode } from '@Nuvio-MCP/ide-debug/lib/browser/tree';
import { DebugConsoleFilterService } from '@Nuvio-MCP/ide-debug/lib/browser/view/console/debug-console-filter.service';
import {
  DebugConsoleModelService,
  IDebugConsoleModel,
} from '@Nuvio-MCP/ide-debug/lib/browser/view/console/debug-console-tree.model.service';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { IEditorDocumentModelService } from '@Nuvio-MCP/ide-editor/lib/browser';
import { OutputService } from '@Nuvio-MCP/ide-output/lib/browser/output.service';
import { IMessageService } from '@Nuvio-MCP/ide-overlay';
import { ITaskService } from '@Nuvio-MCP/ide-task';
import { ITerminalApiService } from '@Nuvio-MCP/ide-terminal-next';
import { IVariableResolverService } from '@Nuvio-MCP/ide-variable';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { MockDebugSession } from '../../../../__mocks__/debug-session';
import styles from '../../../../src/browser/view/console/debug-console.module.less';

describe('Debug Console Tree Model', () => {
  const mockInjector = createBrowserInjector([]);
  let debugConsoleModelService: DebugConsoleModelService;
  let debugConsoleFilterService: DebugConsoleFilterService;
  let debugSessionFactory: DebugSessionFactory;
  const mockDebugHoverSource = {
    onDidChange: jest.fn(() => Disposable.create(() => {})),
  } as any;

  const createMockSession = (sessionId: string, options: Partial<DebugSessionOptions>): IDebugSession =>
    new MockDebugSession(sessionId, options);

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
    currentSession: IDebugSession,
    updateCurrentSession: jest.fn((session: IDebugSession | undefined) => {}),
  };
  // let mockDebugSessionManager: DebugSessionManager;

  const mockMenuService = {
    createMenu: jest.fn(() => ({
      getMergedMenuNodes: () => [],
      dispose: () => {},
    })),
  };

  let mockContextKeyService = {
    createScoped: jest.fn(),
  };

  const mockCtxMenuRenderer = {
    show: jest.fn(),
  } as any;

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
      token: IContextKeyService,
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
      token: WorkbenchEditorService,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: IMessageService,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: DebugPreferences,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: IFileServiceClient,
      useValue: {
        onFilesChanged: jest.fn(),
      },
    });
    mockInjector.overrideProviders({
      token: ITerminalApiService,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: OutputService,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: DebugModelFactory,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: IWorkspaceService,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: IDebugServer,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: QuickPickService,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: IEditorDocumentModelService,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: WSChannelHandler,
      useValue: {
        openChannel: jest.fn(),
      },
    });
    mockInjector.overrideProviders({
      token: DebugSessionContributionRegistry,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: IVariableResolverService,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: ITaskService,
      useValue: {},
    });
    mockInjector.overrideProviders({
      token: DebugContextKey,
      useValue: {
        contextInDebugConsole: {
          set: jest.fn(),
        },
      },
    });

    debugConsoleModelService = mockInjector.get(DebugConsoleModelService);
    debugConsoleFilterService = mockInjector.get(DebugConsoleFilterService);
    mockContextKeyService = mockInjector.get(IContextKeyService);
  });

  afterAll(() => {
    debugConsoleModelService.dispose();
  });

  it('should have enough API', () => {
    expect(typeof debugConsoleModelService.listenTreeViewChange).toBe('function');
    expect(typeof debugConsoleModelService.dispose).toBe('function');
    expect(typeof debugConsoleModelService.onDidUpdateTreeModel).toBe('function');
    expect(typeof debugConsoleModelService.initTreeModel).toBe('function');
    expect(typeof debugConsoleModelService.clear).toBe('function');
    expect(typeof debugConsoleModelService.initDecorations).toBe('function');
    expect(typeof debugConsoleModelService.activeNodeDecoration).toBe('function');
    expect(typeof debugConsoleModelService.activeNodeActivedDecoration).toBe('function');
    expect(typeof debugConsoleModelService.enactiveNodeDecoration).toBe('function');
    expect(typeof debugConsoleModelService.removeNodeDecoration).toBe('function');
    expect(typeof debugConsoleModelService.handleTreeHandler).toBe('function');
    expect(typeof debugConsoleModelService.handleTreeBlur).toBe('function');
    expect(typeof debugConsoleModelService.handleTwistierClick).toBe('function');
    expect(typeof debugConsoleModelService.toggleDirectory).toBe('function');
    expect(typeof debugConsoleModelService.refresh).toBe('function');
    expect(typeof debugConsoleModelService.flushEventQueue).toBe('function');
    expect(debugConsoleModelService.flushEventQueuePromise).toBeUndefined();
    expect(debugConsoleModelService.treeHandle).toBeUndefined();
    expect(debugConsoleModelService.decorations).toBeUndefined();
    expect(debugConsoleModelService.treeModel).toBeUndefined();
    expect(debugConsoleModelService.focusedNode).toBeUndefined();
    expect(Array.isArray(debugConsoleModelService.selectedNodes)).toBeTruthy();
    expect(typeof debugConsoleFilterService.onDidValueChange).toBe('function');
  });

  it('should init success', () => {
    expect(mockDebugSessionManager.onDidDestroyDebugSession).toHaveBeenCalledTimes(1);
    expect(mockDebugSessionManager.onDidChangeActiveDebugSession).toHaveBeenCalledTimes(1);
  });

  it('initTreeModel method should be work', () => {
    const mockSession = {
      on: jest.fn(() => Disposable.create(() => {})),
      hasSeparateRepl: () => true,
      parentSession: undefined,
    } as Partial<IDebugSession>;
    debugConsoleModelService.initTreeModel(mockSession as any);
    expect(mockSession.on).toHaveBeenCalledTimes(1);
  });

  it('clear method should be work', () => {
    const mockSession = {
      on: jest.fn(() => Disposable.create(() => {})),
      hasSeparateRepl: () => true,
      parentSession: undefined,
    } as Partial<IDebugSession>;
    mockDebugSessionManager.currentSession = mockSession as any;
    debugConsoleModelService.clear();
    expect(mockSession.on).toHaveBeenCalledTimes(1);
  });

  it('activeNodeDecoration method should be work', () => {
    const mockSession = {
      on: jest.fn(() => Disposable.create(() => {})),
    } as any;
    debugConsoleModelService.initDecorations(mockRoot);
    const node = new DebugConsoleNode({ session: mockSession }, 'test', mockRoot);
    debugConsoleModelService.activeNodeDecoration(node);
    const decoration = debugConsoleModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
  });

  it('enactiveNodeDecoration method should be work', () => {
    const mockSession = {
      on: jest.fn(() => Disposable.create(() => {})),
    } as any;
    debugConsoleModelService.initDecorations(mockRoot);
    const node = new DebugConsoleNode({ session: mockSession }, 'test', mockRoot);
    debugConsoleModelService.activeNodeDecoration(node);
    let decoration = debugConsoleModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    debugConsoleModelService.enactiveNodeDecoration();
    decoration = debugConsoleModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected]);
  });

  it('removeNodeDecoration method should be work', () => {
    const mockSession = {
      on: jest.fn(() => Disposable.create(() => {})),
    } as any;
    debugConsoleModelService.initDecorations(mockRoot);
    const node = new DebugConsoleNode({ session: mockSession }, 'test', mockRoot);
    debugConsoleModelService.activeNodeDecoration(node);
    let decoration = debugConsoleModelService.decorations.getDecorations(node);
    debugConsoleModelService.removeNodeDecoration();
    decoration = debugConsoleModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([]);
  });

  it('handleTreeHandler method should be work', () => {
    const treeHandle = { ensureVisible: () => {} } as any;
    debugConsoleModelService.handleTreeHandler(treeHandle);
    expect(debugConsoleModelService.treeHandle).toEqual(treeHandle);
  });

  it('handleTreeBlur method should be work', () => {
    const mockSession = {
      on: jest.fn(() => Disposable.create(() => {})),
    } as any;
    debugConsoleModelService.initDecorations(mockRoot);
    const node = new DebugConsoleNode({ session: mockSession }, 'test', mockRoot);
    debugConsoleModelService.initDecorations(mockRoot);
    debugConsoleModelService.activeNodeDecoration(node);
    let decoration = debugConsoleModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    debugConsoleModelService.handleTreeBlur();
    decoration = debugConsoleModelService.decorations.getDecorations(node);
    expect(decoration).toBeDefined();
    expect(decoration!.classlist).toEqual([styles.mod_selected]);
  });

  it('handleTwistierClick method should be work', () => {
    const treeHandle = { collapseNode: jest.fn(), expandNode: jest.fn() } as any;
    let mockNode = { expanded: false };
    debugConsoleModelService.handleTreeHandler(treeHandle);
    debugConsoleModelService.toggleDirectory(mockNode as any);
    expect(treeHandle.expandNode).toHaveBeenCalledTimes(1);
    mockNode = { expanded: true };
    debugConsoleModelService.toggleDirectory(mockNode as any);
    expect(treeHandle.collapseNode).toHaveBeenCalledTimes(1);
  });

  it('handleContextMenu method should be work', () => {
    const mockNode = { expanded: false } as any;
    const mockEvent = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn(),
      nativeEvent: {
        x: 1,
        y: 1,
      },
    } as any;
    debugConsoleModelService.handleContextMenu(mockEvent, mockNode);
    expect(mockCtxMenuRenderer.show).toHaveBeenCalledTimes(1);
    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
    expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('refresh method should be work', (done) => {
    debugConsoleModelService.onDidRefreshed(() => {
      done();
    });
    debugConsoleModelService.refresh(debugConsoleModelService.treeModel?.root as any);
  });

  it('repl merging', async () => {
    const treeHandle = { ensureVisible: () => {} } as any;
    debugConsoleModelService.handleTreeHandler(treeHandle);
    const getBranchSize = (repl: IDebugConsoleModel | undefined) => (repl ? repl.treeModel.root.branchSize : 0);
    const parent = createMockSession('parent', { repl: 'mergeWithParent' });
    createMockSession('child1', { parentSession: parent, repl: 'separate' });
    const child2 = createMockSession('child2', { parentSession: parent, repl: 'mergeWithParent' });
    createMockSession('grandChild', { parentSession: child2, repl: 'mergeWithParent' });
    createMockSession('child3', { parentSession: parent });

    const parentRepl = debugConsoleModelService.getConsoleModel('parent');
    const child1Repl = debugConsoleModelService.getConsoleModel('child1');
    const child2Repl = debugConsoleModelService.getConsoleModel('child2');
    const grandChildRepl = debugConsoleModelService.getConsoleModel('grandChild');
    const child3Repl = debugConsoleModelService.getConsoleModel('child3');

    mockDebugSessionManager.currentSession = parent as any;
    await debugConsoleModelService.execute('1\n');
    expect(getBranchSize(parentRepl)).toBeGreaterThanOrEqual(0);
    expect(getBranchSize(child1Repl)).toEqual(0);
    expect(getBranchSize(child2Repl)).toBeGreaterThanOrEqual(0);
    expect(getBranchSize(grandChildRepl)).toBeGreaterThanOrEqual(0);
    expect(getBranchSize(child3Repl)).toEqual(0);
  });

  it('repl filter service', () => {
    debugConsoleFilterService.setFilterText('KTTQL');
    expect(debugConsoleFilterService.filter('KATATAQALA')).toEqual(false);
    expect(debugConsoleFilterService.filter('KTTQLLLLLL')).toEqual(true);
    expect(debugConsoleFilterService.filter('🐜')).toEqual(false);
    expect(debugConsoleFilterService.filter('早上好我的工友们 KTTQL')).toEqual(true);
  });

  it('repl findMatches service', () => {
    debugConsoleFilterService.setFilterText('T');
    const matches = debugConsoleFilterService.findMatches('KTTQL吧, YYDS');
    expect(matches.length).toEqual(2);
    expect(matches[0].startIndex).toEqual(1);

    debugConsoleFilterService.setFilterText('吧');
    const matches2 = debugConsoleFilterService.findMatches('KTTQL吧, YYDS');
    expect(matches2.length).toEqual(1);
    expect(matches2[0].startIndex).toEqual(5);
  });
});
