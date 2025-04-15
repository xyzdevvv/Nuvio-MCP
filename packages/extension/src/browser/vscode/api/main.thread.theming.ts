import { Autowired, Injectable, Optional } from '@Nuvio-MCP/di';
import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { IDisposable } from '@Nuvio-MCP/ide-core-common';
import { IThemeService } from '@Nuvio-MCP/ide-theme';

import { ExtHostAPIIdentifier, IExtHostTheming, IMainThreadTheming } from '../../../common/vscode';

@Injectable({ multiple: true })
export class MainThreadTheming implements IMainThreadTheming {
  private proxy: IExtHostTheming;

  @Autowired(IThemeService)
  private readonly _themeService: IThemeService;

  private readonly _themeChangeListener: IDisposable;

  constructor(@Optional(IRPCProtocol) private rpcProtocol: IRPCProtocol) {
    this.proxy = this.rpcProtocol.getProxy(ExtHostAPIIdentifier.ExtHostTheming);
    this._themeChangeListener = this._themeService.onThemeChange((e) => {
      this.proxy.$onColorThemeChange(e.type);
    });
    this.proxy.$onColorThemeChange(this._themeService.getCurrentThemeSync().type);
  }

  dispose(): void {
    this._themeChangeListener.dispose();
  }
}
