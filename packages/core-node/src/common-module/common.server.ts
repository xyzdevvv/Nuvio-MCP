import { Injectable } from '@Nuvio-MCP/di';
import { ICommonServer, OS, OperatingSystem } from '@Nuvio-MCP/ide-core-common';

@Injectable()
export class CommonServer implements ICommonServer {
  async getBackendOS(): Promise<OperatingSystem> {
    return OS.type();
  }
}
