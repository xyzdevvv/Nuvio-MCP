/* istanbul ignore file */
import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { URI } from '@Nuvio-MCP/ide-core-browser';
import * as monaco from '@Nuvio-MCP/ide-monaco';
import {
  ITextModelContentProvider,
  ITextModelService,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/services/resolverService';

import { IEditorDocumentModelService } from './types';

@Injectable()
export class MonacoTextModelService implements ITextModelService {
  canHandleResource(resource: any): boolean {
    return true;
  }

  hasTextModelContentProvider(scheme: string): boolean {
    throw new Error('Method not implemented.');
  }

  _serviceBrand: undefined;

  @Autowired(IEditorDocumentModelService)
  documentModelManager: IEditorDocumentModelService;

  async createModelReference(resource: monaco.Uri) {
    const docModelRef = await this.documentModelManager.createModelReference(new URI(resource.toString()), 'monaco');
    if (docModelRef) {
      const model = docModelRef.instance.getMonacoModel();
      return Promise.resolve({
        object: {
          textEditorModel: model,
        },
        dispose: () => {
          docModelRef.dispose();
        },
      }) as any;
    }
  }

  registerTextModelContentProvider(scheme: string, provider: ITextModelContentProvider): monaco.IDisposable {
    return {
      dispose(): void {
        // no-op
      },
    };
  }
}
