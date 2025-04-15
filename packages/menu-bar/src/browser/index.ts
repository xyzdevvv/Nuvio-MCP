/* istanbul ignore file */
import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { MenuBarWebContribution } from './menu-bar-web.contribution';
import { MenuBarContribution } from './menu-bar.contribution';
import { AbstractMenubarStore, MenubarStore } from './menu-bar.store';

@Injectable()
export class MenuBarModule extends BrowserModule {
  providers: Provider[] = [
    MenuBarContribution,
    {
      token: AbstractMenubarStore,
      useClass: MenubarStore,
    },
  ];
  webProviders = [MenuBarWebContribution];
}
