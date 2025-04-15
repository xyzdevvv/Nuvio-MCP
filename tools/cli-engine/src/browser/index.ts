import '@Nuvio-MCP/ide-i18n';
import { BrowserModule, ConstructorOf, IClientAppOpts } from '@Nuvio-MCP/ide-core-browser';
import { ExpressFileServerModule } from '@Nuvio-MCP/ide-express-file-server/lib/browser';
import { defaultConfig } from '@Nuvio-MCP/ide-main-layout/lib/browser/default-config';
import { CommonBrowserModules } from '@Nuvio-MCP/ide-startup/lib/browser/common-modules';
import '@Nuvio-MCP/ide-core-browser/lib/style/index.less';

import { renderApp } from './app';
import './style.less';

export const modules: ConstructorOf<BrowserModule>[] = [...CommonBrowserModules, ExpressFileServerModule];

const customClientOpts = ((window as any).SUMI_CLIENT_OPTS || {}) as IClientAppOpts;

renderApp({
  ...customClientOpts,
  layoutConfig: defaultConfig,
  useCdnIcon: true,
  modules,
  defaultPreferences: {
    'application.confirmExit': 'never',
    'general.theme': 'ide-dark',
    'general.icon': 'vscode-icons',
    ...customClientOpts.defaultPreferences,
  },
});
