import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { DisposableCollection } from '@Nuvio-MCP/ide-core-browser';
import { LifeCyclePhase } from '@Nuvio-MCP/ide-core-common';
import { IMainLayoutService } from '@Nuvio-MCP/ide-main-layout';
import { WelcomeView } from '@Nuvio-MCP/ide-main-layout/lib/browser/welcome.view';

import { Contributes, LifeCycle, VSCodeContributePoint } from '../../../common';
import { ExtensionWebviewView } from '../../components/extension-webview-view';

export interface ViewsContribution {
  [key: string]: Array<ViewItem>;
}

export interface ViewItem {
  id: string;
  name: string;
  when: string;
  weight?: number;
  priority?: number;
  type?: 'tree' | 'webview';
}

export type ViewsSchema = ViewsContribution;

@Injectable()
@Contributes('views')
@LifeCycle(LifeCyclePhase.Initialize)
export class ViewsContributionPoint extends VSCodeContributePoint<ViewsSchema> {
  @Autowired(IMainLayoutService)
  mainLayoutService: IMainLayoutService;

  private disposableCollection: DisposableCollection = new DisposableCollection();

  contribute() {
    for (const contrib of this.contributesMap) {
      const { extensionId, contributes } = contrib;
      for (const location of Object.keys(contributes)) {
        const views = contributes[location].map((view: ViewItem) => ({
          ...view,
          name: this.getLocalizeFromNlsJSON(view.name, extensionId),
          component: view.type === 'webview' ? ExtensionWebviewView : WelcomeView,
        }));
        for (const view of views) {
          const handlerId = this.mainLayoutService.collectViewComponent(
            view,
            location,
            { viewId: view.id },
            {
              fromExtension: true,
            },
          );
          this.disposableCollection.push({
            dispose: () => {
              const handler = this.mainLayoutService.getTabbarHandler(handlerId);
              handler?.disposeView(view.id);
            },
          });
        }
      }
    }
  }

  dispose() {
    this.disposableCollection.dispose();
  }
}
