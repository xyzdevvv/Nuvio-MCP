import { Autowired } from '@Nuvio-MCP/di';
import { Disposable, MenubarSettingId, PreferenceService } from '@Nuvio-MCP/ide-core-browser';
import { ComponentContribution, ComponentRegistry } from '@Nuvio-MCP/ide-core-browser/lib/layout';
import { IMenubarItem } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { Domain } from '@Nuvio-MCP/ide-core-common/lib/di-helper';

import { MenubarStore } from './menu-bar.store';
import { MenuBarMixToolbarAction } from './menu-bar.view';

@Domain(ComponentContribution)
export class MenuBarContribution extends Disposable implements ComponentContribution {
  @Autowired(MenubarStore)
  private readonly menubarStore: MenubarStore;

  @Autowired(PreferenceService)
  private readonly preferenceService: PreferenceService;

  constructor() {
    super();

    this.addDispose(
      this.menubarStore.onDidMenuBarChange((menubarItems: IMenubarItem[]) => {
        this.menubarStore.registerMenusBarByCompact(menubarItems);
      }),
    );

    this.addDispose(
      this.preferenceService.onSpecificPreferenceChange(MenubarSettingId.CompactMode, ({ newValue }) => {
        if (newValue) {
          this.menubarStore.registerMenuItemByCompactMenu();
        } else {
          this.menubarStore.unregisterMenusBarByCompact();
        }
      }),
    );
  }

  registerComponent(registry: ComponentRegistry) {
    registry.register(
      '@Nuvio-MCP/ide-menu-bar',
      {
        id: 'ide-menu-bar',
        component: MenuBarMixToolbarAction,
      },
      {
        size: 27,
      },
    );
  }
}
