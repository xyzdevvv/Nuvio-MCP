import { Injectable } from '@Nuvio-MCP/di';
import { LifeCyclePhase, localize } from '@Nuvio-MCP/ide-core-common';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';

@Injectable()
@Contributes('nodeMain')
@LifeCycle(LifeCyclePhase.Ready)
export class NodeMainContributionPoint extends VSCodeContributePoint<{ [key in string]: string }> {
  static schema = {
    type: 'string',
    defaultSnippets: [
      {
        body: './out/node/index.js',
      },
    ],
    description: localize('sumiContributes.nodeMain'),
  };

  contribute() {
    // do nothing
  }
}
