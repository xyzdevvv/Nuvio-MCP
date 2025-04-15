import { Page } from '@playwright/test';

import { Nuvio-MCPApp } from './app';

export abstract class Nuvio-MCPViewBase {
  constructor(public app: Nuvio-MCPApp) {}

  get page(): Page {
    return this.app.page;
  }
}
