/**
 * 用于快速打开，检索文件
 */
import fuzzy from 'fuzzy';

import { Autowired, INJECTOR_TOKEN, Injectable, Injector } from '@Nuvio-MCP/di';
import {
  CommandService,
  EDITOR_COMMANDS,
  Highlight,
  ILogger,
  KeybindingContribution,
  KeybindingRegistry,
  Mode,
  PreferenceService,
  QuickOpenActionProvider,
  QuickOpenItem,
  RecentFilesManager,
  URI,
  formatLocalize,
  getIcon,
  getSymbolIcon,
  localize,
} from '@Nuvio-MCP/ide-core-browser';
import { LabelService } from '@Nuvio-MCP/ide-core-browser/lib/services';
import {
  CancellationToken,
  CancellationTokenSource,
  Command,
  CommandContribution,
  CommandRegistry,
  IRange,
  IReporterService,
  REPORT_NAME,
} from '@Nuvio-MCP/ide-core-common';
import { Domain } from '@Nuvio-MCP/ide-core-common/lib/di-helper';
import { EditorGroupSplitAction, WorkbenchEditorService } from '@Nuvio-MCP/ide-editor';
import {
  DocumentSymbolStore,
  IDummyRoot,
  INormalizedDocumentSymbol,
} from '@Nuvio-MCP/ide-editor/lib/browser/breadcrumb/document-symbol';
import { FileSearchServicePath, IFileSearchService } from '@Nuvio-MCP/ide-file-search/lib/common';
import * as monaco from '@Nuvio-MCP/ide-monaco';
import {
  PrefixQuickOpenService,
  QuickOpenBaseAction,
  QuickOpenModel,
  QuickOpenOptions,
} from '@Nuvio-MCP/ide-quick-open';
import {
  QuickOpenContribution,
  QuickOpenHandlerRegistry,
} from '@Nuvio-MCP/ide-quick-open/lib/browser/prefix-quick-open.service';
import { IWorkspaceService } from '@Nuvio-MCP/ide-workspace';
import { matchesFuzzy } from '@Nuvio-MCP/monaco-editor-core/esm/vs/base/common/filters';

const DEFAULT_FILE_SEARCH_LIMIT = 200;

export const quickFileOpen: Command = {
  id: 'workbench.action.quickOpen',
  category: 'File',
  label: 'Open File...',
};

export const quickGoToSymbol: Command = {
  id: 'workbench.action.gotoSymbol',
  category: 'File',
  label: 'Open File Symbol...',
};

// support /some/file.js(73,84)
// support /some/file.js#73,84
// support /some/file.js#L73
// support /some/file.js:73
// support /some/file.js:73:84
export const matchLineReg = /^([^:#(]*)[:#(]?L?(\d+)?[:,]?(\d+)?\)?/;

function getRangeByInput(input = ''): monaco.Range | undefined {
  const matchList = input.match(matchLineReg) || [];

  if (matchList.length < 2) {
    return;
  }

  const lineInfo = {
    line: Number(matchList[2] || 0),
    start: Number(matchList[3] || 0),
  };

  return new monaco.Range(lineInfo.line, lineInfo.start, lineInfo.line, lineInfo.start);
}

export function getValidateInput(input: string) {
  return input.replace(matchLineReg, '$1');
}

@Injectable()
class FileSearchActionLeftRight extends QuickOpenBaseAction {
  @Autowired(CommandService)
  private readonly commandService: CommandService;

  @Autowired(INJECTOR_TOKEN)
  private readonly injector: Injector;

  constructor() {
    super({
      id: 'file-search:splitToRight',
      tooltip: localize('quickOpen.openOnTheRightSide'),
      class: getIcon('embed'),
    });
  }

  async run(item: QuickOpenItem): Promise<void> {
    await this.commandService.executeCommand(EDITOR_COMMANDS.OPEN_RESOURCE.id, item.getUri(), {
      preview: false,
      split: EditorGroupSplitAction.Right,
      range: getRangeByInput(this.injector.get(FileSearchQuickCommandHandler).currentLookFor),
      focus: true,
    });
  }
}

@Injectable()
class FileSearchActionProvider implements QuickOpenActionProvider {
  @Autowired()
  private readonly fileSearchActionLeftRight: FileSearchActionLeftRight;

  hasActions(): boolean {
    return true;
  }

  getActions() {
    return [this.fileSearchActionLeftRight];
  }

  getValidateInput(lookFor: string) {
    return getValidateInput(lookFor);
  }
}

@Injectable()
export class FileSearchQuickCommandHandler {
  @Autowired(CommandService)
  private readonly commandService: CommandService;

  @Autowired(FileSearchServicePath)
  private readonly fileSearchService: IFileSearchService;

  @Autowired(WorkbenchEditorService)
  private readonly workbenchEditorService: WorkbenchEditorService;

  @Autowired(DocumentSymbolStore)
  private documentSymbolStore: DocumentSymbolStore;

  @Autowired()
  private readonly labelService: LabelService;

  @Autowired(IWorkspaceService)
  private readonly workspaceService: IWorkspaceService;

  @Autowired(RecentFilesManager)
  private readonly recentFilesManager: RecentFilesManager;

  @Autowired(ILogger)
  private readonly logger: ILogger;

  @Autowired()
  private readonly fileSearchActionProvider: FileSearchActionProvider;

  @Autowired(PreferenceService)
  private readonly preferenceService: PreferenceService;

  @Autowired(IReporterService)
  reporterService: IReporterService;

  private cancelIndicator = new CancellationTokenSource();
  readonly default: boolean = true;
  readonly prefix: string = '...';
  readonly description: string = localize('file-search.command.fileOpen.description');
  private prevEditorState: { uri?: URI; range?: IRange } = {};
  private prevSelected: URI | undefined;

  currentLookFor = '';

  getModel(): QuickOpenModel {
    return {
      onType: async (lookFor, acceptor) => {
        this.cancelIndicator.cancel();
        this.cancelIndicator = new CancellationTokenSource();
        const token = this.cancelIndicator.token;
        const alreadyCollected = new Set<string>();
        let findResults: QuickOpenItem[] = [];

        lookFor = lookFor.trim().replace(/\s/g, '');
        this.currentLookFor = lookFor;
        const validLookFor = getValidateInput(lookFor);
        const timer = this.reporterService.time(REPORT_NAME.QUICK_OPEN_MEASURE);
        const recentlyResultList: QuickOpenItem[] = await this.getRecentlyItems(alreadyCollected, validLookFor, token);

        if (lookFor) {
          this.logger.debug('lookFor', lookFor, validLookFor);
          findResults = await this.getFindOutItems(alreadyCollected, validLookFor, token);
        }

        if (token.isCancellationRequested) {
          return;
        }

        const concatResults = recentlyResultList.concat(findResults);
        acceptor(concatResults, concatResults.length ? this.fileSearchActionProvider : undefined);

        timer.timeEnd(lookFor.indexOf('@') > -1 ? 'file-symbol' : 'file', {
          lookFor,
          stat: {
            recently: recentlyResultList.length,
            find: findResults.length,
          },
        });
      },
    };
  }

  getOptions(): QuickOpenOptions {
    return {
      placeholder: localize('file-search.command.fileOpen.placeholder'),
      fuzzyMatchLabel: {
        enableSeparateSubstringMatching: true,
      },
      showItemsWithoutHighlight: true,
      fuzzyMatchDescription: {
        enableSeparateSubstringMatching: true,
      },
      getPlaceholderItem: (lookFor: string) =>
        new QuickOpenItem({
          label: localize(
            lookFor.indexOf('@') > -1 ? 'search.fileSymbolResults.notfound' : 'search.fileResults.notfound',
          ),
          run: () => false,
        }),
    };
  }

  onClose(canceled?: boolean) {
    if (canceled && this.prevEditorState.uri) {
      // 取消时恢复打开quickOpen时的编辑器状态
      this.workbenchEditorService.open(this.prevEditorState.uri, {
        range: this.prevEditorState.range,
      });
      this.prevEditorState = {};
    }
    this.prevSelected = undefined;
    this.cancelIndicator.cancel();
  }

  onToggle() {
    this.cancelIndicator.cancel();
  }

  // 保存此时的编辑器uri和光标位置
  private trySaveEditorState() {
    if (this.workbenchEditorService.currentResource) {
      let currentRange = { startColumn: 1, startLineNumber: 1, endColumn: 1, endLineNumber: 1 };
      const selections = this.workbenchEditorService.currentEditor?.getSelections();
      if (selections) {
        const { selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn } = selections[0];
        currentRange = new monaco.Range(
          selectionStartLineNumber,
          selectionStartColumn,
          positionLineNumber,
          positionColumn,
        );
      }
      this.prevEditorState = {
        uri: this.workbenchEditorService.currentResource.uri,
        range: currentRange,
      };
    }
  }

  private async getFindOutItems(alreadyCollected: Set<string>, lookFor: string, token: CancellationToken) {
    let results: QuickOpenItem[];
    // 有 @ 时进入查找symbol逻辑
    if (lookFor.indexOf('@') > -1) {
      // save current editor state
      this.trySaveEditorState();
      results = [];
      // 拆分文件查找和symbol查找query
      const [fileQuery, symbolQuery] = lookFor.split('@');
      let targetFile: URI | undefined;
      // 默认采用缓存的结果，无缓存的结果则分析输入查找（直接粘贴 fileName@symbolName 场景）
      if (this.prevSelected) {
        targetFile = this.prevSelected.withoutFragment();
      } else if (fileQuery) {
        const files = await this.getQueryFiles(fileQuery, alreadyCollected, token);
        if (files.length) {
          targetFile = files[0].getUri();
        }
      } else {
        targetFile = this.workbenchEditorService.currentResource?.uri;
      }
      if (targetFile) {
        const symbols = (await this.documentSymbolStore.getDocumentSymbolAsync(targetFile)) || [];
        // 将symbol tree节点展开
        const flatSymbols: INormalizedDocumentSymbol[] = [];
        this.flattenSymbols({ children: symbols }, flatSymbols);
        const items: QuickOpenItem[] = flatSymbols
          .filter((item) => {
            // 手动匹配symbol并高亮
            const matchRange: Highlight[] = matchesFuzzy(symbolQuery, item.name, true) || [];
            if (matchRange) {
              (item as any).labelHighlights = matchRange;
            }
            return matchRange && matchRange.length;
          })
          .map(
            (symbol, index) =>
              new QuickOpenItem({
                uri: targetFile,
                label: symbol.name,
                iconClass: getSymbolIcon(symbol.kind),
                description: (symbol.parent as INormalizedDocumentSymbol)?.name,
                labelHighlights: (symbol as any).labelHighlights,
                groupLabel: index === 0 ? formatLocalize('search.fileSymbolResults', flatSymbols.length) : '',
                showBorder: false,
                run: (mode: Mode) => {
                  if (mode === Mode.PREVIEW) {
                    this.locateSymbol(targetFile!, symbol);
                    return true;
                  }
                  if (mode === Mode.OPEN) {
                    this.locateSymbol(targetFile!, symbol);
                    return true;
                  }
                  return false;
                },
              }),
          );
        results = items;
      } else {
        return [];
      }
    } else {
      results = await this.getQueryFiles(lookFor, alreadyCollected, token);
      // 排序后设置第一个元素的样式
      if (results[0]) {
        const newItems = await this.getItems([results[0].getUri()!.codeUri.fsPath], {
          groupLabel: localize('search.fileResults'),
          showBorder: true,
        });
        results[0] = newItems[0];
      }
    }
    return results;
  }

  async getQueryFiles(fileQuery: string, alreadyCollected: Set<string>, token: CancellationToken) {
    const roots = await this.workspaceService.roots;
    const rootUris: string[] = roots.map((stat) => new URI(stat.uri).codeUri.fsPath);
    const files = await this.fileSearchService.find(
      fileQuery,
      {
        rootUris,
        fuzzyMatch: true,
        limit: DEFAULT_FILE_SEARCH_LIMIT,
        useGitIgnore: true,
        noIgnoreParent: true,
        excludePatterns: this.getPreferenceSearchExcludes(),
      },
      token,
    );
    const results = await this.getItems(
      files.filter((uri: string) => {
        if (alreadyCollected.has(uri) || token.isCancellationRequested) {
          return false;
        }
        alreadyCollected.add(uri);
        return true;
      }),
      {},
    );
    results.sort(this.compareItems.bind(this));
    return results;
  }

  private async flattenSymbols(symbol: INormalizedDocumentSymbol | IDummyRoot, list: INormalizedDocumentSymbol[]) {
    symbol.children!.forEach((item) => {
      list.push(item);
      if (item.children) {
        this.flattenSymbols(item, list);
      }
    });
  }

  private async getRecentlyItems(alreadyCollected, lookFor, token) {
    const recentlyOpenedFiles = (await this.recentFilesManager.getMostRecentlyOpenedFiles(true)) || [];

    return await this.getItems(
      recentlyOpenedFiles.filter((uri: string) => {
        const _uri = new URI(uri);
        if (alreadyCollected.has(uri) || !fuzzy.test(lookFor, _uri.displayName) || token.isCancellationRequested) {
          return false;
        }
        alreadyCollected.add(uri);
        return true;
      }),
      {
        groupLabel: localize('search.historyMatches'),
      },
    );
  }

  private async getItems(uriList: string[], options: { [key: string]: any }) {
    const items: QuickOpenItem[] = [];

    for (const [index, strUri] of uriList.entries()) {
      const uri = URI.isUriString(strUri) ? new URI(strUri) : URI.file(strUri);
      const icon = `file-icon ${this.labelService.getIcon(uri.withoutFragment())}`;
      let description = '';
      const relative = await this.workspaceService.asRelativePath(uri.parent);
      if (relative) {
        if (this.workspaceService.isMultiRootWorkspaceOpened) {
          description = `${new URI(relative.root).displayName}${relative.path ? ` ・ ${relative.path}` : ''}`;
        } else {
          description = relative.path || '';
        }
      }
      const item = new QuickOpenItem({
        uri,
        label: uri.displayName,
        tooltip: strUri,
        iconClass: icon,
        description,
        groupLabel: index === 0 ? options.groupLabel : '',
        showBorder: uriList.length > 0 && index === 0 ? options.showBorder : false,
        run: (mode: Mode) => {
          if (mode === Mode.PREVIEW) {
            this.prevSelected = uri;
          }
          if (mode === Mode.OPEN) {
            this.openFile(uri);
            return true;
          }
          return false;
        },
      });
      items.push(item);
    }
    return items;
  }

  private openFile(uri: URI) {
    const filePath = uri.codeUri.fsPath;
    // 优先从输入上获取 line 和 column
    let range = getRangeByInput(this.currentLookFor);
    if (!range || (!range.startLineNumber && !range.startColumn)) {
      range = getRangeByInput(uri.fragment ? '#' + uri.fragment : filePath);
    }
    this.currentLookFor = '';
    this.commandService.executeCommand(EDITOR_COMMANDS.OPEN_RESOURCE.id, uri.withoutFragment(), {
      preview: false,
      range,
      focus: true,
    });
  }

  private locateSymbol(uri: URI, symbol: INormalizedDocumentSymbol) {
    this.workbenchEditorService.open(uri, {
      range: symbol.range,
      preview: true,
    });
  }

  /**
   * Compare two `QuickOpenItem`.
   *
   * @param a `QuickOpenItem` for comparison.
   * @param b `QuickOpenItem` for comparison.
   * @param member the `QuickOpenItem` object member for comparison.
   */
  private compareItems(a: QuickOpenItem, b: QuickOpenItem, member: 'getLabel' | 'getUri' = 'getLabel'): number {
    /**
     * Normalize a given string.
     *
     * @param str the raw string value.
     * @returns the normalized string value.
     */
    function normalize(str: string) {
      return str.trim().toLowerCase();
    }

    // Normalize the user query.
    const query: string = normalize(getValidateInput(this.currentLookFor));

    /**
     * Score a given string.
     *
     * @param str the string to score on.
     * @returns the score.
     */
    function score(str: string): number {
      const match = fuzzy.match(query, str);
      return match === null ? 0 : match.score;
    }

    // Some code copied and modified from https://github.com/eclipse-theia/theia/tree/v1.14.0/packages/file-search/src/browser/quick-file-open.ts

    // Get the item's member values for comparison.
    let itemA = a[member]()!;
    let itemB = b[member]()!;

    // If the `URI` is used as a comparison member, perform the necessary string conversions.
    if (typeof itemA !== 'string') {
      itemA = itemA.path.toString();
    }
    if (typeof itemB !== 'string') {
      itemB = itemB.path.toString();
    }

    // Normalize the item labels.
    itemA = normalize(itemA);
    itemB = normalize(itemB);

    // Score the item labels.
    const scoreA: number = score(itemA);
    const scoreB: number = score(itemB);

    // If both label scores are identical, perform additional computation.
    if (scoreA === scoreB) {
      // Favor the label which have the smallest substring index.
      const indexA: number = itemA.indexOf(query);
      const indexB: number = itemB.indexOf(query);

      if (indexA === indexB) {
        // Favor the result with the shortest label length.
        if (itemA.length !== itemB.length) {
          return itemA.length < itemB.length ? -1 : 1;
        }

        // Fallback to the alphabetical order.
        const comparison = itemB.localeCompare(itemA);

        // If the alphabetical comparison is equal, call `compareItems` recursively using the `URI` member instead.
        if (comparison === 0) {
          return member === 'getUri'
            ? 0 // Avoid infinite recursion if we have already compared by `uri`.
            : this.compareItems(a, b, 'getUri');
        }

        return itemB.localeCompare(itemA);
      }

      return indexA - indexB;
    }

    return scoreB - scoreA;
  }

  private getPreferenceSearchExcludes(): string[] {
    const excludes: string[] = [];
    const fileExcludes = this.preferenceService.get<object>('files.exclude');
    const searchExcludes = this.preferenceService.get<object>('search.exclude');
    const allExcludes = Object.assign({}, fileExcludes, searchExcludes);
    for (const key of Object.keys(allExcludes)) {
      if (allExcludes[key]) {
        excludes.push(key);
      }
    }
    return excludes;
  }
}

@Domain(CommandContribution, KeybindingContribution, QuickOpenContribution)
export class FileSearchContribution implements CommandContribution, KeybindingContribution, QuickOpenContribution {
  @Autowired(FileSearchQuickCommandHandler)
  protected fileSearchQuickCommandHandler: FileSearchQuickCommandHandler;

  @Autowired(PrefixQuickOpenService)
  protected readonly quickOpenService: PrefixQuickOpenService;

  registerQuickOpenHandlers(quickOpenHandlerRegistry: QuickOpenHandlerRegistry) {
    quickOpenHandlerRegistry.registerHandler(this.fileSearchQuickCommandHandler, {
      title: localize('quickopen.tab.file'),
      commandId: quickFileOpen.id,
      order: 1,
    });
  }

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(quickFileOpen, {
      execute: () => this.quickOpenService.open('...'),
    });
    commands.registerCommand(quickGoToSymbol, {
      execute: () => this.quickOpenService.open('...@'),
    });
  }

  registerKeybindings(keybindings: KeybindingRegistry): void {
    keybindings.registerKeybinding({
      command: quickFileOpen.id,
      keybinding: 'ctrlcmd+p',
    });
  }
}
