/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Text as YText } from 'yjs';

import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { AppConfig } from '@Nuvio-MCP/ide-core-browser';
import { EventBusImpl, IEventBus, ILogger, URI } from '@Nuvio-MCP/ide-core-common';
import { INodeLogger, AppConfig as NodeAppConfig } from '@Nuvio-MCP/ide-core-node';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { MockInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import {
  EditorDocumentModelCreationEvent,
  EditorDocumentModelRemovalEvent,
  IEditorDocumentModelService,
} from '@Nuvio-MCP/ide-editor/lib/browser';
import { FileChangeType, IFileService } from '@Nuvio-MCP/ide-file-service';
import { FileServiceClient } from '@Nuvio-MCP/ide-file-service/lib/browser/file-service-client';
import { IFileServiceClient } from '@Nuvio-MCP/ide-file-service/lib/common';
import { ITextModel } from '@Nuvio-MCP/ide-monaco';
import { monacoApi } from '@Nuvio-MCP/ide-monaco/lib/browser/monaco-api';
import { ICSSStyleService } from '@Nuvio-MCP/ide-theme';

import { CollaborationService } from '../../src/browser/collaboration.service';
import { TextModelBinding } from '../../src/browser/textmodel-binding';
import { CollaborationServiceForClientPath, ICollaborationService, IYWebsocketServer } from '../../src/common';
import { CollaborationServiceForClient } from '../../src/node/collaboration.service';
import { YWebsocketServerImpl } from '../../src/node/y-websocket-server';

@Injectable()
class MockWorkbenchEditorService {
  uri: URI;

  get currentResource() {
    return {
      uri: this.uri,
    };
  }
}

@Injectable()
class MockDocModelService {
  @Autowired(WorkbenchEditorService)
  private workbenchService: MockDocModelService;

  private textModel: ITextModel;

  getModelReference(uri: string) {
    return {
      dispose() {},
      instance: {
        getMonacoModel() {
          return monacoApi.editor.createModel('');
        },
      },
    };
  }
}

describe('CollaborationService basic routines', () => {
  let injector: MockInjector;
  let service: CollaborationService;
  let server: YWebsocketServerImpl;
  let eventBus: IEventBus;
  let workbenchEditorService: MockWorkbenchEditorService;
  let fileServiceClient: IFileServiceClient;

  beforeAll(() => {
    injector = createBrowserInjector([]);
    injector.mockService(ILogger);
    injector.mockService(INodeLogger);
    injector.mockService(IFileService);
    injector.mockService(ICSSStyleService);
    injector.addProviders(
      {
        token: ICollaborationService,
        useClass: CollaborationService,
      },
      {
        token: IYWebsocketServer,
        useClass: YWebsocketServerImpl,
      },
      {
        token: CollaborationServiceForClientPath,
        useClass: CollaborationServiceForClient,
      },
    );
    injector.addProviders({
      token: IEventBus,
      useClass: EventBusImpl,
    });
    injector.overrideProviders({
      token: AppConfig,
      useValue: {
        wsPath: { toString: () => 'ws://127.0.0.1:8080' },
        collaborationOptions: {
          port: 10010,
        },
      },
    });
    injector.overrideProviders({
      token: NodeAppConfig,
      useValue: {
        collaborationOptions: {
          port: 10010,
        },
      } as NodeAppConfig,
    });

    injector.addProviders({
      token: WorkbenchEditorService,
      useClass: MockWorkbenchEditorService,
    });

    injector.addProviders({
      token: IFileServiceClient,
      useClass: FileServiceClient,
    });

    workbenchEditorService = injector.get<MockWorkbenchEditorService>(WorkbenchEditorService);
    const uriString = 'file://home/situ2001/114514/1919810';
    workbenchEditorService.uri = new URI(uriString);

    injector.addProviders({
      token: IEditorDocumentModelService,
      useClass: MockDocModelService,
    });

    server = injector.get(IYWebsocketServer);
    eventBus = injector.get(IEventBus);
    service = injector.get(ICollaborationService);
    fileServiceClient = injector.get(IFileServiceClient);

    // mock impl, because origin impl comes with nodejs
    jest.spyOn(server, 'requestInitContent').mockImplementation(async (uri: string) => {
      if (!server['yMap'].has(uri)) {
        server['yMap'].set(uri, new YText('init content'));
      }
    });

    service.initFileWatch();
    // start server
    server.initialize();
  });

  it('should successfully initialize', () => {
    const spy = jest.spyOn(service, 'initialize');
    service.initialize();
    expect(spy).toHaveBeenCalled();
  });

  it('should create a new binding when all things are ready', async () => {
    const event = new EditorDocumentModelCreationEvent({
      uri: new URI(workbenchEditorService.uri.toString()),
    } as any);
    await eventBus.fireAndAwait(event);
    expect(service['bindingMap'].has(workbenchEditorService.uri.toString())).toBeTruthy();
  });

  it('should call undo and redo on current binding', () => {
    const targetBinding = service['getBinding'](workbenchEditorService.uri.toString()) as TextModelBinding;
    expect(targetBinding).toBeInstanceOf(TextModelBinding);
    const undoSpy = jest.spyOn(targetBinding, 'undo');
    const redoSpy = jest.spyOn(targetBinding, 'redo');
    service.undoOnFocusedTextModel();
    service.redoOnFocusedTextModel();
    expect(undoSpy).toHaveBeenCalled();
    expect(redoSpy).toHaveBeenCalled();
  });

  it('should change YText when remote YText was changed', async () => {
    // simulate YText delete and add
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const binding = service['bindingMap'].get(workbenchEditorService.uri.toString())!;
    expect(binding).toBeInstanceOf(TextModelBinding);
    expect(binding['yText'].toJSON()).toBeTruthy();

    const spy = jest.spyOn(binding, 'changeYText');
    const { yMapReady } = service['getDeferred'](workbenchEditorService.uri.toString());

    service['yTextMap'].delete(workbenchEditorService.uri.toString());
    service['yTextMap'].set(workbenchEditorService.uri.toString(), new YText('1919810'));

    await yMapReady.promise;

    expect(spy).toHaveBeenCalled();
    expect(binding['yText'].toJSON()).toBe('1919810');
  });

  it('should remove binding on EditorDocumentModelRemovalEvent', async () => {
    const event = new EditorDocumentModelRemovalEvent({
      codeUri: new URI(workbenchEditorService.uri.toString()),
    } as any);
    await eventBus.fireAndAwait(event);
    expect(service['bindingMap'].has(workbenchEditorService.uri.toString())).toBeFalsy();
  });

  it('should reset yTextMap on file change', async () => {
    const { yMapReady } = service['getDeferred'](workbenchEditorService.uri.toString());

    service['yTextMap'].delete(workbenchEditorService.uri.toString());
    service['yTextMap'].set(workbenchEditorService.uri.toString(), new YText('Need delete'));

    await yMapReady.promise;

    fileServiceClient.fireFilesChange({
      changes: [{ type: FileChangeType.ADDED, uri: workbenchEditorService.uri.toString() }],
    });
    expect(service['yTextMap'].has(workbenchEditorService.uri.toString())).toBeTruthy();

    fileServiceClient.fireFilesChange({
      changes: [{ type: FileChangeType.UPDATED, uri: workbenchEditorService.uri.toString() }],
    });
    expect(service['yTextMap'].has(workbenchEditorService.uri.toString())).toBeFalsy();
  });

  afterAll(() => {
    server.destroy();
  });
});
