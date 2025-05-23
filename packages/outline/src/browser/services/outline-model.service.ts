import { Autowired, INJECTOR_TOKEN, Injectable, Injector } from '@Nuvio-MCP/di';
import { Decoration, DecorationsManager, IRecycleTreeHandle, TreeNodeType, WatchEvent } from '@Nuvio-MCP/ide-components';
import {
  CommandService,
  Deferred,
  Disposable,
  DisposableCollection,
  Emitter,
  Event,
  ILogger,
  IPosition,
  IRange,
  LRUMap,
  MarkerManager,
  MaybeNull,
  ThrottledDelayer,
  URI,
  pSeries,
  path,
} from '@Nuvio-MCP/ide-core-browser';
import { WorkbenchEditorService } from '@Nuvio-MCP/ide-editor/lib/browser';
import {
  DocumentSymbolStore,
  INormalizedDocumentSymbol,
} from '@Nuvio-MCP/ide-editor/lib/browser/breadcrumb/document-symbol';
import { EXPLORER_CONTAINER_ID } from '@Nuvio-MCP/ide-explorer/lib/browser/explorer-contribution';
import { IMainLayoutService } from '@Nuvio-MCP/ide-main-layout';
import * as monaco from '@Nuvio-MCP/ide-monaco';

import { IOutlineDecorationService, OUTLINE_VIEW_ID } from '../../common';
import { OutlineCompositeTreeNode, OutlineRoot, OutlineTreeNode } from '../outline-node.define';
import styles from '../outline-node.module.less';

import { OutlineEventService } from './outline-event.service';
import { OutlineTreeModel } from './outline-model';
import { OutlineTreeService } from './outline-tree.service';

const { Path } = path;

export interface IEditorTreeHandle extends IRecycleTreeHandle {
  hasDirectFocus: () => boolean;
}

@Injectable()
export class OutlineModelService {
  private static DEFAULT_REFRESH_DELAY = 200;
  private static DEFAULT_INIT_TREE_MODEL_DELAY = 500;

  @Autowired(INJECTOR_TOKEN)
  private readonly injector: Injector;

  @Autowired(ILogger)
  private readonly logger: ILogger;

  @Autowired(OutlineTreeService)
  private readonly outlineTreeService: OutlineTreeService;

  @Autowired(MarkerManager)
  private markerManager: MarkerManager;

  @Autowired(IOutlineDecorationService)
  public decorationService: IOutlineDecorationService;

  @Autowired(OutlineEventService)
  public readonly outlineEventService: OutlineEventService;

  @Autowired(WorkbenchEditorService)
  private readonly editorService: WorkbenchEditorService;

  @Autowired(CommandService)
  public readonly commandService: CommandService;

  @Autowired(DocumentSymbolStore)
  private documentSymbolStore: DocumentSymbolStore;

  @Autowired(IMainLayoutService)
  private readonly mainLayoutService: IMainLayoutService;

  private _activeTreeModel: OutlineTreeModel | undefined;
  private _allTreeModels: LRUMap<string, { treeModel: OutlineTreeModel; decoration: DecorationsManager }> = new LRUMap(
    100,
    80,
  );
  private _whenInitTreeModelReady: Promise<void>;

  private _whenReady: Promise<void>;

  private _decorations: DecorationsManager;
  private _outlineTreeHandle: IEditorTreeHandle;

  private refreshDeferred: Deferred<void> | null;
  private _changeEventDispatchQueue: string[] = [];

  // 装饰器
  private selectedDecoration: Decoration = new Decoration(styles.mod_selected); // 选中态
  private focusedDecoration: Decoration = new Decoration(styles.mod_focused); // 焦点态
  // 即使选中态也是焦点态的节点
  private _focusedNode: OutlineCompositeTreeNode | OutlineTreeNode | undefined;
  // 选中态的节点
  private _selectedNodes: (OutlineCompositeTreeNode | OutlineTreeNode)[] = [];

  private disposableCollection: DisposableCollection = new DisposableCollection();

  private onDidRefreshedEmitter: Emitter<void> = new Emitter();
  private onLoadingStateChangedEmitter: Emitter<boolean> = new Emitter();
  private onDidUpdateTreeModelEmitter: Emitter<OutlineTreeModel | undefined> = new Emitter();

  private _ignoreFollowCursorUpdateEventTimer = 0;
  private initTreeModelDelayer: ThrottledDelayer<void>;
  private refreshDelayer: ThrottledDelayer<void>;

  constructor() {
    this.initTreeModelDelayer = new ThrottledDelayer(OutlineModelService.DEFAULT_INIT_TREE_MODEL_DELAY);
    this.refreshDelayer = new ThrottledDelayer(OutlineModelService.DEFAULT_REFRESH_DELAY);
    this._whenReady = this.initTreeModel();
  }

  get whenReady() {
    return this._whenReady;
  }

  get flushEventQueuePromise() {
    return this.refreshDeferred && this.refreshDeferred.promise;
  }

  get outlineTreeHandle() {
    return this._outlineTreeHandle;
  }

  get decorations() {
    return this._decorations;
  }

  get treeModel() {
    return this._activeTreeModel;
  }

  // 既是选中态，也是焦点态节点
  get focusedNode() {
    return this._focusedNode;
  }
  // 是选中态，非焦点态节点
  get selectedNodes() {
    return this._selectedNodes;
  }
  get onLoadingStateChange(): Event<boolean> {
    return this.onLoadingStateChangedEmitter.event;
  }
  get onDidRefreshed(): Event<void> {
    return this.onDidRefreshedEmitter.event;
  }

  get onDidUpdateTreeModel(): Event<OutlineTreeModel | undefined> {
    return this.onDidUpdateTreeModelEmitter.event;
  }

  get whenInitTreeModelReady() {
    return this._whenInitTreeModelReady;
  }

  get whenRefreshReady() {
    return this.refreshDeferred?.promise;
  }

  private setTreeModel(treeModel?: OutlineTreeModel) {
    this._activeTreeModel = treeModel;
    this.onDidUpdateTreeModelEmitter.fire(this._activeTreeModel);
  }

  private async doInitTreeModelByCurrentUri(uri?: URI | null) {
    let treeModel: OutlineTreeModel | undefined;
    if (uri) {
      // FIXME: 根据是否为多工作区创建不同根节点
      const root = (await this.outlineTreeService.resolveChildren())[0];
      if (!root) {
        this.logger.error(`init outline tree model error: cannot resolve ${uri} children`);
        return;
      }
      treeModel = this.injector.get(OutlineTreeModel, [root]);
      await treeModel.ensureReady;
      // 初始化节点装饰器
      const decoration = this.initDecorations(root);
      if (this._allTreeModels.has(uri.toString())) {
        this._allTreeModels.delete(uri.toString());
      }

      this._allTreeModels.set(uri.toString(), {
        treeModel,
        decoration,
      });
    }
    this.setTreeModel(treeModel);
    return treeModel;
  }

  async initTreeModelByCurrentUri(uri?: URI | null) {
    await this.outlineTreeService.whenReady;
    // 等待上一次刷新完成
    await this.refreshDeferred?.promise;

    this.outlineTreeService.currentUri = uri;

    if (uri && this._allTreeModels.has(uri.toString())) {
      const treeModelStore = this._allTreeModels.get(uri.toString())!;
      this._decorations = treeModelStore.decoration;
      this.setTreeModel(treeModelStore.treeModel);
    } else {
      await this.doInitTreeModelByCurrentUri(uri);
    }
  }

  async initTreeModel() {
    this._whenInitTreeModelReady = this.initTreeModelByCurrentUri(this.editorService.currentEditor?.currentUri);

    await this._whenInitTreeModelReady;

    this.disposableCollection.push(
      this.markerManager.onMarkerChanged((resources) => {
        if (
          this.outlineTreeService.currentUri &&
          resources.find((resource) => resource === this.outlineTreeService.currentUri!.toString())
        ) {
          this.refresh();
        }
      }),
    );

    this.disposableCollection.push(
      this.outlineEventService.onDidActiveChange(async () => {
        if (!this.initTreeModelDelayer.isTriggered()) {
          this.initTreeModelDelayer.cancel();
        }
        this.onLoadingStateChangedEmitter.fire(true);
        this.initTreeModelDelayer.trigger(async () => {
          await this._whenInitTreeModelReady;
          // 初始化时如果存在还未刷新的执行逻辑时，需要进行清理
          if (!this.refreshDelayer.isTriggered()) {
            this.refreshDelayer.cancel();
          }
          const uri = this.editorService.currentEditor?.currentUri;
          this._whenInitTreeModelReady = this.initTreeModelByCurrentUri(uri);
          this.onLoadingStateChangedEmitter.fire(false);
        });
      }),
    );

    this.disposableCollection.push(
      this.outlineEventService.onDidSelectionChange(() => {
        // 选取更改时不需要刷新Tree，仅需要定位选择位置即可
        if (this.outlineTreeService.followCursor) {
          // 如果设置了跟随光标，此时查询一下当前焦点节点
          this.locateSelection(false);
        }
      }),
    );

    this.disposableCollection.push(
      this.outlineEventService.onDidChange((uri: URI | null) => {
        if (uri === this.editorService.currentEditor?.currentUri) {
          // 因为刷新 children 那个函数不能传 currentUri，这里利用一下副作用
          this.outlineTreeService.currentUri = this.editorService.currentEditor?.currentUri;
          this.refresh();
        }
      }),
    );
    this.disposableCollection.push(
      this.outlineEventService.onDidViewCollapseChange((collapsed) => {
        if (!collapsed) {
          this.refresh();
        }
      }),
    );
    this.disposableCollection.push(
      this.outlineTreeService.onDidChange(() => {
        this.refresh();
      }),
    );

    this.disposableCollection.push(
      Disposable.create(() => {
        this._allTreeModels.clear();
      }),
    );
  }

  initDecorations(root) {
    this._decorations = new DecorationsManager(root as any);
    this._decorations.addDecoration(this.selectedDecoration);
    this._decorations.addDecoration(this.focusedDecoration);
    return this._decorations;
  }

  private locateSelection(quiet = true) {
    if (!this.outlineTreeService.currentUri) {
      return;
    }
    const symbols = this.documentSymbolStore.getDocumentSymbol(this.outlineTreeService.currentUri!);
    if (symbols) {
      const activeSymbols = this.findCurrentDocumentSymbol(
        symbols,
        this.editorService.currentEditorGroup.codeEditor.monacoEditor.getPosition(),
      );
      const node = this.outlineTreeService.getTreeNodeBySymbol(activeSymbols[activeSymbols.length - 1]);
      if (node) {
        if (this._ignoreFollowCursorUpdateEventTimer) {
          this._ignoreFollowCursorUpdateEventTimer--;
          return;
        } else {
          this.location(node as OutlineTreeNode);
        }
        this.activeNodeDecoration(node as OutlineTreeNode, !quiet);
      }
    }
  }

  private findCurrentDocumentSymbol(
    documentSymbols: INormalizedDocumentSymbol[],
    position: MaybeNull<IPosition>,
  ): INormalizedDocumentSymbol[] {
    const result: INormalizedDocumentSymbol[] = [];
    if (!position) {
      return result;
    }
    let toFindIn: INormalizedDocumentSymbol[] | undefined = documentSymbols;
    while (toFindIn && toFindIn.length > 0) {
      let found = false;
      for (const documentSymbol of toFindIn) {
        if (this.positionInRange(position, documentSymbol.range)) {
          result.push(documentSymbol);
          toFindIn = documentSymbol.children;
          found = true;
          break;
        }
      }
      if (!found) {
        break;
      }
    }
    return result;
  }

  private positionInRange(pos: IPosition, range: IRange): boolean {
    if (pos.lineNumber < range.startLineNumber) {
      return false;
    } else if (pos.lineNumber === range.startLineNumber) {
      return pos.column >= range.startColumn;
    } else if (pos.lineNumber < range.endLineNumber) {
      return true;
    } else if (pos.lineNumber === range.endLineNumber) {
      return pos.column <= range.endColumn;
    } else {
      return false;
    }
  }
  // 清空所有节点选中态
  clearNodeSelectedDecoration = () => {
    this._selectedNodes.forEach((file) => {
      this.selectedDecoration.removeTarget(file);
    });
    this._selectedNodes = [];
  };

  // 清空其他选中/焦点态节点，更新当前焦点节点
  activeNodeDecoration = (target: OutlineCompositeTreeNode | OutlineTreeNode, dispatch = true) => {
    if (target) {
      for (const target of this.selectedDecoration.appliedTargets.keys()) {
        this.selectedDecoration.removeTarget(target);
      }
      for (const target of this.focusedDecoration.appliedTargets.keys()) {
        this.focusedDecoration.removeTarget(target);
      }
      this.selectedDecoration.addTarget(target);
      this.focusedDecoration.addTarget(target);
      this._focusedNode = target;
      this._selectedNodes = [target];

      // 通知视图更新
      dispatch && this.treeModel?.dispatchChange();
    }
  };

  // 清空其他选中/焦点态节点，更新当前选中节点
  selectNodeDecoration = (target: OutlineCompositeTreeNode | OutlineTreeNode, dispatch = true) => {
    if (target) {
      if (this.selectedNodes.length > 0) {
        this.selectedNodes.forEach((node) => {
          this.selectedDecoration.removeTarget(node);
        });
      }
      if (this.focusedNode) {
        this.focusedDecoration.removeTarget(this.focusedNode);
      }
      this.selectedDecoration.addTarget(target);
      this._selectedNodes = [target];

      // 通知视图更新
      dispatch && this.treeModel?.dispatchChange();
    }
  };

  // 清空其他焦点态节点，更新当前焦点节点，
  // removePreFocusedDecoration 表示更新焦点节点时如果此前已存在焦点节点，之前的节点装饰器将会被移除
  activeNodeFocusedDecoration = (
    target: OutlineCompositeTreeNode | OutlineTreeNode,
    removePreFocusedDecoration = false,
  ) => {
    if (this.focusedNode !== target) {
      if (removePreFocusedDecoration) {
        // 当存在上一次右键菜单激活的文件时，需要把焦点态的文件节点的装饰器全部移除
        if (this.focusedNode) {
          // 多选情况下第一次切换焦点文件
          this.focusedDecoration.removeTarget(this.focusedNode);
        }
      } else if (this.focusedNode) {
        this.focusedDecoration.removeTarget(this.focusedNode);
      }
      if (target) {
        this.selectedDecoration.addTarget(target);
        this.focusedDecoration.addTarget(target);
        this._focusedNode = target;
        this._selectedNodes.push(target);
      }
    }
    // 通知视图更新
    this.treeModel?.dispatchChange();
  };

  // 选中当前指定节点，添加装饰器属性
  activeNodeSelectedDecoration = (target: OutlineCompositeTreeNode | OutlineTreeNode) => {
    if (this._selectedNodes.indexOf(target) > -1) {
      return;
    }
    if (this.selectedNodes.length > 0) {
      this.selectedNodes.forEach((file) => {
        this.selectedDecoration.removeTarget(file);
      });
    }
    this._selectedNodes = [target];
    this.selectedDecoration.addTarget(target);
    // 通知视图更新
    this.treeModel?.dispatchChange();
  };

  // 取消选中节点焦点
  enactiveNodeDecoration = () => {
    if (this.focusedNode) {
      this.focusedDecoration.removeTarget(this.focusedNode);
      this.treeModel?.dispatchChange();
    }
    this._focusedNode = undefined;
  };

  removeNodeDecoration() {
    if (!this.decorations) {
      return;
    }
    this.decorations.removeDecoration(this.selectedDecoration);
    this.decorations.removeDecoration(this.focusedDecoration);
  }

  handleTreeHandler(handle: IEditorTreeHandle) {
    this._outlineTreeHandle = handle;
  }

  handleTreeBlur = () => {
    // 清空焦点状态
    this.enactiveNodeDecoration();
  };

  handleItemClick = (item: OutlineCompositeTreeNode | OutlineTreeNode, type: TreeNodeType) => {
    // 单选操作默认先更新选中状态
    this.activeNodeDecoration(item);

    this.revealRange(item.raw);

    this._ignoreFollowCursorUpdateEventTimer++;
  };

  toggleDirectory = async (item: OutlineCompositeTreeNode) => {
    if (item.expanded) {
      this.outlineTreeHandle.collapseNode(item);
    } else {
      this.outlineTreeHandle.expandNode(item);
    }
  };

  protected revealRange(symbol: INormalizedDocumentSymbol) {
    const currentEditor = this.editorService.currentEditorGroup.codeEditor;
    currentEditor.monacoEditor.revealLineInCenter(symbol.range.startLineNumber);
    currentEditor.monacoEditor.setPosition(
      new monaco.Position(symbol.range.startLineNumber, symbol.range.endLineNumber),
    );
  }

  /**
   * 刷新指定下的所有子节点
   */
  async refresh() {
    this.onLoadingStateChangedEmitter.fire(true);

    await this.whenInitTreeModelReady;
    await this.whenRefreshReady;

    const node: OutlineRoot = this.treeModel?.root as OutlineRoot;

    if (!node || !this.editorService?.currentEditor?.currentUri) {
      // 1. 初次加载时可能还没有初始化Tree，主要原因在于没办法在outline加载时准确把握拿到currentEditor的时机
      // 2. 当前没有激活的URI时，需要情况当前的Tree
      this._whenInitTreeModelReady = this.initTreeModelByCurrentUri(this.editorService?.currentEditor?.currentUri);
      this.onLoadingStateChangedEmitter.fire(false);
      return;
    }

    if (!this.refreshDelayer.isTriggered()) {
      this.refreshDelayer.cancel();
    }

    return this.refreshDelayer.trigger(async () => {
      const handler = this.mainLayoutService.getTabbarHandler(EXPLORER_CONTAINER_ID);
      if (!handler || !handler.isVisible || handler.isCollapsed(OUTLINE_VIEW_ID)) {
        if (this.refreshDeferred) {
          this.refreshDeferred.resolve();
          this.refreshDeferred = null;
        }
        this.onLoadingStateChangedEmitter.fire(false);
        return;
      }
      if (!this.refreshDeferred) {
        this.refreshDeferred = new Deferred<void>();
      }
      this.outlineTreeService.currentUri = this.editorService?.currentEditor?.currentUri;
      if (
        node.currentUri &&
        this.outlineTreeService.currentUri &&
        this.outlineTreeService.currentUri.isEqual(node.currentUri)
      ) {
        // 刷新前需要更新诊断信息数据
        this.decorationService.updateDiagnosisInfo(this.outlineTreeService.currentUri);
        // 因为Outline模块的节点是自展开的，不需要遍历
        await node.refresh();
        this.onDidRefreshedEmitter.fire();
      }
      this.refreshDeferred?.resolve();
      this.refreshDeferred = null;
      this.onLoadingStateChangedEmitter.fire(false);
    });
  }

  public flushEventQueue = () => {
    if (!this._changeEventDispatchQueue || this._changeEventDispatchQueue.length === 0) {
      return;
    }
    this._changeEventDispatchQueue.sort((pathA, pathB) => {
      const pathADepth = Path.pathDepth(pathA);
      const pathBDepth = Path.pathDepth(pathB);
      return pathADepth - pathBDepth;
    });
    const roots = [this._changeEventDispatchQueue[0]];
    for (const path of this._changeEventDispatchQueue) {
      if (roots.some((root) => path.indexOf(root) === 0)) {
        continue;
      } else {
        roots.push(path);
      }
    }
    const promise = pSeries(
      roots.map((path) => async () => {
        const watcher = this.treeModel?.root?.watchEvents.get(path);
        if (watcher && typeof watcher.callback === 'function') {
          await watcher.callback({ type: WatchEvent.Changed, path });
        }
        return null;
      }),
    );
    // 重置更新队列
    this._changeEventDispatchQueue = [];
    return promise;
  };

  public location = async (node: OutlineTreeNode) => {
    await this.refreshDeferred?.promise;
    if (!node) {
      return;
    }
    if (!this.outlineTreeHandle) {
      return;
    }
    node = (await this.outlineTreeHandle.ensureVisible(node, 'smart')) as OutlineTreeNode;
  };

  public collapseAll = async () => {
    await this.refreshDeferred?.promise;
    await this.treeModel?.root.collapsedAll();
  };

  dispose() {
    this.disposableCollection.dispose();
  }
}
