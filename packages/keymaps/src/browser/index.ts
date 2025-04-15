import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { IKeymapService } from '../common';

import { KeymapsContribution } from './keymaps.contribution';
import { KeymapService } from './keymaps.service';

@Injectable()
export class KeymapsModule extends BrowserModule {
  providers: Provider[] = [
    {
      token: IKeymapService,
      useClass: KeymapService,
    },
    KeymapsContribution,
  ];
}
