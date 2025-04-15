import os from 'os';

import {
  HashCalculateServiceImpl,
  IHashCalculateService,
} from '@Nuvio-MCP/ide-core-common/lib/hash-calculate/hash-calculate';
import { AppConfig, INodeLogger, getDebugLogger, path } from '@Nuvio-MCP/ide-core-node';
import { createNodeInjector } from '@Nuvio-MCP/ide-dev-tool/src/mock-injector';
import { IExtensionStoragePathServer } from '@Nuvio-MCP/ide-extension-storage/lib/common';
import { IDiskFileProvider, IFileService } from '@Nuvio-MCP/ide-file-service/lib/common';
import { FileService, FileSystemNodeOptions } from '@Nuvio-MCP/ide-file-service/lib/node';
import { DiskFileSystemProvider } from '@Nuvio-MCP/ide-file-service/lib/node/disk-file-system.provider';

import { IExtensionNodeClientService, IExtensionNodeService } from '../../src/common';
import { ExtensionNodeServiceImpl } from '../../src/node/extension.service';
import { ExtensionServiceClientImpl } from '../../src/node/extension.service.client';

export const extensionDir = path.join(__dirname, '../../__mocks__/extensions');

export const getBaseInjector = () => {
  const injector = createNodeInjector([]);
  injector.addProviders(
    {
      token: AppConfig,
      useValue: {
        marketplace: {
          extensionDir,
          ignoreId: [],
        },
      },
    },
    {
      token: INodeLogger,
      useValue: getDebugLogger(),
    },
    {
      token: IFileService,
      useClass: FileService,
    },
    {
      token: IDiskFileProvider,
      useClass: DiskFileSystemProvider,
    },
    {
      token: 'FileServiceOptions',
      useValue: FileSystemNodeOptions.DEFAULT,
    },
    {
      token: IExtensionStoragePathServer,
      useValue: {
        getLastStoragePath: () => Promise.resolve(path.join(os.homedir(), '.sumi-extension-test', 'workspace-storage')),
      },
    },
    {
      token: IExtensionNodeService,
      useClass: ExtensionNodeServiceImpl,
    },
    {
      token: IExtensionNodeClientService,
      useClass: ExtensionServiceClientImpl,
    },
    {
      token: IHashCalculateService,
      useClass: HashCalculateServiceImpl,
    },
  );
  return injector;
};
