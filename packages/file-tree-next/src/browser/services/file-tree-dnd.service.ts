import { Autowired, Injectable, Optional } from '@Nuvio-MCP/di';
import { Decoration, TargetMatchMode } from '@Nuvio-MCP/ide-components';
import {
  BinaryBuffer,
  Disposable,
  DisposableCollection,
  FileStat,
  ILogger,
  ThrottledDelayer,
  URI,
  WithEventBus,
  encodeBase64,
} from '@Nuvio-MCP/ide-core-browser';
import { FileTreeDropEvent } from '@Nuvio-MCP/ide-core-common/lib/types/dnd';
import { IFileServiceClient } from '@Nuvio-MCP/ide-file-service';
import { IMessageService } from '@Nuvio-MCP/ide-overlay';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';

import { IFileTreeAPI, IFileTreeService } from '../../common';
import { Directory, File } from '../../common/file-tree-node.define';
import treeNodeStyles from '../file-tree-node.module.less';
import styles from '../file-tree.module.less';
import { FileTreeService } from '../file-tree.service';

import { FileTreeModelService } from './file-tree-model.service';

@Injectable()
export class DragAndDropService extends WithEventBus {
  static MS_TILL_DRAGGED_OVER_EXPANDS = 500;

  @Autowired(IFileTreeAPI)
  private readonly fileTreeAPI: IFileTreeAPI;

  @Autowired(ILogger)
  private readonly logger: ILogger;

  @Autowired(IMessageService)
  private readonly messageService: IMessageService;

  @Autowired(IFileTreeService)
  private readonly fileTreeService: FileTreeService;

  @Autowired(IFileServiceClient)
  protected readonly filesystem: IFileServiceClient;

  @Autowired(IWorkspaceService)
  protected readonly workspaceService: IWorkspaceService;

  private toCancelNodeExpansion: DisposableCollection = new DisposableCollection();

  private beingDraggedDec: Decoration = new Decoration(treeNodeStyles.mod_dragging);
  private draggedOverDec: Decoration = new Decoration(treeNodeStyles.mod_dragover);

  // 上一次拖拽进入的目录
  private potentialParent: Directory | null;
  // 开始拖拽的节点
  private beingDraggedNodes: (File | Directory)[] = [];
  private beingDraggedActiveUri: URI | undefined;

  // 拖拽进入的节点
  private draggedOverNode: Directory | File;

  private dragOverTrigger = new ThrottledDelayer<void>(DragAndDropService.MS_TILL_DRAGGED_OVER_EXPANDS);

  constructor(@Optional() private readonly model: FileTreeModelService) {
    super();
    this.model.decorations.addDecoration(this.beingDraggedDec);
    this.model.decorations.addDecoration(this.draggedOverDec);
  }

  get root() {
    return this.model.treeModel.root;
  }

  handleDragStart = (ev: React.DragEvent, node: File | Directory, activeUri?: URI) => {
    ev.stopPropagation();
    // React DragEnd Event maybe not fired for the last renderred element.
    // ref: https://stackoverflow.com/a/24543568
    const handleDragEnd = (event) => {
      this.handleDragEnd(event, node);
    };
    ev.currentTarget.addEventListener('dragend', handleDragEnd, false);
    let draggedNodes = this.model.selectedFiles;
    let isDragWithSelectedNode = false;
    for (const selected of draggedNodes) {
      if (selected && selected.id === node.id) {
        isDragWithSelectedNode = true;
      }
    }
    if (!isDragWithSelectedNode) {
      draggedNodes = [node];
    }

    this.beingDraggedNodes = draggedNodes;
    this.beingDraggedActiveUri = activeUri;

    const draggedFile = draggedNodes.find((node) => !Directory.is(node));

    // 保证多选情况下找到首个文件
    if (draggedFile) {
      ev.dataTransfer.setData('uri', draggedFile.uri.toString());
    }

    ev.dataTransfer.setData(
      'beingDraggedNodes',
      JSON.stringify(this.beingDraggedNodes.map((node) => node.uri.toString())),
    );

    // 拖拽文件到桌面
    // 仅支持单个文件 Chrome/Edge
    if (draggedFile) {
      const file = draggedFile as File;

      if (file.uri.scheme === 'file') {
        ev.dataTransfer.setData(
          'DownloadURL',
          `application/octet-stream:${file.displayName}:data:application/octet-stream;base64,${encodeBase64(
            BinaryBuffer.fromString(file.filestat.uri),
          )}`,
        );
      }
    }

    draggedNodes.forEach((node) => {
      // 添加拖拽样式
      this.beingDraggedDec.addTarget(node, TargetMatchMode.Self);
    });

    if (ev.dataTransfer) {
      let label: string;
      if (draggedNodes.length === 1) {
        label = activeUri ? activeUri.displayName : typeof node.name === 'string' ? node.name : '';
      } else {
        label = String(draggedNodes.length);
      }
      const dragImage = document.createElement('div');
      dragImage.className = styles.file_tree_drag_image;
      dragImage.textContent = label;
      document.body.appendChild(dragImage);
      ev.dataTransfer.setDragImage(dragImage, -10, -10);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  handleDragEnter = (ev: React.DragEvent, node: File | Directory) => {
    ev.stopPropagation();
    ev.preventDefault();
  };

  handleDragLeave = (ev: React.DragEvent, node: File | Directory) => {
    ev.preventDefault();
    ev.stopPropagation();
    this.toCancelNodeExpansion.dispose();
    // 拖拽目标离开时，清除选中态
    if (this.potentialParent) {
      this.draggedOverDec.removeTarget(this.potentialParent);
      // 通知视图更新
      this.model.treeModel.dispatchChange();
    }
  };

  handleDragOver = (ev: React.DragEvent, node: File | Directory) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (!this.toCancelNodeExpansion.disposed) {
      return;
    }
    if (this.beingDraggedNodes.indexOf(node) >= 0) {
      return;
    }

    this.draggedOverNode = node;

    const newPotentialParent: Directory =
      Directory.is(node) && (node as Directory).expanded ? (node as Directory) : (node.parent as Directory);

    if (this.potentialParent !== newPotentialParent || !this.draggedOverDec.hasTarget(newPotentialParent)) {
      if (this.potentialParent) {
        this.draggedOverDec.removeTarget(this.potentialParent);
      }
      this.potentialParent = newPotentialParent;
      this.draggedOverDec.addTarget(this.potentialParent, TargetMatchMode.SelfAndChildren);
      // 通知视图更新
      this.model.treeModel.dispatchChange();
    }

    if (this.potentialParent !== node && Directory.is(node)) {
      this.dragOverTrigger.trigger(async () => {
        if (!node.expanded) {
          await (node as Directory).setExpanded(true);
          // 确保当前仍在当前拖区域节点中
          if (this.draggedOverNode === node) {
            if (this.potentialParent) {
              this.draggedOverDec.removeTarget(this.potentialParent);
            }
            this.potentialParent = node as Directory;
            this.draggedOverDec.addTarget(this.potentialParent, TargetMatchMode.SelfAndChildren);
          }
        } else {
          if (this.potentialParent) {
            this.draggedOverDec.removeTarget(this.potentialParent);
          }
          this.potentialParent = node as Directory;
          this.draggedOverDec.addTarget(this.potentialParent, TargetMatchMode.SelfAndChildren);
        }
        // 通知视图更新
        this.model.treeModel.dispatchChange();
      });
      this.toCancelNodeExpansion.push(
        Disposable.create(() => {
          if (!this.dragOverTrigger.isTriggered()) {
            this.dragOverTrigger.cancel();
          }
        }),
      );
    }
  };

  handleDrop = async (ev: React.DragEvent, node?: File | Directory, activeUri?: URI) => {
    this.eventBus.fire(
      new FileTreeDropEvent({
        event: ev.nativeEvent,
        targetDir: activeUri
          ? activeUri.codeUri.path
          : node && node instanceof File
          ? (node.parent as Directory)?.uri.codeUri.path
          : node
          ? node.uri.codeUri.path
          : new URI(this.workspaceService.workspace?.uri).codeUri.path,
      }),
    );
    try {
      ev.preventDefault();
      ev.stopPropagation();
      // 移除染色
      ev.dataTransfer.dropEffect = 'copy';
      let containing: File | Directory | null;
      const isCompactFolderMove = !!this.beingDraggedActiveUri;
      if (this.fileTreeService.isCompactMode && activeUri && !node?.uri.isEqual(activeUri)) {
        containing = null;
      } else if (node) {
        containing = Directory.is(node) ? (node as Directory) : (node.parent as Directory);
      } else {
        containing = this.root as Directory;
      }
      let resources;
      if (this.beingDraggedActiveUri) {
        const compactNode = this.fileTreeService.getNodeByPathOrUri(this.beingDraggedActiveUri);
        // 生成临时节点用于数据处理
        resources = [
          new Directory(
            this.fileTreeService,
            compactNode?.parent,
            this.beingDraggedActiveUri,
            this.beingDraggedActiveUri.displayName,
            {
              uri: this.beingDraggedActiveUri.toString(),
              isDirectory: true,
              lastModification: new Date().getTime(),
            } as FileStat,
            this.beingDraggedActiveUri.displayName,
          ),
        ];
      } else {
        resources = this.beingDraggedNodes;
        if (!resources || resources.length === 0) {
          try {
            const transUriList = JSON.parse(ev.dataTransfer.getData('beingDraggedNodes'));
            if (transUriList && transUriList.length !== 0) {
              resources = transUriList
                .map((uri: string) => this.fileTreeService.getNodeByPathOrUri(new URI(uri)))
                .filter(Boolean);
              if (!resources.length) {
                resources = await Promise.all(
                  transUriList.map(async (str: string) => {
                    const uri = new URI(str);
                    let resource: File | Directory;
                    const fileStat = await this.filesystem.getFileStat(uri.toString());
                    if (fileStat?.isDirectory) {
                      resource = new Directory(
                        this.fileTreeService,
                        this.root,
                        uri,
                        uri.displayName,
                        {
                          uri: uri.toString(),
                          isDirectory: true,
                          lastModification: new Date().getTime(),
                        } as FileStat,
                        uri.displayName,
                      );
                    } else {
                      resource = new File(
                        this.fileTreeService,
                        this.root,
                        uri,
                        uri.displayName,
                        {
                          uri: uri.toString(),
                          isDirectory: true,
                          lastModification: new Date().getTime(),
                        } as FileStat,
                        uri.displayName,
                      );
                    }
                    return resource;
                  }),
                );
              }
            }
          } catch {}
        }
      }
      if (resources.length > 0) {
        const targetContainerUri = activeUri ? activeUri : (containing && containing.uri)!;
        const resourcesCanBeMoved: (File | Directory)[] = resources.filter(
          (resource: File | Directory) =>
            resource &&
            resource.parent &&
            (this.beingDraggedActiveUri ? !(resource.parent as Directory).uri.isEqual(targetContainerUri) : true),
        );
        if (resourcesCanBeMoved.length > 0) {
          // 最小化移动文件
          const errors = await this.fileTreeAPI.mvFiles(
            resourcesCanBeMoved.map((res) => ({ url: res.uri, isDirectory: res.filestat.isDirectory })),
            targetContainerUri,
          );
          if (errors && errors.length > 0) {
            errors.forEach((error) => {
              this.messageService.error(error);
            });
          } else if (!errors) {
            return;
          } else {
            if (containing) {
              // 这里不能直接使用this.beingDraggedActiveUri做判断，因为需要等待上面移动文件成功后，此时dropEnd事件可能已经执行完了
              if (this.fileTreeService.isCompactMode && isCompactFolderMove) {
                // 当从压缩目录移动子节点到其他容器时
                for (const target of resourcesCanBeMoved) {
                  this.fileTreeService.refresh(target.parent as Directory);
                }
                this.fileTreeService.refresh(containing as Directory);
              } else {
                // 非压缩目录模式情况
                for (const target of resourcesCanBeMoved) {
                  const to = containing.uri.resolve(target.name);
                  this.fileTreeService.moveNodeByPath(
                    target.parent as Directory,
                    containing,
                    target.name,
                    target.name,
                    target.type,
                  );
                  // 由于节点移动时默认仅更新节点路径
                  // 我们需要自己更新额外的参数，如uri, filestat等
                  target.updateMetaData({
                    name: to.displayName,
                    fileStat: {
                      ...target.filestat,
                      uri: to.toString(),
                    },
                    uri: to,
                    tooltip: this.fileTreeAPI.getReadableTooltip(to),
                  });
                  // 当重命名文件为文件夹时，刷新文件夹更新子文件路径
                  if (Directory.is(target)) {
                    this.fileTreeService.refresh(target as Directory);
                  }
                }
              }
            } else if (node) {
              if (this.fileTreeService.isCompactMode && isCompactFolderMove) {
                // 从压缩目录子节点移动到压缩目录子节点下
                for (const target of resourcesCanBeMoved) {
                  this.fileTreeService.refresh(target.parent as Directory);
                }
              } else {
                // 当从普通目录移动到压缩目录子节点时
                for (const target of resourcesCanBeMoved) {
                  this.fileTreeService.deleteAffectedNodeByPath(target.path);
                }
              }
              // 否则，刷新模板节点的父节点
              this.fileTreeService.refresh(node.parent as Directory);
            }
          }
        }
      }
      if (node) {
        this.beingDraggedDec.removeTarget(node);
      }
      if (this.potentialParent) {
        this.draggedOverDec.removeTarget(this.potentialParent);
      }
      this.beingDraggedNodes.forEach((node) => {
        this.beingDraggedDec.removeTarget(node);
      });
      this.beingDraggedNodes = [];
      this.beingDraggedActiveUri = undefined;
      this.potentialParent = null;
      // 通知视图更新
      this.model.treeModel.dispatchChange();
      if (!this.toCancelNodeExpansion.disposed) {
        this.toCancelNodeExpansion.dispose();
      }
    } catch (e) {
      this.logger.error(e);
    }
  };

  handleDragEnd = (ev: React.DragEvent, node: File | Directory) => {
    this.beingDraggedDec.removeTarget(node);
    if (this.potentialParent) {
      this.draggedOverDec.removeTarget(this.potentialParent);
    }
    this.beingDraggedNodes.forEach((node) => {
      // 移除拖拽样式
      this.beingDraggedDec.removeTarget(node);
    });
    this.beingDraggedNodes = [];
    this.beingDraggedActiveUri = undefined;
    this.potentialParent = null;
    // 通知视图更新
    this.model.treeModel.dispatchChange();
    if (!this.toCancelNodeExpansion.disposed) {
      this.toCancelNodeExpansion.dispose();
    }
  };
}
