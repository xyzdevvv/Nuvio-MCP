import { LogLevel } from '@Nuvio-MCP/ide-core-common';
import { IMainThreadExtensionLog } from '@Nuvio-MCP/ide-extension/lib/common/extension-log';

export class MainThreadExtensionLog implements IMainThreadExtensionLog {
  private level: LogLevel = LogLevel.Verbose;
  $getLevel() {
    return this.level;
  }

  $setLevel(level: LogLevel) {
    this.level = level;
  }

  $verbose(...args: any[]) {
    return Promise.resolve();
  }

  $debug(...args: any[]) {
    return Promise.resolve();
  }

  $log(...args: any[]) {
    return Promise.resolve();
  }

  $warn(...args: any[]) {
    return Promise.resolve();
  }

  $error(...args: any[]) {
    return Promise.resolve();
  }

  $critical(...args: any[]) {
    return Promise.resolve();
  }

  $dispose() {
    return Promise.resolve();
  }
}
