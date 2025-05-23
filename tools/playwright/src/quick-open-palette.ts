import { ElementHandle } from '@playwright/test';

import { isMacintosh } from '@Nuvio-MCP/ide-utils';

import { Nuvio-MCP_VIEW_CONTAINERS } from './constans';
import { Nuvio-MCPViewBase } from './view-base';

export class Nuvio-MCPQuickOpenPalette extends Nuvio-MCPViewBase {
  static USER_KEY_TYPING_DELAY = 200;

  async open() {
    await this.page.keyboard.press(isMacintosh ? 'Meta+p' : 'Control+p');
    await this.page.waitForSelector(`#${Nuvio-MCP_VIEW_CONTAINERS.QUICKPICK}`);
  }

  async isOpen(): Promise<boolean> {
    try {
      await this.page.waitForSelector(`#${Nuvio-MCP_VIEW_CONTAINERS.QUICKPICK}`, { timeout: 5000 });
    } catch (err) {
      return false;
    }
    return true;
  }

  async trigger(...commandName: string[]): Promise<void> {
    for (const command of commandName) {
      await this.triggerSingleCommand(command);
    }
  }

  protected async triggerSingleCommand(commandName: string): Promise<void> {
    if (!(await this.isOpen())) {
      await this.open();
    }
    let selected = await this.selectedCommand();
    while (!((await selected?.getAttribute('aria-label')) === commandName)) {
      await this.page.keyboard.press('ArrowDown');
      selected = await this.selectedCommand();
    }
    await this.page.keyboard.press('Enter');
  }

  async type(command: string): Promise<void> {
    if (!(await this.isOpen())) {
      await this.open();
    }
    const input = await this.page.waitForSelector(`#${Nuvio-MCP_VIEW_CONTAINERS.QUICKPICK_INPUT}`);
    if (input != null) {
      await input.focus();
      await input.type(command, { delay: Nuvio-MCPQuickOpenPalette.USER_KEY_TYPING_DELAY });
    }
  }

  protected async selectedCommand(): Promise<ElementHandle<SVGElement | HTMLElement> | null> {
    const command = await this.page.waitForSelector(`#${Nuvio-MCP_VIEW_CONTAINERS.QUICKPICK}`);
    if (!command) {
      throw new Error('No selected command found!');
    }
    const item = await command.$("[class*='item_selected']");
    return item;
  }
}
