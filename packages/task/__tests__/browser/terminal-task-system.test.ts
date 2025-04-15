import { TerminalTaskSystem } from '@Nuvio-MCP/ide-task/lib/browser/terminal-task-system';
import { ITaskSystem } from '@Nuvio-MCP/ide-task/lib/common';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../../tools/dev-tool/src/mock-injector';

describe('TerminalTaskSystem Test Suite', () => {
  const injector: MockInjector = createBrowserInjector([]);
  injector.addProviders(
    ...[
      {
        token: ITaskSystem,
        useClass: TerminalTaskSystem,
      },
    ],
  );

  it('happy test', (done) => {
    done();
  });
});
