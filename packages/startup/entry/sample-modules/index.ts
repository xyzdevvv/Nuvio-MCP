import { Injectable, Provider } from '@Nuvio-MCP/di';
import { BrowserModule } from '@Nuvio-MCP/ide-core-browser';
import { AbstractNodeExtProcessService } from '@Nuvio-MCP/ide-extension/lib/common/extension.service';

import { AINativeContribution } from './ai-native/ai-native.contribution';
import { DebugConfigurationContribution } from './debug-configuration.contribution';
import { EditorEmptyComponentContribution } from './editor-empty-component.contribution';
import { MenuBarContribution } from './menu-bar/menu-bar.contribution';
import { OverrideExtensionNodeService } from './overrides/extension/extension-node.service';
import { StatusBarContribution } from './status-bar.contribution';

@Injectable()
export class SampleModule extends BrowserModule {
  providers: Provider[] = [
    MenuBarContribution,
    EditorEmptyComponentContribution,
    StatusBarContribution,
    AINativeContribution,
    DebugConfigurationContribution,
    {
      token: AbstractNodeExtProcessService,
      useClass: OverrideExtensionNodeService,
      override: true,
    },
  ];
}
