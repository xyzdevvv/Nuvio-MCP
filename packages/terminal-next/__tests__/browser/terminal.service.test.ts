import os from 'os';
import path from 'path';

import fse from 'fs-extra';
import httpProxy from 'http-proxy';
import WebSocket from 'ws';

import { AppConfig } from '@Nuvio-MCP/ide-core-browser';
import { FileUri, OperatingSystem, URI } from '@Nuvio-MCP/ide-core-common';
import { EnvironmentVariableServiceToken } from '@Nuvio-MCP/ide-terminal-next/lib/common/environmentVariable';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { MockEnvironmentVariableService } from '../../../extension/__tests__/hosted/__mocks__/environmentVariableService';
import { NodePtyTerminalService } from '../../src/browser/terminal.service';
import { IShellLaunchConfig, ITerminalService, ITerminalServicePath, TERMINAL_ID_SEPARATOR } from '../../src/common';

import { injector } from './inject';
import { createProxyServer, createWsServer, resetPort } from './proxy';

describe('terminal service test cases', () => {
  let terminalService: ITerminalService;
  const sessionId = 'test-session-id';
  let shellPath = '';

  if (os.platform() === 'win32') {
    shellPath = 'powershell';
  } else if (os.platform() === 'linux' || os.platform() === 'darwin') {
    shellPath = 'sh';
  }

  let proxy: httpProxy;
  let server: WebSocket.Server;
  let workspaceService: IWorkspaceService;
  let root: URI | null;
  let launchConfig: IShellLaunchConfig | undefined;
  beforeAll(async () => {
    root = FileUri.create(path.join(os.tmpdir(), 'terminal-service-test'));

    await fse.ensureDir(root.path.toString());

    workspaceService = injector.get(IWorkspaceService);

    injector.addProviders({
      token: EnvironmentVariableServiceToken,
      useValue: MockEnvironmentVariableService,
    });

    await workspaceService.setWorkspace({
      uri: root.toString(),
      lastModification: new Date().getTime(),
      isDirectory: true,
    });
    resetPort();

    server = createWsServer();
    proxy = createProxyServer();

    injector.overrideProviders(
      {
        token: ITerminalService,
        useClass: NodePtyTerminalService,
      },
      {
        token: AppConfig,
        useValue: {
          isElectronRenderer: true,
          isRemote: false,
        },
      },
    );

    injector.overrideProviders({
      token: ITerminalServicePath,
      useValue: {
        getCodePlatformKey() {
          return 'osx';
        },
        getDefaultSystemShell() {
          return '/bin/sh';
        },
        getOS() {
          return OperatingSystem.Macintosh;
        },
        detectAvailableProfiles() {
          return [];
        },
        create2: (sessionId, cols, rows, _launchConfig) => {
          launchConfig = _launchConfig;
          setTimeout(() => {
            (terminalService as any)?.$processChange(sessionId, 'zsh');
          });
        },
        $resolveUnixShellPath(p) {
          return p;
        },
      },
    });
  });

  afterAll(async () => {
    await server.close();
    await proxy.close();
    await injector.disposeAll();
  });

  beforeEach(() => {
    terminalService = injector.get(ITerminalService);
  });

  afterEach(() => {
    launchConfig = undefined;
  });
  it('should be generate a session id', async () => {
    const sessionId = await terminalService.generateSessionId?.();
    expect(sessionId).toMatch(/^test-window-client-id.*/);
    expect(sessionId).toContain(TERMINAL_ID_SEPARATOR);
  });

  it('[attachByLaunchConfig] should be valid launchConfig with a valid shell path and ignore type', async () => {
    await terminalService.attachByLaunchConfig(
      sessionId,
      200,
      200,
      {
        executable: shellPath,
      },
      {} as any,
    );
    expect(launchConfig?.executable).toEqual(shellPath);
  });

  it('[attachByLaunchConfig] can launch valid config', async () => {
    const launchConfig: IShellLaunchConfig = {
      executable: shellPath,
    };
    await terminalService.attachByLaunchConfig(sessionId, 200, 200, launchConfig, {} as any);
    expect(launchConfig?.executable).toEqual(shellPath);
  });

  it('terminal process name will change', (done) => {
    expect.assertions(2);
    const launchConfig: IShellLaunchConfig = {
      executable: shellPath,
    };
    terminalService.onProcessChange((e) => {
      expect(e.sessionId).toBe(sessionId);
      expect(e.processName).toBe('zsh');
      done();
    });
    terminalService.attachByLaunchConfig(sessionId, 200, 200, launchConfig, {} as any);
  });
});
