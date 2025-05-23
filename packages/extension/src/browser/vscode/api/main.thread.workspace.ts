import { Autowired, Injectable, Optional } from '@Nuvio-MCP/di';
import { IRPCProtocol } from '@Nuvio-MCP/ide-connection';
import { CancellationToken, IDisposable, ILogger, OnEvent, URI, WithEventBus } from '@Nuvio-MCP/ide-core-browser';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import { IExtensionStorageService } from '@Nuvio-MCP/ide-extension-storage';
import { FileSearchServicePath, IFileSearchService } from '@Nuvio-MCP/ide-file-search/lib/common';
import { FileStat } from '@Nuvio-MCP/ide-file-service';
import { IBulkEditResult, ResourceEdit } from '@Nuvio-MCP/ide-monaco/lib/browser/monaco-api/index';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';
import { IBulkEditServiceShape, WorkspaceEditDidRenameFileEvent } from '@Nuvio-MCP/ide-workspace-edit';

import { ExtHostAPIIdentifier, IExtHostStorage, IExtHostWorkspace, IMainThreadWorkspace } from '../../../common/vscode';

import type * as model from '../../../common/vscode/model.api';

@Injectable({ multiple: true })
export class MainThreadWorkspace extends WithEventBus implements IMainThreadWorkspace {
  private readonly proxy: IExtHostWorkspace;
  private roots: FileStat[];

  @Autowired(IWorkspaceService)
  workspaceService: IWorkspaceService;

  @Autowired(WorkbenchEditorService)
  editorService: WorkbenchEditorService;

  @Autowired(FileSearchServicePath)
  private readonly fileSearchService: IFileSearchService;

  @Autowired(IExtensionStorageService)
  extensionStorageService: IExtensionStorageService;

  @Autowired(IBulkEditServiceShape)
  protected readonly bulkEditService: IBulkEditServiceShape;

  storageProxy: IExtHostStorage;

  @Autowired(ILogger)
  logger: ILogger;

  private workspaceChangeEvent: IDisposable;

  constructor(@Optional(Symbol()) private rpcProtocol: IRPCProtocol) {
    super();
    this.proxy = this.rpcProtocol.getProxy(ExtHostAPIIdentifier.ExtHostWorkspace);

    this.processWorkspaceFoldersChanged(this.workspaceService.tryGetRoots());

    this.addDispose(
      (this.workspaceChangeEvent = this.workspaceService.onWorkspaceChanged((roots) => {
        this.processWorkspaceFoldersChanged(roots);
      })),
    );

    this.storageProxy = rpcProtocol.getProxy<IExtHostStorage>(ExtHostAPIIdentifier.ExtHostStorage);
  }

  async $startFileSearch(
    includePattern: string,
    options: { cwd?: string; absolute: boolean },
    excludePatternOrDisregardExcludes: string | false | undefined,
    maxResult: number | undefined,
    token: CancellationToken,
  ): Promise<string[]> {
    const fileSearchOptions: IFileSearchService.Options = {
      rootUris: options.cwd ? [options.cwd] : this.workspaceService.tryGetRoots().map((root) => root.uri),
      excludePatterns: excludePatternOrDisregardExcludes ? [excludePatternOrDisregardExcludes] : undefined,
      limit: maxResult,
      includePatterns: [includePattern],
    };
    const result = await this.fileSearchService.find('', fileSearchOptions, token);
    return result;
  }

  private isAnyRootChanged(roots: FileStat[]): boolean {
    if (!this.roots || this.roots.length !== roots.length) {
      return true;
    }

    return this.roots.some((root, index) => root.uri !== roots[index].uri);
  }

  processWorkspaceFoldersChanged(roots: FileStat[]): void {
    if (this.isAnyRootChanged(roots) === false) {
      return;
    }
    this.roots = roots;
    this.proxy.$onWorkspaceFoldersChanged({ roots });

    // workspace变化，更新及初始化storage
    this.extensionStorageService.getAll(false).then((v) => {
      this.storageProxy.$updateWorkspaceStorageData(v);
    });
  }

  dispose() {
    super.dispose();
    this.workspaceChangeEvent.dispose();
  }

  async $updateWorkspaceFolders(
    start: number,
    deleteCount?: number,
    workspaceToName?: { [key: string]: string },
    ...rootsToAdd: string[]
  ): Promise<void> {
    await this.workspaceService.spliceRoots(
      start,
      deleteCount,
      workspaceToName,
      ...rootsToAdd.map((root) => new URI(root)),
    );
  }

  async $tryApplyWorkspaceEdit(
    dto: model.WorkspaceEditDto,
    metadata?: model.WorkspaceEditMetadataDto,
  ): Promise<boolean> {
    try {
      const edits = ResourceEdit.convert(dto);
      const { success } = (await this.bulkEditService.apply(edits, {
        respectAutoSaveConfig: metadata?.isRefactoring,
      })) as IBulkEditResult & { success: boolean };
      return success;
    } catch (e) {
      return false;
    }
  }

  async $save(uri: URI): Promise<URI | undefined> {
    if (!uri) {
      return undefined;
    }

    try {
      const saveUri = URI.file(uri.path.toString());
      return await this.editorService.save(saveUri);
    } catch (error) {
      this.logger.error(`Save Failed: ${error.message}`);
      return undefined;
    }
  }

  async $saveAs(uri: URI): Promise<URI | undefined> {
    if (!uri) {
      return undefined;
    }

    try {
      return await this.editorService.saveAs(uri);
    } catch (error) {
      this.logger.error(`SaveAs Failed: ${error.message}`);
      return undefined;
    }
  }

  async $saveAll(): Promise<boolean> {
    try {
      await this.editorService.saveAll();
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  @OnEvent(WorkspaceEditDidRenameFileEvent)
  onRenameFile(e: WorkspaceEditDidRenameFileEvent) {
    this.proxy.$didRenameFile(e.payload.oldUri.codeUri, e.payload.newUri.codeUri);
  }
}
