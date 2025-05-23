import { Injectable } from '@Nuvio-MCP/di';
import { ReconnectingWebSocketConnection } from '@Nuvio-MCP/ide-connection/lib/common/connection/drivers/reconnecting-websocket';
import { UrlProvider, uuid } from '@Nuvio-MCP/ide-core-common';

import { BaseConnectionHelper } from '../base-socket';

export interface IWebConnectionOptions {
  connectionPath: UrlProvider;
  connectionProtocols?: string[];
}

@Injectable({ multiple: true })
export class WebConnectionHelper extends BaseConnectionHelper {
  clientId: string;
  constructor(protected options: IWebConnectionOptions) {
    super();

    this.clientId = WebConnectionHelper.clientIdFactory();
  }

  getDefaultClientId() {
    return this.clientId;
  }

  createConnection() {
    return ReconnectingWebSocketConnection.forURL(this.options.connectionPath, this.options.connectionProtocols);
  }

  static clientIdFactory() {
    return `CLIENT_ID_${uuid()}`;
  }
}
