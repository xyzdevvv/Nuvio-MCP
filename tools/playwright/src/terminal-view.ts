import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPContextMenu } from './context-menu';
import { Nuvio-MCPPanel } from './panel';

type TerminalType = 'bash' | 'zsh' | 'Javascript Debug Terminal';

export class Nuvio-MCPTerminalView extends Nuvio-MCPPanel {
  constructor(app: Nuvio-MCPApp) {
    super(app, 'TERMINAL');
  }

  async sendText(text: string) {
    const visible = await this.isVisible();
    if (!visible) {
      await this.open();
    }
    await this.focus();
    const box = await this.view?.boundingBox();
    if (box) {
      await this.app.page.mouse.click(box.x + box?.width / 2, box.y + box?.height / 2);
    }
    await this.page.keyboard.type(text);
    await this.app.page.keyboard.press('Enter');
  }

  async createTerminalByType(type: TerminalType) {
    const buttonWrapper = await this.view?.$('[class*="item_wrapper__"]');
    const buttons = await buttonWrapper?.$$('.kaitian-icon');
    if (!buttons) {
      return;
    }
    let button;
    for (const item of buttons) {
      const title = await item.getAttribute('title');
      if (title === 'Create terminal by type') {
        button = item;
        break;
      }
    }
    if (!button) {
      return;
    }
    await button.click();
    const menu = new Nuvio-MCPContextMenu(this.app);
    await menu.waitForVisible();
    await menu.clickMenuItem(type);

    // 新建终端后，需要等待一段时间，否则会出现终端未创建完成的情况
    await this.app.page.waitForTimeout(5000);
  }
}
