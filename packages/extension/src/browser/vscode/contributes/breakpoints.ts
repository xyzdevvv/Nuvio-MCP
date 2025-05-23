import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { LifeCyclePhase } from '@Nuvio-MCP/ide-core-common';
import { DebugConfigurationManager } from '@Nuvio-MCP/ide-debug/lib/browser/debug-configuration-manager';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';

export interface BreakpointsContributionScheme {
  language: string;
}

@Injectable()
@Contributes('breakpoints')
@LifeCycle(LifeCyclePhase.Starting)
export class BreakpointsContributionPoint extends VSCodeContributePoint<BreakpointsContributionScheme[]> {
  @Autowired(DebugConfigurationManager)
  private debugConfigurationManager: DebugConfigurationManager;

  contribute() {
    for (const contrib of this.contributesMap) {
      const { contributes } = contrib;
      contributes.forEach((item) => {
        this.debugConfigurationManager.addSupportBreakpoints(item.language);
      });
    }
  }

  unregister(items: BreakpointsContributionScheme[]) {
    items.forEach((item) => {
      this.debugConfigurationManager.removeSupportBreakpoints(item.language);
    });
  }

  dispose() {
    for (const contrib of this.contributesMap) {
      const { contributes } = contrib;
      this.unregister(contributes);
    }
  }
}
