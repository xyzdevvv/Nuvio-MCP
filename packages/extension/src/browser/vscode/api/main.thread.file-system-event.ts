import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { PreferenceService } from '@Nuvio-MCP/ide-core-browser';
import { IProgressService } from '@Nuvio-MCP/ide-core-browser/lib/progress';
import {
  CancellationTokenSource,
  Disposable,
  ILogger,
  MessageType,
  ProgressLocation,
  URI,
  Uri,
  formatLocalize,
  localize,
  raceCancellation,
} from '@Nuvio-MCP/ide-core-common';
import { FileChangeType, IFileServiceClient } from '@Nuvio-MCP/ide-file-service';
import { ResourceEdit } from '@Nuvio-MCP/ide-monaco/lib/browser/monaco-api';
import { IDialogService } from '@Nuvio-MCP/ide-overlay';
import {
  FileOperation,
  IBulkEditServiceShape,
  IWorkspaceFileOperationParticipant,
  IWorkspaceFileService,
} from '@Nuvio-MCP/ide-workspace-edit';

import { ExtHostAPIIdentifier } from '../../../common/vscode';
import { FileSystemEvents, IExtHostFileSystemEvent } from '../../../common/vscode/file-system';

@Injectable({ multiple: true })
export class MainThreadFileSystemEvent extends Disposable {
  @Autowired(IFileServiceClient)
  private readonly fileService: IFileServiceClient;

  @Autowired(IWorkspaceFileService)
  private readonly workspaceFileService: IWorkspaceFileService;

  @Autowired(PreferenceService)
  private readonly preferenceService: PreferenceService;

  @Autowired(IProgressService)
  private readonly progressService: IProgressService;

  @Autowired(ILogger)
  private readonly logger: ILogger;

  @Autowired(IDialogService)
  private readonly dialogService: IDialogService;

  @Autowired(IBulkEditServiceShape)
  private readonly bulkEditService: IBulkEditServiceShape;

  private _showPreview: string;
  private _proxy: IExtHostFileSystemEvent;

  constructor(private readonly rpcProtocol: IRPCProtocol) {
    super();
    this._proxy = this.rpcProtocol.getProxy<IExtHostFileSystemEvent>(ExtHostAPIIdentifier.ExtHostFileSystemEvent);

    // dispatch file event to ext-host
    this._dispatchFileEventListener();
    // do somethings when file operation is happening
    this._participateFileOperation();
    // Init listener for showPreview
    this._initShowPreview();
  }

  private _dispatchFileEventListener() {
    // file system events - (changes the editor and other make)
    const events: FileSystemEvents = {
      created: [],
      changed: [],
      deleted: [],
    };
    this.addDispose(
      this.fileService.onFilesChanged((changes) => {
        let hasResult = false;
        for (const change of changes) {
          switch (change.type) {
            case FileChangeType.ADDED:
              events.created.push(Uri.parse(change.uri));
              hasResult = true;
              break;
            case FileChangeType.UPDATED:
              events.changed.push(Uri.parse(change.uri));
              hasResult = true;
              break;
            case FileChangeType.DELETED:
              events.deleted.push(Uri.parse(change.uri));
              hasResult = true;
              break;
          }
        }

        if (hasResult) {
          this._proxy.$onFileEvent(events);
          events.created = [];
          events.changed = [];
          events.deleted = [];
        }
      }),
    );
  }

  private _participateFileOperation() {
    // BEFORE file operation
    this.addDispose(
      this.workspaceFileService.registerFileOperationParticipant({
        participate: this.fileOperationParticipant.bind(this),
      }),
    );

    // AFTER file operation
    this.addDispose(
      this.workspaceFileService.onDidRunWorkspaceFileOperation((e) =>
        this._proxy.$onDidRunFileOperation(e.operation, e.files),
      ),
    );
  }

  private _initShowPreview() {
    // additional edits for file-participants
    this._showPreview = this.preferenceService.get<string>('workbench.refactoringChanges.showPreviewStrategy')!;
    this.addDispose(
      this.preferenceService.onPreferenceChanged((e) => {
        if (e.preferenceName === 'workbench.refactoringChanges.showPreviewStrategy') {
          this._showPreview = e.newValue;
        }
      }),
    );
  }

  private async fileOperationParticipant(...args: Parameters<IWorkspaceFileOperationParticipant['participate']>) {
    const [files, operation, _, timeout, token] = args;

    const cts = new CancellationTokenSource(token);
    const timer = setTimeout(() => cts.cancel(), timeout);

    const data = await this.progressService
      .withProgress(
        {
          location: ProgressLocation.Notification,
          title: this.getProgressLabel(operation),
          cancellable: true,
          delay: Math.min(timeout / 2, 3000),
        },
        () => {
          // race ext-host event response against timeout/cancellation
          const onWillEvent = this._proxy.$onWillRunFileOperation(operation, files, timeout, token);
          return raceCancellation(onWillEvent, cts.token);
        },
        () => {
          // user-cancel
          cts.cancel();
        },
      )
      .finally(() => {
        cts.dispose();
        clearTimeout(timer);
      });

    if (!data) {
      // cancelled or no reply
      return;
    }

    let showPreview = this._showPreview;
    const needsConfirmation = data.edit.edits.some((edit) => edit.metadata?.needsConfirmation);

    if (showPreview === 'askMe') {
      // Interaction with user

      let message: string;
      if (data.extensionNames.length === 1) {
        if (operation === FileOperation.CREATE) {
          message = formatLocalize('refactoring-changes.ask.1.create', data.extensionNames[0]);
        } else if (operation === FileOperation.COPY) {
          message = formatLocalize('refactoring-changes.ask.1.copy', data.extensionNames[0]);
        } else if (operation === FileOperation.MOVE) {
          message = formatLocalize('refactoring-changes.ask.1.move', data.extensionNames[0]);
        } /* if (operation === FileOperation.DELETE) */ else {
          message = formatLocalize('refactoring-changes.ask.1.delete', data.extensionNames[0]);
        }
      } else {
        if (operation === FileOperation.CREATE) {
          message = formatLocalize('refactoring-changes.ask.N.create', data.extensionNames.length);
        } else if (operation === FileOperation.COPY) {
          message = formatLocalize('refactoring-changes.ask.N.copy', data.extensionNames.length);
        } else if (operation === FileOperation.MOVE) {
          message = formatLocalize('refactoring-changes.ask.N.move', data.extensionNames.length);
        } /* if (operation === FileOperation.DELETE) */ else {
          message = formatLocalize('refactoring-changes.ask.N.delete', data.extensionNames.length);
        }
      }

      if (needsConfirmation) {
        const choices = [
          localize('refactoring-changes.msg.showPreview'),
          localize('refactoring-changes.msg.skipChanges'),
        ];
        // edit#metadata.needsConfirmation#true --> show dialog
        const answer = await this.dialogService.open({ message, type: MessageType.Info, buttons: choices });
        showPreview = 'show';
        if (answer === choices[1]) {
          // Skip changes
          return;
        }
      } else {
        const choices = [
          localize('refactoring-changes.msg.showPreview'),
          localize('refactoring-changes.msg.skipChanges'),
          localize('component.modal.okText'),
        ];
        const answer = await this.dialogService.open({ message, type: MessageType.Info, buttons: choices });
        if (answer === choices[1]) {
          // Skip changes
          return;
        }
        showPreview = answer === choices[0] ? 'show' : 'hide';
      }
    }

    this.logger.log('[onWill-handler] applying additional workspace edit from extensions', data.extensionNames);

    const workspaceEditDto = data?.edit;
    if (workspaceEditDto) {
      await this.bulkEditService.apply(ResourceEdit.convert(workspaceEditDto), { showPreview: showPreview === 'show' });
    }
  }

  private getProgressLabel(operation: FileOperation) {
    switch (operation) {
      case FileOperation.CREATE:
        return localize('fileOperation.create', "Running 'File Create' participants...");
      case FileOperation.DELETE:
        return localize('fileOperation.delete', "Running 'File Delete' participants...");
      case FileOperation.COPY:
        return localize('fileOperation.copy', "Running 'File Copy' participants...");
      case FileOperation.MOVE:
        return localize('fileOperation.move', "Running 'File Move' participants...");
    }
  }
}
