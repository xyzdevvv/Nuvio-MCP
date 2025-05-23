import path from 'path';

import * as fs from 'fs-extra';
import temp from 'temp';

import { WSChannelHandler } from '@Nuvio-MCP/ide-connection/lib/browser';
import { AppConfig } from '@Nuvio-MCP/ide-core-browser';
import { FileUri, IFileServiceClient, ILoggerManagerClient, StoragePaths, URI } from '@Nuvio-MCP/ide-core-common';
import { IHashCalculateService } from '@Nuvio-MCP/ide-core-common/lib/hash-calculate/hash-calculate';
import { createBrowserInjector } from '@Nuvio-MCP/ide-dev-tool/src/injector-helper';
import { MockInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';
import { IExtensionStoragePathServer, IExtensionStorageServer } from '@Nuvio-MCP/ide-extension-storage';
import { FileStat, IDiskFileProvider } from '@Nuvio-MCP/ide-file-service';
import { FileServiceClient } from '@Nuvio-MCP/ide-file-service/lib/browser/file-service-client';
import { DiskFileSystemProvider } from '@Nuvio-MCP/ide-file-service/lib/node/disk-file-system.provider';
import { WatcherProcessManagerToken } from '@Nuvio-MCP/ide-file-service/lib/node/watcher-process-manager';

import { ExtensionStorageModule } from '../../src/browser';

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error(reason);
});

describe('Extension Storage Server -- Setup directory should be worked', () => {
  let injector: MockInjector;
  let root: URI;
  const track = temp.track();

  const initializeInjector = async () => {
    injector = createBrowserInjector([ExtensionStorageModule]);

    injector.addProviders(
      {
        token: AppConfig,
        useValue: {},
      },
      {
        token: IFileServiceClient,
        useClass: FileServiceClient,
      },
      {
        token: IDiskFileProvider,
        useClass: DiskFileSystemProvider,
      },
      {
        token: WSChannelHandler,
        useValue: {
          clientId: 'test_client_id',
        },
      },
      {
        token: WatcherProcessManagerToken,
        useValue: {
          setClient: () => void 0,
          watch: (() => 1) as any,
          unWatch: () => void 0,
          createProcess: () => void 0,
          setWatcherFileExcludes: () => void 0,
        },
      },
    );
    const hashImpl = injector.get(IHashCalculateService) as IHashCalculateService;
    await hashImpl.initialize();
    const fileServiceClient: FileServiceClient = injector.get(IFileServiceClient);
    fileServiceClient.registerProvider('file', injector.get(IDiskFileProvider));
  };

  beforeEach(() => {
    root = FileUri.create(fs.realpathSync(temp.mkdirSync('extension-storage-test')));

    return initializeInjector();
  });

  afterEach(async () => {
    track.cleanupSync();
    await injector.disposeAll();
  });

  it('Extension Path Server should setup directory correctly', async () => {
    const extensionStorage = injector.get(IExtensionStorageServer);
    const rootFileStat = {
      uri: root.toString(),
      isDirectory: true,
      lastModification: 0,
    } as FileStat;
    const extensionStorageDirName = '.extensionStorageDirName';
    injector.mock(ILoggerManagerClient, 'getLogFolder', () => root.path.toString());
    injector.mock(IExtensionStoragePathServer, 'getUserHomeDir', async () => root.path.toString());
    await extensionStorage.init(rootFileStat, [rootFileStat], extensionStorageDirName);
    expect(fs.existsSync(path.join(root.path.toString(), extensionStorageDirName))).toBeTruthy();
    expect(
      fs.existsSync(
        path.join(root.path.toString(), extensionStorageDirName, StoragePaths.EXTENSIONS_GLOBAL_STORAGE_DIR),
      ),
    ).toBeTruthy();
    expect(
      fs.existsSync(
        path.join(root.path.toString(), extensionStorageDirName, StoragePaths.EXTENSIONS_WORKSPACE_STORAGE_DIR),
      ),
    ).toBeTruthy();
  });
});

describe('Extension Storage Server -- Data operation should be worked', () => {
  let injector: MockInjector;
  let root: URI;
  let extensionStorage: IExtensionStorageServer;
  const track = temp.track();

  const initializeInjector = async () => {
    injector = createBrowserInjector([ExtensionStorageModule]);

    injector.addProviders(
      {
        token: AppConfig,
        useValue: {},
      },
      {
        token: IFileServiceClient,
        useClass: FileServiceClient,
      },
      {
        token: IDiskFileProvider,
        useClass: DiskFileSystemProvider,
      },
      {
        token: WSChannelHandler,
        useValue: {
          clientId: 'test_client_id',
        },
      },
      {
        token: WatcherProcessManagerToken,
        useValue: {
          setClient: () => void 0,
          watch: (() => 1) as any,
          unWatch: () => void 0,
          createProcess: () => void 0,
          setWatcherFileExcludes: () => void 0,
        },
      },
    );

    const fileServiceClient: FileServiceClient = injector.get(IFileServiceClient);
    fileServiceClient.registerProvider('file', injector.get(IDiskFileProvider));
    const hashImpl = injector.get(IHashCalculateService) as IHashCalculateService;
    await hashImpl.initialize();
  };

  beforeEach(async () => {
    root = FileUri.create(fs.realpathSync(temp.mkdirSync('extension-storage-test')));

    await initializeInjector();

    extensionStorage = injector.get(IExtensionStorageServer);
    const rootFileStat = {
      uri: root.toString(),
      isDirectory: true,
      lastModification: 0,
    } as FileStat;
    const extensionStorageDirName = '.extensionStorageDirName';
    injector.mock(ILoggerManagerClient, 'getLogFolder', () => root.path.toString());
    injector.mock(IExtensionStoragePathServer, 'getUserHomeDir', async () => root.path.toString());
    await extensionStorage.init(rootFileStat, [rootFileStat], extensionStorageDirName);
  });

  afterEach(async () => {
    track.cleanupSync();
    await injector.disposeAll();
  });

  it('Global -- set value can be work', async () => {
    const isGlobal = true;
    const key = 'test';
    const value = {
      hello: 'world',
    };
    const data = {};
    data[key] = value;
    await extensionStorage.set(key, value, isGlobal);
    expect(await extensionStorage.get(key, isGlobal)).toEqual(value);
    expect(await extensionStorage.getAll(isGlobal)).toEqual(data);
  });

  it('Workspace -- set value can be work', async () => {
    const isGlobal = false;
    const key = 'test';
    const value = {
      hello: 'world',
    };
    const data = {};
    data[key] = value;
    await extensionStorage.set(key, value, isGlobal);
    expect(await extensionStorage.get(key, isGlobal)).toEqual(value);
    expect(await extensionStorage.getAll(isGlobal)).toEqual(data);
  });
});
