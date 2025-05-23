import { CommandService, IContextKeyService, WORKSPACE_COMMANDS } from '@Nuvio-MCP/ide-core-browser';
import { MockContextKeyService } from '@Nuvio-MCP/ide-core-browser/__mocks__/context-key';
import { URI } from '@Nuvio-MCP/ide-core-common';
import { IWindowDialogService } from '@Nuvio-MCP/ide-overlay';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../../tools/dev-tool/src/mock-injector';
import { WorkspaceModule } from '../../src/browser';
import { WorkspaceContribution } from '../../src/browser/workspace-contribution';
import { IWorkspaceService } from '../../src/common';

describe('WorkspaceContribution should be work', () => {
  let workspaceContribution: WorkspaceContribution;
  let injector: MockInjector;
  const mockWorkspaceService = {
    getWorkspaceRootUri: jest.fn(),
    whenReady: Promise.resolve(),
    onWorkspaceChanged: jest.fn(),
    onWorkspaceLocationChanged: jest.fn(),
    save: jest.fn(),
    addRoot: jest.fn(),
    init: jest.fn(),
    tryGetRoots: jest.fn(() => []),
    isMultiRootWorkspaceOpened: true,
  };

  const mockCommandService = {
    executeCommand: jest.fn(),
  };
  const mockWindowDialogService = {
    showOpenDialog: jest.fn(() => [URI.file('/userhome/folder').toString()]),
    showSaveDialog: jest.fn(() => URI.file('/userhome/folder').toString()),
  };
  beforeEach(async () => {
    injector = createBrowserInjector([WorkspaceModule]);
    injector.overrideProviders({
      token: IContextKeyService,
      useClass: MockContextKeyService,
    });
    injector.overrideProviders({
      token: CommandService,
      useValue: mockCommandService,
    });
    injector.overrideProviders({
      token: IWorkspaceService,
      useValue: mockWorkspaceService,
    });
    injector.overrideProviders({
      token: IWindowDialogService,
      useValue: mockWindowDialogService,
    });

    workspaceContribution = injector.get(WorkspaceContribution);
  });

  afterEach(async () => {
    await injector.disposeAll();
    mockWorkspaceService.getWorkspaceRootUri.mockReset();
  });

  it('ClientAppContribution should be work', async () => {
    await workspaceContribution.onStart();
    expect(mockWorkspaceService.onWorkspaceLocationChanged).toHaveBeenCalledTimes(1);
  });

  it('CommandContribution should be work', (done) => {
    const mockRegistry = {
      registerCommand: jest.fn(async (command, { execute }) => {
        if (command.id === WORKSPACE_COMMANDS.ADD_WORKSPACE_FOLDER.id) {
          await execute();
          expect(mockWorkspaceService.addRoot).toHaveBeenCalledTimes(1);
        } else if (command.id === WORKSPACE_COMMANDS.SAVE_WORKSPACE_AS_FILE.id) {
          await execute();
          expect(mockWorkspaceService.save).toHaveBeenCalledTimes(1);
          done();
        }
      }),
    };
    workspaceContribution.registerCommands(mockRegistry as any);
    expect(mockRegistry.registerCommand).toHaveBeenCalledTimes(3);
  });

  it('FsProviderContribution should be work', () => {
    workspaceContribution.onFileServiceReady();
    expect(mockWorkspaceService.init).toHaveBeenCalledTimes(1);
  });
});
