import { WSChannelHandler } from '@Nuvio-MCP/ide-connection/lib/browser';
import { ReconnectingWebSocketConnection } from '@Nuvio-MCP/ide-connection/lib/common/connection/drivers/reconnecting-websocket';
import { BrowserConnectionErrorEvent, IEventBus } from '@Nuvio-MCP/ide-core-common';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { MockInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';
import { Server, WebSocket } from '@Nuvio-MCP/mock-socket';

import { ClientAppStateService } from '../../src/application';
import { createConnectionService } from '../../src/bootstrap/connection';
(global as any).WebSocket = WebSocket;

describe('packages/core-browser/src/bootstrap/connection.test.ts', () => {
  let injector: MockInjector;
  let eventBus: IEventBus;
  let stateService: ClientAppStateService;
  beforeEach(() => {
    injector = createBrowserInjector([]);

    eventBus = injector.get(IEventBus);
  });

  afterEach(async () => {
    await injector.disposeAll();
  });

  it('handle WebSocket BrowserConnectionErrorEvent event', (done) => {
    const fakeWSURL = 'ws://localhost:8089';
    const mockServer = new Server(fakeWSURL);
    eventBus.on(BrowserConnectionErrorEvent, () => {
      mockServer.close();
      done();
    });
    stateService = injector.get(ClientAppStateService);
    const channelHandler = new WSChannelHandler(ReconnectingWebSocketConnection.forURL(fakeWSURL), 'test-client-id');
    createConnectionService(injector, [], channelHandler);
    stateService.state = 'core_module_initialized';
    new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 4000);
    }).then(() => {
      mockServer.simulate('error');
    });
  });
});
