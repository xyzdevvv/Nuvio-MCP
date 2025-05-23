import { IExtensionInfo, Uri } from '@Nuvio-MCP/ide-core-common';
import { IMainThreadWebview, MainThreadAPIIdentifier } from '@Nuvio-MCP/ide-extension/lib/common/vscode';
import { ExtHostWebview } from '@Nuvio-MCP/ide-extension/lib/hosted/api/sumi/ext.host.webview';
import { ExtHostWebviewService } from '@Nuvio-MCP/ide-extension/lib/hosted/api/vscode/ext.host.api.webview';

import { mockService } from '../../../../../../tools/dev-tool/src/mock-injector';
describe('vscode extHostWebview Test', () => {
  const map = new Map();
  const rpcProtocol = {
    getProxy: (r) => map.get(r),
    set: map.set.bind(map),
  };

  const mainService: IMainThreadWebview = mockService({
    $getWebviewResourceRoots() {
      return ['testResourceRoots'];
    },
  }) as any;

  rpcProtocol.set(MainThreadAPIIdentifier.MainThreadWebview, mainService);

  const extHostWebview = new ExtHostWebviewService(rpcProtocol as any);

  it('ext host vscode webview test', async () => {
    await extHostWebview.$init();
    expect((extHostWebview as any).resourceRoots).toEqual(['testResourceRoots']);
    const extensionInfo: IExtensionInfo = {
      id: 'id',
      extensionId: 'extensionId',
      isBuiltin: true,
    };
    const webviewPanel = extHostWebview.createWebview(
      undefined,
      'editor',
      'testWebview',
      { viewColumn: 1 },
      { enableFindWidget: true },
      extensionInfo,
    );

    const id = (webviewPanel as any)._handle;

    expect(mainService.$createWebviewPanel).toHaveBeenCalledWith(
      id,
      'editor',
      'testWebview',
      expect.objectContaining({ viewColumn: 1 }),
      expect.objectContaining({ enableFindWidget: true }),
      extensionInfo,
    );

    // basic
    expect(webviewPanel.title).toBe('testWebview');
    expect(webviewPanel.viewType).toBe('editor');
    expect(webviewPanel.webview).toBeDefined();
    expect(webviewPanel.options.enableFindWidget).toBeTruthy();

    // setIconPath
    const uri = Uri.parse('file:///testicon');
    webviewPanel.iconPath = uri;
    expect(webviewPanel.iconPath).toBe(uri);
    expect(mainService.$setIconPath).toHaveBeenCalled();

    // setHtml
    webviewPanel.webview.html = '<div>test<div>';
    expect(webviewPanel.webview.html).toBe('<div>test<div>');
    expect(mainService.$setHtml).toHaveBeenCalledWith(id, '<div>test<div>');

    // setOption
    webviewPanel.webview.options = { enableScripts: true };
    expect(webviewPanel.webview.options.enableScripts).toBeTruthy();
    expect(mainService.$setOptions).toHaveBeenCalledWith(id, expect.objectContaining({ enableScripts: true }));

    // setTitle
    webviewPanel.title = 'testTitle2';
    expect(mainService.$setTitle).toHaveBeenCalledWith(id, 'testTitle2');

    // messaging
    const onMessageHandler = jest.fn();
    webviewPanel.webview.onDidReceiveMessage(onMessageHandler);
    extHostWebview.$onMessage(id, 'testMessage');
    expect(onMessageHandler).toHaveBeenCalledWith('testMessage');

    webviewPanel.webview.postMessage('testPostMessage');
    expect(mainService.$postMessage).toHaveBeenCalledWith(id, 'testPostMessage');

    // viewState
    const states = [
      {
        visible: true,
        active: true,
        position: 5,
      },
      {
        visible: false,
        active: false,
        position: 1,
      },
    ];
    states.forEach((state) => {
      extHostWebview.$onDidChangeWebviewPanelViewState(id, state);
      expect(webviewPanel.viewColumn).toBe(state.position);
      expect(webviewPanel.visible).toBe(state.visible);
      expect(webviewPanel.active).toBe(state.active);
    });

    // dispose
    await extHostWebview.$onDidDisposeWebviewPanel(id);
    expect((webviewPanel as any)._isDisposed).toBeTruthy();
    expect(() => webviewPanel.webview).toThrow();
  });
});

describe('sumi extHostWebview Test', () => {
  const map = new Map();
  const rpcProtocol = {
    getProxy: (r) => map.get(r),
    set: map.set.bind(map),
  };

  const mainService: IMainThreadWebview = mockService({}) as any;

  rpcProtocol.set(MainThreadAPIIdentifier.MainThreadWebview, mainService);

  const extHostWebview = new ExtHostWebview(rpcProtocol as any);

  it('ext host sumi webview test', async () => {
    const handle1 = await extHostWebview.getWebviewHandle('existingWebview');
    expect(mainService.$connectPlainWebview).toHaveBeenCalledWith('existingWebview');

    const handle2 = await extHostWebview.createPlainWebview('testPlain', 'path/to/icon');
    expect(mainService.$createPlainWebview).toHaveBeenCalledWith((handle2 as any).id, 'testPlain', 'path/to/icon');

    const handle2Id = (handle2 as any).id;

    await handle2.reveal(1);
    expect(mainService.$revealPlainWebview).toHaveBeenCalledWith(handle2Id, 1);

    await handle2.loadUrl('http://example.com');
    expect(mainService.$plainWebviewLoadUrl).toHaveBeenCalledWith(handle2Id, 'http://example.com');

    const onMessageHandler = jest.fn();
    handle2.onMessage(onMessageHandler);
    extHostWebview.$acceptMessage(handle2Id, 'testMessage');
    expect(onMessageHandler).toHaveBeenCalledWith('testMessage');

    handle2.postMessage('postTestMessage');
    expect(mainService.$postMessageToPlainWebview).toHaveBeenCalledWith(handle2Id, 'postTestMessage');

    handle1.dispose();
    handle2.dispose();
  });
});
