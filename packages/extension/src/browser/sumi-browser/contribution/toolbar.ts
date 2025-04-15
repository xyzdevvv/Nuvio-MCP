import { Autowired, INJECTOR_TOKEN, Injectable, Injector } from '@Nuvio-MCP/di';
import { Disposable, IDisposable, ILogger } from '@Nuvio-MCP/ide-core-common';
import { IMainLayoutService } from '@Nuvio-MCP/ide-main-layout';
import { IIconService } from '@Nuvio-MCP/ide-theme';
import { IToolBarViewService, ToolBarPosition } from '@Nuvio-MCP/ide-toolbar/lib/browser';

import { AbstractSumiBrowserContributionRunner, IRunTimeParams } from '../types';

@Injectable({ multiple: true })
export class ToolBarBrowserContributionRunner extends AbstractSumiBrowserContributionRunner {
  @Autowired(IMainLayoutService)
  layoutService: IMainLayoutService;

  @Autowired(IToolBarViewService)
  toolBarViewService: IToolBarViewService;

  @Autowired(IIconService)
  iconService: IIconService;

  @Autowired(ILogger)
  logger: ILogger;

  @Autowired(INJECTOR_TOKEN)
  injector: Injector;

  run(param: IRunTimeParams): IDisposable {
    const disposer = new Disposable();
    if (!this.injector.creatorMap.has(IToolBarViewService)) {
      this.logger.warn('没有找到 toolbarViewService');
      return disposer;
    }

    if (this.contribution.toolBar) {
      this.contribution.toolBar.view.forEach((view) => {
        const { extendProtocol, extendService } = param.getExtensionExtendService(this.extension, view.id);
        const disposable = this.toolBarViewService.registerToolBarElement({
          type: 'component',
          component: view.component as React.ComponentType,
          position: view.position || this.contribution.toolBar!.position || ToolBarPosition.LEFT,
          initialProps: {
            kaitianExtendService: extendService,
            kaitianExtendSet: extendProtocol,
            sumiExtendService: extendService,
            sumiExtendSet: extendProtocol,
          },
          description: view.description,
          order: view.order,
          weight: view.weight,
        });
        if (disposable) {
          disposer.addDispose(disposable);
        }
      });
    }

    return disposer;
  }
}
