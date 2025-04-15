import { WSChannel } from '@Nuvio-MCP/ide-connection';
import { WSChannelHandler } from '@Nuvio-MCP/ide-connection/lib/browser/ws-channel-handler';
import { SimpleConnection } from '@Nuvio-MCP/ide-connection/lib/common/connection/drivers/simple';
import { IContextKeyService, IFileServiceClient } from '@Nuvio-MCP/ide-core-browser';
import { Disposable } from '@Nuvio-MCP/ide-core-common';
import {
  DebugModelFactory,
  DebugSessionOptions,
  IDebugServer,
  IDebugSession,
  IDebugSessionManager,
} from '@Nuvio-MCP/ide-debug';
import { DebugPreferences } from '@Nuvio-MCP/ide-debug/lib/browser/debug-preferences';
import { DebugSession } from '@Nuvio-MCP/ide-debug/lib/browser/debug-session';
import { DebugSessionContributionRegistry } from '@Nuvio-MCP/ide-debug/lib/browser/debug-session-contribution';
import { DebugConsoleFilterService } from '@Nuvio-MCP/ide-debug/lib/browser/view/console/debug-console-filter.service';
import { DebugConsoleModelService } from '@Nuvio-MCP/ide-debug/lib/browser/view/console/debug-console-tree.model.service';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { IEditorDocumentModelService } from '@Nuvio-MCP/ide-editor/lib/browser';
import { IMainLayoutService } from '@Nuvio-MCP/ide-main-layout';
import { LayoutService } from '@Nuvio-MCP/ide-main-layout/lib/browser/layout.service';
import { OutputService } from '@Nuvio-MCP/ide-output/lib/browser/output.service';
import { IMessageService } from '@Nuvio-MCP/ide-overlay';
import { QuickPickService } from '@Nuvio-MCP/ide-quick-open';
import { ITaskService } from '@Nuvio-MCP/ide-task';
import { ITerminalApiService } from '@Nuvio-MCP/ide-terminal-next';
import { IVariableResolverService } from '@Nuvio-MCP/ide-variable';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { MockDebugSession } from '../../../../__mocks__/debug-session';

describe('Debug console component Test Suites', () => {
  const mockInjector = createBrowserInjector([]);
  let debugConsoleModelService: DebugConsoleModelService;
  let debugConsoleFilterService: DebugConsoleFilterService;
  let container;

  const createMockSession = (sessionId: string, options: Partial<DebugSessionOptions>): IDebugSession =>
    new MockDebugSession(sessionId, options);

  const mockCtxMenuRenderer = {
    show: jest.fn(),
    onDidChangeContext: jest.fn(() => Disposable.create(() => {})),
  } as any;
  const mockDebugSessionManager = {
    onDidDestroyDebugSession: jest.fn(() => Disposable.create(() => {})),
    onDidChangeActiveDebugSession: jest.fn(() => Disposable.create(() => {})),
    currentSession: undefined,
    updateCurrentSession: jest.fn((session: IDebugSession | undefined) => {}),
  } as any;

  beforeEach(() => {
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
        clientId: 'mock_id' + Math.random(),
        openChannel(id: string) {
          return new WSChannel(new SimpleConnection(), { id: 'mock_wschannel' + id });
        },
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
      token: IContextKeyService,
      useValue: mockCtxMenuRenderer,
    });
    mockInjector.overrideProviders({
      token: IDebugSessionManager,
      useValue: mockDebugSessionManager,
    });
    mockInjector.overrideProviders({
      token: IMainLayoutService,
      useClass: LayoutService,
    });

    debugConsoleModelService = mockInjector.get(DebugConsoleModelService);
    debugConsoleFilterService = mockInjector.get(DebugConsoleFilterService);
    container = document.createElement('div');
    container.setAttribute('id', 'debugConsole');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  it('repl can be filter', async () => {
    const session = createMockSession('mock', {});
    mockDebugSessionManager.currentSession = session;
    await debugConsoleModelService.initTreeModel(session as DebugSession);
    const tree = debugConsoleModelService;
    const ensureVisible = jest.fn();
    debugConsoleModelService.handleTreeHandler({
      ensureVisible,
    } as any);

    await tree.execute('ABCD\n');
    await tree.execute('EFGH\n');
    await tree.execute('KTTQL\n');
    await tree.execute('KATATAQAL\n');
    await tree.execute('🐜\n');
    expect(ensureVisible).toHaveBeenCalledTimes(5);
    const filterString = 'KTTQL';
    debugConsoleFilterService.onDidValueChange((event) => {
      expect(event).toBe(filterString);
    });
    debugConsoleFilterService.setFilterText(filterString);
  });
});
