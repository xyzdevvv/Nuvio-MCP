import { MockInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';

import { EventBusImpl, IEventBus } from '../src/event-bus/index';

export function getInjector() {
  return new MockInjector([
    {
      token: IEventBus,
      useClass: EventBusImpl,
    },
  ]);
}
