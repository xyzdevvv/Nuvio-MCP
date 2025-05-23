import { Autowired, INJECTOR_TOKEN, Injectable, Injector } from '@Nuvio-MCP/di';
import { OperatingSystem, PreferenceService } from '@Nuvio-MCP/ide-core-browser';
import { Dispatcher, Disposable, Emitter, Event, IApplicationService, ILogger } from '@Nuvio-MCP/ide-core-common';

import {
  IDetectProfileOptionsPreference,
  INodePtyInstance,
  IPtyExitEvent,
  IPtyProcessChangeEvent,
  IShellLaunchConfig,
  ITerminalConnection,
  ITerminalError,
  ITerminalProfile,
  ITerminalService,
  ITerminalServiceClient,
  ITerminalServicePath,
  TERMINAL_ID_SEPARATOR,
  generateSessionId,
  isTerminalError,
} from '../common';
import { CodeTerminalSettingPrefix } from '../common/preference';

import { XTerm } from './xterm';

export interface EventMessage {
  data: string;
}
@Injectable()
export class NodePtyTerminalService extends Disposable implements ITerminalService {
  static countId = 1;

  private backendOs: OperatingSystem | undefined;

  @Autowired(INJECTOR_TOKEN)
  protected readonly injector: Injector;

  @Autowired(ILogger)
  protected readonly logger: ILogger;

  @Autowired(ITerminalServicePath)
  protected readonly serviceClientRPC: ITerminalServiceClient;

  @Autowired(PreferenceService)
  private preferenceService: PreferenceService;

  @Autowired(IApplicationService)
  protected readonly applicationService: IApplicationService;

  private _onError = this.registerDispose(new Emitter<ITerminalError>());
  public onError: Event<ITerminalError> = this._onError.event;

  private _onExit = this.registerDispose(new Emitter<IPtyExitEvent>());
  public onExit: Event<IPtyExitEvent> = this._onExit.event;

  private _onProcessChange = this.registerDispose(new Emitter<IPtyProcessChangeEvent>());
  public onProcessChange = this._onProcessChange.event;

  private _onDataDispatcher = this.registerDispose(new Dispatcher<string>());
  private _onExitDispatcher = this.registerDispose(
    new Dispatcher<{
      code?: number;
      signal?: number;
    }>(),
  );

  generateSessionId() {
    return this.applicationService.clientId + TERMINAL_ID_SEPARATOR + generateSessionId();
  }

  async check(ids: string[]) {
    const ensureResult = await this.serviceClientRPC.ensureTerminal(ids);
    return ensureResult;
  }

  private _createCustomWebSocket = (sessionId: string, pty: INodePtyInstance): ITerminalConnection => ({
    name: pty.name,
    readonly: false,
    onData: (handler: (value: string | ArrayBuffer) => void) => this._onDataDispatcher.on(sessionId)(handler),
    onExit: (handler: (exitCode: number | undefined) => void) =>
      this._onExitDispatcher.on(sessionId)((e) => {
        handler(e.code);
      }),
    sendData: (message: string) => {
      this.sendText(sessionId, message);
    },
    ptyInstance: pty,
  });

  async attachByLaunchConfig(
    sessionId: string,
    cols: number,
    rows: number,
    launchConfig: IShellLaunchConfig,
    _xterm: XTerm,
  ) {
    // If code runs to here, it means that we want to create a real terminal.
    // So if `launchConfig.executable` is not set, we should use the default shell.
    if (!launchConfig.executable) {
      launchConfig.executable = await this.getDefaultSystemShell();
    }

    this.logger.log(`attach terminal ${sessionId} with launchConfig `, launchConfig);

    const ptyInstance = await this.serviceClientRPC.create2(sessionId, cols, rows, launchConfig);
    if (ptyInstance && (ptyInstance.pid || ptyInstance.name)) {
      this.logger.log(`${sessionId} attach success, pid: ${ptyInstance.pid}, name: ${ptyInstance.name}`);
      // 有 pid 或者 name 的才视为创建成功
      // 创建不成功的时候会被通过 closeClient 把错误信息传递回来
      return this._createCustomWebSocket(sessionId, ptyInstance);
    }
    this.logger.error(`${sessionId} cannot create ptyInstance`, ptyInstance);
  }

  private _sendMessage(sessionId: string, json: any, requestId?: number) {
    const id = requestId || NodePtyTerminalService.countId++;

    this.serviceClientRPC.onMessage(
      sessionId,
      JSON.stringify({
        id,
        ...json,
      }),
    );
  }

  async sendText(sessionId: string, message: string) {
    this._sendMessage(sessionId, {
      data: message,
    });
  }

  async resize(sessionId: string, cols: number, rows: number) {
    this._sendMessage(sessionId, {
      method: 'resize',
      params: { cols, rows },
    });
  }

  async getCodePlatformKey(): Promise<'osx' | 'windows' | 'linux'> {
    return await this.serviceClientRPC.getCodePlatformKey();
  }

  disposeById(sessionId: string) {
    this.serviceClientRPC.disposeById(sessionId);
  }

  async getProcessId(sessionId: string) {
    return this.serviceClientRPC.getProcessId(sessionId);
  }

  /**
   * for pty node
   *
   * @param sessionId
   * @param message
   */
  onMessage(sessionId: string, message: string) {
    this._onDataDispatcher.dispatch(sessionId, message);
  }

  /**
   * for pty node
   *
   * @param sessionId
   */
  closeClient(id: string, code?: number, signal?: number): void;
  closeClient(sessionId: string, data: ITerminalError | { code?: number; signal?: number }): void;
  closeClient(sessionId: string, data?: ITerminalError | { code?: number; signal?: number } | number, signal?: number) {
    this.logger.log(`${sessionId} was closed, error:`, data);

    if (isTerminalError(data)) {
      this._onError.fire(data);
    } else if (typeof data === 'number') {
      // 说明是 pty 报出来的正常退出
      this._onExitDispatcher.dispatch(sessionId, { code: data, signal });
      this._onExit.fire({ sessionId, code: data, signal });
    } else if (data) {
      // 说明是 pty 报出来的正常退出
      this._onExitDispatcher.dispatch(sessionId, { code: data.code, signal: data.signal });
      this._onExit.fire({ sessionId, code: data.code, signal: data.signal });
    }
  }

  $processChange(sessionId: string, processName: string) {
    this._onProcessChange.fire({ sessionId, processName });
  }

  async getOS() {
    if (this.backendOs) {
      return this.backendOs;
    }
    return (this.backendOs = this.serviceClientRPC.getOS());
  }

  async getProfiles(autoDetect: boolean): Promise<ITerminalProfile[]> {
    const platformKey = await this.getCodePlatformKey();
    const terminalPreferences = this.preferenceService.get<IDetectProfileOptionsPreference>(
      `${CodeTerminalSettingPrefix.Profiles}${platformKey}`,
      {},
    );

    return await this.serviceClientRPC.detectAvailableProfiles({
      autoDetect,
      preference: terminalPreferences,
    });
  }

  async getCwd(sessionId: string) {
    try {
      return await this.serviceClientRPC.getCwd(sessionId);
    } catch {
      return undefined;
    }
  }

  async getDefaultSystemShell(): Promise<string> {
    return await this.serviceClientRPC.getDefaultSystemShell(await this.getOS());
  }
}
