import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IElectronNativeDialogService, electronEnv } from '@Nuvio-MCP/ide-core-browser';
import { IElectronMainUIService } from '@Nuvio-MCP/ide-core-common/lib/electron';

@Injectable()
export class ElectronNativeDialogService implements IElectronNativeDialogService {
  @Autowired(IElectronMainUIService)
  electronMainUIService: IElectronMainUIService;

  async showOpenDialog(options: Electron.OpenDialogOptions): Promise<string[] | undefined> {
    return this.electronMainUIService.showOpenDialog(electronEnv.currentWindowId, options);
  }

  showSaveDialog(options: Electron.SaveDialogOptions): Promise<string | undefined> {
    return this.electronMainUIService.showSaveDialog(electronEnv.currentWindowId, options);
  }
}
