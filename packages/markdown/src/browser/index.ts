import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { IMarkdownService } from '../common';

import { MarkdownServiceImpl } from './markdown.service';
export { Markdown } from './markdown-widget';
@Injectable()
export class MarkdownModule extends BrowserModule {
  providers: Provider[] = [
    {
      token: IMarkdownService,
      useClass: MarkdownServiceImpl,
    },
  ];
}
