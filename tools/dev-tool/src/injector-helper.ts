import { Injectable, Injector } from '@Nuvio-MCP/di';
import { MockLogger, MockLoggerManageClient, MockLoggerService } from '@Nuvio-MCP/ide-core-browser/__mocks__/logger';
import { useMockStorage } from '@Nuvio-MCP/ide-core-browser/__mocks__/storage';
import { ClientApp } from '@Nuvio-MCP/ide-core-browser/lib/bootstrap/app';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser/lib/browser-module';
import { IContextKeyService } from '@Nuvio-MCP/ide-core-browser/lib/context-key';
import { RecentFilesManager } from '@Nuvio-MCP/ide-core-browser/lib/quick-open';
import {
  CommonServerPath,
  ConstructorOf,
  ILogServiceManager,
  ILogger,
  ILoggerManagerClient,
  LogLevel,
  LogServiceForClientPath,
  OS,
  getDebugLogger,
} from '@Nuvio-MCP/ide-core-common';
import { MockContextKeyService } from '@Nuvio-MCP/ide-monaco/__mocks__/monaco.context-key.service';

import { MockInjector } from './mock-injector';

@Injectable()
class MockMainLayout extends BrowserModule {}

export interface MockClientApp extends ClientApp {
  injector: MockInjector;
}

export async function createBrowserApp(
  modules: Array<ConstructorOf<BrowserModule>>,
  inj?: MockInjector,
): Promise<MockClientApp> {
  const injector = inj || new MockInjector();
  // 需要依赖前后端模块
  injector.addProviders(
    {
      token: ILoggerManagerClient,
      useValue: {
        getLogger() {
          return getDebugLogger();
        },
      },
    },
    {
      token: CommonServerPath,
      useValue: {
        getBackendOS: jest.fn(() => OS.Type.OSX),
      },
    },
  );
  const app = new ClientApp({
    modules: [MockMainLayout, ...modules],
    injector,
    layoutConfig: {},
  } as any) as MockClientApp;
  await app.start(document.getElementById('main')!);
  return app;
}

@Injectable()
class MockLogServiceForClient {
  private level: LogLevel;

  hasDisposeAll = false;

  async setGlobalLogLevel(level) {
    this.level = level;
  }

  async getGlobalLogLevel() {
    return this.level;
  }
  async getLevel() {
    return this.level;
  }
  async setLevel(level: LogLevel) {
    this.level = level;
  }
  async verbose() {
    //
  }
  async debug() {}
  async warn() {}
  async log() {}
  async error() {}
  async critical() {}
  async disposeLogger() {}
  async disposeAll() {
    this.hasDisposeAll = true;
  }
}

function getBrowserMockInjector() {
  const injector = new MockInjector();
  useMockStorage(injector);
  injector.addProviders(
    {
      token: IContextKeyService,
      useClass: MockContextKeyService,
    },
    {
      token: RecentFilesManager,
      useValue: {
        getMostRecentlyOpenedFiles: () => [],
      },
    },
    {
      token: LogServiceForClientPath,
      useClass: MockLogServiceForClient,
    },
    {
      token: ILoggerManagerClient,
      useClass: MockLoggerManageClient,
    },
    {
      token: ILogServiceManager,
      useClass: MockLoggerService,
    },
    {
      token: ILogger,
      useClass: MockLogger,
    },
  );
  return injector;
}

export function createBrowserInjector(modules: Array<ConstructorOf<BrowserModule>>, inj?: Injector): MockInjector {
  const injector = inj || getBrowserMockInjector();
  const app = new ClientApp({ modules, injector } as any);

  return app.injector as MockInjector;
}
