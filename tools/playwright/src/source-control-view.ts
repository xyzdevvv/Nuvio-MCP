import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPView } from './view';

export class Nuvio-MCPSourceControlView extends Nuvio-MCPView {
  constructor(app: Nuvio-MCPApp, name: string) {
    super(app, {
      viewSelector: '[data-view-id="scm_view"]',
      tabSelector: '[data-view-id="scm_view"] [tabindex="0"]',
      name,
    });
  }

  async getTreeNode() {
    return await this.page.$('[class*="scm_tree_node_content___"]');
  }

  async getTreeNodeActionById(id: string) {
    const header = await this.getTreeNode();
    if (!header) {
      return;
    }
    await header.hover();
    const titleAction = await header.waitForSelector('[class*="titleActions___"]');
    const actions = await titleAction.$$('[class*="iconAction__"]');
    for (const action of actions) {
      const title = await action.getAttribute('id');
      if (id === title) {
        return action;
      }
    }
  }

  async getTitleActionByName(name: string) {
    const header = await this.page.$('.scm [class*="titlebar___"]');
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

  async getTitleActionById(id: string) {
    const header = await this.page.$('.scm [class*="titlebar___"]');
    if (!header) {
      return;
    }
    await header.hover();
    const titleAction = await header.waitForSelector('[class*="titleActions___"]');
    const actions = await titleAction.$$('[class*="iconAction__"]');
    for (const action of actions) {
      const itemId = await action.getAttribute('id');
      if (id === itemId) {
        return action;
      }
    }
  }
}
