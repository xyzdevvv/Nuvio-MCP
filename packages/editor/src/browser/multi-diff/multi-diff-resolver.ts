import { Injectable } from '@Nuvio-MCP/di';
import { URI } from '@Nuvio-MCP/ide-core-common';
import { ValueWithChangeEvent } from '@Nuvio-MCP/monaco-editor-core/esm/vs/base/common/event';

import {
  IMultiDiffSourceResolver,
  IResolvedMultiDiffSource,
  MULTI_DIFF_SCHEME,
  MultiDiffEditorItem,
} from '../../common/multi-diff';

@Injectable()
export class MultiDiffResolver implements IMultiDiffSourceResolver {
  private readonly sourceValues = new Map<string, ValueWithChangeEvent<MultiDiffEditorItem[]>>();

  registerSources(uri: URI, sources: MultiDiffEditorItem[]) {
    const key = uri.toString();
    const saved = this.sourceValues.get(key);
    if (saved) {
      saved.value = sources;
    } else {
      this.sourceValues.set(key, new ValueWithChangeEvent(sources));
    }
  }

  canHandleUri(uri: URI): boolean {
    return uri.scheme === MULTI_DIFF_SCHEME;
  }

  async resolveDiffSource(uri: URI): Promise<IResolvedMultiDiffSource | undefined> {
    const value = this.sourceValues.get(uri.toString());
    if (!value) {
      return undefined;
    }

    return {
      resources: value,
    };
  }

  dispose() {
    this.sourceValues.clear();
  }
}
