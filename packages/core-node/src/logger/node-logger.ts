import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { ILogService, ILogServiceManager, LogLevel, SupportLogNamespace } from '@Nuvio-MCP/ide-core-common';

export type INodeLogger = ILogService;
export const INodeLogger = Symbol('INodeLogger');

@Injectable()
export class NodeLogger implements INodeLogger {
  @Autowired(ILogServiceManager)
  private loggerManger: ILogServiceManager;

  private logger: ILogService;

  constructor() {
    this.logger = this.loggerManger.getLogger(SupportLogNamespace.Node);
  }

  error(...args) {
    return this.logger.error(...args);
  }

  warn(...args) {
    return this.logger.warn(...args);
  }

  log(...args) {
    return this.logger.log(...args);
  }
  debug(...args) {
    return this.logger.debug(...args);
  }

  verbose(...args) {
    return this.logger.verbose(...args);
  }

  critical(...args) {
    return this.logger.critical(...args);
  }

  dispose() {
    return this.logger.dispose();
  }

  setOptions(options) {
    return this.logger.setOptions(options);
  }

  sendLog(level: LogLevel, message: string) {
    return this.logger.sendLog(level, message);
  }

  drop() {
    return this.logger.drop();
  }

  flush() {
    return this.logger.flush();
  }

  getLevel() {
    return this.logger.getLevel();
  }

  setLevel(level: LogLevel) {
    return this.logger.setLevel(level);
  }
}
