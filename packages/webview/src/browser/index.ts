import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { WebviewModuleContribution } from './contribution';
import { ElectronWebviewModuleContribution } from './electron.contribution';
import { IWebviewService } from './types';
import { WebviewServiceImpl } from './webview.service';
export * from './types';
export { PlainWebview } from './editor-webview';

@Injectable()
export class WebviewModule extends BrowserModule {
  providers: Provider[] = [
    {
      token: IWebviewService,
      useClass: WebviewServiceImpl,
    },
    WebviewModuleContribution,
  ];
  electronProviders: Provider[] = [ElectronWebviewModuleContribution];
}
