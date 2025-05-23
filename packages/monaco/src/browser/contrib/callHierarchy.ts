import { LanguageFeatureRegistry } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/languageFeatureRegistry';

import type { CancellationToken, IPosition, IRange, SymbolTag, Uri as URI } from '@Nuvio-MCP/ide-core-common';
import type { Position } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/core/position';
import type { ProviderResult, SymbolKind } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/languages';
import type { ITextModel } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/model';

export interface CallHierarchyItem {
  _sessionId: string;
  _itemId: string;
  kind: SymbolKind;
  name: string;
  detail?: string;
  uri: URI;
  range: IRange;
  selectionRange: IRange;
  tags?: SymbolTag[];
}

export interface IncomingCall {
  from: CallHierarchyItem;
  fromRanges: IRange[];
}

export interface OutgoingCall {
  fromRanges: IRange[];
  to: CallHierarchyItem;
}

export interface CallHierarchySession {
  roots: CallHierarchyItem[];
  dispose(): void;
}

export interface CallHierarchyProvider {
  prepareCallHierarchy(
    document: ITextModel,
    position: IPosition,
    token: CancellationToken,
  ): ProviderResult<CallHierarchySession>;

  provideIncomingCalls(item: CallHierarchyItem, token: CancellationToken): ProviderResult<IncomingCall[]>;

  provideOutgoingCalls(item: CallHierarchyItem, token: CancellationToken): ProviderResult<OutgoingCall[]>;
}

export const CallHierarchyProviderRegistry = new LanguageFeatureRegistry<CallHierarchyProvider>();

export interface ICallHierarchyService {
  registerCallHierarchyProvider: (selector: any, provider: CallHierarchyProvider) => void;

  prepareCallHierarchyProvider: (resource: URI, position: Position) => Promise<CallHierarchyItem[]>;

  provideIncomingCalls: (item: CallHierarchyItem) => ProviderResult<IncomingCall[]>;

  provideOutgoingCalls: (item: CallHierarchyItem) => ProviderResult<OutgoingCall[]>;
}

export const ICallHierarchyService = Symbol('ICallHierarchyService');
