import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { RPCService } from '@Nuvio-MCP/ide-connection/lib/common/rpc-service';
import { IOpenerService } from '@Nuvio-MCP/ide-core-browser/lib/opener';
import { PreferenceService } from '@Nuvio-MCP/ide-core-browser/lib/preferences';
import { CommandService, Disposable, IDisposable, URI, Uri } from '@Nuvio-MCP/ide-core-common';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';

import { IRemoteHostConverter, IRemoteOpenerBrowserService } from '../common';

// 不预置SUPPORT_HOSTS，改为用户注册，默认走openerService来处理这部分逻辑
// const SUPPORT_HOSTS = ['localhost', '0.0.0.0', '127.0.0.1'];

@Injectable()
export class RemoteOpenerBrowserServiceImpl extends RPCService implements IRemoteOpenerBrowserService {
  @Autowired(WorkbenchEditorService)
  private readonly workbenchEditorService: WorkbenchEditorService;

  @Autowired(CommandService)
  protected commandService: CommandService;

  @Autowired(PreferenceService)
  private readonly preferenceService: PreferenceService;

  @Autowired(IOpenerService)
  private readonly openerService: IOpenerService;

  private supportHosts: Set<string> = new Set();

  private converter: IRemoteHostConverter | null = null;

  registerSupportHosts(hosts: string[]) {
    for (const host of hosts) {
      this.supportHosts.add(host);
    }
    return Disposable.create(() => {
      for (const host of hosts) {
        this.supportHosts.delete(host);
      }
    });
  }

  registerConverter(converter: IRemoteHostConverter): IDisposable {
    if (this.converter) {
      throw new Error('Only one converter is allowed.');
    }

    this.converter = converter;
    return Disposable.create(() => {
      this.converter = null;
    });
  }

  get isRemoteOpenerEnabled(): boolean {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.preferenceService.get('remote.opener.enable', true)!;
  }

  async $openExternal(type: 'file' | 'url', uri: Uri): Promise<void> {
    if (!this.isRemoteOpenerEnabled) {
      return;
    }

    const revivedUri = Uri.revive(uri);
    switch (type) {
      case 'url': {
        const url = new URL(decodeURIComponent(revivedUri.toString()));
        if (this.supportHosts.has(url.hostname)) {
          if (!this.converter) {
            throw new Error('Converter is not registered.');
          }

          const { port } = url;
          const hostname = this.converter.convert(port);
          // Default use https protocol
          url.protocol = 'https';
          // remove port
          url.port = '';
          url.hostname = hostname;
        }

        this.openerService.open(url.toString());
        break;
      }
      case 'file':
        this.workbenchEditorService.open(URI.parse(revivedUri.toString()), { preview: false, focus: true });
        break;
      default:
        // eslint-disable-next-line no-console
        console.warn(`Unsupported ${type}.`);
        break;
    }
  }
}
