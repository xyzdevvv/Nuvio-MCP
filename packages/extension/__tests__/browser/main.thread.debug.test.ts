import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { LabelService } from '@Nuvio-MCP/ide-core-browser/src';
import { Disposable, IFileServiceClient, URI, Uri } from '@Nuvio-MCP/ide-core-common';
import {
  IDebugConsoleModelService,
  IDebugModelManager,
  IDebugServer,
  IDebugService,
  IDebugSessionManager,
} from '@Nuvio-MCP/ide-debug';
import { BreakpointManager } from '@Nuvio-MCP/ide-debug/lib/browser/breakpoint';
import { DebugConfigurationManager } from '@Nuvio-MCP/ide-debug/lib/browser/debug-configuration-manager';
import { DebugPreferences } from '@Nuvio-MCP/ide-debug/lib/browser/debug-preferences';
import { DebugSessionContributionRegistry } from '@Nuvio-MCP/ide-debug/lib/browser/debug-session-contribution';
import { addEditorProviders } from '@Nuvio-MCP/ide-dev-tool/src/injector-editor';
import { IEditorDocumentModelService } from '@Nuvio-MCP/ide-editor/lib/browser';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor/src';
import { MainThreadConnection } from '@Nuvio-MCP/ide-extension/lib/browser/vscode/api/main.thread.connection';
import { MainThreadDebug } from '@Nuvio-MCP/ide-extension/lib/browser/vscode/api/main.thread.debug';
import { ExtHostAPIIdentifier } from '@Nuvio-MCP/ide-extension/lib/common/vscode';
import { IMessageService } from '@Nuvio-MCP/ide-overlay';
import { ITerminalApiService } from '@Nuvio-MCP/ide-terminal-next';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../../tools/dev-tool/src/mock-injector';

const map = new Map();

const rpcProtocol: IRPCProtocol = {
  getProxy: (key) => map.get(key),
  set: (key, value) => {
    map.set(key, value);
    return value;
  },
  get: (r) => map.get(r),
};

const mockExtThreadDebug = {
  $breakpointsDidChange: jest.fn(() => Disposable.create(() => {})),
  $sessionDidStart: jest.fn(() => Disposable.create(() => {})),
  $sessionDidDestroy: jest.fn(() => Disposable.create(() => {})),
  $sessionDidChange: jest.fn(() => Disposable.create(() => {})),
  $onSessionCustomEvent: jest.fn(() => Disposable.create(() => {})),
  $unregisterDebuggerContributions: jest.fn(() => Disposable.create(() => {})),
  $registerDebuggerContributions: jest.fn(() => Disposable.create(() => {})),
  $getTerminalCreationOptions: jest.fn(() => Disposable.create(() => {})),
};

const mockExtThreadConnection = {
  $createConnection: jest.fn(),
  $deleteConnection: jest.fn(),
  $sendMessage: jest.fn(),
};

const mockDebugSessionManager = {
  onDidStartDebugSession: jest.fn(() => Disposable.create(() => {})),
  onDidDestroyDebugSession: jest.fn(() => Disposable.create(() => {})),
  onDidChangeActiveDebugSession: jest.fn(() => Disposable.create(() => {})),
  onDidReceiveDebugSessionCustomEvent: jest.fn(() => Disposable.create(() => {})),
  getSession: jest.fn(),
  start: jest.fn(),
};

const mockDebugService = {
  debugContributionPoints: [
    [
      URI.file('/home/test').toString(),
      [
        {
          type: 'node',
          label: 'Node Debug',
        },
      ],
    ],
  ],
  onDidDebugContributionPointChange: jest.fn(() => Disposable.create(() => {})),
};

const mockDebugSessionContributionRegistry = {
  registerDebugSessionContribution: jest.fn(() => Disposable.create(() => {})),
};

const mockBreakpointManager = {
  onDidChangeBreakpoints: jest.fn(() => Disposable.create(() => {})),
  addBreakpoint: jest.fn(),
  findMarkers: jest.fn(),
  delBreakpoint: jest.fn(),
};

const mockDebugConsoleModelService = {
  debugConsoleSession: {
    append: jest.fn(),
    appendLine: jest.fn(),
  },
};

const mockDebugConfigurationManager = {
  all: [] as any,
};

const mockDebugServer = {
  registerDebugAdapterContribution: jest.fn(() => Disposable.create(() => {})),
};

const mockDebugModelManager = {
  resolve: jest.fn(),
};

describe('MainThreadDebug API Test Suite', () => {
  let injector: MockInjector;
  let mainThreadDebug: MainThreadDebug;
  let mainThreadConnection: MainThreadConnection;
  beforeAll(() => {
    jest.clearAllMocks();

    injector = createBrowserInjector([]);
    injector.addProviders(
      {
        token: BreakpointManager,
        useValue: mockBreakpointManager,
      },
      {
        token: IDebugSessionManager,
        useValue: mockDebugSessionManager,
      },
      {
        token: IDebugModelManager,
        useValue: mockDebugModelManager,
      },
      {
        token: IDebugService,
        useValue: mockDebugService,
      },
      {
        token: IDebugConsoleModelService,
        useValue: mockDebugConsoleModelService,
      },
      {
        token: ITerminalApiService,
        useValue: {},
      },
      {
        token: WorkbenchEditorService,
        useValue: {},
      },
      {
        token: DebugSessionContributionRegistry,
        useValue: mockDebugSessionContributionRegistry,
      },
      {
        token: IMessageService,
        useValue: {},
      },
      {
        token: IFileServiceClient,
        useValue: {},
      },
      {
        token: DebugPreferences,
        useValue: {},
      },
      {
        token: LabelService,
        useValue: {},
      },
      {
        token: DebugConfigurationManager,
        useValue: mockDebugConfigurationManager,
      },
      {
        token: IDebugServer,
        useValue: mockDebugServer,
      },
      {
        token: IEditorDocumentModelService,
        useValue: {},
      },
    );
    addEditorProviders(injector);

    rpcProtocol.set(ExtHostAPIIdentifier.ExtHostConnection, mockExtThreadConnection as any);
    rpcProtocol.set(ExtHostAPIIdentifier.ExtHostDebug, mockExtThreadDebug as any);

    mainThreadConnection = injector.get(MainThreadConnection, [rpcProtocol]);
    mainThreadDebug = injector.get(MainThreadDebug, [rpcProtocol, mainThreadConnection]);
  });

  afterAll(async () => {
    await injector.disposeAll();
  });

  it('MainThreadDebug can be initial correctly', () => {
    expect(mockBreakpointManager.onDidChangeBreakpoints).toHaveBeenCalledTimes(1);
    expect(mockDebugSessionManager.onDidStartDebugSession).toHaveBeenCalledTimes(1);
    expect(mockDebugSessionManager.onDidDestroyDebugSession).toHaveBeenCalledTimes(1);
    expect(mockDebugSessionManager.onDidChangeActiveDebugSession).toHaveBeenCalledTimes(1);
    expect(mockDebugSessionManager.onDidReceiveDebugSessionCustomEvent).toHaveBeenCalledTimes(1);
    expect(mockDebugService.onDidDebugContributionPointChange).toHaveBeenCalledTimes(1);
    expect(mockDebugSessionManager.onDidStartDebugSession).toHaveBeenCalledTimes(1);
    expect(mockExtThreadDebug.$registerDebuggerContributions).toHaveBeenCalledTimes(1);
    mockExtThreadDebug.$getTerminalCreationOptions.mockClear();
  });

  it('$appendToDebugConsole method should be work', () => {
    const value = 'test';
    mainThreadDebug.$appendToDebugConsole(value);
    expect(mockDebugConsoleModelService.debugConsoleSession.append).toHaveBeenCalledWith(value);
  });

  it('$appendLineToDebugConsole method should be work', () => {
    const value = 'test';
    mainThreadDebug.$appendLineToDebugConsole(value);
    expect(mockDebugConsoleModelService.debugConsoleSession.appendLine).toHaveBeenCalledWith(value);
  });

  it('$registerDebuggerContribution method should be work', async () => {
    // TODO: 这个 case 应该是在别的地方已经被调用过一次了，这里加个先检测为 1，然后调用一次，下一次检测是不是 2
    expect(mockDebugServer.registerDebugAdapterContribution).toHaveBeenCalledTimes(1);
    expect(mockDebugSessionContributionRegistry.registerDebugSessionContribution).toHaveBeenCalledTimes(1);

    await mainThreadDebug.$registerDebuggerContribution({
      type: 'node',
      label: 'Node Debug',
    });
    expect(mockExtThreadDebug.$getTerminalCreationOptions).toHaveBeenCalledTimes(1);
    expect(mockDebugServer.registerDebugAdapterContribution).toHaveBeenCalledTimes(2);
    expect(mockDebugSessionContributionRegistry.registerDebugSessionContribution).toHaveBeenCalledTimes(2);
  });

  it('$addBreakpoints method should be work', async () => {
    const breakpoints = [
      {
        id: 1,
        enabled: true,
        location: {
          uri: Uri.parse('/home/a.js'),
          range: {
            startLineNumber: 1,
            startColumn: 0,
            endLineNumber: 1,
            endColumn: 10,
          },
        },
      },
    ];
    mockBreakpointManager.findMarkers.mockClear();
    await mainThreadDebug.$addBreakpoints(breakpoints as any);
    expect(mockBreakpointManager.addBreakpoint).toHaveBeenCalledTimes(1);
    expect(mockBreakpointManager.findMarkers).toHaveBeenCalledTimes(1);
  });

  it('$removeBreakpoints method should be work', async () => {
    const breakpoints = [
      {
        id: 1,
        enabled: true,
      },
    ];
    mockBreakpointManager.findMarkers.mockReturnValueOnce([
      {
        data: {
          uri: URI.file('/home/a.js').toString(),
        },
      },
    ]);
    mockBreakpointManager.findMarkers.mockClear();
    await mainThreadDebug.$removeBreakpoints(breakpoints as any);
    expect(mockBreakpointManager.findMarkers).toHaveBeenCalledTimes(1);
  });

  it('$customRequest method should be work', async () => {
    const sendCustomRequest = jest.fn();
    mockDebugSessionManager.getSession.mockReturnValueOnce({
      sendCustomRequest,
    });
    await mainThreadDebug.$customRequest('1', 'source');
    expect(sendCustomRequest).toHaveBeenCalledTimes(1);
  });

  it('$getDebugProtocolBreakpoint method should be work', async () => {
    const getDebugProtocolBreakpoint = jest.fn();
    mockDebugSessionManager.getSession.mockReturnValueOnce({
      getDebugProtocolBreakpoint,
    });
    await mainThreadDebug.$getDebugProtocolBreakpoint('1', '1');
    expect(getDebugProtocolBreakpoint).toHaveBeenCalledTimes(1);
  });

  it('$startDebugging method should be work', async () => {
    mockDebugConfigurationManager.all.push({
      configuration: {
        name: 'test',
        configuration: {},
      },
    });
    await mainThreadDebug.$startDebugging(undefined, 'test', {});
    expect(mockDebugSessionManager.start).toHaveBeenCalledTimes(1);
  });

  it('$unregisterDebuggerContribution method should be work', () => {
    mainThreadDebug.$unregisterDebuggerContribution({
      type: 'node',
      label: 'Node Debug',
    });
  });
});
