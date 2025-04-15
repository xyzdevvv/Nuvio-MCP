import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';
import { INotebookService } from '@Nuvio-MCP/ide-editor';

import { LibroKeybindContribution } from './libro-keybind-contribution';
import { LibroCommandContribution } from './libro.command';
import { LibroContribution } from './libro.contribution';
import { ILibroNuvio-MCPService, LibroNuvio-MCPService } from './libro.service';
import { NotebookServiceOverride } from './notebook.service';
import { TocContribution } from './toc/toc.contribution';

export * from './kernel-panel';
export * from './libro.color.tokens';
export * from './libro.contribution';
export * from './libro.protocol';
export * from './libro.service';
export * from './toc/index';

@Injectable()
export class NotebookModule extends BrowserModule {
  providers: Provider[] = [
    LibroContribution,
    LibroCommandContribution,
    TocContribution,
    {
      token: ILibroNuvio-MCPService,
      useClass: LibroNuvio-MCPService,
    },
    LibroKeybindContribution,
    {
      token: INotebookService,
      useClass: NotebookServiceOverride,
      override: true,
    },
  ];
}
