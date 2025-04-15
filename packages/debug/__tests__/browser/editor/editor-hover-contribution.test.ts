import {
  Disposable,
  IContextKeyService,
  IFileServiceClient,
  MonacoOverrideServiceRegistry,
  QuickPickService,
} from '@Nuvio-MCP/ide-core-browser';
import { DebugModelFactory, IDebugModelManager, IDebugServer } from '@Nuvio-MCP/ide-debug';
import { DebugPreferences } from '@Nuvio-MCP/ide-debug/lib/browser/debug-preferences';
import { DebugEditorContribution } from '@Nuvio-MCP/ide-debug/lib/browser/editor/debug-editor-contribution';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { IDebugSessionManager } from './../../../src/common/debug-session';

describe('Editor Hover Contribution', () => {
  const mockInjector = createBrowserInjector([]);
  let contribution: DebugEditorContribution;

  const mockContextKeyService = {
    onDidChangeContext: jest.fn(() => Disposable.create(() => {})),
  };
  beforeAll(() => {
    mockInjector.overrideProviders(
      {
        token: IContextKeyService,
        useValue: mockContextKeyService,
      },
      {
        token: WorkbenchEditorService,
        useValue: {},
      },
      {
        token: DebugModelFactory,
        useValue: {},
      },
      {
        token: IFileServiceClient,
        useValue: {},
      },
      {
        token: IWorkspaceService,
        useValue: {},
      },
      {
        token: IDebugServer,
        useValue: {},
      },
      {
        token: IDebugModelManager,
        useValue: {},
      },
      {
        token: QuickPickService,
        useValue: {},
      },
      {
        token: DebugPreferences,
        useValue: {},
      },
      {
        token: IDebugSessionManager,
        useValue: {
          onDidChangeActiveDebugSession: jest.fn(() => Disposable.create(() => {})),
          onDidDestroyDebugSession: jest.fn(() => Disposable.create(() => {})),
        },
      },
      {
        token: MonacoOverrideServiceRegistry,
        useValue: {},
      },
    );

    contribution = mockInjector.get(DebugEditorContribution);
  });

  it('should have enough API', () => {
    expect(typeof contribution.contribute).toBe('function');
    expect(typeof contribution.setHoverEnabled).toBe('function');
  });

  it('contribute method should be work', () => {
    const mockEditor = {
      monacoEditor: {
        updateOptions: jest.fn(),
        onKeyDown: jest.fn(() => Disposable.create(() => {})),
        onKeyUp: jest.fn(() => Disposable.create(() => {})),
        onDidChangeModelContent: jest.fn(() => Disposable.create(() => {})),
        onDidChangeModel: jest.fn(() => Disposable.create(() => {})),
        removeDecorations: jest.fn(() => Disposable.create(() => {})),
        getVisibleRanges: jest.fn(() => Disposable.create(() => {})),
        getModel: jest.fn(() => Disposable.create(() => {})),
        setDecorations: jest.fn(() => Disposable.create(() => {})),
      },
    };
    contribution.contribute(mockEditor as any);
    expect(mockContextKeyService.onDidChangeContext).toHaveBeenCalledTimes(0);
  });
});
