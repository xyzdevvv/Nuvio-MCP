import { DebugConfiguration, DebugStreamConnection } from '@Nuvio-MCP/ide-debug';

import { ExtensionConnection } from '../../../../common/vscode';

import { StreamDebugAdapter } from './abstract-debug-adapter-session';

import type vscode from 'vscode';

export class ExtensionDebugAdapterSession extends StreamDebugAdapter implements vscode.DebugSession {
  readonly type: string;
  readonly name: string;
  readonly workspaceFolder: vscode.WorkspaceFolder | undefined;
  readonly configuration: DebugConfiguration;

  constructor(
    protected readonly communicationProvider: DebugStreamConnection,
    protected readonly tracker: vscode.DebugAdapterTracker,
    protected readonly debugSession: vscode.DebugSession,
  ) {
    super(debugSession.id, communicationProvider);

    this.type = debugSession.type;
    this.name = debugSession.name;
    this.workspaceFolder = debugSession.workspaceFolder;
    this.configuration = debugSession.configuration;
  }

  public get parentSession(): vscode.DebugSession | undefined {
    return this.debugSession.parentSession;
  }

  async start(connection: ExtensionConnection): Promise<void> {
    if (this.tracker.onWillStartSession) {
      this.tracker.onWillStartSession();
    }
    await super.start(connection);
  }

  async stop(): Promise<void> {
    if (this.tracker.onWillStopSession) {
      this.tracker.onWillStopSession();
    }
    await super.stop();
  }

  async customRequest(command: string, args?: any): Promise<any> {
    return this.debugSession.customRequest(command, args);
  }

  async getDebugProtocolBreakpoint(breakpoint: vscode.Breakpoint): Promise<vscode.DebugProtocolBreakpoint | undefined> {
    return this.debugSession.getDebugProtocolBreakpoint(breakpoint);
  }

  protected onDebugAdapterError(error: Error): void {
    if (this.tracker.onError) {
      this.tracker.onError(error);
    }
    super.onDebugAdapterError(error);
  }

  protected sendToFrontend(message: string): void {
    try {
      super.sendToFrontend(message);
    } finally {
      if (this.tracker.onDidSendMessage) {
        this.tracker.onDidSendMessage(message);
      }
    }
  }

  protected write(message: string): void {
    if (this.tracker.onWillReceiveMessage) {
      this.tracker.onWillReceiveMessage(message);
    }
    super.write(message);
  }

  protected onDebugAdapterExit(exitCode: number, signal: string | undefined): void {
    if (this.tracker.onExit) {
      this.tracker.onExit(exitCode, signal);
    }
    super.onDebugAdapterExit(exitCode, signal);
  }
}
