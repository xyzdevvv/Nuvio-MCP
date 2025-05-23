import { Autowired } from '@Nuvio-MCP/di';
import { AppConfig, Domain, Schemes, URI } from '@Nuvio-MCP/ide-core-browser';
import {
  StaticResourceContribution,
  StaticResourceService,
} from '@Nuvio-MCP/ide-core-browser/lib/static-resource/static.definition';

import { EXPRESS_SERVER_PATH } from '../common';

@Domain(StaticResourceContribution)
export class ExpressFileServerContribution implements StaticResourceContribution {
  @Autowired(AppConfig)
  appConfig: AppConfig;

  registerStaticResolver(service: StaticResourceService): void {
    service.registerStaticResourceProvider({
      scheme: Schemes.file,
      resolveStaticResource: (uri: URI) => {
        // file 协议统一走静态服务
        // http://${HOST}:8000/assets/${path}
        const assetsUri = new URI(this.appConfig.staticServicePath || EXPRESS_SERVER_PATH);
        /**
         * uri.path 在 Windows 下会被解析为 /c:/Path/to/file
         * fsPath C:\\Path\\to\\file
         */
        const [resourceUrl, query] = uri.codeUri.path.split('?');
        return assetsUri.resolve(`assets${decodeURIComponent(resourceUrl)}`).withQuery(query);
      },
      roots: [this.appConfig.staticServicePath || EXPRESS_SERVER_PATH],
    });
  }
}
