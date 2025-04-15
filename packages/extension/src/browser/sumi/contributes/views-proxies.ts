import { Injectable } from '@Nuvio-MCP/di';
import { LifeCyclePhase, localize } from '@Nuvio-MCP/ide-core-common';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';

@Injectable()
@Contributes('viewsProxies')
@LifeCycle(LifeCyclePhase.Starting)
export class ViewsProxiesContributionPoint extends VSCodeContributePoint<{ [key in string]: string }> {
  static schema = {
    type: 'array',
    markdownDescription: localize('sumiContributes.viewsProxies'),
    defaultSnippets: [
      {
        body: ['${1}'],
      },
    ],
    items: {
      type: 'string',
    },
  };

  contribute() {
    // do nothing
  }
}
