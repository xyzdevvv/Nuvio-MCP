import { BasicEvent } from '@Nuvio-MCP/ide-core-common';

export interface TerminalClientAttachEventPayload {
  clientId: string;
}

export class TerminalClientAttachEvent extends BasicEvent<TerminalClientAttachEventPayload> {}
