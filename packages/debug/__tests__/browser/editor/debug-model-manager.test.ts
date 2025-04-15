import { Disposable, IContextKeyService, QuickPickService } from '@Nuvio-MCP/ide-core-browser';
import { DebugModelFactory, IDebugServer } from '@Nuvio-MCP/ide-debug';
import { BreakpointManager } from '@Nuvio-MCP/ide-debug/lib/browser/breakpoint';
import { DebugConfigurationManager } from '@Nuvio-MCP/ide-debug/lib/browser/debug-configuration-manager';
import { DebugPreferences } from '@Nuvio-MCP/ide-debug/lib/browser/debug-preferences';
import { DebugModelManager } from '@Nuvio-MCP/ide-debug/lib/browser/editor';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { EditorCollectionService, WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { IEditorDocumentModelService } from '@Nuvio-MCP/ide-editor/lib/browser';
import { IFileServiceClient } from '@Nuvio-MCP/ide-file-service';
import { IWorkspaceService, IWorkspaceStorageService } from '@Nuvio-MCP/ide-workspace';

describe('Debug Model Manager', () => {
  const mockInjector = createBrowserInjector([]);
  let debugModelManager: DebugModelManager;

  const mockEditorCollectionService = {
    onCodeEditorCreate: jest.fn(() => Disposable.create(() => {})),
  };

  const mockBreakpointManager = {
    onDidChangeBreakpoints: jest.fn(() => Disposable.create(() => {})),
  };

  beforeAll(() => {
    mockInjector.overrideProviders({
      token: EditorCollectionService,
      useValue: mockEditorCollectionService,
    });

    mockInjector.overrideProviders({
      token: BreakpointManager,
      useValue: mockBreakpointManager,
    });

    mockInjector.overrideProviders({
      token: WorkbenchEditorService,
      useValue: {},
    });

    mockInjector.overrideProviders({
      token: DebugConfigurationManager,
      useValue: {},
    });

    mockInjector.overrideProviders({
      token: DebugModelFactory,
      useValue: {},
    });

    mockInjector.overrideProviders({
      token: IFileServiceClient,
      useValue: {},
    });

    mockInjector.overrideProviders({
      token: IWorkspaceStorageService,
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
      token: DebugPreferences,
      useValue: {},
    });

    mockInjector.overrideProviders({
      token: QuickPickService,
      useValue: {},
    });

    mockInjector.overrideProviders({
      token: IContextKeyService,
      useValue: {},
    });

    mockInjector.overrideProviders({
      token: IEditorDocumentModelService,
      useValue: {},
    });

    debugModelManager = mockInjector.get(DebugModelManager);
  });

  afterAll(() => {});

  it('debugModelManager should be init success', () => {
    debugModelManager.init();
    expect(mockEditorCollectionService.onCodeEditorCreate).toHaveBeenCalledTimes(1);
    expect(mockBreakpointManager.onDidChangeBreakpoints).toHaveBeenCalledTimes(1);
  });

  it('should have enough API', () => {
    expect(typeof debugModelManager.init).toBe('function');
    expect(typeof debugModelManager.dispose).toBe('function');
    expect(typeof debugModelManager.resolve).toBe('function');
    expect(typeof debugModelManager.handleMouseEvent).toBe('function');
  });
});
