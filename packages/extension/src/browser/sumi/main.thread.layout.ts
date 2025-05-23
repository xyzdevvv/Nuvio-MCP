import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { Disposable, IEventBus, ILogger } from '@Nuvio-MCP/ide-core-browser';
import { IMainLayoutService, TabBarRegistrationEvent } from '@Nuvio-MCP/ide-main-layout';
import { TabBarHandler } from '@Nuvio-MCP/ide-main-layout/lib/browser/tabbar-handler';
import { IIconService, IconShape, IconType } from '@Nuvio-MCP/ide-theme';

import { ExtHostSumiAPIIdentifier } from '../../common/sumi';
import { IExtHostLayout, IMainThreadLayout } from '../../common/sumi/layout';

import type { ViewBadge } from 'vscode';

@Injectable({ multiple: true })
export class MainThreadLayout extends Disposable implements IMainThreadLayout {
  @Autowired(IMainLayoutService)
  layoutService: IMainLayoutService;

  @Autowired(IIconService)
  private iconService: IIconService;

  handlerMap = new Map<string, TabBarHandler>();

  proxy: IExtHostLayout;

  @Autowired(IEventBus)
  eventBus: IEventBus;

  @Autowired(ILogger)
  logger: ILogger;

  constructor(rpcProtocol: IRPCProtocol) {
    super();
    this.proxy = rpcProtocol.getProxy(ExtHostSumiAPIIdentifier.ExtHostLayout);
  }

  $setTitle(id: string, title: string): void {
    this.getHandler(id)?.updateTitle(title);
  }

  $setIcon(id: string, iconPath: string): void {
    const iconClass = this.iconService.fromIcon('', iconPath, IconType.Background, IconShape.Square);
    this.getHandler(id)?.setIconClass(iconClass!);
  }

  $setSize(id: string, size: number): void {
    this.getHandler(id)?.setSize(size);
  }

  $activate(id: string): void {
    this.getHandler(id)?.activate();
  }

  $deactivate(id: string): void {
    this.getHandler(id)?.deactivate();
  }

  $setBadge(id: string, badge?: string | ViewBadge): void {
    this.getHandler(id)?.setBadge(badge);
  }

  async $setVisible(id: string, visible: boolean) {
    if (visible) {
      this.getHandler(id)?.show();
    } else {
      if (this.getHandler(id)?.isActivated()) {
        this.getHandler(id)?.deactivate();
      }
      this.getHandler(id)?.hide();
    }
  }

  async $connectTabbar(id: string) {
    if (!this.handlerMap.has(id)) {
      const handle = this.layoutService.getTabbarHandler(id);
      if (handle) {
        this.bindHandleEvents(handle);
      } else {
        const disposer = this.eventBus.on(TabBarRegistrationEvent, (e) => {
          if (e.payload.tabBarId === id) {
            const handler = this.layoutService.getTabbarHandler(id);
            if (handler) {
              this.bindHandleEvents(handler);
            }
            disposer.dispose();
          }
        });
        this.addDispose(disposer);
      }
    }
  }

  // 视图可能未注册到layout上，此时调用该方法返回false
  async $isAttached(id: string) {
    return !!this.layoutService.getTabbarHandler(id);
  }

  private bindHandleEvents(handle: TabBarHandler) {
    this.handlerMap.set(handle.containerId, handle);
    handle.onActivate(() => {
      this.proxy.$acceptMessage(handle.containerId, 'activate');
    });
    handle.onInActivate(() => {
      this.proxy.$acceptMessage(handle.containerId, 'deactivate');
    });
  }

  protected getHandler(id: string) {
    const handler = this.layoutService.getTabbarHandler(id);
    if (!handler) {
      this.logger.warn(`Could not find a handler with \`${id}\``);
    }
    return handler;
  }
}
