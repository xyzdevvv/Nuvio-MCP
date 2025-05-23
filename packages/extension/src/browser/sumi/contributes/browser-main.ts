import { Injectable } from '@Nuvio-MCP/di';
import { LifeCyclePhase, localize } from '@Nuvio-MCP/ide-core-common';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';

@Injectable()
@Contributes('browserMain')
@LifeCycle(LifeCyclePhase.Ready)
export class BrowserMainContributionPoint extends VSCodeContributePoint<{ [key in string]: string }> {
  static schema = {
    type: 'string',
    defaultSnippets: [
      {
        body: './out/browser/index.js',
      },
    ],
    description: localize('sumiContributes.browserMain'),
  };

  contribute() {
    // do nothing
  }
}
