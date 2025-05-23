import { CancellationTokenSource, Disposable, Emitter } from '@Nuvio-MCP/ide-core-common';
import { IMarkdownService } from '@Nuvio-MCP/ide-markdown';
import { MarkdownModule } from '@Nuvio-MCP/ide-markdown/lib/browser';
import { IWebview, IWebviewService } from '@Nuvio-MCP/ide-webview';

import { createBrowserInjector } from '../../../../tools/dev-tool/src/injector-helper';

describe('markdown test', () => {
  const injector = createBrowserInjector([MarkdownModule]);

  injector.addProviders({
    token: IWebviewService,
    useValue: {},
  });

  it('markdown service test', async () => {
    const webview = new MockedWebviewElement();
    injector.mock(IWebviewService, 'createWebview', () => webview);

    const markdownService: IMarkdownService = injector.get(IMarkdownService);

    const element = document.createElement('div');
    const markdownString = '### h1Content \n\n* list element1\n* list element2';
    const updateEvent = new Emitter<string>();
    await markdownService.previewMarkdownInContainer(
      markdownString,
      element,
      new CancellationTokenSource().token,
      undefined,
      updateEvent.event,
    );

    expect(webview.appendTo).toHaveBeenCalledWith(element);
    expect(webview.setContent).toHaveBeenCalledTimes(1);
    expect(webview.content).toContain('<li>');
    expect(webview.content).toContain('h1Content');
    expect(webview.content).toContain('list element1');

    expect(webview.onDidClickLink).toHaveBeenCalledTimes(1);

    await updateEvent.fireAndAwait('## h2Content');
    expect(webview.content).toContain('h2Content');
  });
});

class MockedWebviewElement extends Disposable implements Partial<IWebview> {
  appendTo = jest.fn();

  public content = '';

  setContent = jest.fn((content: string) => {
    this.content = content;
  }) as any;

  _onDidClickLink = new Emitter<any>();
  onDidClickLink = jest.fn(this._onDidClickLink.event);
}
