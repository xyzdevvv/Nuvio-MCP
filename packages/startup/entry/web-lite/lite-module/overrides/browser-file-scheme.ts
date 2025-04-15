import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';
import { IFileSchemeDocClient } from '@Nuvio-MCP/ide-file-scheme';
import {
  FileSystemEditorComponentContribution,
  FileSystemEditorResourceContribution,
} from '@Nuvio-MCP/ide-file-scheme/lib/browser/file-scheme.contribution';

import { FileSchemeDocClientService } from './doc-client';

@Injectable()
export class BrowserFileSchemeModule extends BrowserModule {
  providers: Provider[] = [
    FileSystemEditorResourceContribution,
    FileSystemEditorComponentContribution,
    {
      token: IFileSchemeDocClient,
      useClass: FileSchemeDocClientService,
    },
  ];
}
