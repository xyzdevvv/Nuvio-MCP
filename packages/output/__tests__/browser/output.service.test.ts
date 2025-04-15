import { Injectable } from '@Nuvio-MCP/di';
import { PreferenceService } from '@Nuvio-MCP/ide-core-browser';
import {
  HashCalculateServiceImpl,
  IHashCalculateService,
} from '@Nuvio-MCP/ide-core-common/lib/hash-calculate/hash-calculate';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { IDocPersistentCacheProvider } from '@Nuvio-MCP/ide-editor';
import {
  EmptyDocCacheImpl,
  IEditorDocumentModelContentRegistry,
  IEditorDocumentModelService,
} from '@Nuvio-MCP/ide-editor/lib/browser';
import {
  EditorDocumentModelContentRegistryImpl,
  EditorDocumentModelServiceImpl,
} from '@Nuvio-MCP/ide-editor/lib/browser/doc-model/main';
import { IMainLayoutService } from '@Nuvio-MCP/ide-main-layout/lib/common';
import { MonacoService } from '@Nuvio-MCP/ide-monaco';
import { MockedMonacoService } from '@Nuvio-MCP/ide-monaco/__mocks__/monaco.service.mock';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';
import { MockWorkspaceService } from '@Nuvio-MCP/ide-workspace/lib/common/mocks';

import { MockWalkThroughSnippetSchemeDocumentProvider } from '../../../file-scheme/__mocks__/browser/file-doc';
import { OutputPreferences } from '../../src/browser/output-preference';
import { OutputService } from '../../src/browser/output.service';

@Injectable()
class MockMainLayoutService {
  getTabbarHandler() {
    return {
      isVisible: false,
      activate() {},
    };
  }
}

const preferences: Map<string, any> = new Map();

const mockedPreferenceService: any = {
  get: (k) => preferences.get(k),
  set: (k, v) => {
    preferences.set(k, v);
  },
  onPreferenceChanged: (listener) =>
    //
    ({
      dispose: () => {},
    }),
};

describe('Output.service.ts', () => {
  // let mockPreferenceVal = false;
  let outputService: OutputService;

  const injector = createBrowserInjector([]);
  injector.overrideProviders(
    ...[
      {
        token: IMainLayoutService,
        useClass: MockMainLayoutService,
      },
      {
        token: PreferenceService,
        useValue: mockedPreferenceService,
      },
      {
        token: MonacoService,
        useClass: MockedMonacoService,
      },
      {
        token: OutputService,
        useClass: OutputService,
      },
      {
        token: IWorkspaceService,
        useClass: MockWorkspaceService,
      },
      {
        token: IEditorDocumentModelService,
        useClass: EditorDocumentModelServiceImpl,
      },
      {
        token: OutputPreferences,
        useValue: {
          'output.logWhenNoPanel': true,
        },
      },
      {
        token: IEditorDocumentModelContentRegistry,
        useClass: EditorDocumentModelContentRegistryImpl,
      },
      {
        token: IHashCalculateService,
        useClass: HashCalculateServiceImpl,
      },
      {
        token: IDocPersistentCacheProvider,
        useClass: EmptyDocCacheImpl,
      },
    ],
  );

  beforeAll(async () => {
    const documentRegistry = injector.get<IEditorDocumentModelContentRegistry>(IEditorDocumentModelContentRegistry);
    documentRegistry.registerEditorDocumentModelContentProvider(
      injector.get(MockWalkThroughSnippetSchemeDocumentProvider),
    );
    injector.get(MonacoService);
    outputService = injector.get(OutputService);
  });

  test('getChannel', () => {
    const output = outputService.getChannel('1');
    expect(output?.name).toEqual('1');
    outputService.deleteChannel('1');
  });

  test('deleteChannel', () => {
    const origLength = outputService.getChannels.get().length;
    outputService.getChannel('1');
    outputService.deleteChannel('1');
    expect(outputService.getChannels.get().length).toEqual(origLength);
  });

  test('getChannels', () => {
    const origLength = outputService.getChannels.get().length;
    outputService.getChannel('1');
    outputService.deleteChannel('1');
    expect(outputService.getChannels.get().length).toEqual(origLength);
  });
});
