import { Injectable } from '@Nuvio-MCP/di';
import { IAIInlineChatService } from '@Nuvio-MCP/ide-core-browser';
import { Emitter, Event } from '@Nuvio-MCP/ide-core-common';

export { EInlineChatStatus, EResultKind } from '../../../common';

@Injectable({ multiple: false })
export class InlineChatService implements IAIInlineChatService {
  public readonly _onInlineChatVisible = new Emitter<boolean>();
  public readonly onInlineChatVisible: Event<boolean> = this._onInlineChatVisible.event;

  private readonly _onThumbs = new Emitter<boolean>();
  public readonly onThumbs: Event<boolean> = this._onThumbs.event;

  public fireThumbsEvent(isThumbsUp: boolean) {
    this._onThumbs.fire(isThumbsUp);
  }
}
