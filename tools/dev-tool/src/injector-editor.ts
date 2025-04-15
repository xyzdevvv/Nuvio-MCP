import { MonacoService } from '@Nuvio-MCP/ide-core-browser/lib/monaco';
import {
  EditorCollectionService,
  EditorComponentRegistry,
  EmptyDocCacheImpl,
  IEditorDecorationCollectionService,
  IEditorDocumentModelContentRegistry,
  IEditorDocumentModelService,
  IEditorFeatureRegistry,
  ILanguageService,
  ResourceService,
  WorkbenchEditorService,
} from '@Nuvio-MCP/ide-editor/lib/browser';
import { EditorComponentRegistryImpl } from '@Nuvio-MCP/ide-editor/lib/browser/component';
import { EditorDocumentModelServiceImpl } from '@Nuvio-MCP/ide-editor/lib/browser/doc-model/editor-document-model-service';
import { EditorDocumentModelContentRegistryImpl } from '@Nuvio-MCP/ide-editor/lib/browser/doc-model/editor-document-registry';
import { EditorCollectionServiceImpl } from '@Nuvio-MCP/ide-editor/lib/browser/editor-collection.service';
import { EditorDecorationCollectionService } from '@Nuvio-MCP/ide-editor/lib/browser/editor.decoration.service';
import { EditorFeatureRegistryImpl } from '@Nuvio-MCP/ide-editor/lib/browser/feature';
import { LanguageService } from '@Nuvio-MCP/ide-editor/lib/browser/language/language.service';
import { ResourceServiceImpl } from '@Nuvio-MCP/ide-editor/lib/browser/resource.service';
import { WorkbenchEditorServiceImpl } from '@Nuvio-MCP/ide-editor/lib/browser/workbench-editor.service';
import { IDocPersistentCacheProvider } from '@Nuvio-MCP/ide-editor/lib/common';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';
import { MockWorkspaceService } from '@Nuvio-MCP/ide-workspace/lib/common/mocks/workspace-service';

import { TestEditorDocumentProvider } from '../../../packages/editor/__tests__/browser/test-providers';
import { MockedMonacoService } from '../../../packages/monaco/__mocks__/monaco.service.mock';

import { MockInjector } from './mock-injector';
export function addEditorProviders(injector: MockInjector) {
  injector.addProviders(
    {
      token: IDocPersistentCacheProvider,
      useClass: EmptyDocCacheImpl,
    },
    {
      token: IEditorDocumentModelContentRegistry,
      useClass: EditorDocumentModelContentRegistryImpl,
    },
    {
      token: IEditorDocumentModelService,
      useClass: EditorDocumentModelServiceImpl,
    },
    {
      token: EditorCollectionService,
      useClass: EditorCollectionServiceImpl,
    },
    {
      token: WorkbenchEditorService,
      useClass: WorkbenchEditorServiceImpl,
    },
    {
      token: ResourceService,
      useClass: ResourceServiceImpl,
    },
    {
      token: EditorComponentRegistry,
      useClass: EditorComponentRegistryImpl,
    },
    {
      token: IEditorDecorationCollectionService,
      useClass: EditorDecorationCollectionService,
    },
    {
      token: ILanguageService,
      useClass: LanguageService,
    },
    {
      token: MonacoService,
      useClass: MockedMonacoService,
    },
    {
      token: IWorkspaceService,
      useClass: MockWorkspaceService,
    },
    {
      token: IEditorFeatureRegistry,
      useClass: EditorFeatureRegistryImpl,
    },
  );
  const editorDocModelRegistry: IEditorDocumentModelContentRegistry = injector.get(IEditorDocumentModelContentRegistry);
  editorDocModelRegistry.registerEditorDocumentModelContentProvider(TestEditorDocumentProvider);
}
