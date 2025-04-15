import { Autowired } from '@Nuvio-MCP/di';
import { PreferenceContribution, PreferenceSchemaProvider } from '@Nuvio-MCP/ide-core-browser';
import { Domain, OperatingSystem, PreferenceSchema, TerminalSettingsId } from '@Nuvio-MCP/ide-core-common';

import { ITerminalService } from '../../common';
import { terminalPreferenceSchema } from '../../common/preference';
import { NodePtyTerminalService } from '../terminal.service';

@Domain(PreferenceContribution)
export class TerminalPreferenceContribution implements PreferenceContribution {
  public schema: PreferenceSchema = terminalPreferenceSchema;

  @Autowired(ITerminalService)
  private ptyTerminal: NodePtyTerminalService;

  @Autowired(PreferenceSchemaProvider)
  private preferenceSchemaProvider: PreferenceSchemaProvider;

  constructor() {
    const TERMINAL_TYPE_ENUM = ['git-bash', 'powershell', 'cmd', 'default'];
    const {
      properties: { [TerminalSettingsId.Type]: terminalTypeProperty },
    } = { ...terminalPreferenceSchema };

    this.ptyTerminal.getOS().then((osType) => {
      if (osType === OperatingSystem.Windows) {
        this.preferenceSchemaProvider.setSchema(
          {
            properties: {
              [TerminalSettingsId.Type]: {
                ...terminalTypeProperty,
                enum: TERMINAL_TYPE_ENUM, // if OS is windows, update terminal type
              },
            },
          },
          true,
        );
      }
    });
  }
}
