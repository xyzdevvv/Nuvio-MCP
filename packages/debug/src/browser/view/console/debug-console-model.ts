import { Injectable, Optional } from '@Nuvio-MCP/di';
import { CompositeTreeNode, TreeModel, TreeNodeEvent } from '@Nuvio-MCP/ide-components';
import { ThrottledDelayer } from '@Nuvio-MCP/ide-core-browser';

import { ExpressionContainer } from '../../tree/debug-tree-node.define';

@Injectable({ multiple: true })
export class DebugConsoleTreeModel extends TreeModel {
  static DEFAULT_FLUSH_DELAY = 100;

  private flushDispatchChangeDelayer = new ThrottledDelayer<void>(DebugConsoleTreeModel.DEFAULT_FLUSH_DELAY);
  private _tempScrollOffset = 0;

  constructor(@Optional() root: ExpressionContainer) {
    super();
    this.init(root);
  }

  /**
   * 判断是否滚动到了底部
   * TODO: //临时处理 by @Ricbet
   */
  get isScrollBottom(): boolean {
    this._tempScrollOffset = Math.max(this.state.scrollOffset, this._tempScrollOffset);
    return this._tempScrollOffset === this.state.scrollOffset;
  }

  init(root: CompositeTreeNode) {
    this.root = root;
    // 分支更新时通知树刷新, 不是立即更新，而是延迟更新，待树稳定后再更新
    // 100ms的延迟并不能保证树稳定，特别是在node_modules展开的情况下
    // 但在普通使用上已经足够可用，即不会有渲染闪烁问题
    this.root.watcher.on(TreeNodeEvent.BranchDidUpdate, () => {
      if (!this.flushDispatchChangeDelayer.isTriggered()) {
        this.flushDispatchChangeDelayer.cancel();
      }
      this.flushDispatchChangeDelayer.trigger(async () => {
        this.dispatchChange();
      });
    });
  }
}
