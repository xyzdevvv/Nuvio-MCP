import { Range } from 'vscode-languageserver-types';

import { Autowired, Injectable } from '@Nuvio-MCP/di';
import { IEditorDocumentEditChange, IEditorDocumentModelSaveResult } from '@Nuvio-MCP/ide-core-browser';
import { IHashCalculateService } from '@Nuvio-MCP/ide-core-common/lib/hash-calculate/hash-calculate';
import { IContentChange, IFileSchemeDocClient, ISavingContent } from '@Nuvio-MCP/ide-file-scheme';
import { IFileServiceClient, TextDocumentContentChangeEvent } from '@Nuvio-MCP/ide-file-service';

/**
 * todo: 重写文档保存逻辑
 */
@Injectable()
export class FileSchemeDocClientService implements IFileSchemeDocClient {
  @Autowired(IFileServiceClient)
  private fileService: IFileServiceClient;

  @Autowired(IHashCalculateService)
  private readonly hashCalculateService: IHashCalculateService;

  async saveByChange(
    uri: string,
    change: IContentChange,
    encoding?: string | undefined,
    force?: boolean | undefined,
  ): Promise<IEditorDocumentModelSaveResult> {
    try {
      const stat = await this.fileService.getFileStat(uri);
      if (stat) {
        if (!force) {
          const res = await this.fileService.resolveContent(uri, { encoding });
          if (change.baseMd5 !== this.hashCalculateService.calculate(res.content)) {
            return {
              state: 'diff',
            };
          }
        }
        const docChanges: TextDocumentContentChangeEvent[] = [];
        change.changes!.forEach((c) => {
          if ((c as IEditorDocumentEditChange).changes) {
            (c as IEditorDocumentEditChange).changes.forEach((e) => {
              const range = Range.create(
                e.range.startLineNumber - 1,
                e.range.startColumn - 1,
                e.range.endLineNumber - 1,
                e.range.endColumn - 1,
              );
              docChanges.push({
                range,
                text: e.text,
              });
            });
          }
        });
        await this.fileService.updateContent(stat, docChanges, { encoding });
        return {
          state: 'success',
        };
      } else {
        return {
          state: 'error',
          errorMessage: 'useByContent',
        };
      }
    } catch (e) {
      return {
        state: 'error',
        errorMessage: e.toString(),
      };
    }
  }

  async saveByContent(
    uri: string,
    content: ISavingContent,
    encoding?: string | undefined,
    force?: boolean | undefined,
  ): Promise<IEditorDocumentModelSaveResult> {
    try {
      const stat = await this.fileService.getFileStat(uri);
      if (stat) {
        if (!force) {
          const res = await this.fileService.resolveContent(uri, { encoding });
          if (content.baseMd5 !== this.hashCalculateService.calculate(res.content)) {
            return {
              state: 'diff',
            };
          }
        }
        await this.fileService.setContent(stat, content.content, { encoding });
        return {
          state: 'success',
        };
      } else {
        await this.fileService.createFile(uri, { content: content.content, encoding });
        return {
          state: 'success',
        };
      }
    } catch (e) {
      return {
        state: 'error',
        errorMessage: e.toString(),
      };
    }
  }

  async getMd5(uri: string, encoding?: string | undefined): Promise<string | undefined> {
    try {
      if (await this.fileService.access(uri)) {
        const res = await this.fileService.resolveContent(uri, { encoding });
        return this.hashCalculateService.calculate(res.content);
      } else {
        return undefined;
      }
    } catch (e) {
      return undefined;
    }
  }
}
