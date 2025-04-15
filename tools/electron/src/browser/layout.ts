import { LayoutConfig, SlotLocation } from '@Nuvio-MCP/ide-core-browser';

export const customLayoutConfig: LayoutConfig = {
  [SlotLocation.top]: {
    modules: ['@Nuvio-MCP/ide-menu-bar', 'toolbar'],
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
    ],
  },
  [SlotLocation.right]: {
    modules: [],
  },
  [SlotLocation.main]: {
    modules: ['@Nuvio-MCP/ide-editor'],
  },
  [SlotLocation.bottom]: {
    modules: ['@Nuvio-MCP/ide-terminal-next', '@Nuvio-MCP/ide-output', 'debug-console', '@Nuvio-MCP/ide-markers'],
  },
  [SlotLocation.statusBar]: {
    modules: ['@Nuvio-MCP/ide-status-bar'],
  },
  [SlotLocation.extra]: {
    modules: ['breadcrumb-menu'],
  },
};
