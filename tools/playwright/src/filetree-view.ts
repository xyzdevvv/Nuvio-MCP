import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPView } from './view';

export class Nuvio-MCPFileTreeView extends Nuvio-MCPView {
  constructor(app: Nuvio-MCPApp, workspaceName: string) {
    super(app, {
      viewSelector: '[data-view-id="file-explorer"]',
      tabSelector: '[data-view-id="file-explorer"] [tabindex="0"]',
      name: workspaceName,
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
