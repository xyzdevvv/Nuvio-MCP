import { IDisposable } from '@Nuvio-MCP/ide-core-common';

export interface IConnectionShape<T> {
  send(data: T): void;
  onMessage: (cb: (data: T) => void) => IDisposable;
  onceClose: (cb: (code?: number, reason?: string) => void) => IDisposable;
}
