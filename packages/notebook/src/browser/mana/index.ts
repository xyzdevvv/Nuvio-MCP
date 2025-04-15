import { GlobalContainer, Syringe } from '@difizen/mana-app';

import { Injector } from '@Nuvio-MCP/di';

export const Nuvio-MCPInjector = Syringe.defineToken('Nuvio-MCPInjector');
export const ManaContainer = Symbol('ManaContainer');

export const initLibroNuvio-MCP = (injector: Injector, container?: Syringe.Container) => {
  const initInjector = injector;
  const initContainer = container || GlobalContainer;
  initInjector.addProviders({
    token: ManaContainer,
    useValue: initContainer,
  });
  initContainer?.register({ token: Nuvio-MCPInjector, useValue: initInjector });
};

export const manaContainer = GlobalContainer.createChild();

export const ContentLoaderType = 'libro-Nuvio-MCP-loader';
