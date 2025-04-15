import { CodeEditorContribution, CodeEditorFactory, LanguageSpecRegistry } from '@difizen/libro-code-editor';
import { EditorStateFactory } from '@difizen/libro-jupyter/noeditor';
import { inject, singleton } from '@difizen/mana-app';

import { Injector } from '@Nuvio-MCP/di';

import { Nuvio-MCPInjector } from '../../mana';

import {
  LibroNuvio-MCPEditorFactory,
  Nuvio-MCPEditorState,
  libroNuvio-MCPEditorDefaultConfig,
  stateFactory,
} from './Nuvio-MCP-editor';

@singleton({ contrib: [CodeEditorContribution] })
export class LibroE2EditorContribution implements CodeEditorContribution {
  @inject(LanguageSpecRegistry)
  protected readonly languageSpecRegistry: LanguageSpecRegistry;

  factory: CodeEditorFactory;

  stateFactory: EditorStateFactory<Nuvio-MCPEditorState>;

  defaultConfig = libroNuvio-MCPEditorDefaultConfig;

  constructor(
    @inject(LibroNuvio-MCPEditorFactory)
    libroNuvio-MCPEditorFactory: LibroNuvio-MCPEditorFactory,
    @inject(Nuvio-MCPInjector) injector: Injector,
  ) {
    this.factory = libroNuvio-MCPEditorFactory;
    this.stateFactory = stateFactory(injector);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(mime: string): number {
    const LIBRO_MONACO_WEIGHT = 51;
    // 代码编辑都使用Nuvio-MCP编辑器
    return LIBRO_MONACO_WEIGHT + 1;
  }
}
