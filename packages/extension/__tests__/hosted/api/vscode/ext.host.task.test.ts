import path from 'path';

import { WSChannelHandler } from '@Nuvio-MCP/ide-connection/lib/browser';
import { MockedStorageProvider } from '@Nuvio-MCP/ide-core-browser/__mocks__/storage';
import {
  Deferred,
  Disposable,
  Emitter as EventEmitter,
  IFileServiceClient,
  StorageProvider,
  Uri,
} from '@Nuvio-MCP/ide-core-common';
import { ITaskDefinitionRegistry, TaskDefinitionRegistryImpl } from '@Nuvio-MCP/ide-core-common/lib/task-definition';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { mockService } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';
import { IEditorDocumentModelService, WorkbenchEditorService } from '@Nuvio-MCP/ide-editor/lib/browser';
import { ExtensionDocumentDataManagerImpl } from '@Nuvio-MCP/ide-extension/lib/hosted/api/vscode/doc';
import { ExtHostMessage } from '@Nuvio-MCP/ide-extension/lib/hosted/api/vscode/ext.host.message';
import { ExtHostWorkspace } from '@Nuvio-MCP/ide-extension/lib/hosted/api/vscode/ext.host.workspace';
import { MockFileServiceClient } from '@Nuvio-MCP/ide-file-service/__mocks__/file-service-client';
import { IMainLayoutService } from '@Nuvio-MCP/ide-main-layout/lib/common/main-layout.definition';
import { OutputPreferences } from '@Nuvio-MCP/ide-output/lib/browser/output-preference';
import { TaskService } from '@Nuvio-MCP/ide-task/lib/browser/task.service';
import { TerminalTaskSystem } from '@Nuvio-MCP/ide-task/lib/browser/terminal-task-system';
import { ITaskService, ITaskSystem } from '@Nuvio-MCP/ide-task/lib/common';
import {
  ITerminalApiService,
  ITerminalClientFactory2,
  ITerminalController,
  ITerminalGroupViewService,
  ITerminalInternalService,
  ITerminalProfileInternalService,
  ITerminalProfileService,
  ITerminalService,
  ITerminalTheme,
} from '@Nuvio-MCP/ide-terminal-next';
import {
  MockMainLayoutService,
  MockTerminalProfileInternalService,
  MockTerminalService,
  MockTerminalThemeService,
} from '@Nuvio-MCP/ide-terminal-next/__tests__/browser/mock.service';
import { createTerminalClientFactory2 } from '@Nuvio-MCP/ide-terminal-next/lib/browser/terminal.client';
import { TerminalController } from '@Nuvio-MCP/ide-terminal-next/lib/browser/terminal.controller';
import { TerminalEnvironmentService } from '@Nuvio-MCP/ide-terminal-next/lib/browser/terminal.environment.service';
import { TerminalInternalService } from '@Nuvio-MCP/ide-terminal-next/lib/browser/terminal.internal.service';
import { TerminalPreference } from '@Nuvio-MCP/ide-terminal-next/lib/browser/terminal.preference';
import { TerminalProfileService } from '@Nuvio-MCP/ide-terminal-next/lib/browser/terminal.profile';
import { TerminalGroupViewService } from '@Nuvio-MCP/ide-terminal-next/lib/browser/terminal.view';
import { EnvironmentVariableServiceToken } from '@Nuvio-MCP/ide-terminal-next/lib/common/environmentVariable';
import { ITerminalPreference } from '@Nuvio-MCP/ide-terminal-next/lib/common/preference';
import { IVariableResolverService } from '@Nuvio-MCP/ide-variable';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { mockExtensionProps } from '../../../../__mocks__/extensions';
import { createMockPairRPCProtocol } from '../../../../__mocks__/initRPCProtocol';
import { MainThreadTasks } from '../../../../src/browser/vscode/api/main.thread.tasks';
import { MainThreadTerminal } from '../../../../src/browser/vscode/api/main.thread.terminal';
import { ExtHostAPIIdentifier, MainThreadAPIIdentifier } from '../../../../src/common/vscode';
import { ExtHostTerminal } from '../../../../src/hosted/api/vscode/ext.host.terminal';
import { ExtHostTasks } from '../../../../src/hosted/api/vscode/tasks/ext.host.tasks';
import { MockEnvironmentVariableService } from '../../__mocks__/environmentVariableService';

import { CustomBuildTaskProvider } from './__mock__/taskProvider';

const extension = mockExtensionProps;

const { rpcProtocolExt, rpcProtocolMain } = createMockPairRPCProtocol();

let extHostTask: ExtHostTasks;
let extHostTerminal: ExtHostTerminal;
let mainThreadTerminal: MainThreadTerminal;
let mainThreadTask: MainThreadTasks;

describe('ExtHostTask API', () => {
  const injector = createBrowserInjector([]);

  injector.addProviders(
    {
      token: ITerminalApiService,
      useValue: mockService({
        terminals: [],
        onDidChangeActiveTerminal: () => Disposable.NULL,
        onDidCloseTerminal: () => Disposable.NULL,
        onDidOpenTerminal: () => Disposable.NULL,
        onDidTerminalTitleChange: () => Disposable.NULL,
        createTerminal: (options) => ({
          id: options.name,
        }),
      }),
    },
    {
      token: IVariableResolverService,
      useValue: {
        resolve: () => '',
      },
    },
    {
      token: ITerminalProfileInternalService,
      useValue: {
        resolveDefaultProfile: jest.fn(() => ({
          profileName: 'bash',
          path: '/local/bin/bash',
          isDefault: true,
        })),
      },
    },
    {
      token: ITerminalService,
      useValue: new MockTerminalService(),
    },
    {
      token: ITerminalInternalService,
      useClass: TerminalInternalService,
    },
    {
      token: WSChannelHandler,
      useValue: {
        openChannel: jest.fn(),
        clientId: 'test_connection',
      },
    },
    {
      token: EnvironmentVariableServiceToken,
      useClass: TerminalEnvironmentService,
    },
    {
      token: ITerminalProfileService,
      useClass: TerminalProfileService,
    },
    {
      token: StorageProvider,
      useValue: MockedStorageProvider,
    },
    {
      token: ITaskService,
      useClass: TaskService,
    },
    {
      token: ITerminalClientFactory2,
      useFactory:
        (injector) =>
        (widget, options = {}) =>
          createTerminalClientFactory2(injector)(widget, options),
    },
    {
      token: ITaskSystem,
      useClass: TerminalTaskSystem,
    },
    {
      token: ITerminalGroupViewService,
      useClass: TerminalGroupViewService,
    },
    {
      token: OutputPreferences,
      useValue: {
        'output.logWhenNoPanel': true,
      },
    },
    {
      token: IWorkspaceService,
      useValue: {
        tryGetRoots: () => [{ uri: __dirname }],
        getWorkspaceName: () => 'Test Workspace',
        getWorkspaceFolder: (uri) => ({ uri, name: 'Test Workspace' }),
      },
    },
    {
      token: ITaskDefinitionRegistry,
      useClass: TaskDefinitionRegistryImpl,
    },
    {
      token: WorkbenchEditorService,
      useValue: {},
    },
    {
      token: IFileServiceClient,
      useClass: MockFileServiceClient,
    },
    {
      token: ITerminalTheme,
      useValue: new MockTerminalThemeService(),
    },
    {
      token: ITerminalPreference,
      useClass: TerminalPreference,
    },
    {
      token: ITerminalController,
      useClass: TerminalController,
    },
    {
      token: IEditorDocumentModelService,
      useValue: {
        getModelReference: jest.fn(() => ({
          instance: {
            dirty: false,
          },
          dispose: () => {},
        })),
        createModelReference: (uri) =>
          Promise.resolve({
            instance: {
              uri,
              getMonacoModel: () => ({
                onDidChangeContent: new EventEmitter().event,
                uri,
                setValue: () => {},
              }),
            },
            dispose: jest.fn(),
          }),
      },
    },
    {
      token: IMainLayoutService,
      useValue: new MockMainLayoutService(),
    },
    {
      token: ITerminalProfileInternalService,
      useValue: new MockTerminalProfileInternalService(),
    },
    {
      token: EnvironmentVariableServiceToken,
      useValue: MockEnvironmentVariableService,
    },
  );

  const extHostMessage = rpcProtocolExt.set(ExtHostAPIIdentifier.ExtHostMessage, new ExtHostMessage(rpcProtocolExt));
  const extHostDocs = rpcProtocolExt.set(
    ExtHostAPIIdentifier.ExtHostDocuments,
    injector.get(ExtensionDocumentDataManagerImpl, [rpcProtocolExt]),
  );
  const extHostWorkspace = new ExtHostWorkspace(rpcProtocolExt, extHostMessage, extHostDocs);

  extHostTerminal = new ExtHostTerminal(rpcProtocolExt);
  rpcProtocolExt.set(ExtHostAPIIdentifier.ExtHostTerminal, extHostTerminal);
  extHostTask = new ExtHostTasks(rpcProtocolExt, extHostTerminal, extHostWorkspace);
  mainThreadTerminal = injector.get(MainThreadTerminal, [rpcProtocolMain]);
  mainThreadTask = injector.get(MainThreadTasks, [rpcProtocolMain]);

  rpcProtocolExt.set(ExtHostAPIIdentifier.ExtHostTasks, extHostTask);
  rpcProtocolMain.set(MainThreadAPIIdentifier.MainThreadTerminal, mainThreadTerminal);
  rpcProtocolMain.set(MainThreadAPIIdentifier.MainThreadTasks, mainThreadTask);
  extHostTask.registerTaskProvider(
    'custombuildscript',
    new CustomBuildTaskProvider(path.join(__dirname, 'test')),
    extension,
  );

  const taskService: ITaskService = injector.get(ITaskService);
  const taskDefinition: ITaskDefinitionRegistry = injector.get(ITaskDefinitionRegistry);
  taskDefinition.register('custombuildscript', {
    extensionId: extension.id,
    taskType: 'custombuildscript',
    required: [],
    properties: {},
  });

  extHostWorkspace['folders'] = [{ uri: Uri.file(__dirname), name: 'Test Workspace', index: 0 }];

  it('register custombuildscript taskProvider', async () => {
    expect(mainThreadTask['providers'].size).toBe(1);
    const taskHandler = mainThreadTask['providers'].get(1);
    expect(taskHandler).toBeDefined();
  });

  it('provide tasks', async () => {
    const taskHandler = mainThreadTask['providers'].get(1);
    const taskSet = await taskHandler?.provider.provideTasks({ custombuildscript: true });
    expect(taskSet).toBeDefined();
    expect(taskSet?.type).toBe('custombuildscript');
    expect(taskSet?.tasks.length).toBe(6);
  });

  it('run custombuild task', async () => {
    expect.assertions(2);

    const defered = new Deferred();
    extHostTask.onDidStartTask((e) => {
      expect(e.execution.task.definition.type).toBe('custombuildscript');
      expect(e.execution.task.name).toBe('32 watch incremental');
      defered.resolve();
    });

    const taskSet = await taskService['getGroupedTasks']();
    taskService.run(taskSet[0].tasks[0]);

    await defered.promise;
  });
});
