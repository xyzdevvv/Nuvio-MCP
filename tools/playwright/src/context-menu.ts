import { ElementHandle } from '@playwright/test';

import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPMenu } from './menu';

export class Nuvio-MCPContextMenu extends Nuvio-MCPMenu {
  public static async openAt(app: Nuvio-MCPApp, x: number, y: number): Promise<Nuvio-MCPContextMenu> {
    await app.page.mouse.move(x, y);
    await app.page.mouse.click(x, y, { button: 'right' });
    return Nuvio-MCPContextMenu.returnWhenVisible(app);
  }

  public static async open(
    app: Nuvio-MCPApp,
    element: () => Promise<ElementHandle<SVGElement | HTMLElement>>,
  ): Promise<Nuvio-MCPContextMenu> {
    const elementHandle = await element();
    await elementHandle.click({ button: 'right' });
    return Nuvio-MCPContextMenu.returnWhenVisible(app);
  }

  private static async returnWhenVisible(app: Nuvio-MCPApp): Promise<Nuvio-MCPContextMenu> {
    const menu = new Nuvio-MCPContextMenu(app);
    await menu.waitForVisible();
    return menu;
  }
}
