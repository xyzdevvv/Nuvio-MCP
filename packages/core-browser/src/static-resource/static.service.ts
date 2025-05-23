import { Injectable } from '@Nuvio-MCP/di';
import { URI } from '@Nuvio-MCP/ide-core-common';

import { IStaticResourceProvider, StaticResourceService } from './static.definition';

@Injectable()
export class StaticResourceServiceImpl implements StaticResourceService {
  private providers = new Map<string, IStaticResourceProvider>();

  public readonly resourceRoots: Set<string> = new Set();

  public registerStaticResourceProvider(provider: IStaticResourceProvider) {
    this.providers.set(provider.scheme, provider);
    if (provider.roots) {
      provider.roots.forEach((root) => {
        this.resourceRoots.add(root);
      });
    }
    return {
      dispose: () => {
        if (this.providers.get(provider.scheme) === provider) {
          this.providers.delete(provider.scheme);
        }
      },
    };
  }

  public removeStaticResourceProvider(scheme: string) {
    this.providers.delete(scheme);
  }

  public resolveStaticResource(uri: URI): URI {
    if (!this.providers.has(uri.scheme)) {
      return uri;
    }
    const url = this.providers.get(uri.scheme)!.resolveStaticResource(uri);
    // vscode-url path的 = 会被转码，先手动跳过转码
    url.toString = url.toString.bind(url, true);
    return url;
  }
}
