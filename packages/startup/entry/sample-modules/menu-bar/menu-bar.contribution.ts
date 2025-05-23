import { Injectable } from '@Nuvio-MCP/di';
import { ComponentContribution, ComponentRegistry, Domain } from '@Nuvio-MCP/ide-core-browser';

import { MenuBarView } from './menu-bar.view';

@Injectable()
@Domain(ComponentContribution)
export class MenuBarContribution implements ComponentContribution {
  // Component key
  static MenuBarContainer = 'menubar';

  registerComponent(registry: ComponentRegistry): void {
    registry.register(MenuBarContribution.MenuBarContainer, {
      component: MenuBarView,
      id: MenuBarContribution.MenuBarContainer,
    });
  }
}
