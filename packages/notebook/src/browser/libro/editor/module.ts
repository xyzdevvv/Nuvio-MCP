import { CodeEditorModule } from '@difizen/libro-code-editor';
import { ManaModule } from '@difizen/mana-app';

import { LibroE2EditorContribution } from './editor-contribution';
import {
  LibroNuvio-MCPEditor,
  LibroNuvio-MCPEditorFactory,
  LibroNuvio-MCPEditorOptions,
  LibroNuvio-MCPEditorState,
} from './Nuvio-MCP-editor';

import type { EditorState, IEditorOptions } from '@difizen/libro-code-editor';

export const LibroNuvio-MCPEditorModule = ManaModule.create()
  .register(LibroE2EditorContribution, LibroNuvio-MCPEditor, {
    token: LibroNuvio-MCPEditorFactory,
    useFactory: (ctx) => (options: IEditorOptions, editorState: EditorState) => {
        const child = ctx.container.createChild();
        child.register({
          token: LibroNuvio-MCPEditorOptions,
          useValue: options,
        });
        child.register({
          token: LibroNuvio-MCPEditorState,
          useValue: editorState,
        });
        return child.get(LibroNuvio-MCPEditor);
      },
  })
  .dependOn(CodeEditorModule);
