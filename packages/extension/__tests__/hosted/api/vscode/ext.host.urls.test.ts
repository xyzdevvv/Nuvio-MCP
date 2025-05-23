import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { Uri } from '@Nuvio-MCP/ide-core-common';
import { IMainThreadUrls, MainThreadAPIIdentifier } from '@Nuvio-MCP/ide-extension/lib/common/vscode';

import { mockService } from '../../../../../../tools/dev-tool/src/mock-injector';
import { ExtHostUrls } from '../../../../src/hosted/api/vscode/ext.host.urls';

describe('extension/__tests__/hosted/api/vscode/ext.host.urls.test.ts', () => {
  let mainService: IMainThreadUrls;
  let extHostUrls: ExtHostUrls;

  beforeEach(() => {
    const map = new Map();
    const rpcProtocol: IRPCProtocol = {
      getProxy: (key) => map.get(key),
      set: (key, value) => {
        map.set(key, value);
        return value;
      },
      get: (r) => map.get(r),
    };

    mainService = mockService({
      $registerUriHandler: jest.fn(),
      $unregisterUriHandler: jest.fn(),
    });
    rpcProtocol.set(MainThreadAPIIdentifier.MainThreadUrls, mainService);
    extHostUrls = new ExtHostUrls(rpcProtocol);
  });

  it('register a url handler', () => {
    const handleUri = jest.fn();
    extHostUrls.registerUriHandler('vscode.git', {
      handleUri,
    });
    expect(mainService.$registerUriHandler).toHaveBeenCalledTimes(1);
    const uri = Uri.file('/123');
    extHostUrls.$handleExternalUri(0, uri);
    expect(handleUri).toHaveBeenCalledTimes(1);
    expect(handleUri).toHaveBeenCalledWith(uri);
  });

  it('will throw error when the extension already registered handler', () => {
    const extensionId = 'vscode.git';
    extHostUrls.registerUriHandler(extensionId, {
      handleUri: jest.fn(),
    });
    // 注册两次会抛异常
    expect(() =>
      extHostUrls.registerUriHandler(extensionId, {
        handleUri: jest.fn(),
      }),
    ).toThrow();
  });

  it('distpose a url handler', () => {
    const disposer = extHostUrls.registerUriHandler('vscode.git', {
      handleUri: jest.fn(),
    });
    disposer.dispose();
    expect(mainService.$unregisterUriHandler).toHaveBeenCalledTimes(1);
  });
});
