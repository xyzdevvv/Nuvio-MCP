import { Autowired, INJECTOR_TOKEN, Injector } from '@Nuvio-MCP/di';
import {
  ClientAppContribution,
  CommandContribution,
  CommandRegistry,
  ContributionProvider,
  Domain,
  KeybindingContribution,
  KeybindingRegistry,
  LAYOUT_COMMANDS,
  QUICK_OPEN_COMMANDS,
  localize,
} from '@Nuvio-MCP/ide-core-browser';
import { IMenuRegistry, MenuContribution, MenuId } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { PrefixQuickOpenService } from '@Nuvio-MCP/ide-core-browser/lib/quick-open';

import { QuickOpenContribution, QuickOpenHandlerRegistry } from './prefix-quick-open.service';
import { QuickCommandHandler } from './quick-open.command.service';
import { HelpQuickOpenHandler } from './quick-open.help.service';

// 连接 monaco 内部的 quick-open
// 作为 contribution provider 的职责
@Domain(ClientAppContribution)
export class CoreQuickOpenContribution implements ClientAppContribution {
  @Autowired()
  private readonly quickOpenHandlerRegistry: QuickOpenHandlerRegistry;

  @Autowired(QuickOpenContribution)
  private readonly quickOpenContributionProvider: ContributionProvider<QuickOpenContribution>;

  // contribution provider 的职责
  onStart() {
    for (const contribution of this.quickOpenContributionProvider.getContributions()) {
      contribution.registerQuickOpenHandlers(this.quickOpenHandlerRegistry);
    }
  }
}

// 作为 command platte 等相关功能的贡献点
@Domain(CommandContribution, KeybindingContribution, MenuContribution, QuickOpenContribution)
export class QuickOpenFeatureContribution
  implements CommandContribution, KeybindingContribution, MenuContribution, QuickOpenContribution
{
  @Autowired(INJECTOR_TOKEN)
  injector: Injector;

  @Autowired(PrefixQuickOpenService)
  private readonly prefixQuickOpenService: PrefixQuickOpenService;

  @Autowired()
  private readonly quickCommandHandler: QuickCommandHandler;

  @Autowired()
  private readonly helpQuickOpenHandler: HelpQuickOpenHandler;

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(QUICK_OPEN_COMMANDS.OPEN, {
      execute: () => this.prefixQuickOpenService.open('>'),
    });
    commands.registerCommand(QUICK_OPEN_COMMANDS.OPEN_OUTLINE, {
      execute: () => this.prefixQuickOpenService.open('@'),
    });
    commands.registerCommand(QUICK_OPEN_COMMANDS.OPEN_VIEW, {
      execute: () => this.prefixQuickOpenService.open('view '),
    });
    commands.registerCommand(QUICK_OPEN_COMMANDS.OPEN_WITH_COMMAND, {
      execute: (value?: string) => this.prefixQuickOpenService.open('>', value),
    });
  }

  registerKeybindings(keybindings: KeybindingRegistry): void {
    keybindings.registerKeybinding({
      command: QUICK_OPEN_COMMANDS.OPEN.id,
      keybinding: 'ctrlcmd+shift+p',
    });
  }

  registerMenus(menus: IMenuRegistry): void {
    menus.registerMenuItem(MenuId.MenubarViewMenu, {
      command: {
        id: QUICK_OPEN_COMMANDS.OPEN.id,
        label: localize('menu-bar.view.quick.command'),
      },
      group: '0_primary',
    });
    menus.registerMenuItem(MenuId.MenubarViewMenu, {
      command: {
        id: LAYOUT_COMMANDS.OPEN_VIEW.id,
        label: LAYOUT_COMMANDS.OPEN_VIEW.label,
      },
      group: '0_primary',
    });
  }

  registerQuickOpenHandlers(handlers: QuickOpenHandlerRegistry): void {
    handlers.registerHandler(this.quickCommandHandler, {
      title: localize('quickopen.tab.command'),
      commandId: QUICK_OPEN_COMMANDS.OPEN.id,
      order: 4,
    });
    handlers.registerHandler(this.helpQuickOpenHandler);
  }
}
