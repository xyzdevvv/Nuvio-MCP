import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { LifeCyclePhase, URI } from '@Nuvio-MCP/ide-core-common';
import { IThemeContribution, IThemeService } from '@Nuvio-MCP/ide-theme';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';
import { AbstractExtInstanceManagementService } from '../../types';

export type ThemesSchema = Array<IThemeContribution>;

@Injectable()
@Contributes('themes')
@LifeCycle(LifeCyclePhase.Initialize)
export class ThemesContributionPoint extends VSCodeContributePoint<ThemesSchema> {
  @Autowired(IThemeService)
  protected readonly themeService: IThemeService;

  @Autowired(AbstractExtInstanceManagementService)
  protected readonly extensionManageService: AbstractExtInstanceManagementService;

  contribute() {
    for (const contrib of this.contributesMap) {
      const { extensionId, contributes } = contrib;
      const themes = contributes.map((t) => ({
        ...t,
        label: this.getLocalizeFromNlsJSON(t.label, extensionId),
        extensionId,
      }));
      const extension = this.extensionManageService.getExtensionInstanceByExtId(extensionId);
      if (extension) {
        this.themeService.registerThemes(themes, URI.from(extension.uri!));
      }
    }
  }
}
