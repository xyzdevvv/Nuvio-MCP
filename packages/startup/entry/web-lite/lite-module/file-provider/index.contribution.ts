import { Autowired } from '@Nuvio-MCP/di';
import { AppConfig, Domain, FsProviderContribution, Schemes, URI, Uri, path } from '@Nuvio-MCP/ide-core-browser';
import {
  StaticResourceContribution,
  StaticResourceService,
} from '@Nuvio-MCP/ide-core-browser/lib/static-resource/static.definition';
import { IFileServiceClient } from '@Nuvio-MCP/ide-file-service';
import { FileServiceClient } from '@Nuvio-MCP/ide-file-service/lib/browser/file-service-client';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { AbstractHttpFileService } from './browser-fs-provider';
import { ExtFsProvider } from './ext-fs-provider';
import { HttpFileService } from './http-file.service';

const { Path } = path;

const EXPRESS_SERVER_PATH = window.location.href;

// file 文件资源 远程读取
@Domain(StaticResourceContribution, FsProviderContribution)
export class FileProviderContribution implements StaticResourceContribution, FsProviderContribution {
  @Autowired(IFileServiceClient)
  private readonly fileSystem: FileServiceClient;

  @Autowired(AbstractHttpFileService)
  private httpImpl: HttpFileService;

  @Autowired(AppConfig)
  private readonly appConfig: AppConfig;

  @Autowired(IWorkspaceService)
  private readonly workspaceService: IWorkspaceService;

  @Autowired()
  private readonly ktExtFsProvider: ExtFsProvider;

  onFileServiceReady() {
    this.httpImpl.initWorkspace(Uri.file(this.appConfig.workspaceDir!));
  }

  registerProvider(registry: IFileServiceClient) {
    registry.registerProvider('ext', this.ktExtFsProvider);
  }

  registerStaticResolver(service: StaticResourceService): void {
    // 用来打开 raw 文件，如 jpg
    service.registerStaticResourceProvider({
      scheme: Schemes.file,
      resolveStaticResource: (uri: URI) => {
        // file 协议统一走 scm raw 服务
        // https://${HOST}:8080/asset-service/v3/project/$repo/repository/blobs/$ref
        // GET /api/v3/projects/{id}/repository/blobs/{sha}
        const assetsUri = new URI(this.appConfig.staticServicePath || EXPRESS_SERVER_PATH);
        const rootUri = new URI(this.workspaceService.workspace?.uri!);
        const relativePath = rootUri.relative(uri);
        return assetsUri
          .withPath(new Path('asset-service/v3/projects').join('repository/blobs'))
          .withQuery(`filepath=${relativePath?.toString()}`);
      },
      roots: [this.appConfig.staticServicePath || EXPRESS_SERVER_PATH],
    });
    // 插件静态资源路径
    service.registerStaticResourceProvider({
      scheme: 'ext',
      resolveStaticResource: (uri: URI) =>
        // ext 协议统一走 scheme 头转换为 https
        uri.withScheme(Schemes.https),
      roots: [this.appConfig.staticServicePath || EXPRESS_SERVER_PATH],
    });
  }
}
