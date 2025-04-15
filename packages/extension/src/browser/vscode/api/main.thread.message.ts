import { Autowired, Injectable, Optional } from '@Nuvio-MCP/di';
import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { MessageType } from '@Nuvio-MCP/ide-core-common';
import { IDialogService, IMessageService } from '@Nuvio-MCP/ide-overlay';

import { ExtHostAPIIdentifier, IExtHostMessage, IMainThreadMessage } from '../../../common/vscode';

import type vscode from 'vscode';

@Injectable({ multiple: true })
export class MainThreadMessage implements IMainThreadMessage {
  protected readonly proxy: IExtHostMessage;

  @Autowired(IDialogService)
  protected readonly dialogService: IDialogService;

  @Autowired(IMessageService)
  protected readonly messageService: IMessageService;

  constructor(@Optional(IRPCProtocol) private rpcProtocol: IRPCProtocol) {
    this.proxy = this.rpcProtocol.getProxy(ExtHostAPIIdentifier.ExtHostMessage);
  }

  public dispose() {}

  async $showMessage(
    type: MessageType,
    message: string,
    options: vscode.MessageOptions,
    actions: string[],
    from,
  ): Promise<number | undefined> {
    const action = options.modal
      ? await this.dialogService.open({ message, type, buttons: actions, options })
      : await this.messageService.open({ message, type, buttons: actions, closable: true, from });
    return action ? actions.indexOf(action) : undefined;
  }
}
