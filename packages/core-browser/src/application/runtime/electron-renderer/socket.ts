import { Injectable } from '@Nuvio-MCP/di';

import { createNetSocketConnection, electronEnv } from '../../../utils/electron';
import { BaseConnectionHelper } from '../base-socket';

@Injectable({ multiple: true })
export class ElectronConnectionHelper extends BaseConnectionHelper {
  getDefaultClientId() {
    return electronEnv.metadata.windowClientId;
  }

  createConnection() {
    return createNetSocketConnection();
  }
}
