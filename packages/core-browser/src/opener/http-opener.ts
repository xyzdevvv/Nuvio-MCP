import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { Schemes, URI } from '@Nuvio-MCP/ide-core-common';

import { IWindowService } from '../window';

import { IOpener } from '.';

@Injectable()
export class HttpOpener implements IOpener {
  static standardSupportedLinkSchemes = new Set([Schemes.http, Schemes.https, Schemes.mailto]);

  @Autowired(IWindowService)
  private readonly windowService: IWindowService;

  handleScheme(scheme: string) {
    return HttpOpener.standardSupportedLinkSchemes.has(scheme);
  }

  async open(uri: URI) {
    this.windowService.openNewWindow(uri.toString(true), {
      external: true,
    });
    return true;
  }
}
