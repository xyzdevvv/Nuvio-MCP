import os from 'os';
import path from 'path';

import * as fs from 'fs-extra';

import { Injector } from '@Nuvio-MCP/di';
import { IHashCalculateService } from '@Nuvio-MCP/ide-core-common/lib/hash-calculate/hash-calculate';
import { IExtensionStoragePathServer } from '@Nuvio-MCP/ide-extension-storage/lib/common';
import { WatcherProcessManagerToken } from '@Nuvio-MCP/ide-file-service/lib/node/watcher-process-manager';

import { IExtensionNodeClientService } from '../../src/common';

import { extensionDir, getBaseInjector } from './baseInjector';

describe('Extension Client Serivce', () => {
  let injector: Injector;
  let extensionNodeClient: IExtensionNodeClientService;
  const testExtId = 'Nuvio-MCP.ide-dark-theme';
  const testExtPath = 'Nuvio-MCP.ide-dark-theme-1.13.1';
  const testExtReadme = '# IDE Dark Theme';

  beforeAll(async () => {
    injector = getBaseInjector();
    extensionNodeClient = injector.get(IExtensionNodeClientService);
  });

  describe('get all extensions', () => {
    it('should get all extension and equals dirs', async () => {
      const extensions = await extensionNodeClient.getAllExtensions([extensionDir], [], 'zh-CN', {});
      const dirs = fs.readdirSync(extensionDir);

      expect(extensions.map((e) => path.basename(e.realPath)).sort()).toEqual(dirs.sort());
      expect(extensions.length).toBe(dirs.length);
    });

    it('should get all extension and contains extraMetadata', async () => {
      const extension = await extensionNodeClient.getAllExtensions([extensionDir], [], 'zh_CN', {
        readme: './README.md',
      });
      const expectExtension = extension.find((e) => e.id === testExtId);
      expect(expectExtension?.extraMetadata.readme.trim()).toEqual(testExtReadme);
    });
  });

  describe('get extension', () => {
    it('should get first extension', async () => {
      const extension = await extensionNodeClient.getExtension(path.join(extensionDir, testExtPath), 'zh_CN', {});
      expect(path.basename(extension!.realPath)).toBe(testExtPath);
    });

    it('should get a extension and contains extraMetadata', async () => {
      const extension = await extensionNodeClient.getExtension(path.join(extensionDir, testExtPath), 'zh_CN', {
        readme: './README.md',
      });
      const readme = fs.readFileSync(path.join(extensionDir, testExtPath, 'README.md'), 'utf8').toString();

      expect(extension!.extraMetadata.readme).toBe(readme);
    });
  });

  describe('language pack', () => {
    it('should generate languagepacks.json and set VSCODE_NLS_CONFIG', async () => {
      // download languagepack extension
      const name = 'vscode-language-pack-zh-hans';
      const publisher = 'vscode-extensions';
      const version = '1.37.1';
      const lpPath = path.join(os.homedir(), '.sumi', 'workspace-storage', 'languagepacks.json');
      injector.addProviders({
        token: WatcherProcessManagerToken,
        useValue: {
          setClient: () => void 0,
        },
      });
      // make sure the workspace-storage path is exist
      const extensionStorageServer = injector.get(IExtensionStoragePathServer);
      const hashCalculateService = injector.get(IHashCalculateService);
      await hashCalculateService.initialize();
      const targetPath = path.join(extensionDir, `${publisher}.${name}-${version}`);
      const storagePath = (await extensionStorageServer.getLastStoragePath()) || '';
      await extensionNodeClient.updateLanguagePack('zh-CN', targetPath, storagePath);
      expect(fs.existsSync(lpPath));
      // const content = fs.readFileSync(lpPath, { encoding: 'utf8' });

      expect(!!process.env['VSCODE_NLS_CONFIG']);
      const nlsConfig = JSON.parse(process.env['VSCODE_NLS_CONFIG']!);
      expect(nlsConfig.locale).toBe('zh-cn');
    });
  });
});
