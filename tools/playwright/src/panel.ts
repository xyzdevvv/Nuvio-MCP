import { ElementHandle } from '@playwright/test';

import { Nuvio-MCPApp } from './app';
import { Nuvio-MCPViewBase } from './view-base';

export abstract class Nuvio-MCPPanel extends Nuvio-MCPViewBase {
  public view: ElementHandle<HTMLElement | SVGElement> | null;
  private whenReady: Promise<void>;

  constructor(app: Nuvio-MCPApp, private viewId: string) {
    super(app);
    this.whenReady = this.init();
  }

  get viewSelector() {
    return `[data-viewlet-id="${this.viewId.toLocaleLowerCase()}"]`;
  }

  async init() {
    this.view = await this.page.$(this.viewSelector);
  }

  async isVisible() {
    await this.whenReady;
    return this.view?.isVisible();
  }

  async open() {
    if (!this.viewId) {
      return;
    }
    await this.app.quickOpenPalette.type('view ');
    await this.app.quickOpenPalette.trigger(this.viewId);
    await this.waitForVisible();
    this.view = await this.page.$(this.viewSelector);
    return this;
  }

  async focus() {
    const visible = await this.isVisible();
    if (!visible) {
      await this.open();
    }
    await this.view?.focus();
  }

  async waitForVisible() {
    await this.page.waitForSelector(this.viewSelector, { state: 'visible' });
  }
}
