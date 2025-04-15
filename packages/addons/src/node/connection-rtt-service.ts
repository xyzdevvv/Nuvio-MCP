import { Injectable } from '@Nuvio-MCP/di';

import { IConnectionBackService } from '../common';

@Injectable()
export class ConnectionRTTBackService implements IConnectionBackService {
  $measure(): Promise<void> {
    return Promise.resolve();
  }
}
