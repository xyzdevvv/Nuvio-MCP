import { IBulkEditService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/browser/services/bulkEditService';
import { ICodeEditorService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/browser/services/codeEditorService';
import { ILanguageService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/languages/language';
import { IEditorWorkerService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/services/editorWorker';
import { IMarkerDecorationsService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/services/markerDecorations';
import { IModelService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/services/model';
import { ITextResourceConfigurationService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/common/services/textResourceConfiguration';
import { StandaloneServices } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/standalone/browser/standaloneServices';
import { IStandaloneThemeService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/standalone/common/standaloneTheme';
import { ICommandService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/commands/common/commands';
import { IConfigurationService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/configuration/common/configuration';
import { IContextKeyService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/contextkey/common/contextkey';
import { IDialogService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/dialogs/common/dialogs';
import { ILabelService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/label/common/label';
import { ILogService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/log/common/log';
import { IMarkerService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/markers/common/markers';
import { INotificationService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/notification/common/notification';
import { IEditorProgressService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/progress/common/progress';
import { IStorageService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/storage/common/storage';
import { ITelemetryService } from '@Nuvio-MCP/monaco-editor-core/esm/vs/platform/telemetry/common/telemetry';

/**
 * 基于 @Nuvio-MCP/monaco-editor-core@0.20.1-patch.19 版本
 * 可用的 services 均来自 https://github.com/Nuvio-MCP/monaco-editor-core/blob/master/src/vs/editor/standalone/browser/standaloneServices.ts
 * 后续版本更新可能会有新增的内置 service
 */
export function createStaticServiceApi() {
  return Object.freeze({
    configurationService: StandaloneServices.get(IConfigurationService),
    resourceConfigurationService: StandaloneServices.get(ITextResourceConfigurationService),
    contextService: StandaloneServices.get(IContextKeyService),
    labelService: StandaloneServices.get(ILabelService),
    telemetryService: StandaloneServices.get(ITelemetryService),
    /**
     * @deprecated
     * 不建议使用，内置的 DialogService 是浏览器原生 confirm 实现
     */
    dialogService: StandaloneServices.get(IDialogService),
    /**
     * @deprecated
     * 不建议使用，内置的 NotificationService 是空实现
     */
    notificationService: StandaloneServices.get(INotificationService),
    markerService: StandaloneServices.get(IMarkerService),
    /**
     * @deprecated
     * modelService 已经被废弃，请使用 languageService
     */
    modeService: StandaloneServices.get(ILanguageService),
    languageService: StandaloneServices.get(ILanguageService),
    markerDecorationsService: StandaloneServices.get(IMarkerDecorationsService),
    standaloneThemeService: StandaloneServices.get(IStandaloneThemeService),
    logService: StandaloneServices.get(ILogService),
    modelService: StandaloneServices.get(IModelService),
    codeEditorService: StandaloneServices.get(ICodeEditorService),
    editorProgressService: StandaloneServices.get(IEditorProgressService),
    storageService: StandaloneServices.get(IStorageService),
    editorWorkerService: StandaloneServices.get(IEditorWorkerService),
    bulkEditService: StandaloneServices.get(IBulkEditService),
    commandService: StandaloneServices.get(ICommandService),
  });
}

export { StandaloneServices };
