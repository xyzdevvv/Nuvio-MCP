import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { MessageType } from '@Nuvio-MCP/ide-core-common';
import { MAX_MESSAGE_LENGTH } from '@Nuvio-MCP/ide-overlay/lib/common';

import { IExtHostMessage, IMainThreadMessage, MainThreadAPIIdentifier } from '../../../common/vscode';

import type vscode from 'vscode';

export class ExtHostMessage implements IExtHostMessage {
  private proxy: IMainThreadMessage;

  constructor(rpc: IRPCProtocol) {
    this.proxy = rpc.getProxy(MainThreadAPIIdentifier.MainThreadMessages);
  }

  async showMessage(
    type: MessageType,
    rawMessage: string,
    optionsOrFirstItem?: string | vscode.MessageItem | vscode.MessageOptions | undefined,
    from?: string,
    ...rest: (string | vscode.MessageItem)[]
  ): Promise<string | vscode.MessageItem | undefined> {
    let message = rawMessage;
    if (message.length > MAX_MESSAGE_LENGTH) {
      message = `${rawMessage.substr(0, MAX_MESSAGE_LENGTH)}...`;
    }

    const options: vscode.MessageOptions = {};
    const actions: string[] = [];
    const items: (string | vscode.MessageItem)[] = [];
    const pushItem = (item: string | vscode.MessageItem) => {
      items.push(item);
      if (typeof item === 'string') {
        actions.push(item);
      } else {
        actions.push(item.title);
      }
    };

    if (optionsOrFirstItem) {
      if (typeof optionsOrFirstItem === 'string' || 'title' in optionsOrFirstItem) {
        pushItem(optionsOrFirstItem);
      } else {
        if ('modal' in optionsOrFirstItem) {
          options.modal = optionsOrFirstItem.modal;

          if ('detail' in optionsOrFirstItem) {
            options.detail = optionsOrFirstItem.detail;
          }
        }
      }
    }
    for (const item of rest) {
      pushItem(item);
    }
    const actionHandle = await this.proxy.$showMessage(type, message, options, actions, from);
    return actionHandle !== undefined ? items[actionHandle] : undefined;
  }
}
