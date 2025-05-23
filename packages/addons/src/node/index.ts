import { Injectable, Provider } from '@Nuvio-MCP/di';
import { NodeModule } from '@Nuvio-MCP/ide-core-node';

import {
  ConnectionBackServicePath,
  FileDropServicePath,
  IConnectionBackService,
  IFileDropServiceToken,
} from '../common';

import { ConnectionRTTBackService } from './connection-rtt-service';
import { FileDropService } from './file-drop.service';

@Injectable()
export class AddonsModule extends NodeModule {
  providers: Provider[] = [
    {
      token: IFileDropServiceToken,
      useClass: FileDropService,
    },
    {
      token: IConnectionBackService,
      useClass: ConnectionRTTBackService,
    },
  ];

  backServices = [
    {
      servicePath: FileDropServicePath,
      token: IFileDropServiceToken,
    },
    {
      servicePath: ConnectionBackServicePath,
      token: IConnectionBackService,
    },
  ];
}
