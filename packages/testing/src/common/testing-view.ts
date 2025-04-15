import { IBasicInlineMenu, IBasicInlineMenuPosition } from '@Nuvio-MCP/ide-components';

import { DebugTestCommand, GoToTestCommand, RuntTestCommand } from './commands';

export const TestingViewId = '@Nuvio-MCP/ide-testing';

export const TestingContainerId = 'testing';

export const TestingExplorerInlineMenus: IBasicInlineMenu[] = [
  {
    icon: 'start',
    title: 'Run Test',
    command: RuntTestCommand.id,
    position: IBasicInlineMenuPosition.TREE_CONTAINER,
  },
  {
    icon: 'debug-alt-small',
    title: 'Debug Test',
    command: DebugTestCommand.id,
    position: IBasicInlineMenuPosition.TREE_CONTAINER,
  },
  {
    icon: 'openfile',
    title: 'Go To Test',
    command: GoToTestCommand.id,
    position: IBasicInlineMenuPosition.TREE_CONTAINER,
  },
];
