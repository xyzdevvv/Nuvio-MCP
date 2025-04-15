import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPContextMenu } from './context-menu';
import { Nuvio-MCPView } from './view';

export class Nuvio-MCPOutlineView extends Nuvio-MCPView {
  constructor(app: Nuvio-MCPApp) {
    super(app, {
      viewSelector: '[data-view-id="outline-view"]',
      tabSelector: '[data-view-id="outline-view"] [tabindex="0"]',
      name: 'OUTLINE',
    });
  }

  async getTitleActionByName(name: string) {
    const header = await this.getTabElement();
    if (!header) {
      return;
    }
    await header.hover();
    const titleAction = await header.waitForSelector('[class*="titleActions___"]');
    const actions = await titleAction.$$('[class*="iconAction__"]');
    for (const action of actions) {
      const title = await action.getAttribute('title');
      if (name === title) {
        return action;
      }
    }
  }

  async openTabContextMenu() {
    const header = await this.getTabElement();
    if (!header) {
      return;
    }
    return Nuvio-MCPContextMenu.open(this.app, async () => header);
  }
}
