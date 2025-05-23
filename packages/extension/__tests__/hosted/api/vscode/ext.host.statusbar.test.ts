import { WSChannelHandler } from '@Nuvio-MCP/ide-connection/lib/browser/ws-channel-handler';
import { IContextKeyService, IStatusBarService } from '@Nuvio-MCP/ide-core-browser';
import { MockContextKeyService } from '@Nuvio-MCP/ide-core-browser/__mocks__/context-key';
import { uuid } from '@Nuvio-MCP/ide-core-common';
import { StatusBarService } from '@Nuvio-MCP/ide-status-bar/lib/browser/status-bar.service';

import { createBrowserInjector } from '../../../../../../tools/dev-tool/src/injector-helper';
import { mockService } from '../../../../../../tools/dev-tool/src/mock-injector';
import { mockExtensionDescription } from '../../../../__mocks__/extensions';
import { createMockPairRPCProtocol } from '../../../../__mocks__/initRPCProtocol';
import { MainThreadStatusBar } from '../../../../src/browser/vscode/api/main.thread.statusbar';
import { ExtHostAPIIdentifier, MainThreadAPIIdentifier } from '../../../../src/common/vscode';
import { ThemeColor } from '../../../../src/common/vscode/ext-types';
import { ExtHostStatusBar } from '../../../../src/hosted/api/vscode/ext.host.statusbar';

const { rpcProtocolExt, rpcProtocolMain } = createMockPairRPCProtocol();

let extHost: ExtHostStatusBar;
let mainThread: MainThreadStatusBar;

describe('vscode MainThreadStatusBar Test', () => {
  let injector;

  beforeEach(() => {
    injector = createBrowserInjector([]);
    injector.addProviders(
      {
        token: WSChannelHandler,
        useValue: mockService({
          clientId: uuid(),
        }),
      },
      {
        token: IStatusBarService,
        useClass: StatusBarService,
      },
      {
        token: IContextKeyService,
        useClass: MockContextKeyService,
      },
    );
    extHost = new ExtHostStatusBar(rpcProtocolExt);
    rpcProtocolExt.set(ExtHostAPIIdentifier.ExtHostStatusBar, extHost);

    mainThread = rpcProtocolMain.set(
      MainThreadAPIIdentifier.MainThreadStatusBar,
      injector.get(MainThreadStatusBar, [rpcProtocolMain]),
    );
  });

  afterEach(async () => {
    await injector.disposeAll();
    jest.resetAllMocks();
  });

  it('support id', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription, 'test');
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect($setMessage.mock.calls[0][1]).toBe('test.sumi-extension.test');
      done();
    }, 100);
  });

  it('support name', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription, 'test');

    statusbar.name = 'test name';
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect($setMessage.mock.calls[0][2]).toBe('test name');
      done();
    }, 100);
  });

  it('support command', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription);
    statusbar.command = 'test';
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect($setMessage.mock.calls[0][10]).toBe('test');
      expect($setMessage.mock.calls[0][11]).toBe(undefined);
      done();
    }, 100);
  });

  it('support command arguments', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription);
    statusbar.command = {
      title: 'test',
      command: 'test',
      arguments: ['test2'],
    };
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect($setMessage.mock.calls[0][10]).toBe('test');
      expect($setMessage.mock.calls[0][11]).toStrictEqual(['test2']);
      done();
    }, 100);
  });

  it('support accessibilityInformation', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription);
    statusbar.accessibilityInformation = {
      label: 'User',
      role: 'danzong',
    };
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect($setMessage.mock.calls[0][9]).toStrictEqual({ label: 'User', role: 'danzong' });
      done();
    }, 100);
  });

  it('support backgroundColor', (done) => {
    // mock mainThread.$setMessage
    const $setMessage = jest.spyOn(mainThread, '$setMessage');

    const statusbar = extHost.createStatusBarItem(mockExtensionDescription);
    statusbar.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
    statusbar.color = 'red';
    statusbar.show();
    // statusbar host 调用 main 有一个 定时器
    setTimeout(() => {
      expect(($setMessage.mock.calls[0][6] as ThemeColor).id).toStrictEqual('statusBarItem.errorForeground');
      expect(($setMessage.mock.calls[0][7] as ThemeColor).id).toStrictEqual('statusBarItem.errorBackground');
      done();
    }, 100);
  });
});
