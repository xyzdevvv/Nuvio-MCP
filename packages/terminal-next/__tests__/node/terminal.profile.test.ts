import { Injector } from '@Nuvio-MCP/di';
import { createNodeInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';

import { TerminalNodePtyModule } from '../../src/node';
import { TerminalProfileServiceNode } from '../../src/node/terminal.profile.service';

describe('TerminalServiceClientImpl', () => {
  let injector: Injector;
  let terminalProfileService: TerminalProfileServiceNode;

  beforeEach(() => {
    injector = createNodeInjector([TerminalNodePtyModule]);
    terminalProfileService = injector.get(TerminalProfileServiceNode);
  });

  it('will get 0 profiles without any input data', async () => {
    const ps = await terminalProfileService.detectAvailableProfiles({
      autoDetect: false,
    });

    expect(ps).toHaveLength(0);
  });

  it('can parse preference configs', async () => {
    const ps = await terminalProfileService.detectAvailableProfiles({
      autoDetect: false,
      preference: {
        bash: {
          path: '/bin/bash',
          args: ['-l'],
        },
      },
    });

    expect(ps).toHaveLength(1);
    expect(ps[0].profileName).toEqual('bash');
    expect(ps[0].args).toEqual(['-l']);
  });
  it('can resolve autoDetect profiles', async () => {
    const ps = await terminalProfileService.detectAvailableProfiles({
      autoDetect: true,
    });

    expect(ps.length).toBeGreaterThan(0);
  });
});
