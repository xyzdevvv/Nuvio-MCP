import { Injectable, Provider } from '@Nuvio-MCP/di';
import { NodeModule } from '@Nuvio-MCP/ide-core-node';

import { IProcessFactory, IProcessManage, processManageServicePath } from '../common/';

import { ProcessFactory } from './process';
import { ProcessManage } from './process-manager';

@Injectable()
export class ProcessModule extends NodeModule {
  providers: Provider[] = [
    { token: IProcessManage, useClass: ProcessManage },
    { token: IProcessFactory, useClass: ProcessFactory },
  ];

  backServices = [
    {
      servicePath: processManageServicePath,
      token: IProcessManage,
    },
  ];
}

export * from './process';
export * from './process-manager';
