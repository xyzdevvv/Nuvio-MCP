import { AI_CHAT_LOGO_AVATAR_ID } from '@Nuvio-MCP/ide-ai-native';
import { SlotLocation } from '@Nuvio-MCP/ide-core-browser';
import { DESIGN_MENUBAR_CONTAINER_VIEW_ID, DESIGN_MENU_BAR_RIGHT } from '@Nuvio-MCP/ide-design';
import { NotebookModule } from '@Nuvio-MCP/ide-notebook/lib/browser';
import { AIModules } from '@Nuvio-MCP/ide-startup/lib/browser/common-modules';
import { MENU_BAR_FEATURE_TIP } from '@Nuvio-MCP/ide-startup/lib/browser/menu-bar-help-icon';

import { getDefaultClientAppOpts, renderApp } from './render-app';

renderApp(
  getDefaultClientAppOpts({
    modules: [...AIModules, NotebookModule],
    opts: {
      layoutViewSize: {
        menubarHeight: 32,
      },
      layoutConfig: {
        [DESIGN_MENU_BAR_RIGHT]: {
          modules: [MENU_BAR_FEATURE_TIP, AI_CHAT_LOGO_AVATAR_ID],
        },
        [SlotLocation.top]: {
          modules: [DESIGN_MENUBAR_CONTAINER_VIEW_ID],
        },
      },
      measure: {
        connection: {
          minimumReportThresholdTime: 400,
        },
      },
      AINativeConfig: {
        capabilities: {
          supportsMCP: true,
          supportsCustomLLMSettings: true,
        },
      },
      notebookServerHost: 'localhost:8888',
    },
  }),
);
