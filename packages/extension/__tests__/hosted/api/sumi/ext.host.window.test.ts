import { IRPCProtocol } from '@Nuvio-MCP/ide-connection/lib/common/rpc/multiplexer';
import { IWindowInfo } from '@Nuvio-MCP/ide-extension/lib/common/sumi/window';
import { ExtHostIDEWindow, ExtIDEWebviewWindow } from '@Nuvio-MCP/ide-extension/lib/hosted/api/sumi/ext.host.window';
import { createWindowApiFactory } from '@Nuvio-MCP/ide-extension/lib/hosted/api/sumi/ext.host.window';

import { createBrowserInjector } from '../../../../../../tools/dev-tool/src/injector-helper';
import { MainThreadSumiAPIIdentifier } from '../../../../src/common/sumi';
import { MainThreadAPIIdentifier } from '../../../../src/common/vscode';
import { ExtHostCommands } from '../../../../src/hosted/api/vscode/ext.host.command';

const mockMainThreadIDEWindowProxy = {
  $createWebviewWindow: jest.fn(async () => {
    const info: IWindowInfo = {
      webContentsId: 100,
      windowId: 99,
    };
    return info;
  }),
  $show: jest.fn(),
  $hide: jest.fn(),
  $postMessage: jest.fn(),
  $loadURL: jest.fn(),
  $setSize: jest.fn(),
  $destroy: jest.fn(),
  $setAlwaysOnTop: jest.fn(),
};

const mockMainThreadCommandProxy = {
  $executeCommand: jest.fn(() => new Promise(() => ({}))),
};

const map = new Map();

const rpcProtocol: IRPCProtocol = {
  getProxy: (key) => map.get(key),
  set: (key, value) => {
    map.set(key, value);
    return value;
  },
  get: (r) => map.get(r),
};

describe('packages/extension/__tests__/hosted/api/sumi/ext.host.window.test.ts', () => {
  let extHostIDEWindow: ExtHostIDEWindow;
  let extHostCommands: ExtHostCommands;
  let windowAPI: ReturnType<typeof createWindowApiFactory>;

  const injector = createBrowserInjector([]);

  beforeAll(() => {
    rpcProtocol.set(MainThreadSumiAPIIdentifier.MainThreadIDEWindow, mockMainThreadIDEWindowProxy as any);
    rpcProtocol.set(MainThreadAPIIdentifier.MainThreadCommands, mockMainThreadCommandProxy as any);

    extHostIDEWindow = injector.get(ExtHostIDEWindow, [rpcProtocol]);
    extHostCommands = injector.get(ExtHostCommands, [rpcProtocol]);
    windowAPI = createWindowApiFactory(extHostCommands, extHostIDEWindow);
  });

  it('reloadWindow should be work', () => {
    windowAPI.reloadWindow();
    expect(mockMainThreadCommandProxy.$executeCommand).toHaveBeenCalledTimes(1);
  });

  describe('createWebviewWindow should be work', () => {
    const webviewId = 'TestView';
    let window: ExtIDEWebviewWindow;

    beforeAll(async () => {
      window = (await windowAPI.createWebviewWindow(webviewId, {}, {}))!;
    });

    it('message event can be received', (done) => {
      expect(window).toBeDefined();
      const testMessage = 'message';
      window.onMessage((message) => {
        expect(message).toBe(testMessage);
        done();
      });
      extHostIDEWindow.$postMessage(webviewId, testMessage);
    });

    it('closed event can be received', (done) => {
      window.onClosed(() => {
        done();
      });
      extHostIDEWindow.$dispatchClosed(webviewId);
    });

    it('show method should be work', () => {
      window.show();
      expect(mockMainThreadIDEWindowProxy.$show).toHaveBeenCalledTimes(1);
    });

    it('hide method should be work', () => {
      window.hide();
      expect(mockMainThreadIDEWindowProxy.$hide).toHaveBeenCalledTimes(1);
    });

    it('postMessage method should be work', () => {
      window.postMessage('message');
      expect(mockMainThreadIDEWindowProxy.$postMessage).toHaveBeenCalledTimes(1);
    });

    it('loadUrl method should be work', () => {
      window.loadUrl('http://Nuvio-MCP.com');
      expect(mockMainThreadIDEWindowProxy.$loadURL).toHaveBeenCalledTimes(1);
    });

    it('setSize method should be work', () => {
      window.setSize({ width: 100, height: 200 });
      expect(mockMainThreadIDEWindowProxy.$setSize).toHaveBeenCalledTimes(1);
    });

    it('setAlwaysOnTop method should be work', () => {
      window.setAlwaysOnTop(true);
      expect(mockMainThreadIDEWindowProxy.$setSize).toHaveBeenCalledTimes(1);
    });

    it('window should contain windowId and webContentsID', () => {
      expect(window.windowId).toBe(99);
      expect(window.webContentsId).toBe(100);
    });

    it('dispose method should be work', () => {
      window.dispose();
      expect(mockMainThreadIDEWindowProxy.$destroy).toHaveBeenCalledTimes(1);
    });
  });
});
