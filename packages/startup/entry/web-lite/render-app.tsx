import * as BrowserFS from 'browserfs';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import { Injector } from '@Nuvio-MCP/di';
import { DEFAULT_WORKSPACE_CONFIGURATION_DIR_NAME, IClientAppOpts } from '@Nuvio-MCP/ide-core-browser';
import { ClientApp } from '@Nuvio-MCP/ide-core-browser/lib/bootstrap/app';
import { ensureDir } from '@Nuvio-MCP/ide-core-common/lib/browser-fs/ensure-dir';
import { IDiskFileProvider } from '@Nuvio-MCP/ide-file-service/lib/common';

import {
  AbstractHttpFileService,
  BROWSER_HOME_DIR,
  BrowserFsProvider,
} from './lite-module/file-provider/browser-fs-provider';
import { HttpFileService } from './lite-module/file-provider/http-file.service';

export async function renderApp(opts: IClientAppOpts) {
  const injector = new Injector();
  opts.injector = injector;

  opts.workspaceDir = opts.workspaceDir || process.env.WORKSPACE_DIR;
  opts.extWorkerHost = opts.extWorkerHost || 'http://localhost:8080/worker-host.js';
  opts.webviewEndpoint = opts.webviewEndpoint || 'http://localhost:50998';

  // TODO: 框架在新版本加了不允许覆盖file协议的限制，这里通过DI覆盖，后续需要确认下是否要必要加这个限制
  injector.addProviders({
    token: AbstractHttpFileService,
    useClass: HttpFileService,
  });
  const httpFs: AbstractHttpFileService = injector.get(AbstractHttpFileService);
  injector.addProviders({
    token: IDiskFileProvider,
    useValue: new BrowserFsProvider(httpFs, { rootFolder: opts.workspaceDir! }),
  });

  BrowserFS.configure(
    {
      fs: 'MountableFileSystem',
      options: {
        [opts.workspaceDir!]: { fs: 'InMemory' },
        // home目录挂载到lcoalstorage来支持一些记录的持久化，不需要持久化可以注释掉
        // '/home': { fs: "LocalStorage", options: {} },
      },
    },
    async function () {
      await ensureDir(opts.workspaceDir!);
      await ensureDir(BROWSER_HOME_DIR.codeUri.fsPath);
      await ensureDir(BROWSER_HOME_DIR.path.join(DEFAULT_WORKSPACE_CONFIGURATION_DIR_NAME).toString());
      const app = new ClientApp(opts);
      app.fireOnReload = () => {
        window.location.reload();
      };

      const targetDom = document.getElementById('main')!;
      await app.start((child) => {
        const MyApp = (
          <div id='custom-wrapper' style={{ height: '100%', width: '100%' }}>
            {child({})}
          </div>
        );
        return new Promise<void>((resolve) => {
          createRoot(targetDom).render(MyApp);
          resolve();
        });
      });
      const loadingDom = document.getElementById('loading');
      if (loadingDom) {
        loadingDom.classList.add('loading-hidden');
        loadingDom.remove();
      }
    },
  );
}
