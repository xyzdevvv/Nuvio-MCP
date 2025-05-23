import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { ITree } from '@Nuvio-MCP/ide-components';
import { CorePreferences, EDITOR_COMMANDS } from '@Nuvio-MCP/ide-core-browser';
import { CommandService, Emitter, Event, URI, formatLocalize, localize, path } from '@Nuvio-MCP/ide-core-common';
import { FileStat } from '@Nuvio-MCP/ide-file-service';
import { IFileServiceClient } from '@Nuvio-MCP/ide-file-service/lib/common';
import { IDialogService } from '@Nuvio-MCP/ide-overlay';
import { IWorkspaceEditService } from '@Nuvio-MCP/ide-workspace-edit';

import { IFileTreeAPI, IFileTreeService, IMoveFileMetadata } from '../../common';
import { Directory, File } from '../../common/file-tree-node.define';

@Injectable()
export class FileTreeAPI implements IFileTreeAPI {
  private readonly onDidResolveChildrenEmitter: Emitter<string> = new Emitter();
  onDidResolveChildren: Event<string> = this.onDidResolveChildrenEmitter.event;

  @Autowired(IFileServiceClient)
  protected fileServiceClient: IFileServiceClient;

  @Autowired(IWorkspaceEditService)
  private workspaceEditService: IWorkspaceEditService;

  @Autowired(CommandService)
  private commandService: CommandService;

  @Autowired(CorePreferences)
  private readonly corePreferences: CorePreferences;

  @Autowired(IDialogService)
  private readonly dialogService: IDialogService;

  private userhomePath: URI;

  async resolveChildren(tree: IFileTreeService, path: string | FileStat, parent?: Directory, compact?: boolean) {
    let file: FileStat | undefined;
    if (!this.userhomePath) {
      const userhome = await this.fileServiceClient.getCurrentUserHome();
      if (userhome) {
        this.userhomePath = new URI(userhome.uri);
      }
    }
    if (typeof path === 'string') {
      file = await this.fileServiceClient.getFileStat(path);
    } else {
      file = await this.fileServiceClient.getFileStat(path.uri);
    }

    if (file) {
      this.onDidResolveChildrenEmitter.fire(file.uri.toString());
      if (file.children?.length === 1 && file.children[0].isDirectory && compact) {
        return await this.resolveChildren(tree, file.children[0].uri, parent, compact);
      } else {
        // 为文件树节点新增isInSymbolicDirectory属性，用于探测节点是否处于软链接文件中
        const filestat = {
          ...file,
          isInSymbolicDirectory: parent?.filestat.isSymbolicLink || parent?.filestat.isInSymbolicDirectory,
        };
        return {
          children: this.toNodes(tree, filestat, parent),
          filestat,
        };
      }
    } else {
      return {
        children: [],
        filestat: null,
      };
    }
  }

  async resolveNodeByPath(tree: ITree, path: string, parent?: Directory) {
    const file = await this.fileServiceClient.getFileStat(path);
    if (file) {
      return this.toNode(tree, file, parent);
    }
  }

  async resolveFileStat(uri: URI) {
    return await this.fileServiceClient.getFileStat(uri.toString());
  }

  toNodes(tree: ITree, filestat: FileStat, parent?: Directory) {
    // 如果为根目录，则返回其节点自身，否则返回子节点
    if (!parent) {
      return [this.toNode(tree, filestat, parent)];
    } else {
      if (filestat.children) {
        return filestat.children.map((child) => this.toNode(tree, child, parent));
      }
    }
    return [];
  }

  /**
   * 转换FileStat对象为TreeNode
   */
  toNode(tree: ITree, filestat: FileStat, parent?: Directory, presetName?: string): Directory | File {
    const uri = new URI(filestat.uri);
    // 这里的name主要用于拼接节点路径，即path属性, 必须遵循路径原则
    // labelService可根据uri参数提供不同的展示效果
    const name = presetName ? presetName : uri.displayName;
    let node: Directory | File;
    filestat.isInSymbolicDirectory = parent?.filestat.isSymbolicLink ?? parent?.filestat.isInSymbolicDirectory;
    if (filestat.isDirectory) {
      node = new Directory(tree as any, parent, uri, name, filestat, this.getReadableTooltip(uri));
    } else {
      node = new File(tree as any, parent, uri, name, filestat, this.getReadableTooltip(uri));
    }
    return node;
  }

  async mvFiles(fromFiles: IMoveFileMetadata[], targetDir: URI) {
    const error: string[] = [];
    for (const from of fromFiles) {
      if (from.url.isEqualOrParent(targetDir)) {
        return;
      }
    }
    // 合并具有包含关系的文件移动
    const sortedFiles = fromFiles.sort((a, b) => a.toString().length - b.toString().length);
    const mergeFiles: IMoveFileMetadata[] = [];
    for (const file of sortedFiles) {
      if (mergeFiles.length > 0 && mergeFiles.find((exist) => exist.url.isEqualOrParent(file.url))) {
        continue;
      }
      mergeFiles.push(file);
    }
    if (this.corePreferences['explorer.confirmMove']) {
      const ok = localize('file.confirm.move.ok');
      const cancel = localize('file.confirm.move.cancel');
      const confirm = await this.dialogService.warning(
        formatLocalize(
          'file.confirm.move',
          `[ ${mergeFiles.map((file) => file.url.displayName).join(',')} ]`,
          targetDir.displayName,
        ),
        [cancel, ok],
      );
      if (confirm !== ok) {
        return;
      }
    }
    for (const from of mergeFiles) {
      const res = await this.mv(from.url, targetDir.resolve(from.url.displayName), from.isDirectory);
      if (res) {
        error.push(res);
      }
    }
    return error;
  }

  async mv(from: URI, to: URI, isDirectory = false) {
    try {
      await this.workspaceEditService.apply({
        edits: [
          {
            newResource: to,
            oldResource: from,
            options: {
              isDirectory,
              overwrite: true,
            },
          },
        ],
      });
    } catch (e) {
      return e.message;
    }
    return;
  }

  async createFile(uri: URI, content: string) {
    try {
      await this.workspaceEditService.apply({
        edits: [
          {
            newResource: uri,
            options: { content },
          },
        ],
      });
    } catch (e) {
      return e.message;
    }
    this.commandService.executeCommand(EDITOR_COMMANDS.OPEN_RESOURCE.id, uri, { disableNavigate: true, focus: true });
    return;
  }

  async createDirectory(uri: URI) {
    try {
      await this.workspaceEditService.apply({
        edits: [
          {
            newResource: uri,
            options: {
              isDirectory: true,
            },
          },
        ],
      });
    } catch (e) {
      return e.message;
    }
    return;
  }

  async delete(uri: URI) {
    try {
      await this.workspaceEditService.apply({
        edits: [
          {
            oldResource: uri,
            options: {},
          },
        ],
      });
      return;
    } catch (e) {
      return e.message;
    }
  }

  async copyFile(from: URI, to: URI) {
    let idx = 1;
    let exists;
    try {
      exists = await this.fileServiceClient.access(to.toString());
    } catch (e) {
      return e.message;
    }
    while (exists) {
      const name = to.displayName.replace(/\Wcopy\W\d+/, '');
      const extname = path.extname(name);
      const basename = path.basename(name, extname);
      const newFileName = `${basename} copy ${idx}${extname}`;
      to = to.parent.resolve(newFileName);
      idx++;
      try {
        exists = await this.fileServiceClient.access(to.toString());
      } catch (e) {
        return;
      }
    }
    try {
      return await this.fileServiceClient.copy(from.toString(), to.toString());
    } catch (e) {
      return e.message;
    }
  }

  /**
   * 替换用户目录为 ~
   * 移除协议头文本 file://
   *
   * @param {URI} path
   * @returns
   * @memberof FileTreeAPI
   */
  public getReadableTooltip(path: URI) {
    const pathStr = path.toString();
    const userhomePathStr = this.userhomePath && this.userhomePath.toString();
    if (!this.userhomePath) {
      return decodeURIComponent(path.withScheme('').toString());
    }
    if (this.userhomePath.isEqualOrParent(path)) {
      return decodeURIComponent(pathStr.replace(userhomePathStr, '~'));
    }
    return decodeURIComponent(path.withScheme('').toString());
  }
}
