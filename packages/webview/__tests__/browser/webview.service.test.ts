import { StaticResourceService } from '@Nuvio-MCP/ide-core-browser/lib/static-resource';
import { Disposable } from '@Nuvio-MCP/ide-core-common';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { EditorComponentRegistry, EditorPreferences } from '@Nuvio-MCP/ide-editor/lib/browser';
import { ITheme, IThemeService } from '@Nuvio-MCP/ide-theme';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../../tools/dev-tool/src/mock-injector';
import { IWebviewService } from '../../src/browser';
import { ElectronPlainWebview } from '../../src/browser/plain-webview';
import { WebviewServiceImpl } from '../../src/browser/webview.service';

let injector: MockInjector;
const providers = [
  {
    token: IWebviewService,
    useClass: WebviewServiceImpl,
  },
  {
    token: IThemeService,
    useValue: {
      getCurrentThemeSync: () =>
        ({
          type: 'dark',
          themeData: { id: 'vs-dark' } as any,
          defines: () => false,
          getColor: () => undefined,
        } as ITheme),
    },
  },
  {
    token: StaticResourceService,
    useValue: {
      registerStaticResourceProvider(provider) {
        return new Disposable();
      },
      resolveStaticResource(uri) {
        return uri;
      },
    },
  },
  {
    token: EditorComponentRegistry,
    useValue: {},
  },
  {
    token: WorkbenchEditorService,
    useValue: {},
  },
  {
    token: EditorPreferences,
    useValue: {},
  },
];

mockIframeAndElectronWebview();

describe('web platform webview service test suite', () => {
  beforeAll(() => {
    injector = createBrowserInjector([]);
    injector.addProviders(...providers);
  });

  it('should be able to create iframe webview', async () => {
    const service: IWebviewService = injector.get(IWebviewService);
    const webview = service.createWebview();
    expect(webview).toBeDefined();
    webview.appendTo(document.createElement('div'));
    const html = '<HTML> TEST <HTML>';
    await webview.setContent(html);
    expect(webview.getContent()).toBe(html);
  });

  it('should be able to create plain iframe webview', (done) => {
    const service: IWebviewService = injector.get(IWebviewService);
    const webview = service.createPlainWebview();
    expect(webview).toBeDefined();
    webview.appendTo(document.createElement('div'));
    (webview as any)._ready.resolve(); // mock ready;
    webview.loadURL('http://example.test.com').then(() => {
      expect(webview.url).toBe('http://example.test.com');
      done();
    });
    setTimeout(() => {
      const event = new window.Event('load');
      ((webview as any)._iframe as HTMLIFrameElement).dispatchEvent(event);
    }, 100);
  });

  it('should be able to create electron webview webviewComponent', async () => {
    const registerFn = jest.fn(() => new Disposable());
    const registerFn2 = jest.fn(() => new Disposable());
    injector.mock(EditorComponentRegistry, 'registerEditorComponent', registerFn);
    injector.mock(EditorComponentRegistry, 'registerEditorComponentResolver', registerFn2);
    const service: IWebviewService = injector.get(IWebviewService);
    const webview = service.createEditorPlainWebviewComponent();
    expect(webview).toBeDefined();
    expect(registerFn).toHaveBeenCalled();
    expect(registerFn2).toHaveBeenCalled();
  });
});

describe('electron platform webview service test suite', () => {
  beforeAll(() => {
    global.isElectronRenderer = true;
    injector = createBrowserInjector([]);
    injector.addProviders(...providers);
  });

  it('should be able to create electron webview', async () => {
    const service: IWebviewService = injector.get(IWebviewService);
    const webview = service.createWebview();
    expect(webview).toBeDefined();
    webview.appendTo(document.createElement('div'));
    const html = '<HTML> TEST <HTML>';
    await webview.setContent(html);
    expect(webview.getContent()).toBe(html);
  });

  it('should be able to create electron plain webview', async () => {
    const service: IWebviewService = injector.get(IWebviewService);
    const webview = service.createPlainWebview();
    expect(webview).toBeDefined();
    webview.appendTo(document.createElement('div'));
    await webview.loadURL('http://example.test.com');
    expect(webview.url).toBe('http://example.test.com');
  });

  it('can set partition in electron plain webview', async () => {
    const service: IWebviewService = injector.get(IWebviewService);
    const webview = service.createPlainWebview();
    webview.setPartition('persist:test');
    webview.appendTo(document.createElement('div'));
    await webview.loadURL('http://example.test.com');
    expect(webview.url).toBe('http://example.test.com');
    const domNode = (webview as ElectronPlainWebview).getWebviewElement();
    expect(domNode).toBeDefined();
    expect(domNode?.partition).toBe('persist:test');
  });

  it('should be able to create electron webview webviewComponent', async () => {
    const registerFn = jest.fn(() => new Disposable());
    const registerFn2 = jest.fn(() => new Disposable());
    injector.mock(EditorComponentRegistry, 'registerEditorComponent', registerFn);
    injector.mock(EditorComponentRegistry, 'registerEditorComponentResolver', registerFn2);
    const service: IWebviewService = injector.get(IWebviewService);
    const webview = service.createEditorPlainWebviewComponent();
    expect(webview).toBeDefined();
    expect(registerFn).toHaveBeenCalled();
    expect(registerFn2).toHaveBeenCalled();
  });

  afterAll(() => {
    global.isElectronRenderer = false;
  });
});

function mockIframeAndElectronWebview() {
  const original = document.createElement;
  document.createElement = function (tagName, ...args) {
    const element: any = original.call(this as any, tagName, ...args);
    if (tagName === 'iframe') {
      element.sandbox = {
        add: () => null,
      };
      Object.defineProperty(element, 'contentWindow', {
        get: () => ({
          document: {
            body: document.createElement('div'),
          },
        }),
      });
    }
    if (tagName === 'webview') {
    }
    return element;
  };
}

declare global {
  namespace NodeJS {
    interface Global {
      isElectronRenderer: boolean;
    }
  }
}
