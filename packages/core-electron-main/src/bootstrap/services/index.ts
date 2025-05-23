import { Provider } from '@Nuvio-MCP/di';

import { MenuElectronMainContribution } from './menu';
import { ProtocolElectronMainContribution } from './protocol';
import { UIElectronMainContribution } from './ui';
import { UrlElectronMainContribution } from './url';

export const serviceProviders: Provider[] = [
  MenuElectronMainContribution,
  UIElectronMainContribution,
  ProtocolElectronMainContribution,
  UrlElectronMainContribution,
];
