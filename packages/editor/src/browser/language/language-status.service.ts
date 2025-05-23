import { Injectable } from '@Nuvio-MCP/di';
import { Event, IDisposable, strings } from '@Nuvio-MCP/ide-core-common';
import { LanguageFeatureRegistry } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/languageFeatureRegistry';
import { ITextModel } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/model';

import { ILanguageStatus, ILanguageStatusService } from '../../common';

const { compare } = strings;

@Injectable()
export class LanguageStatusService implements ILanguageStatusService {
  private readonly _provider = new LanguageFeatureRegistry<ILanguageStatus>();

  readonly onDidChange: Event<any> = this._provider.onDidChange;

  addStatus(status: ILanguageStatus): IDisposable {
    return this._provider.register(status.selector, status);
  }

  getLanguageStatus(model: ITextModel): ILanguageStatus[] {
    return this._provider.ordered(model).sort((a, b) => {
      let res = b.severity - a.severity;
      if (res === 0) {
        res = compare(a.source, b.source);
      }
      if (res === 0) {
        res = compare(a.id, b.id);
      }
      return res;
    });
  }
}
