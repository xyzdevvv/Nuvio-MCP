import { Autowired, Injectable, Provider } from '@Nuvio-MCP/di';
import {
  BrowserModule,
  CommandContribution,
  Domain,
  ILogger,
  MonacoContribution,
  MonacoOverrideServiceRegistry,
  ServiceNames,
  TabBarToolbarContribution,
  ToolbarRegistry,
  getIcon,
  localize,
} from '@Nuvio-MCP/ide-core-browser';
import { CommandRegistry } from '@Nuvio-MCP/ide-core-common';

import { IBulkEditServiceShape, IWorkspaceEditService, IWorkspaceFileService } from '../common';

import { MonacoBulkEditService } from './bulk-edit.service';
import { IRefactorPreviewService, PreviewViewId, RefactorPreviewServiceImpl } from './refactor-preview.service';
import { WorkspaceEditServiceImpl } from './workspace-edit.service';
import { WorkspaceFileService } from './workspace-file.service';

import type {
  IBulkEditOptions,
  ResourceEdit,
} from '@Nuvio-MCP/monaco-editor-core/esm/vs/editor/browser/services/bulkEditService';

const ClearEditsId = 'refactor-preview.clear.edits';
const ApplyEditsId = 'refactor-preview.apply.edits';

@Injectable()
export class WorkspaceEditModule extends BrowserModule {
  providers: Provider[] = [
    {
      token: IWorkspaceEditService,
      useClass: WorkspaceEditServiceImpl,
    },
    {
      token: IWorkspaceFileService,
      useClass: WorkspaceFileService,
    },
    {
      token: IRefactorPreviewService,
      useClass: RefactorPreviewServiceImpl,
    },
    {
      token: IBulkEditServiceShape,
      useClass: MonacoBulkEditService,
    },
    WorkspaceEditContribution,
  ];
}

@Domain(MonacoContribution, TabBarToolbarContribution, CommandContribution)
export class WorkspaceEditContribution implements MonacoContribution, TabBarToolbarContribution, CommandContribution {
  @Autowired(IBulkEditServiceShape)
  protected readonly bulkEditService: IBulkEditServiceShape;

  @Autowired(ILogger)
  protected readonly logger: ILogger;

  @Autowired(IRefactorPreviewService)
  protected readonly refactorPreviewService: IRefactorPreviewService;

  private async previewEdit(edits: ResourceEdit[], options?: IBulkEditOptions): Promise<ResourceEdit[]> {
    try {
      const filteredEdits = await this.refactorPreviewService.previewEdits(edits);
      return filteredEdits;
    } catch (err) {
      if (!err) {
        // Canceled
      } else {
        this.logger.error(`Preview textEdit error: \n ${err.message}`);
      }
      return edits;
    }
  }

  registerOverrideService(registry: MonacoOverrideServiceRegistry) {
    // Monaco BulkEditService
    registry.registerOverrideService(ServiceNames.BULK_EDIT_SERVICE, this.bulkEditService);
    this.bulkEditService.setPreviewHandler(this.previewEdit.bind(this));
  }

  registerToolbarItems(registry: ToolbarRegistry) {
    registry.registerItem({
      id: ClearEditsId,
      viewId: PreviewViewId,
      command: ClearEditsId,
      tooltip: localize('refactor-preview.title.clear'),
    });

    registry.registerItem({
      id: ApplyEditsId,
      viewId: PreviewViewId,
      command: ApplyEditsId,
      tooltip: localize('refactor-preview.title.apply'),
    });
  }

  registerCommands(registry: CommandRegistry) {
    registry.registerCommand(
      {
        id: ClearEditsId,
        iconClass: getIcon('clear'),
      },
      {
        execute: () => {
          this.refactorPreviewService.clearAllEdits();
        },
      },
    );

    registry.registerCommand(
      {
        id: ApplyEditsId,
        iconClass: getIcon('check'),
      },
      {
        execute: () => {
          this.refactorPreviewService.applyEdits();
        },
      },
    );
  }
}
