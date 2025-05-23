import { Autowired, INJECTOR_TOKEN, Injectable, Injector } from '@Nuvio-MCP/di';
import {
  Emitter,
  Event,
  FileSystemProviderCapabilities,
  RecursiveWatcherBackend,
  Uri,
  debounce,
  getDebugLogger,
  isLinux,
} from '@Nuvio-MCP/ide-core-common';
import { IReadableStream } from '@Nuvio-MCP/ide-utils/lib/stream';

import {
  DidFilesChangedParams,
  DiskFileServicePath,
  FileChange,
  FileChangeEvent,
  FileSystemProvider,
  IDiskFileProvider,
} from '../common';

export abstract class CoreFileServiceProviderClient implements FileSystemProvider {
  @Autowired(INJECTOR_TOKEN)
  injector: Injector;

  abstract capabilities: FileSystemProviderCapabilities;
  abstract onDidChangeCapabilities: Event<void>;

  abstract fileServiceProvider: FileSystemProvider;

  protected readonly onDidChangeFileEmitter = new Emitter<FileChangeEvent>();
  onDidChangeFile: Event<FileChangeEvent> = this.onDidChangeFileEmitter.event;

  watch(uri: Uri, options: { recursive: boolean; excludes: string[] }) {
    return this.fileServiceProvider.watch(uri, options);
  }

  unwatch(watcherId: number) {
    return this.fileServiceProvider.unwatch && this.fileServiceProvider.unwatch(watcherId);
  }

  async stat(uri: Uri) {
    const stat = await this.fileServiceProvider.stat(uri);
    return stat;
  }

  readDirectory(uri: Uri) {
    return this.fileServiceProvider.readDirectory(uri);
  }

  createDirectory(uri: Uri) {
    return this.fileServiceProvider.createDirectory(uri);
  }

  async readFile(uri: Uri, encoding?: string) {
    if (encoding) {
      getDebugLogger('fileService.fsProvider').warn('encoding option for fsProvider.readFile is deprecated');
    }
    const buffer = await this.fileServiceProvider.readFile(uri);
    return buffer;
  }

  readFileStream(uri: Uri): Promise<IReadableStream<Uint8Array>> {
    if (this.fileServiceProvider.readFileStream) {
      return this.fileServiceProvider.readFileStream(uri);
    }
    throw new Error('readFileStream not supported');
  }

  writeFile(uri: Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean }) {
    // TODO: 转换放到connection抹平
    return this.fileServiceProvider.writeFile(uri, Array.from(content) as any, options);
  }

  delete(uri: Uri, options: { recursive: boolean; moveToTrash?: boolean | undefined }) {
    return this.fileServiceProvider.delete(uri, options);
  }

  rename(oldUri: Uri, newUri: Uri, options: { overwrite: boolean }) {
    return this.fileServiceProvider.rename(oldUri, newUri, options);
  }
}

@Injectable()
export class DiskFsProviderClient extends CoreFileServiceProviderClient implements IDiskFileProvider {
  @Autowired(DiskFileServicePath)
  fileServiceProvider: IDiskFileProvider;

  onDidChangeCapabilities: Event<void> = Event.None;
  protected _capabilities: FileSystemProviderCapabilities | undefined;
  get capabilities(): FileSystemProviderCapabilities {
    if (!this._capabilities) {
      this._capabilities =
        FileSystemProviderCapabilities.FileReadWrite |
        FileSystemProviderCapabilities.FileOpenReadWriteClose |
        FileSystemProviderCapabilities.FileReadStream |
        FileSystemProviderCapabilities.FileFolderCopy |
        FileSystemProviderCapabilities.FileWriteUnlock |
        FileSystemProviderCapabilities.Trash;

      if (isLinux) {
        this._capabilities |= FileSystemProviderCapabilities.PathCaseSensitive;
      }
    }

    return this._capabilities;
  }

  async initialize(clientId: string, backend?: RecursiveWatcherBackend) {
    if (this.fileServiceProvider?.initialize) {
      try {
        await this.fileServiceProvider?.initialize(clientId, backend);
      } catch (err) {
        getDebugLogger('fileService.fsProvider').error('initialize error', err);
      }
    }
  }

  @debounce(100)
  setWatchFileExcludes(excludes: string[]) {
    return this.fileServiceProvider.setWatchFileExcludes(excludes);
  }

  getWatchFileExcludes() {
    return this.fileServiceProvider.getWatchFileExcludes();
  }

  onDidFilesChanged(event: DidFilesChangedParams): void {
    const changes: FileChange[] = event.changes.map(
      (change) =>
        ({
          uri: change.uri,
          type: change.type,
        } as FileChange),
    );
    this.onDidChangeFileEmitter.fire(changes);
  }

  copy(source: Uri, destination: Uri, options: { overwrite: boolean }) {
    return this.fileServiceProvider.copy(source, destination, options);
  }

  access(uri: Uri, mode: number) {
    return this.fileServiceProvider.access(uri, mode);
  }

  getCurrentUserHome() {
    return this.fileServiceProvider.getCurrentUserHome();
  }

  getFileType(uri: string) {
    return this.fileServiceProvider.getFileType(uri);
  }
}
