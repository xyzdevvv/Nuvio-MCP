import { Injectable } from '@Nuvio-MCP/di';
import { LifeCyclePhase, localize } from '@Nuvio-MCP/ide-core-common';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';

@Injectable()
@Contributes('workerMain')
@LifeCycle(LifeCyclePhase.Ready)
export class WorkerMainContributionPoint extends VSCodeContributePoint<{ [key in string]: string }> {
  static schema = {
    type: 'string',
    defaultSnippets: [
      {
        body: './out/worker/index.js',
      },
    ],
    description: localize('sumiContributes.workerMain'),
  };

  contribute() {
    // do nothing
  }
}
