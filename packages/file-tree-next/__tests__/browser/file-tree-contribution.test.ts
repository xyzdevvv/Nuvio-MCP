import {
  IApplicationService,
  IClipboardService,
  IContextKeyService,
  OS,
  PreferenceService,
  QuickOpenService,
} from '@Nuvio-MCP/ide-core-browser';
import { Emitter, URI } from '@Nuvio-MCP/ide-core-browser';
import { MockContextKeyService } from '@Nuvio-MCP/ide-core-browser/__mocks__/context-key';
import { IDecorationsService } from '@Nuvio-MCP/ide-decoration';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { MockWorkbenchEditorService } from '@Nuvio-MCP/ide-editor/lib/common/mocks/workbench-editor.service';
import { EXPLORER_CONTAINER_ID } from '@Nuvio-MCP/ide-explorer/lib/browser/explorer-contribution';
import { IFileServiceClient } from '@Nuvio-MCP/ide-file-service';
import { IFileTreeAPI, IFileTreeService } from '@Nuvio-MCP/ide-file-tree-next';
import { FileTreeContribution } from '@Nuvio-MCP/ide-file-tree-next/lib/browser/file-tree-contribution';
import { IMainLayoutService, IViewsRegistry } from '@Nuvio-MCP/ide-main-layout';
import { ViewsRegistry } from '@Nuvio-MCP/ide-main-layout/lib/browser/views-registry';
import { IDialogService, IMessageService, IWindowDialogService } from '@Nuvio-MCP/ide-overlay';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../../tools/dev-tool/src/mock-injector';
import { MockQuickOpenService } from '../../../quick-open/src/common/mocks/quick-open.service';

describe('FileTreeContribution', () => {
  let mockInjector: MockInjector;
  const tabbarHandlerMap = new Map();

  const mockMainLayoutService = {
    collectViewComponent: jest.fn(),
    getTabbarHandler: (name: string) => {
      if (tabbarHandlerMap.has(name)) {
        return tabbarHandlerMap.get(name);
      }
      const handler = {
        updateViewTitle: jest.fn(),
        onActivate: jest.fn(),
        onInActivate: jest.fn(),
      };
      tabbarHandlerMap.set(name, handler);
      return handler;
    },
  };
  const mockFileTreeService = {
    init: jest.fn(),
    reWatch: jest.fn(),
    getNodeByPathOrUri: () => ({
      filestat: {
        isSymbolicLink: true,
        isDirectory: false,
        lastModification: new Date().getTime(),
        uri: URI.file('userhome').resolve('test').toString(),
      },
    }),
  };
  const mockDecorationsService = {
    registerDecorationsProvider: jest.fn(),
  };
  const onWorkspaceLocationChangedEmitter = new Emitter();
  const mockWorkspaceService = {
    workspace: {
      isSymbolicLink: false,
      isDirectory: true,
      lastModification: new Date().getTime(),
      uri: URI.file('userhome').toString(),
    },
    onWorkspaceLocationChanged: onWorkspaceLocationChangedEmitter.event,
  };
  const mockFileService = {};

  beforeEach(() => {
    mockInjector = createBrowserInjector([]);

    mockInjector.overrideProviders(
      {
        token: IMainLayoutService,
        useValue: mockMainLayoutService,
      },
      {
        token: IFileTreeService,
        useValue: mockFileTreeService,
      },
      {
        token: IFileServiceClient,
        useValue: mockFileService,
      },
      {
        token: IWorkspaceService,
        useValue: mockWorkspaceService,
      },
      {
        token: IDecorationsService,
        useValue: mockDecorationsService,
      },
      {
        token: WorkbenchEditorService,
        useClass: MockWorkbenchEditorService,
      },
      {
        token: IWindowDialogService,
        useValue: {},
      },
      {
        token: IFileTreeAPI,
        useValue: {},
      },
      {
        token: IMessageService,
        useValue: {},
      },
      {
        token: IClipboardService,
        useValue: {},
      },
      {
        token: IDialogService,
        useValue: {},
      },
      {
        token: IContextKeyService,
        useClass: MockContextKeyService,
      },
      {
        token: PreferenceService,
        useValue: {},
      },
      {
        token: IViewsRegistry,
        useClass: ViewsRegistry,
      },
      {
        token: QuickOpenService,
        useClass: MockQuickOpenService,
      },
      {
        token: IApplicationService,
        useValue: {
          getBackendOS: () => Promise.resolve(OS.type()),
        },
      },
    );
  });

  afterAll(async () => {
    await mockInjector.disposeAll();
  });

  describe('01 #contribution should be work', () => {
    it('should onStart be work', async () => {
      const contribution = mockInjector.get(FileTreeContribution);
      await contribution.onStart();
      expect(mockMainLayoutService.collectViewComponent).toHaveBeenCalledTimes(1);
      await onWorkspaceLocationChangedEmitter.fireAndAwait(undefined);
      const handler = tabbarHandlerMap.get(EXPLORER_CONTAINER_ID);
      expect(handler.updateViewTitle).toHaveBeenCalledTimes(1);
    });

    it('should onDidStart be work', async () => {
      const contribution = mockInjector.get(FileTreeContribution);
      await contribution.onDidStart();
      expect(mockDecorationsService.registerDecorationsProvider).toHaveBeenCalledTimes(1);
    });

    it('should onDidRender be work', async () => {
      const contribution = mockInjector.get(FileTreeContribution);
      contribution.onDidRender();
      const handler = tabbarHandlerMap.get(EXPLORER_CONTAINER_ID);
      expect(handler.onActivate).toHaveBeenCalledTimes(1);
      expect(handler.onInActivate).toHaveBeenCalledTimes(1);
    });

    it('should getWorkspaceTitle be work', async () => {
      const contribution = mockInjector.get(FileTreeContribution);
      const title = contribution.getWorkspaceTitle();
      expect(title).toBe('userhome');
    });

    it('should registerCommands be work', async () => {
      const contribution = mockInjector.get(FileTreeContribution);
      const register = jest.fn();
      contribution.registerCommands({ registerCommand: register } as any);
      expect(register).toHaveBeenCalled();
    });

    it('should registerMenus be work', async () => {
      const contribution = mockInjector.get(FileTreeContribution);
      const register = jest.fn();
      contribution.registerMenus({ registerMenuItem: register } as any);
      expect(register).toHaveBeenCalled();
    });

    it('should registerKeybindings be work', async () => {
      const contribution = mockInjector.get(FileTreeContribution);
      const register = jest.fn();
      contribution.registerKeybindings({ registerKeybinding: register } as any);
      expect(register).toHaveBeenCalled();
    });

    it('should registerToolbarItems be work', async () => {
      const contribution = mockInjector.get(FileTreeContribution);
      const register = jest.fn();
      contribution.registerToolbarItems({ registerItem: register } as any);
      expect(register).toHaveBeenCalled();
    });
  });
});
