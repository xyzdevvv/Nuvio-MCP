import { AppConfig, SlotLocation, IElectronMainMenuService } from '@Nuvio-MCP/ide-core-browser';
import { IElectronMenuBarService } from '@Nuvio-MCP/ide-core-browser/lib/menu/next/renderer/ctxmenu/electron';
import { IElectronMainLifeCycleService, IElectronMainUIService } from '@Nuvio-MCP/ide-core-common/lib/electron';
import { IMessageService } from '@Nuvio-MCP/ide-overlay/lib/common';

import { createBrowserInjector } from '../../../tools/dev-tool/src/injector-helper';
import { MockInjector } from '../../../tools/dev-tool/src/mock-injector';

import { mockService } from './utils';

export const createElectronBasicInjector = (): MockInjector => {
  const injector = createBrowserInjector([]);
  injector.addProviders(
    {
      token: AppConfig,
      useValue: {
        layoutConfig: {
          [SlotLocation.top]: {
            modules: ['@Nuvio-MCP/ide-menu-bar'],
          },
        },
      },
      override: true,
    },
    {
      token: IElectronMenuBarService,
      useValue: mockService({}),
    },
    {
      token: IElectronMainMenuService,
      useValue: mockService({}),
    },
    {
      token: IElectronMainUIService,
      useValue: mockService({}),
    },
    {
      token: IElectronMainLifeCycleService,
      useValue: mockService({}),
    },
    {
      token: IMessageService,
      useValue: mockService({}),
    },
  );
  return injector;
};
