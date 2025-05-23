import { Optional } from '@Nuvio-MCP/di';
import { Emitter, Uri, localize } from '@Nuvio-MCP/ide-core-browser';
import { IDecorationData, IDecorationsProvider } from '@Nuvio-MCP/ide-decoration';

import { FileTreeService } from './file-tree.service';

export class SymlinkDecorationsProvider implements IDecorationsProvider {
  readonly label = 'symbollink';

  readonly onDidChangeEmitter: Emitter<Uri[]> = new Emitter();

  constructor(@Optional() private readonly fileTreeService: FileTreeService) {}

  get onDidChange() {
    return this.onDidChangeEmitter.event;
  }

  provideDecorations(resource: Uri): IDecorationData | undefined {
    const node = this.fileTreeService.getNodeByPathOrUri(resource.toString());
    if (node && node.filestat) {
      if (node.filestat.isSymbolicLink) {
        return {
          letter: '⤷',
          source: node.filestat.uri,
          color: 'gitDecoration.ignoredResourceForeground',
          tooltip: localize('file.tooltip.symbolicLink'),
          // 保证单文件的情况下也可以取到对应的decoration
          weight: -1,
          bubble: !node.filestat.isDirectory,
        } as IDecorationData;
      }
    }
    return undefined;
  }
}
