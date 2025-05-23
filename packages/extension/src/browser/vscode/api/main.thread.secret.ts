import { Autowired, Injectable, Optional } from '@Nuvio-MCP/di';
import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { AppConfig, Disposable, ICredentialsService } from '@Nuvio-MCP/ide-core-browser';
import { ICryptoService } from '@Nuvio-MCP/ide-core-browser/lib/services';

import { ExtHostAPIIdentifier, IExtHostSecret, IMainThreadSecret } from '../../../common/vscode';

@Injectable({ multiple: true })
export class MainThreadSecret extends Disposable implements IMainThreadSecret {
  private readonly _proxy: IExtHostSecret;

  @Autowired(AppConfig)
  private readonly appConfig: AppConfig;

  @Autowired(ICredentialsService)
  private readonly credentialsService: ICredentialsService;

  @Autowired(ICryptoService)
  private readonly cryptoService: ICryptoService;

  constructor(@Optional(Symbol()) rpcProtocol: IRPCProtocol) {
    super();
    this._proxy = rpcProtocol.getProxy(ExtHostAPIIdentifier.ExtHostSecret);
    this.addDispose(
      this.credentialsService.onDidChangePassword((e) => {
        const extensionId = e.service.substring(this.appConfig.uriScheme!.length);
        this._proxy.$onDidChangePassword({ extensionId, key: e.account });
      }),
    );
  }

  private getFullKey(extensionId: string): string {
    return `${this.appConfig.uriScheme}${extensionId}`;
  }

  async $getPassword(extensionId: string, key: string): Promise<string | undefined> {
    const fullKey = this.getFullKey(extensionId);
    const password = await this.credentialsService.getPassword(fullKey, key);
    const decrypted = password && (await this.cryptoService.decrypt(password));

    if (decrypted) {
      try {
        const value = JSON.parse(decrypted);
        if (value.extensionId === extensionId) {
          return value.content;
        }
      } catch (_) {
        throw new Error('Cannot get password');
      }
    }

    return undefined;
  }

  async $setPassword(extensionId: string, key: string, value: string): Promise<void> {
    const fullKey = this.getFullKey(extensionId);
    const toEncrypt = JSON.stringify({
      extensionId,
      content: value,
    });
    const encrypted = await this.cryptoService.encrypt(toEncrypt);
    return this.credentialsService.setPassword(fullKey, key, encrypted);
  }

  async $deletePassword(extensionId: string, key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(extensionId);
      await this.credentialsService.deletePassword(fullKey, key);
    } catch (_) {
      throw new Error('Cannot delete password');
    }
  }
}
