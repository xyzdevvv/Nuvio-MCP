import path from 'path';

import { Injector } from '@Nuvio-MCP/di';
import { LanguageParserService } from '@Nuvio-MCP/ide-ai-native/lib/browser/languages/service';
import { AppConfig, BrowserModule } from '@Nuvio-MCP/ide-core-browser';
import { ESupportRuntime } from '@Nuvio-MCP/ide-core-browser/lib/application/runtime';
import { RendererRuntime } from '@Nuvio-MCP/ide-core-browser/lib/application/runtime/types';
import { Uri } from '@Nuvio-MCP/ide-core-common';
import { MockInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';

class MockRendererRuntime extends RendererRuntime {
  runtimeName = 'web' as ESupportRuntime;
  mergeAppConfig(meta: AppConfig): AppConfig {
    throw new Error('Method not implemented.');
  }
  registerRuntimeInnerProviders(injector: Injector): void {
    throw new Error('Method not implemented.');
  }
  registerRuntimeModuleProviders(injector: Injector, module: BrowserModule<any>): void {
    throw new Error('Method not implemented.');
  }
  async provideResourceUri() {
    const result = path.dirname(require.resolve('@Nuvio-MCP/tree-sitter-wasm/package.json'));
    return Uri.file(result).toString();
  }
}

describe.skip('tree sitter', () => {
  let injector: MockInjector;
  beforeAll(() => {
    injector = new MockInjector([
      {
        token: LanguageParserService,
        useClass: LanguageParserService,
      },
    ]);
    injector.mockService(RendererRuntime, new MockRendererRuntime());
  });

  it('parser', async () => {
    const service = injector.get(LanguageParserService) as LanguageParserService;
    const parser = service.createParser('javascript');
    expect(parser).toBeDefined();

    await parser!.ready();
  });
});
