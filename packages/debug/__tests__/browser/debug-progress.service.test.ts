import { IContextKeyService, QuickPickService } from '@Nuvio-MCP/ide-core-browser';
import { IFileServiceClient } from '@Nuvio-MCP/ide-core-common';
import { DebugPreferences } from '@Nuvio-MCP/ide-debug/lib/browser/debug-preferences';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor/lib/browser';
import { MockFileServiceClient } from '@Nuvio-MCP/ide-file-service/__mocks__/file-service-client';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../../tools/dev-tool/src/mock-injector';
import { MockContextKeyService } from '../../../monaco/__mocks__/monaco.context-key.service';

import { DebugProgressService } from './../../src/browser/debug-progress.service';
import { DebugSessionManager } from './../../src/browser/debug-session-manager';
import { DebugModelFactory } from './../../src/common/debug-model';
import { IDebugProgress } from './../../src/common/debug-progress';
import { IDebugServer } from './../../src/common/debug-service';
import { IDebugSessionManager } from './../../src/common/debug-session';

describe('DebugProgressService', () => {
  let debugProgressService: IDebugProgress;
  let injector: MockInjector;

  const debugSessionManager = {
    onDidChangeActiveDebugSession: jest.fn(),
  };

  beforeAll(() => {
    injector = createBrowserInjector(
      [],
      new MockInjector([
        {
          token: IContextKeyService,
          useClass: MockContextKeyService,
        },
        {
          token: IDebugProgress,
          useClass: DebugProgressService,
        },
        {
          token: IDebugSessionManager,
          useClass: DebugSessionManager,
        },
        {
          token: WorkbenchEditorService,
          useValue: {},
        },
        {
          token: DebugModelFactory,
          useValue: {},
        },
        {
          token: IFileServiceClient,
          useValue: MockFileServiceClient,
        },
        {
          token: IWorkspaceService,
          useValue: {},
        },
        {
          token: IDebugServer,
          useValue: {},
        },
        {
          token: QuickPickService,
          useValue: {},
        },
        {
          token: DebugPreferences,
          useValue: {},
        },
      ]),
    );
    debugProgressService = injector.get(IDebugProgress);
  });

  afterAll(async () => {
    await injector.disposeAll();
  });

  it('should have enough API', () => {
    expect(typeof debugProgressService.run).toBe('function');
    expect(typeof debugProgressService.onDebugServiceStateChange).toBe('function');
  });

  it('run should be ok.', () => {
    debugProgressService.run(debugSessionManager as any);

    expect(debugSessionManager.onDidChangeActiveDebugSession).toHaveBeenCalledTimes(1);
  });
});
