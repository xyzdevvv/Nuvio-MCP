/* istanbul ignore file */
import { LayoutConfig, SlotLocation } from '@Nuvio-MCP/ide-core-browser';

import { DROP_BOTTOM_CONTAINER, DROP_RIGHT_CONTAINER } from '../common';

export const defaultConfig: LayoutConfig = {
  [SlotLocation.top]: {
    modules: ['@Nuvio-MCP/ide-menu-bar'],
  },
  [SlotLocation.action]: {
    modules: ['@Nuvio-MCP/ide-toolbar-action'],
  },
  [SlotLocation.left]: {
    modules: [
      '@Nuvio-MCP/ide-explorer',
      '@Nuvio-MCP/ide-search',
      '@Nuvio-MCP/ide-scm',
      '@Nuvio-MCP/ide-extension-manager',
      '@Nuvio-MCP/ide-debug',
      '@Nuvio-MCP/ide-notebook',
    ],
  },
  [SlotLocation.right]: {
    modules: [DROP_RIGHT_CONTAINER],
  },
  [SlotLocation.main]: {
    modules: ['@Nuvio-MCP/ide-editor'],
  },
  [SlotLocation.bottom]: {
    modules: [
      DROP_BOTTOM_CONTAINER,
      '@Nuvio-MCP/ide-terminal-next',
      '@Nuvio-MCP/ide-output',
      'debug-console',
      '@Nuvio-MCP/ide-markers',
    ],
  },
  [SlotLocation.statusBar]: {
    modules: ['@Nuvio-MCP/ide-status-bar'],
  },
  [SlotLocation.extra]: {
    modules: ['breadcrumb-menu'],
  },
};
