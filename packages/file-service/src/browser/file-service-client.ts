import { TextDocument } from 'vscode-languageserver-types';

import { Autowired, INJECTOR_TOKEN, Injectable, Injector } from '@Nuvio-MCP/di';
import {
  AppConfig,
  BinaryBuffer,
  Deferred,
  DisposableCollection,
  Emitter,
  Event,
  ExtensionActivateEvent,
  FileUri,
  FilesChangeEvent,
  IDisposable,
  ParsedPattern,
  URI,
  Uri,
  parseGlob,
} from '@Nuvio-MCP/ide-core-browser';
import { CorePreferences } from '@Nuvio-MCP/ide-core-browser/lib/core-preferences';
import { FileSystemProviderCapabilities, IEventBus, ILogger, Schemes, isUndefined } from '@Nuvio-MCP/ide-core-common';
import { IElectronMainUIService } from '@Nuvio-MCP/ide-core-common/lib/electron';
import { IApplicationService } from '@Nuvio-MCP/ide-core-common/lib/types/application';
import { Iterable } from '@Nuvio-MCP/monaco-editor-core/esm/vs/base/common/iterator';

import {
  DidFilesChangedParams,
  FileAccess,
  FileChange,
  FileChangeEvent,
  FileCopyOptions,
  FileCreateOptions,
  FileDeleteOptions,
  FileMoveOptions,
  FileSetContentOptions,
  FileStat,
  FileSystemError,
  FileSystemProvider,
  IBrowserFileSystemRegistry,
  IDiskFileProvider,
  IFileServiceClient,
  IFileServiceWatcher,
  IFileSystemProvider,
  IFileSystemProviderActivationEvent,
  IFileSystemProviderCapabilitiesChangeEvent,
  IFileSystemProviderRegistrationEvent,
  TextDocumentContentChangeEvent,
  containsExtraFileMethod,
} from '../common';

import { FileSystemWatcher } from './watcher';

@Injectable()
export class BrowserFileSystemRegistryImpl implements IBrowserFileSystemRegistry {
  public readonly providers = new Map<string, IFileSystemProvider>();
  registerFileSystemProvider(provider: IFileSystemProvider) {
    const scheme = provider.scheme;
    this.providers.set(scheme, provider);
    return {
      dispose: () => {
        this.providers.delete(scheme);
      },
    };
  }
}

@Injectable()
export class FileServiceClient implements IFileServiceClient, IDisposable {
  protected readonly watcherWithSchemaMap = new Map<string, number[]>();
  protected readonly watcherDisposerMap = new Map<number, IDisposable>();
  protected readonly onFileChangedEmitter = new Emitter<FileChangeEvent>();
  protected readonly onFileProviderChangedEmitter = new Emitter<string[]>();

  protected readonly _onFilesChanged = new Emitter<FileChangeEvent>();
  readonly onFilesChanged: Event<FileChangeEvent> = this._onFilesChanged.event;

  protected readonly _onFileProviderChanged = new Emitter<string[]>();
  readonly onFileProviderChanged: Event<string[]> = this._onFileProviderChanged.event;

  protected readonly _onDidChangeFileSystemProviderRegistrations = new Emitter<IFileSystemProviderRegistrationEvent>();
  readonly onDidChangeFileSystemProviderRegistrations = this._onDidChangeFileSystemProviderRegistrations.event;

  private readonly _onWillActivateFileSystemProvider = new Emitter<IFileSystemProviderActivationEvent>();
  readonly onWillActivateFileSystemProvider = this._onWillActivateFileSystemProvider.event;

  private readonly _onDidChangeFileSystemProviderCapabilities =
    new Emitter<IFileSystemProviderCapabilitiesChangeEvent>();
  readonly onDidChangeFileSystemProviderCapabilities = this._onDidChangeFileSystemProviderCapabilities.event;

  protected filesExcludesMatcherList: ParsedPattern[] = [];

  protected watcherId = 0;
  protected toDisposable = new DisposableCollection();
  protected watchFileExcludes: string[] = [];
  protected watchFileExcludesMatcherList: ParsedPattern[] = [];
  protected filesExcludes: string[] = [];
  protected workspaceRoots: string[] = [];

  // 记录哪些 fsProviders 发生了变更
  private _providerChanged: Set<string> = new Set();

  @Autowired(IBrowserFileSystemRegistry)
  private registry: BrowserFileSystemRegistryImpl;

  private fsProviders: Map<string, FileSystemProvider | IDiskFileProvider> = new Map();

  @Autowired(INJECTOR_TOKEN)
  private injector: Injector;

  @Autowired(IEventBus)
  private eventBus: IEventBus;

  @Autowired(AppConfig)
  private readonly appConfig: AppConfig;

  @Autowired(IApplicationService)
  protected readonly applicationService: IApplicationService;

  @Autowired(ILogger)
  private readonly logger: ILogger;
  private get clientId() {
    return this.applicationService.clientId;
  }

  private userHomeDeferred: Deferred<FileStat | undefined> = new Deferred();

  public options = {
    encoding: 'utf8',
    overwrite: false,
    recursive: true,
    moveToTrash: true,
  };

  constructor() {
    this.toDisposable.push(
      this.onDidChangeFileSystemProviderRegistrations((e) => {
        // 只支持 file
        if (e.added && e.scheme === Schemes.file) {
          this.doGetCurrentUserHome();
        }
      }),
    );
  }

  async initialize() {
    const provider = await this.getProvider(Schemes.file);
    if (provider.initialize) {
      await provider.initialize(this.clientId, this.appConfig.recursiveWatcherBackend);
    }
  }

  private async doGetCurrentUserHome() {
    const provider = await this.getProvider(Schemes.file);
    const userHome = provider.getCurrentUserHome();
    this.userHomeDeferred.resolve(userHome);
  }

  corePreferences: CorePreferences;

  handlesScheme(scheme: string) {
    return this.registry.providers.has(scheme) || this.fsProviders.has(scheme);
  }

  public dispose() {
    return this.toDisposable.dispose();
  }

  /**
   * 直接先读文件，错误在后端抛出
   * @deprecated 方法在未来或许有变化
   * @param uri URI 地址
   */
  async resolveContent(uri: string, options?: FileSetContentOptions) {
    const _uri = this.convertUri(uri);
    const provider = await this.getProvider(_uri.scheme);
    const rawContent = await provider.readFile(_uri.codeUri);
    const data = (rawContent as any).data || rawContent;
    const buffer = BinaryBuffer.wrap(Uint8Array.from(data));
    return { content: buffer.toString(options?.encoding) };
  }

  async readFile(uri: string) {
    const _uri = this.convertUri(uri);
    const provider = await this.getProvider(_uri.scheme);
    const rawContent = await provider.readFile(_uri.codeUri);
    const data = (rawContent as any).data || rawContent;
    const buffer = BinaryBuffer.wrap(Uint8Array.from(data));
    return { content: buffer };
  }

  async readFileStream(uri: string) {
    const _uri = this.convertUri(uri);
    const provider = await this.getProvider(_uri.scheme);
    return await provider.readFileStream!(_uri.codeUri);
  }

  async getFileStat(uri: string, withChildren = true) {
    const _uri = this.convertUri(uri);
    const provider = await this.getProvider(_uri.scheme);
    try {
      const stat = await provider.stat(_uri.codeUri);
      if (!stat) {
        throw FileSystemError.FileNotFound(_uri.codeUri.toString(), 'File not found.');
      }
      return this.filterStat(stat, withChildren);
    } catch (err) {
      if (FileSystemError.FileNotFound.is(err)) {
        return undefined;
      }
    }
  }

  async setContent(file: FileStat, content: string | Uint8Array, options?: FileSetContentOptions) {
    const _uri = this.convertUri(file.uri);
    const provider = await this.getProvider(_uri.scheme);
    const stat = await provider.stat(_uri.codeUri);

    if (!stat) {
      throw FileSystemError.FileNotFound(file.uri, 'File not found.');
    }
    if (stat.isDirectory) {
      throw FileSystemError.FileIsADirectory(file.uri, 'Cannot set the content.');
    }
    if (!(await this.isInSync(file, stat))) {
      throw this.createOutOfSyncError(file);
    }
    await provider.writeFile(
      _uri.codeUri,
      typeof content === 'string' ? BinaryBuffer.fromString(content).buffer : content,
      { create: false, overwrite: true, encoding: options?.encoding },
    );
    const newStat = await provider.stat(_uri.codeUri);
    return newStat;
  }

  async updateContent(
    file: FileStat,
    contentChanges: TextDocumentContentChangeEvent[],
    options?: FileSetContentOptions,
  ): Promise<FileStat> {
    const _uri = this.convertUri(file.uri);
    const provider = await this.getProvider(_uri.scheme);
    const stat = await provider.stat(_uri.codeUri);
    if (!stat) {
      throw FileSystemError.FileNotFound(file.uri, 'File not found.');
    }
    if (stat.isDirectory) {
      throw FileSystemError.FileIsADirectory(file.uri, 'Cannot set the content.');
    }
    if (!this.checkInSync(file, stat)) {
      throw this.createOutOfSyncError(file);
    }
    if (contentChanges.length === 0) {
      return stat;
    }
    const content = (await provider.readFile(_uri.codeUri)) as Uint8Array;
    const newContent = this.applyContentChanges(BinaryBuffer.wrap(content).toString(options?.encoding), contentChanges);
    await provider.writeFile(_uri.codeUri, BinaryBuffer.fromString(newContent).buffer, {
      create: false,
      overwrite: true,
      encoding: options?.encoding,
    });
    const newStat = await provider.stat(_uri.codeUri);
    if (!newStat) {
      throw FileSystemError.FileNotFound(_uri.codeUri.toString(), 'File not found.');
    }
    return newStat;
  }

  async createFile(uri: string, options?: FileCreateOptions) {
    const _uri = this.convertUri(uri);
    const provider = await this.getProvider(_uri.scheme);

    const content = BinaryBuffer.fromString(options?.content || '').buffer;
    let newStat: any = await provider.writeFile(_uri.codeUri, content, {
      create: true,
      overwrite: (options && options.overwrite) || false,
      encoding: options?.encoding,
    });
    newStat = newStat || (await provider.stat(_uri.codeUri));
    return newStat;
  }

  async createFolder(uri: string): Promise<FileStat> {
    const _uri = this.convertUri(uri);
    const provider = await this.getProvider(_uri.scheme);

    const result = await provider.createDirectory(_uri.codeUri);

    if (result) {
      return result;
    }
    const stat = await provider.stat(_uri.codeUri);
    return stat as FileStat;
  }

  async move(sourceUri: string, targetUri: string, options?: FileMoveOptions): Promise<FileStat> {
    const _sourceUri = this.convertUri(sourceUri);
    const _targetUri = this.convertUri(targetUri);

    const provider = await this.getProvider(_sourceUri.scheme);
    const result: any = await provider.rename(_sourceUri.codeUri, _targetUri.codeUri, {
      overwrite: !!(options && options.overwrite),
    });

    if (result) {
      return result;
    }

    const stat = await provider.stat(_targetUri.codeUri);
    return stat as FileStat;
  }

  async copy(sourceUri: string, targetUri: string, options?: FileCopyOptions): Promise<FileStat> {
    const _sourceUri = this.convertUri(sourceUri);
    const _targetUri = this.convertUri(targetUri);
    const provider = await this.getProvider(_sourceUri.scheme);
    const overwrite = await this.doGetOverwrite(options);

    if (!containsExtraFileMethod(provider, 'copy')) {
      throw this.getErrorProvideNotSupport(_sourceUri.scheme, 'copy');
    }

    const result = await provider.copy(_sourceUri.codeUri, _targetUri.codeUri, {
      overwrite: !!overwrite,
    });

    if (result) {
      return result;
    }
    const stat = await provider.stat(_targetUri.codeUri);
    return stat as FileStat;
  }

  async getFsPath(uri: string) {
    if (!uri.startsWith('file:/')) {
      return undefined;
    } else {
      return FileUri.fsPath(uri);
    }
  }

  fireFilesChange(event: DidFilesChangedParams): void {
    const changes: FileChange[] = event.changes.map(
      (change) =>
        ({
          uri: change.uri,
          type: change.type,
        } as FileChange),
    );
    this._onFilesChanged.fire(changes);
    this.eventBus.fire(new FilesChangeEvent(changes));
  }

  private uriWatcherMap: Map<
    string,
    {
      watcher: FileSystemWatcher;
      excludes?: string[];
    }
  > = new Map();

  // 添加监听文件
  async watchFileChanges(uri: URI, excludes?: string[]): Promise<IFileServiceWatcher> {
    const pollingWatcherDirectories = this.appConfig.pollingWatcherDirectories || [];
    const pollingWatch = pollingWatcherDirectories.some((dir) => uri.path.toString().startsWith(dir));

    const _uri = this.convertUri(uri.toString());

    let id = 0;
    const provider = await this.getProvider(_uri.scheme);
    const schemaWatchIdList = this.watcherWithSchemaMap.get(_uri.scheme) || [];

    let prevWatcher: IFileServiceWatcher | undefined;
    if (this.uriWatcherMap.has(_uri.toString())) {
      const watcherInfo = this.uriWatcherMap.get(_uri.toString());
      prevWatcher = watcherInfo?.watcher;
      if (prevWatcher) {
        await prevWatcher.dispose();
      }
    }

    if (prevWatcher) {
      id = prevWatcher.watchId;
    } else {
      id = this.watcherId++;
    }

    const watcherId = await provider.watch(_uri.codeUri, {
      excludes,
      pollingWatch,
    });

    this.watcherDisposerMap.set(id, {
      dispose: async () => {
        const watcherInfo = this.uriWatcherMap.get(_uri.toString());
        const watcher = watcherInfo?.watcher;
        await Promise.all([provider.unwatch && provider.unwatch(watcherId), watcher && watcher.dispose()]);
        this.uriWatcherMap.delete(_uri.toString());
      },
    });
    schemaWatchIdList.push(id);
    this.watcherWithSchemaMap.set(_uri.scheme, schemaWatchIdList);
    const watcher = new FileSystemWatcher({
      fileServiceClient: this,
      watchId: id,
      uri,
    });
    this.uriWatcherMap.set(_uri.toString(), {
      watcher,
      excludes,
    });
    return watcher;
  }

  async setWatchFileExcludes(excludes: string[]) {
    const provider = await this.getProvider(Schemes.file);
    return await provider.setWatchFileExcludes(excludes);
  }

  async getWatchFileExcludes() {
    const provider = await this.getProvider(Schemes.file);
    return await provider.getWatchFileExcludes();
  }

  async setFilesExcludes(excludes: string[], roots?: string[]): Promise<void> {
    this.filesExcludes = excludes;
    this.filesExcludesMatcherList = [];
    if (roots) {
      this.setWorkspaceRoots(roots);
    }
    this.updateExcludeMatcher();
  }

  async setWorkspaceRoots(roots: string[]) {
    this.workspaceRoots = roots;
    this.updateExcludeMatcher();
  }

  async unwatchFileChanges(watcherId: number): Promise<void> {
    const disposable = this.watcherDisposerMap.get(watcherId);
    if (!disposable || !disposable.dispose) {
      return;
    }
    this.watcherDisposerMap.delete(watcherId);
    return disposable.dispose();
  }

  async delete(uriString: string, options?: FileDeleteOptions) {
    if (this.appConfig.isElectronRenderer && options?.moveToTrash !== false) {
      const uri = new URI(uriString);
      if (uri.scheme === Schemes.file) {
        return (this.injector.get(IElectronMainUIService) as IElectronMainUIService).moveToTrash(uri.codeUri.fsPath);
      }
    }
    const _uri = this.convertUri(uriString);
    const provider = await this.getProvider(_uri.scheme);

    await provider.stat(_uri.codeUri);

    await provider.delete(_uri.codeUri, {
      recursive: true,
      moveToTrash: await this.doGetMoveToTrash(options),
    });
  }

  async getEncoding(uri: string): Promise<string> {
    // FIXME: 临时修复方案 目前识别率太低，全部返回 UTF8
    return 'utf8';
  }

  // capabilities
  listCapabilities(): Iterable<{ scheme: string; capabilities: FileSystemProviderCapabilities }> {
    return Iterable.map(this.fsProviders, ([scheme, provider]) => ({ scheme, capabilities: provider.capabilities }));
  }
  // capabilities end

  registerProvider(scheme: string, provider: FileSystemProvider): IDisposable {
    if (this.fsProviders.has(scheme)) {
      throw new Error(`The file system provider for \`${scheme}\` already registered`);
    }

    const disposables: IDisposable[] = [];

    this.fsProviders.set(scheme, provider);
    this._onDidChangeFileSystemProviderRegistrations.fire({ added: true, scheme, provider });

    disposables.push({
      dispose: () => {
        this._onDidChangeFileSystemProviderRegistrations.fire({ added: false, scheme, provider });
        this.fsProviders.delete(scheme);
        this._providerChanged.add(scheme);
      },
    });

    if (provider.onDidChangeFile) {
      disposables.push(provider.onDidChangeFile((e) => this.fireFilesChange({ changes: e })));
    }
    this.toDisposable.push(
      provider.onDidChangeCapabilities(() =>
        this._onDidChangeFileSystemProviderCapabilities.fire({ provider, scheme }),
      ),
    );
    disposables.push({
      dispose: async () => {
        const promises = [] as any[];
        (this.watcherWithSchemaMap.get(scheme) || []).forEach((id) => promises.push(this.unwatchFileChanges(id)));
        await Promise.all(promises);
      },
    });

    this._providerChanged.add(scheme);
    this.onFileProviderChangedEmitter.fire(Array.from(this._providerChanged));
    this.toDisposable.pushAll(disposables);

    /**
     * 当外部注册了当前 Provider 的时候，暴露出去一个 dispose 供注册方去调用
     */
    const tempToDisable = new DisposableCollection();

    tempToDisable.pushAll(disposables);

    this._onFileProviderChanged.fire(Array.from(this._providerChanged));
    return tempToDisable;
  }

  async access(uri: string, mode: number = FileAccess.Constants.F_OK): Promise<boolean> {
    const _uri = this.convertUri(uri);
    const provider = await this.getProvider(_uri.scheme);

    if (!containsExtraFileMethod(provider, 'access')) {
      if (mode === FileAccess.Constants.F_OK) {
        // 当 mode 为 F_OK 时，如果 provider 不支持 access 方法，则使用 stat 方法判断文件是否存在
        try {
          const stat = await provider.stat(_uri.codeUri);
          return !!stat;
        } catch (error) {
          return false;
        }
      }
      throw this.getErrorProvideNotSupport(_uri.scheme, 'access');
    }

    return await provider.access(_uri.codeUri, mode);
  }

  // 这里需要 try catch 了
  async getFileType(uri: string) {
    const _uri = this.convertUri(uri);
    const provider = await this.getProvider(_uri.scheme);

    if (!containsExtraFileMethod(provider, 'getFileType')) {
      throw this.getErrorProvideNotSupport(_uri.scheme, 'getFileType');
    }

    return await provider.getFileType(uri);
  }

  // FIXME: file scheme only?
  async getCurrentUserHome() {
    return this.userHomeDeferred.promise;
  }

  private getErrorProvideNotSupport(scheme: string, funName: string): string {
    return `Scheme ${scheme} not support this function: ${funName}.`;
  }

  /**
   * 提供一个方法让集成方对该方法进行复写。
   * 如双容器架构中对 IDE 容器读取不到的研发容器目录进行 scheme 替换，让插件提供提供的 fs-provider 去读取
   */
  protected convertUri(uri: string | Uri): URI {
    const _uri = new URI(uri);

    if (!_uri.scheme) {
      throw new Error(`Unsupported convert Uri with non-scheme Uri: ${uri}`);
    }

    return _uri;
  }

  private updateExcludeMatcher() {
    this.filesExcludes.forEach((str) => {
      if (this.workspaceRoots.length > 0) {
        this.workspaceRoots.forEach((root: string) => {
          const uri = new URI(root);
          const pathStrWithExclude = uri.resolve(str).path.toString();
          this.filesExcludesMatcherList.push(parseGlob(pathStrWithExclude));
        });
      } else {
        this.filesExcludesMatcherList.push(parseGlob(str));
      }
    });
  }

  public async shouldWaitProvider(scheme: string): Promise<boolean> {
    const activateSchema = await this._onWillActivateFileSystemProvider.fireAndAwait<string[]>({
      scheme,
    });

    const { result } = activateSchema[0];

    if (result && result.includes(scheme)) {
      const providerSchema = await Event.toPromise(
        Event.filter(this.onFileProviderChanged, (schema: string[]) => schema.includes(scheme)),
      );

      if (!isUndefined(providerSchema)) {
        return true;
      }
    }

    return false;
  }

  private async getProvider<T extends string>(
    scheme: T,
  ): Promise<T extends 'file' ? IDiskFileProvider : FileSystemProvider>;
  private async getProvider(scheme: string): Promise<IDiskFileProvider | FileSystemProvider> {
    if (this._providerChanged.has(scheme)) {
      // 让相关插件启动完成 (3秒超时), 此处防止每次都发，仅在相关scheme被影响时才尝试激活插件
      await this.eventBus.fireAndAwait(new ExtensionActivateEvent({ topic: 'onFileSystem', data: scheme }), {
        timeout: 3000,
      });
      this._providerChanged.delete(scheme);
    }

    const provider = this.fsProviders.get(scheme);

    if (!provider) {
      throw new Error(`Not find ${scheme} provider.`);
    }

    return provider;
  }

  public async isReadonly(uriString: string): Promise<boolean> {
    try {
      const uri = new URI(uriString);
      const provider = await this.getProvider(uri.scheme);
      const stat = (await provider.stat(this.convertUri(uriString).codeUri)) as FileStat;
      return !!stat.readonly;
    } catch (e) {
      // 考虑到非 readonly 变readonly 的情况，相对于 readonly 变不 readonly 来说更为严重
      return false;
    }
  }

  private isExclude(uriString: string) {
    const uri = new URI(uriString);

    return this.filesExcludesMatcherList.some((matcher) => matcher(uri.path.toString()));
  }

  private filterStat(stat?: FileStat, withChildren = true) {
    if (!stat) {
      return;
    }
    if (this.isExclude(stat.uri)) {
      return;
    }

    // 这里传了 false 就走不到后面递归逻辑了
    if (stat.children && withChildren) {
      stat.children = this.filterStatChildren(stat.children);
    }

    return stat;
  }

  private filterStatChildren(children: FileStat[]) {
    const list: FileStat[] = [];

    children.forEach((child) => {
      if (this.isExclude(child.uri)) {
        return false;
      }
      const state = this.filterStat(child);
      if (state) {
        list.push(state);
      }
    });

    return list;
  }

  protected applyContentChanges(content: string, contentChanges: TextDocumentContentChangeEvent[]): string {
    let document = TextDocument.create('', '', 1, content);
    for (const change of contentChanges) {
      let newContent = change.text;
      if (change.range) {
        const start = document.offsetAt(change.range.start);
        const end = document.offsetAt(change.range.end);
        newContent = document.getText().substr(0, start) + change.text + document.getText().substr(end);
      }
      document = TextDocument.create(document.uri, document.languageId, document.version, newContent);
    }
    return document.getText();
  }

  protected async isInSync(file: FileStat, stat: FileStat): Promise<boolean> {
    if (this.checkInSync(file, stat)) {
      return true;
    }
    return false;
  }

  protected checkInSync(file: FileStat, stat: FileStat): boolean {
    return stat.lastModification === file.lastModification && stat.size === file.size;
  }

  protected createOutOfSyncError(file: FileStat): Error {
    return FileSystemError.FileIsOutOfSync(file.uri);
  }

  protected async doGetEncoding(option?: { encoding?: string }): Promise<string> {
    return option && typeof option.encoding !== 'undefined' ? option.encoding : this.options.encoding;
  }

  protected async doGetOverwrite(option?: { overwrite?: boolean }): Promise<boolean | undefined> {
    return option && typeof option.overwrite !== 'undefined' ? option.overwrite : this.options.overwrite;
  }

  protected async doGetRecursive(option?: { recursive?: boolean }): Promise<boolean> {
    return option && typeof option.recursive !== 'undefined' ? option.recursive : this.options.recursive;
  }

  protected async doGetMoveToTrash(option?: { moveToTrash?: boolean }): Promise<boolean> {
    return option && typeof option.moveToTrash !== 'undefined' ? option.moveToTrash : this.options.moveToTrash;
  }

  async reconnect() {
    const provider = await this.getProvider(Schemes.file);
    if (provider.initialize) {
      await provider.initialize(this.clientId, this.appConfig.recursiveWatcherBackend);
    }
    const uriList = Array.from(this.uriWatcherMap.keys());
    const reconnectPromises = uriList.map(async (uriString) => {
      try {
        const uri = new URI(uriString);
        const watcherInfo = this.uriWatcherMap.get(uriString);
        if (watcherInfo?.watcher) {
          await this.watchFileChanges(uri, watcherInfo.excludes);
        }
      } catch (err) {
        this.logger?.error('Error reconnecting watcher for:', uriString, err);
      }
    });
    await Promise.allSettled(reconnectPromises);
  }
}
