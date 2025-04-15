import { IDebugService } from '@Nuvio-MCP/ide-debug';
import { DebugService } from '@Nuvio-MCP/ide-debug/lib/browser/debug-service';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../../tools/dev-tool/src/mock-injector';

describe('DebugService', () => {
  let debugService: IDebugService;
  let injector: MockInjector;

  beforeAll(() => {
    injector = createBrowserInjector(
      [],
      new MockInjector([
        {
          token: IDebugService,
          useClass: DebugService,
        },
      ]),
    );
    debugService = injector.get(IDebugService);
  });

  afterAll(async () => {
    await injector.disposeAll();
  });

  it('registerDebugContributionPoints should emit change', (done) => {
    debugService.onDidDebugContributionPointChange(() => {
      done();
    });

    debugService.registerDebugContributionPoints('file://extensions/a', [
      {
        title: 'node',
      },
    ]);
  });

  it('registerDebugContributionPoints should emit change', () => {
    expect(debugService.debugContributionPoints.size).toBe(1);

    debugService.unregisterDebugContributionPoints('file://extensions/a');

    expect(debugService.debugContributionPoints.size).toBe(0);
  });
});
