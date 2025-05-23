import { WSChannelHandler } from '@Nuvio-MCP/ide-connection/lib/browser/ws-channel-handler';
import {
  CommandRegistry,
  CommandService,
  IClientApp,
  IClipboardService,
  OperatingSystem,
  URI,
  Uri,
  isLinux,
  isWindows,
} from '@Nuvio-MCP/ide-core-browser';
import { IApplicationService, uuid } from '@Nuvio-MCP/ide-core-common';
import { IFileTreeService } from '@Nuvio-MCP/ide-file-tree-next';
import { FileTreeContribution } from '@Nuvio-MCP/ide-file-tree-next/lib/browser/file-tree-contribution';
import { PreferenceContribution } from '@Nuvio-MCP/ide-preferences/lib/browser/preference-contribution';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { MockInjector, mockService } from '../../../../tools/dev-tool/src/mock-injector';
import { ExtensionNodeServiceServerPath, IExtensionNodeClientService } from '../../src';
import { ExtensionClientAppContribution, ExtensionCommandContribution } from '../../src/browser/extension.contribution';

import { setupExtensionServiceInjector } from './extension-service/extension-service-mock-helper';

describe('extension browser test', () => {
  let injector: MockInjector;
  let commandService: CommandService;
  let extensionClientAppContribution: ExtensionClientAppContribution;
  let extensionCommandContribution: ExtensionCommandContribution;

  beforeEach(() => {
    injector = setupExtensionServiceInjector();
    injector.overrideProviders(
      ExtensionClientAppContribution,
      ExtensionCommandContribution,
      PreferenceContribution,
      FileTreeContribution,
      {
        token: IClipboardService,
        useValue: mockService({
          writeText: jest.fn(),
          readText: jest.fn(),
        }),
      },
      {
        token: IClientApp,
        useValue: mockService({
          fireOnReload: jest.fn(),
        }),
      },
      {
        token: IFileTreeService,
        useValue: mockService({
          isMultipleWorkspace: false,
        }),
      },
      {
        token: IWorkspaceService,
        useValue: mockService({
          workspace: {
            uri: URI.file('/home/admin/workspace'),
          },
        }),
      },
      {
        token: ExtensionNodeServiceServerPath,
        useValue: mockService({
          disposeClientExtProcess: jest.fn(),
        }),
      },
      {
        token: WSChannelHandler,
        useValue: mockService({
          clientId: uuid(),
        }),
      },
      {
        token: IApplicationService,
        useValue: {
          backendOS: isWindows ? OperatingSystem.Windows : isLinux ? OperatingSystem.Linux : OperatingSystem.Macintosh,
        },
      },
    );
    const commandRegistry = injector.get<CommandRegistry>(CommandRegistry);
    extensionClientAppContribution = injector.get(ExtensionClientAppContribution);
    extensionCommandContribution = injector.get(ExtensionCommandContribution);
    const fileTreeContribution = injector.get(FileTreeContribution);
    const preferenceContribution = injector.get(PreferenceContribution);
    extensionCommandContribution.registerCommands(commandRegistry);
    fileTreeContribution.registerCommands(commandRegistry);

    preferenceContribution.registerCommands(commandRegistry);
    commandService = injector.get<CommandService>(CommandService);
    injector.mockCommand('editor.openUri', () => {});
  });

  afterEach(async () => {
    await injector.disposeAll();
  });

  it('execute workbench.action.reloadWindow command', async () => {
    const clientApp = injector.get<IClientApp>(IClientApp);
    await commandService.executeCommand('workbench.action.reloadWindow');
    expect(clientApp.fireOnReload).toHaveBeenCalled();
  });

  it('execute copyFilePath command', async () => {
    const clipboardService = injector.get<IClipboardService>(IClipboardService);
    await commandService.executeCommand('copyFilePath', Uri.file('/home/admin/workspace/a.ts'));
    expect(clipboardService.writeText).toHaveBeenCalled();
    expect(clipboardService.writeText).toHaveBeenCalledWith('/home/admin/workspace/a.ts');
  });

  it('execute copyRelativeFilePath command', async () => {
    const clipboardService = injector.get<IClipboardService>(IClipboardService);
    await commandService.executeCommand('copyRelativeFilePath', Uri.file('/home/admin/workspace/a.ts'));
    expect(clipboardService.writeText).toHaveBeenCalled();
    expect(clipboardService.writeText).toHaveBeenCalledWith('a.ts');
  });

  it('close page expects disposeClientExtProcess to be called', () => {
    const extensionNodeClientService = injector.get<IExtensionNodeClientService>(ExtensionNodeServiceServerPath);
    // trigger close
    extensionClientAppContribution.onDisposeSideEffects();
    expect(extensionNodeClientService.disposeClientExtProcess).toHaveBeenCalled();
  });

  it('workbench.action.openSettings', (done) => {
    const commandRegistry = injector.get<CommandRegistry>(CommandRegistry);
    const dispose = commandRegistry.beforeExecuteCommand((command, args) => {
      expect(command).toBe('core.openpreference');
      dispose.dispose();
      done();
      return args;
    });
    commandService.executeCommand('workbench.action.openSettings');
  });
});
