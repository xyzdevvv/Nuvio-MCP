import { Autowired, Injector } from '@Nuvio-MCP/di';
import { BasicModule, CommandRegistry, Deferred } from '@Nuvio-MCP/ide-core-common';

import { AppConfig } from './react-providers/config-provider';

export const IClientApp = Symbol('CLIENT_APP_TOKEN');

export interface IClientApp {
  appInitialized: Deferred<void>;
  browserModules: BrowserModule<any>[];
  injector: Injector;
  config: AppConfig;
  commandRegistry: CommandRegistry;
  fireOnReload: (forcedReload?: boolean) => void;
}

export abstract class BrowserModule<T = any> extends BasicModule {
  @Autowired(IClientApp)
  protected app: IClientApp;
  public preferences?: (injector: Injector) => void;
  public component?: React.ComponentType<T>;

  // 脱离于文档流的模块
  public isOverlay?: boolean;
}
