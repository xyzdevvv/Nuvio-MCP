import { Terminal } from '@xterm/xterm';
import WebSocket from 'ws';

import { Injectable } from '@Nuvio-MCP/di';
import { WSChannel } from '@Nuvio-MCP/ide-connection';
import { createWSChannelForClient } from '@Nuvio-MCP/ide-connection/__test__/common/ws-channel';
import { WSWebSocketConnection } from '@Nuvio-MCP/ide-connection/lib/common/connection';
import { Disposable, PreferenceProvider, PreferenceResolveResult, PreferenceService } from '@Nuvio-MCP/ide-core-browser';
import { Deferred, Emitter, IDisposable, OperatingSystem, PreferenceScope, URI, uuid } from '@Nuvio-MCP/ide-core-common';
import { Color, RGBA } from '@Nuvio-MCP/ide-theme/lib/common/color';

import {
  ICreateContributedTerminalProfileOptions,
  IExtensionTerminalProfile,
  IPtyProcessChangeEvent,
  IResolveDefaultProfileOptions,
  IShellLaunchConfig,
  ITerminalConnection,
  ITerminalContributions,
  ITerminalError,
  ITerminalProfile,
  ITerminalProfileInternalService,
  ITerminalProfileProvider,
  ITerminalProfileService,
  ITerminalService,
} from '../../src/common';

import { MessageMethod, getPort, localhost } from './proxy';
import { delay } from './utils';

// Ref: https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

export const defaultName = 'bash';

@Injectable()
export class MockTerminalService implements ITerminalService {
  static resId = 1;

  private channels: Map<string, WSChannel>;
  private socks: Map<string, WebSocket>;
  private _response: Map<number, { resolve: (value: any) => void }>;

  constructor() {
    this.channels = new Map();
    this.socks = new Map();
    this._response = new Map();
  }

  private _onProcessChange: Emitter<IPtyProcessChangeEvent> = new Emitter();

  onProcessChange = this._onProcessChange.event;

  async attachByLaunchConfig(
    sessionId: string,
    cols: number,
    rows: number,
    launchConfig: IShellLaunchConfig,
  ): Promise<ITerminalConnection | undefined> {
    const sock = new WebSocket(localhost(getPort()));
    const channel = createWSChannelForClient(new WSWebSocketConnection(sock), {
      id: sessionId,
    });

    this.channels.set(sessionId, channel);
    this.socks.set(sessionId, sock);

    await delay(2000);
    this._handleMethod(sessionId);

    await this._doMethod(sessionId, MessageMethod.create, { sessionId, cols, rows });

    this._onProcessChange.fire({ sessionId, processName: 'zsh' });

    return this._customConnection(sessionId);
  }

  async getProfiles(_: boolean): Promise<ITerminalProfile[]> {
    return [
      {
        profileName: 'bash',
        path: '/bin/bash',
        isDefault: true,
      },
    ];
  }
  async getDefaultSystemShell(): Promise<string> {
    return (await this.getProfiles(true))[0].path;
  }
  getCodePlatformKey(): Promise<'osx' | 'windows' | 'linux'> {
    return Promise.resolve('osx');
  }

  makeId() {
    return uuid();
  }

  meta() {
    return '';
  }

  restore() {
    return 'term.test.restore';
  }

  getOptions() {
    return {};
  }

  async getOS() {
    return OperatingSystem.Linux;
  }

  async getCwd() {
    return undefined;
  }

  private _handleStdoutMessage(sessionId: string, handler: (json: any) => void) {
    const channel = this.channels.get(sessionId);
    if (!channel) {
      return;
    }

    channel.onMessage((data) => {
      const json = JSON.parse(data) as any;
      if (!json.method) {
        handler(json.data);
      }
    });
  }

  private _customConnection(sessionId: string): ITerminalConnection {
    return {
      onData: (handler: (json: any) => void) => {
        this._handleStdoutMessage(sessionId, handler);
        return {
          dispose: () => {},
        };
      },
      sendData: (message: string) => {
        if (!message) {
          return;
        }
        this._sendMessage(sessionId, {
          sessionId,
          data: message,
        });
      },
      name: defaultName,
      readonly: false,
    };
  }

  private _sendMessage(sessionId: string, json: any) {
    const sock = this.channels.get(sessionId);
    if (!sock) {
      return;
    }
    sock.send(JSON.stringify(json));
  }

  private async _doMethod(sessionId: string, method: string, params: any) {
    return new Promise((resolve) => {
      const id = MockTerminalService.resId++;
      this._sendMessage(sessionId, { id, method, params });
      if (id !== -1) {
        this._response.set(id, { resolve });
      }
    });
  }

  private _handleMethod(sessionId: string) {
    const socket = this.channels.get(sessionId);

    if (!socket) {
      return;
    }

    socket.onMessage((data) => {
      const json = JSON.parse(data);
      if (json.method) {
        const handler = this._response.get(json.id);
        handler && handler.resolve(json);
        this._response.delete(json.id);
      }
    });
  }

  async attach(sessionId: string, term: Terminal) {
    return this.attachByLaunchConfig(sessionId, term.cols, term.rows, {});
  }

  async sendText(sessionId: string, data: string) {
    this._sendMessage(sessionId, { sessionId, data });
  }

  async resize(sessionId: string, cols: number, rows: number) {
    await this._doMethod(sessionId, MessageMethod.resize, { cols, rows });
    return;
  }

  disposeById(sessionId: string) {
    const socket = this.socks.get(sessionId);

    this._doMethod(sessionId, MessageMethod.resize, { id: sessionId });

    if (socket) {
      try {
        socket.close();
      } catch (_e) {
        /** nothing */
      }
    }
  }

  async getProcessId() {
    return -1;
  }

  onError() {
    return new Disposable();
  }
  onExit() {
    return new Disposable();
  }
}

export class MockEditorService {}

export class MockFileService {
  getFileStat(uri: URI) {
    return Promise.resolve({});
  }
}

/** Mock MainLayout Service */
export const MainLayoutTabbarOnActivate = new Emitter<any>();
export const MainLayoutTabbarOnInActivate = new Emitter<any>();

export class MockMainLayoutService {
  viewReady = new Deferred();
  constructor() {
    this.viewReady.resolve();
  }
  getTabbarHandler() {
    return {
      onActivate: MainLayoutTabbarOnActivate.event,
      onInActivate: MainLayoutTabbarOnInActivate.event,
      isActivated: () => true,
    };
  }

  toggleSlot() {
    // todo
  }
}
/** End */

/** Mock Theme Service */
export const MainTerminalThemeOnThemeChange = new Emitter<any>();

export class MockThemeService {
  onThemeChange = MainTerminalThemeOnThemeChange.event;
  getCurrentThemeSync = () => ({
    getColor: () => new Color(new RGBA(128, 128, 0, 1)),
  });
}
/** End */

/** Mock Terminal Theme Service */
export class MockTerminalThemeService {
  get terminalTheme() {
    return {
      background: 'white',
    };
  }
}
/** End */

/** Mock Preference Service */
export class MockPreferenceService implements PreferenceService {
  ready: Promise<void> = Promise.resolve();

  has(preferenceName: string, resourceUri?: string | undefined, language?: string | undefined): boolean {
    return true;
  }

  hasLanguageSpecific(preferenceName: any, overrideIdentifier: string, resourceUri: string): boolean {
    return false;
  }

  async set(
    preferenceName: string,
    value: any,
    scope?: PreferenceScope,
    resourceUri?: string,
    overrideIdentifier?: string,
  ): Promise<void> {}

  async update(preferenceName: string, value: any, defaultScope?: PreferenceScope): Promise<void> {}

  onPreferencesChanged() {
    return Disposable.NULL;
  }

  onLanguagePreferencesChanged() {
    return Disposable.NULL;
  }

  inspect<T>(
    preferenceName: string,
    resourceUri?: string,
    language?: string,
  ):
    | {
        preferenceName: string;
        defaultValue: T | undefined;
        globalValue: T | undefined;
        workspaceValue: T | undefined;
        workspaceFolderValue: T | undefined;
      }
    | undefined {
    return;
  }

  getProvider(scope: PreferenceScope): PreferenceProvider | undefined {
    return;
  }

  resolve<T>(
    preferenceName: string,
    defaultValue?: T,
    resourceUri?: string,
    language?: string,
    untilScope?: PreferenceScope,
  ): PreferenceResolveResult<T> {
    throw new Error('Method not implemented.');
  }

  onSpecificPreferenceChange() {
    return Disposable.NULL;
  }

  dispose(): void {}

  get(key: string, defaultValue?: any) {
    return defaultValue;
  }

  getValid(key: string, defaultValue?: any) {
    return defaultValue;
  }

  onPreferenceChanged() {
    return new Disposable();
  }
}
/** End */

/** Mock Terminal Widget */
export class MockTerminalWidget {
  resize() {
    // todo
  }
}
/** End */

/** Mock Error Service */
export class MockErrorService {
  errors = new Map<string, ITerminalError>();

  async fix(_sessionId: string) {}
}
/** End */

export class MockProfileService implements ITerminalProfileService {
  createContributedTerminalProfile(
    extensionIdentifier: string,
    id: string,
    options: ICreateContributedTerminalProfileOptions,
  ): Promise<void> {
    return Promise.resolve();
  }
  contributedProfiles: IExtensionTerminalProfile[] = [];
  async getContributedDefaultProfile(
    shellLaunchConfig: IShellLaunchConfig,
  ): Promise<IExtensionTerminalProfile | undefined> {
    return undefined;
  }

  availableProfiles: ITerminalProfile[] = [
    {
      isDefault: true,
      path: '/bin/sh',
      profileName: 'default',
    },
  ];
  getDefaultProfileName(): string | undefined {
    return 'default';
  }
  profilesReady: Promise<void> = Promise.resolve();
  refreshAvailableProfiles(): void {
    return;
  }
  onDidChangeAvailableProfiles() {
    return new Disposable();
  }
  onDidChangeDefaultShell() {
    return new Disposable();
  }
  getContributedProfileProvider(extensionIdentifier: string, id: string): ITerminalProfileProvider | undefined {
    return;
  }
  registerTerminalProfileProvider(
    extensionIdentifier: string,
    id: string,
    profileProvider: ITerminalProfileProvider,
  ): IDisposable {
    return new Disposable();
  }
  get onTerminalProfileResolved() {
    return new Emitter<string>().event;
  }
  addContributedProfile(extensionId: string, contributions: ITerminalContributions): void {}
  removeContributedProfile(extensionId: string): void {}
}

export class MockTerminalProfileInternalService implements ITerminalProfileInternalService {
  async resolveDefaultProfile(options?: IResolveDefaultProfileOptions): Promise<ITerminalProfile | undefined> {
    return {
      path: '/bin/sh',
      isDefault: false,
      profileName: 'default',
    };
  }
  async resolveRealDefaultProfile(): Promise<ITerminalProfile | undefined> {
    return undefined;
  }
}
