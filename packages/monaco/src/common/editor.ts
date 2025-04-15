export {
  EndOfLinePreference,
  IAttachedView,
  ICursorStateComputer,
  IIdentifiedSingleEditOperation,
  IModelDecoration,
  IModelDecorationOptions,
  IModelDecorationOverviewRulerOptions,
  InjectedTextOptions,
  IModelDecorationsChangeAccessor,
  IModelDecorationMinimapOptions,
  IModelDeltaDecoration,
  TrackedRangeStickiness,
  ITextModelUpdateOptions,
  FindMatch,
  ITextModel,
  EndOfLineSequence,
  OverviewRulerLane,
  TextModelResolvedOptions,
  ITextBuffer,
  ITextSnapshot,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/model';
export { IWordAtPosition } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/core/wordHelper';
export * from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/cursorEvents';
export { DetailedLineRangeMapping } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/diff/rangeMapping';
export * from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/config/editorOptions';
export { ITokenThemeRule } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/languages/supports/tokenization';
export type {
  IPartialEditorMouseEvent,
  IEditorMouseEvent,
  IActiveCodeEditor,
  IEditorAriaOptions,
  ICodeEditor,
  IPasteEvent,
  IContentWidget,
  IViewZoneChangeAccessor,
  IOverlayWidget,
  IMouseTarget,
  IGlyphMarginWidget,
  IContentWidgetPosition,
  IViewZone,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/browser/editorBrowser';
export * from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/textModelEvents';
export type {
  IStandaloneDiffEditor,
  IStandaloneCodeEditor,
  IStandaloneEditorConstructionOptions,
  IStandaloneDiffEditorConstructionOptions,
  IActionDescriptor,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneCodeEditor';
export {
  IDiffEditorModel,
  IDiffEditorViewModel,
  IEditorAction,
  ScrollType,
  IEditorDecorationsCollection,
  IDiffEditorViewState,
  ICommand,
  IScrollEvent,
  IModelChangedEvent,
  ICodeEditorViewState,
  IContentSizeChangedEvent,
  IDecorationOptions,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/editorCommon';
export { IDimension } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/core/dimension';
export { IChange, ILineChange } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/diff/legacyLinesDiffComputer';
export {
  ContextKeyValue,
  IContextKey,
  IContextKeyService,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/contextkey/common/contextkey';
export {
  CommandsRegistry,
  ICommandHandler,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/commands/common/commands';
export {
  INewScrollPosition,
  Scrollable,
  ScrollbarVisibility,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/base/common/scrollable';
export type { IEditorWhitespace, IViewModel } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/viewModel';
export {
  IMarker,
  IMarkerData,
  IRelatedInformation,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/markers/common/markers';

export { KeyMod } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/services/editorBaseApi';
