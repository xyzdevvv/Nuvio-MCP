import { createNodeInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';
import { MockInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';

import { AddonsModule } from '../../src/node';

describe('test for', () => {
  let injector: MockInjector;

  beforeEach(() => {
    injector = createNodeInjector([AddonsModule]);
  });

  it('empty module', () => {
    const ins = injector.get(AddonsModule);
    expect(ins.providers.length).toBe(2);
  });
});
