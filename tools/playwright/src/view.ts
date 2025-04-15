import { ElementHandle } from '@playwright/test';

import { Nuvio-MCPApp } from './app';
import { containsClass, isElementVisible } from './utils';
import { Nuvio-MCPViewBase } from './view-base';

export interface Nuvio-MCPViewInfo {
  tabSelector: string;
  viewSelector: string;
  name?: string;
}

export class Nuvio-MCPView extends Nuvio-MCPViewBase {
  constructor(app: Nuvio-MCPApp, private readonly data: Nuvio-MCPViewInfo) {
    super(app);
  }

  get tabSelector() {
    return this.data.tabSelector;
  }

  get viewSelector() {
    return this.data.viewSelector;
  }

  get name() {
    return this.data.name;
  }

  getViewElement(): Promise<ElementHandle<SVGElement | HTMLElement> | null> {
    return this.page.$(this.viewSelector);
  }

  getTabElement(): Promise<ElementHandle<SVGElement | HTMLElement> | null> {
    return this.page.$(this.tabSelector);
  }

  async open(): Promise<Nuvio-MCPView | undefined> {
    if (!this.name) {
      return;
    }
    await this.app.quickOpenPalette.type('view ');
    await this.app.quickOpenPalette.trigger(this.name.toUpperCase());
    await this.waitForVisible();
    return this;
  }

  async focus(): Promise<void> {
    await this.activate();
    const view = await this.getViewElement();
    await view?.click();
  }

  async activate(): Promise<void> {
    await this.page.waitForSelector(this.tabSelector, { state: 'visible' });
    if (!(await this.isActive())) {
      const tabContainer = await this.getTabElement();
      await tabContainer?.click();
    }
    return this.waitForVisible();
  }

  async waitForVisible(): Promise<void> {
    await this.page.waitForSelector(this.viewSelector, { state: 'visible' });
  }

  async isTabVisible(): Promise<boolean> {
    return isElementVisible(this.getTabElement());
  }

  async isDisplayed(): Promise<boolean> {
    return isElementVisible(this.getViewElement());
  }

  async isActive(): Promise<boolean> {
    return (await this.isTabVisible()) && containsClass(this.getTabElement(), 'p-mod-current');
  }

  async isClosable(): Promise<boolean> {
    return (await this.isTabVisible()) && containsClass(this.getTabElement(), 'p-mod-closable');
  }

  async isVisible() {
    return this.isTabVisible();
  }

  protected async waitUntilClosed(): Promise<void> {
    await this.page.waitForSelector(this.tabSelector, { state: 'detached' });
  }
}
