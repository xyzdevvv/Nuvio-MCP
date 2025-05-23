import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IMarkedOptions, parseMarkdown } from '@Nuvio-MCP/ide-components/lib/utils';
import { CancellationToken, Disposable, Event, IDisposable, IOpenerService, URI } from '@Nuvio-MCP/ide-core-browser';
import { HttpOpener } from '@Nuvio-MCP/ide-core-browser/lib/opener/http-opener';
import { IWebviewService } from '@Nuvio-MCP/ide-webview';

import { IMarkdownService } from '../common';

import { markdownCss } from './mardown.style';

@Injectable()
export class MarkdownServiceImpl implements IMarkdownService {
  @Autowired(IWebviewService)
  webviewService: IWebviewService;

  @Autowired(IOpenerService)
  private readonly openerService: IOpenerService;

  // 检测下支持的协议，以防打开内部协议
  private isSupportedLink(uri: URI) {
    return HttpOpener.standardSupportedLinkSchemes.has(uri.scheme);
  }

  async previewMarkdownInContainer(
    content: string,
    container: HTMLElement,
    cancellationToken: CancellationToken,
    options?: IMarkedOptions,
    onUpdate?: Event<string>,
    onLinkClick?: (uri: URI) => void,
  ): Promise<IDisposable> {
    const body = await this.getBody(content, options);
    if (cancellationToken.isCancellationRequested) {
      return new Disposable();
    }

    const disposer = new Disposable();
    const webviewElement = this.webviewService.createWebview({
      enableFindWidget: true,
      localResourceRoots: [],
    });
    webviewElement.appendTo(container);
    webviewElement.setContent(body);

    disposer.addDispose(
      webviewElement.onDidClickLink((link) => {
        if (!link) {
          return;
        }
        // Whitelist supported schemes for links
        if (this.isSupportedLink(link)) {
          this.openerService.open(link);
        }
        if (onLinkClick) {
          onLinkClick(link);
        }
      }),
    );
    disposer.addDispose(webviewElement);
    if (onUpdate) {
      disposer.addDispose(
        onUpdate(async (content) => {
          const body = await this.getBody(content, options);
          if (!cancellationToken.isCancellationRequested) {
            webviewElement.setContent(body);
          }
        }),
      );
    }

    return disposer;
  }

  async getBody(content: string, options: IMarkedOptions | undefined): Promise<string> {
    return new Promise((resolve, reject) => {
      parseMarkdown(content, options, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(removeEmbeddedSVGs(renderBody(result)));
      });
    });
  }
}

function renderBody(body: string): string {
  return `<!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="Content-type" content="text/html;charset=UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src http: https: data:; media-src https:; script-src 'none'; style-src 'unsafe-inline'; child-src 'none'; frame-src 'none';">
        <style>
          ${markdownCss}
        </style>
      </head>
      <body>
        <a id="scroll-to-top" role="button" aria-label="scroll to top" href="#"><span class="icon"></span></a>
        ${body}
      </body>
    </html>`;
}

function removeEmbeddedSVGs(documentContent: string): string {
  const newDocument = new DOMParser().parseFromString(documentContent, 'text/html');

  // remove all inline svgs
  const allSVGs = newDocument.documentElement.querySelectorAll('svg');
  if (allSVGs) {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < allSVGs.length; i++) {
      const svg = allSVGs[i];
      if (svg.parentNode) {
        svg.parentNode.removeChild(allSVGs[i]);
      }
    }
  }

  return newDocument.documentElement.outerHTML;
}
