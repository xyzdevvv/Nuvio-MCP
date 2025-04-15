import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';

import { IDecorationsService } from '../common/decorations';

import { FileDecorationsService } from './decorationsService';

@Injectable()
export class DecorationModule extends BrowserModule {
  providers: Provider[] = [
    {
      token: IDecorationsService,
      useClass: FileDecorationsService,
    },
  ];
}
