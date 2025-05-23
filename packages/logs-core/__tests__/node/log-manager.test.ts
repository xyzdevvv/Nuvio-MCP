import path from 'path';

import * as fs from 'fs-extra';
import temp from 'temp';

import { toLocalISOString } from '@Nuvio-MCP/ide-core-common';
import { AppConfig } from '@Nuvio-MCP/ide-core-node/lib/types';
import { createNodeInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';
import { MockInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';

import { ILogServiceManager, LogLevel, SupportLogNamespace } from '../../src/common';
import { LogServiceModule } from '../../src/node';

let track;
let logDir;
const today = Number(
  toLocalISOString(new Date())
    .replace(/-/g, '')
    .match(/^\d{8}/)?.[0],
);

describe('LogServiceManager', () => {
  let injector: MockInjector;
  let loggerManager: ILogServiceManager;

  beforeAll(async () => {
    track = temp.track();
    logDir = await temp.mkdir('log-test');
    injector = createNodeInjector(
      [LogServiceModule],
      new MockInjector([
        {
          token: AppConfig,
          useValue: {
            logDir,
          },
        },
      ]),
    );
    loggerManager = injector.get(ILogServiceManager);
    loggerManager.setGlobalLogLevel(LogLevel.Error);
  });

  afterAll(() => {
    loggerManager.cleanAllLogs();
    track.cleanupSync();
  });

  test('Set 、get LogLevel', () => {
    ['20190801', '20190802', '20190803', '20190804', '20190805'].forEach((day) => {
      try {
        fs.mkdirpSync(path.join(logDir, day));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    });
    const logger = loggerManager.getLogger(SupportLogNamespace.Node);
    expect(logger.getLevel()).toBe(LogLevel.Error);
  });

  test.skip('GetLogZipArchiveByDay', async () => {
    const archive = await loggerManager.getLogZipArchiveByDay(today);
    expect(archive.pipe).toBeInstanceOf(archive.pipe.constructor);
  });

  test('Clean log folder cleanOldLogs', async () => {
    await loggerManager.cleanOldLogs();

    const children = fs.readdirSync(logDir);
    expect(children.length).toBe(5);
    expect(children.some((child) => child === '20190801')).toBe(false);
  });

  test('Clean log folder cleanExpiredLogs', async () => {
    await loggerManager.cleanExpiredLogs(today);

    const children = fs.readdirSync(logDir);
    expect(children.length).toBe(1);
  });
});
