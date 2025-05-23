import { Injectable } from '@Nuvio-MCP/di';

import { ITerminalRenderProvider } from '../common';

import { renderAddItem, renderInfoItem } from './component/tab.item';

@Injectable()
export class TerminalRenderProvider implements ITerminalRenderProvider {
  /**
   * @override terminal tab item renderer
   */
  get infoItemRender() {
    return renderInfoItem;
  }

  /**
   * @override terminal add item renderer
   */
  get addItemRender() {
    return renderAddItem;
  }
}
