import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IMenuRegistry } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { ISumiMenuExtendInfo, LifeCyclePhase } from '@Nuvio-MCP/ide-core-common';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';
import { IContributeMenubarItem } from '../../../common/sumi/extension';

export type KtMenubarsSchema = IContributeMenubarItem[];

@Injectable()
@Contributes('menu-extend')
@LifeCycle(LifeCyclePhase.Starting)
export class MenuExtendContributionPoint extends VSCodeContributePoint<KtMenubarsSchema> {
  @Autowired(IMenuRegistry)
  private readonly menuRegistry: IMenuRegistry;

  contribute() {
    for (const contrib of this.contributesMap) {
      const { extensionId, contributes } = contrib;
      for (const menuPosition of Object.keys(contributes)) {
        const menuActions = contributes[menuPosition] as Array<ISumiMenuExtendInfo>;

        this.addDispose(
          this.menuRegistry.registerMenuExtendInfo(
            menuPosition,
            menuActions.map((extendInfo: ISumiMenuExtendInfo) => ({
              ...extendInfo,
              extraDesc: this.getLocalizeFromNlsJSON(extendInfo?.extraDesc ?? '', extensionId),
            })),
          ),
        );
      }
    }
  }
}
