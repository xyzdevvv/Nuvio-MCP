import {
  Disposable,
  FileStat,
  IContextKeyService,
  PreferenceService,
  QuickPickService,
  StorageProvider,
  URI,
} from '@Nuvio-MCP/ide-core-browser';
import { IDebugServer } from '@Nuvio-MCP/ide-debug';
import { DebugConfigurationManager } from '@Nuvio-MCP/ide-debug/lib/browser/debug-configuration-manager';
import { DebugPreferences } from '@Nuvio-MCP/ide-debug/lib/browser/debug-preferences';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { IEditorDocumentModelService } from '@Nuvio-MCP/ide-editor/lib/browser';
import { IFileServiceClient } from '@Nuvio-MCP/ide-file-service';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { MockContextKeyService } from '../../../monaco/__mocks__/monaco.context-key.service';

describe('Debug Configuration Manager', () => {
  const mockInjector = createBrowserInjector([]);
  let debugConfigurationManager: DebugConfigurationManager;
  const root = URI.file('home/test');
  const rootFileStat: FileStat = {
    uri: root.toString(),
    isDirectory: true,
    lastModification: new Date().getTime(),
  };

  const mockWorkspaceService = {
    roots: Promise.resolve([rootFileStat]),
    getWorkspaceRootUri: jest.fn(() => root),
  };

  const mockMonacoEditorModel = {
    getLineLastNonWhitespaceColumn: jest.fn(),
    getPositionAt: jest.fn(() => 1),
    getValue: jest.fn(
      () => `{
      "version": "0.2.0",
      "configurations": [`,
    ),
  };

  const mockMonacoEditor = {
    _commandService: {
      executeCommand: jest.fn(),
    },
    getModel: () => mockMonacoEditorModel,
    setPosition: jest.fn(),
    getValue: () =>
      JSON.stringify({
        configUri: root.resolve('.sumi/launch.json'),
        value: {
          version: '0.2.0',
          configurations: [
            {
              type: 'node',
              request: 'attach',
              name: 'Attach to BackEnd',
              port: 9999,
              restart: true,
            },
          ],
        },
      }),
    trigger: jest.fn(),
  };

  const mockWorkbenchEditorService = {
    open: jest.fn(() => ({
      group: {
        codeEditor: {
          monacoEditor: mockMonacoEditor,
        },
      },
    })),
  };

  const mockPreferenceService = {
    onPreferenceChanged: jest.fn(() => Disposable.create(() => {})),
    resolve: jest.fn(() => ({
      configUri: root.resolve('.sumi/launch.json'),
      value: {
        version: '0.2.0',
        configurations: [
          {
            type: 'node',
            request: 'attach',
            name: 'Attach to BackEnd',
            port: 9999,
            restart: true,
          },
        ],
      },
    })),
  };

  const mockDebugServer = {
    debugTypes: jest.fn(() => ['node']),
  };

  const mockFileServiceClient = {
    createFile: jest.fn(),
    setContent: jest.fn(),
  };

  const mockDebugStorage = {
    get: jest.fn((key) => {
      if (key === 'configurations') {
        return {
          current: {
            name: 'Attach to BackEnd',
            index: 0,
            workspaceFolderUri: root.toString(),
          },
        };
      } else if (key === 'recentDynamicConfigurations') {
        return [];
      }
    }),
    set: jest.fn(),
  };

  const mockDebugPreferences = {
    'preference.debug.allowBreakpointsEverywhere': true,
  };

  beforeAll(async () => {
    mockInjector.overrideProviders({
      token: IContextKeyService,
      useClass: MockContextKeyService,
    });

    mockInjector.overrideProviders({
      token: IWorkspaceService,
      useValue: mockWorkspaceService,
    });

    mockInjector.overrideProviders({
      token: PreferenceService,
      useValue: mockPreferenceService,
    });

    mockInjector.overrideProviders({
      token: WorkbenchEditorService,
      useValue: mockWorkbenchEditorService,
    });

    mockInjector.overrideProviders({
      token: IDebugServer,
      useValue: mockDebugServer,
    });

    mockInjector.overrideProviders({
      token: QuickPickService,
      useValue: {},
    });

    mockInjector.overrideProviders({
      token: IFileServiceClient,
      useValue: mockFileServiceClient,
    });

    mockInjector.overrideProviders({
      token: DebugPreferences,
      useValue: mockDebugPreferences,
    });

    mockInjector.overrideProviders({
      token: StorageProvider,
      useValue: () => mockDebugStorage,
    });

    mockInjector.overrideProviders({
      token: IEditorDocumentModelService,
      useValue: {
        createModelReference: (uri) => ({
          instance: {
            uri,
            getMonacoModel: () => ({
              getValue: jest.fn(() => ''),
            }),
          },
          dispose: jest.fn(),
        }),
      },
    });

    debugConfigurationManager = mockInjector.get(DebugConfigurationManager);

    await debugConfigurationManager.whenReady;
  });

  afterAll(() => {});

  it('debugModelManager should be init success', () => {
    expect(mockPreferenceService.onPreferenceChanged).toHaveBeenCalledTimes(2);
  });

  it('should have enough API', () => {
    expect(typeof debugConfigurationManager.supported).toBe('object');
    expect(typeof debugConfigurationManager.find).toBe('function');
    expect(typeof debugConfigurationManager.openConfiguration).toBe('function');
    expect(typeof debugConfigurationManager.addConfiguration).toBe('function');
    expect(typeof debugConfigurationManager.load).toBe('function');
    expect(typeof debugConfigurationManager.save).toBe('function');
    expect(typeof debugConfigurationManager.canSetBreakpointsIn).toBe('function');
    expect(typeof debugConfigurationManager.addSupportBreakpoints).toBe('function');
    expect(typeof debugConfigurationManager.removeSupportBreakpoints).toBe('function');
    expect(typeof debugConfigurationManager.registerDebugger).toBe('function');
    expect(typeof debugConfigurationManager.registerDebugger).toBe('function');
    expect(typeof debugConfigurationManager.getDebuggers).toBe('function');
    expect(typeof debugConfigurationManager.getDebugger).toBe('function');
  });

  it('find method should be work', () => {
    const configuration = debugConfigurationManager.find('Attach to BackEnd', root.toString());
    expect(configuration).toBeDefined();
    expect(configuration!.workspaceFolderUri).toBe(root.toString());
  });

  it('getSupported method should be work', async () => {
    const support = await debugConfigurationManager.supported;
    expect(support).toBeDefined();
    expect(support.length).toBe(1);
  });

  it('openConfiguration method should be work', async () => {
    await debugConfigurationManager.openConfiguration();
    expect(mockWorkbenchEditorService.open).toHaveBeenCalledTimes(1);
  });

  it('addConfiguration method should be work', async () => {
    await debugConfigurationManager.addConfiguration();
    expect(mockMonacoEditorModel.getLineLastNonWhitespaceColumn).toHaveBeenCalledTimes(2);
    expect(mockMonacoEditor.setPosition).toHaveBeenCalledTimes(1);
    expect(mockMonacoEditor.trigger).toHaveBeenCalledTimes(2);
  });

  it('load method should be work', async () => {
    await debugConfigurationManager.load();
    expect(mockDebugStorage.get.mock.calls.length).toBeGreaterThan(0);
  });

  it('save method should be work', async () => {
    await debugConfigurationManager.save();
    expect(mockDebugStorage.set).toHaveBeenCalledTimes(1);
  });

  it('canSetBreakpointsIn method should be work', () => {
    // jsonc
    let mockGetLanguageIdentifier = jest.fn(() => ({ language: 'jsonc' }));
    let expected = debugConfigurationManager.canSetBreakpointsIn({
      getLanguageIdentifier: mockGetLanguageIdentifier,
      getLanguageId: () => 'jsonc',
    } as any);
    expect(expected).toBeFalsy();
    // log
    mockGetLanguageIdentifier = jest.fn(() => ({ language: 'log' }));
    expected = debugConfigurationManager.canSetBreakpointsIn({
      getLanguageIdentifier: mockGetLanguageIdentifier,
      getLanguageId: () => 'log',
    } as any);
    expect(expected).toBeFalsy();
    // undefined model
    expected = debugConfigurationManager.canSetBreakpointsIn(null as any);
    expect(expected).toBeFalsy();
    // if allowBreakpointsEverywhere = true
    mockGetLanguageIdentifier = jest.fn(() => ({ language: 'c' }));
    expected = debugConfigurationManager.canSetBreakpointsIn({
      getLanguageIdentifier: mockGetLanguageIdentifier,
      getLanguageId: () => 'c',
    } as any);
    expect(expected).toBeTruthy();
    // if allowBreakpointsEverywhere = false
    mockDebugPreferences['preference.debug.allowBreakpointsEverywhere'] = false;
    mockGetLanguageIdentifier = jest.fn(() => ({ language: 'c' }));
    expected = debugConfigurationManager.canSetBreakpointsIn({
      getLanguageIdentifier: mockGetLanguageIdentifier,
      getLanguageId: () => 'c',
    } as any);
    expect(expected).toBeFalsy();
    // while debug server support node language
    debugConfigurationManager.addSupportBreakpoints('node');
    mockGetLanguageIdentifier = jest.fn(() => ({ language: 'node' }));
    expected = debugConfigurationManager.canSetBreakpointsIn({
      getLanguageIdentifier: mockGetLanguageIdentifier,
      getLanguageId: () => 'node',
    } as any);
    expect(expected).toBeTruthy();
  });

  it('addSupportBreakpoints method should be work', () => {
    const mockGetLanguageIdentifier = jest.fn(() => ({ language: 'abc' }));
    debugConfigurationManager.addSupportBreakpoints('abc');
    const expected = debugConfigurationManager.canSetBreakpointsIn({
      getLanguageIdentifier: mockGetLanguageIdentifier,
      getLanguageId: () => 'abc',
    } as any);
    expect(expected).toBeTruthy();
  });

  it('removeSupportBreakpoints method should be work', () => {
    const mockGetLanguageIdentifier = jest.fn(() => ({ language: 'abc' }));
    debugConfigurationManager.removeSupportBreakpoints('abc');
    const expected = debugConfigurationManager.canSetBreakpointsIn({
      getLanguageIdentifier: mockGetLanguageIdentifier,
      getLanguageId: () => 'abc',
    } as any);
    expect(expected).toBeFalsy();
  });

  it('registerDebugger/getDebugger/getDebuggers method should be work', () => {
    const debugContribution = {
      type: 'node',
    };
    debugConfigurationManager.registerDebugger(debugContribution);

    const contribute = debugConfigurationManager.getDebugger('node');
    expect(contribute).toEqual(debugContribution);

    const contributes = debugConfigurationManager.getDebuggers();
    expect(contributes.length).toBe(1);
  });
});
