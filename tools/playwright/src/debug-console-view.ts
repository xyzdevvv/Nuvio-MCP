import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPContextMenu } from './context-menu';
import { Nuvio-MCPPanel } from './panel';

export class Nuvio-MCPDebugConsoleView extends Nuvio-MCPPanel {
  constructor(app: Nuvio-MCPApp) {
    super(app, 'DEBUG-CONSOLE');
  }

  async getOutputContainer() {
    return this.view?.$('[class*="debug_console_output__"]');
  }

  async openConsoleContextMenu() {
    const view = await this.getOutputContainer();
    if (!view) {
      return;
    }
    return Nuvio-MCPContextMenu.open(this.app, async () => view);
  }
}
