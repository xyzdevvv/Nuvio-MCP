import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPView } from './view';

export class Nuvio-MCPOpenedEditorView extends Nuvio-MCPView {
  constructor(app: Nuvio-MCPApp) {
    super(app, {
      viewSelector: '[data-view-id="file-opened-editor"]',
      tabSelector: '[data-view-id="file-opened-editor"] [tabindex="0"]',
      name: 'OPENED EDITORS',
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
}
