import { Injectable } from '@Nuvio-MCP/di';
import { ECodeEditsSourceTyping, IDisposable } from '@Nuvio-MCP/ide-core-common';
import { Position } from '@Nuvio-MCP/ide-monaco';
import {
  IObservableSignal,
  derived,
  observableSignal,
  runOnChangeWithStore,
} from '@Nuvio-MCP/ide-monaco/lib/common/observable';

import { BaseCodeEditsSource } from './base';

export interface ITriggerData {
  position: Position | null;
}

@Injectable({ multiple: true })
export class TriggerCodeEditsSource extends BaseCodeEditsSource {
  // 主动触发的优先级是最高的
  public priority = Number.MAX_SAFE_INTEGER;

  public triggerSignal: IObservableSignal<void> = observableSignal(this);

  public mount(): IDisposable {
    this.addDispose(
      runOnChangeWithStore(
        derived((reader) => {
          this.triggerSignal.read(reader);
          return {};
        }),
        () => {
          const position = this.monacoEditor.getPosition();
          this.setBean({
            typing: ECodeEditsSourceTyping.Trigger,
            data: {
              [ECodeEditsSourceTyping.Trigger]: { position },
            },
          });
        },
      ),
    );
    return this;
  }
}
