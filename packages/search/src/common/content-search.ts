import { Event, ParsedPattern, URI, parseGlob, strings } from '@Nuvio-MCP/ide-core-common';

import type { ITree, ValidateMessage } from '@Nuvio-MCP/ide-components';

export const ContentSearchServerPath = 'ContentSearchServerPath';

export const IContentSearchServer = Symbol('ContentSearchService');

export const DEFAULT_SEARCH_IN_WORKSPACE_LIMIT = 2000;

export interface ContentSearchOptions {
  /**
   * Maximum number of results to return.  Defaults to DEFAULT_SEARCH_IN_WORKSPACE_LIMIT.
   */
  maxResults?: number;
  /**
   * Search case sensitively if true.
   */
  matchCase?: boolean;
  /**
   * Search whole words only if true.
   */
  matchWholeWord?: boolean;
  /**
   * Use regular expressions for search if true.
   */
  useRegExp?: boolean;
  /**
   * Include all .gitignored and hidden files.
   */
  includeIgnored?: boolean;
  /**
   * Glob pattern for matching files and directories to include the search.
   */
  include?: string[];
  /**
   * Glob pattern for matching files and directories to exclude the search.
   */
  exclude?: string[];
  /**
   * Interpret files using this encoding.
   * See the setting `"files.encoding"`
   */
  encoding?: string;
}

export interface IContentSearchServer {
  /**
   * Start a search for WHAT in directories ROOTURIS.  Return a unique search id.
   */
  search(searchId: number, what: string, rootUris: string[], opts?: ContentSearchOptions): Promise<number>;

  /**
   * Cancel an ongoing search.
   */
  cancel(searchId: number): Promise<void>;

  dispose(): void;
}

export const IContentSearchClientService = Symbol('IContentSearchClientService');

export interface IContentSearchClientService {
  replaceValue: string;
  searchValue: string;
  searchError: string;
  includeValue: string;
  excludeValue: string;
  searchState: SEARCH_STATE;
  UIState: IUIState;
  searchResults: Map<string, ContentSearchResult[]>;
  resultTotal: ResultTotal;
  isReplacing: boolean;
  isSearching: boolean;
  isShowValidateMessage: boolean;
  validateMessage: ValidateMessage | undefined;

  updateUIState(obj: Record<string, any>, e?: React.KeyboardEvent): void;
  replaceAll(): void;
  search(): void;
  onSearchInputChange(text: string): void;
  onReplaceInputChange(text: string): void;
  onSearchExcludeChange(text: string): void;
  onSearchIncludeChange(text: string): void;

  openPreference(): void;
  blur(): void;
  focus(): void;
  searchEditorSelection(): void;
  searchDebounce(): void;
  clean(): void;
  refresh(): void;
  setBackRecentSearchWord(): void;
  setRecentSearchWord(): void;
  initSearchHistory(): void;
  refreshIsEnable(): boolean;

  onDidChange: Event<void>;
  onDidTitleChange: Event<void>;
  onDidUIStateChange: Event<IUIState>;
  onDidSearchStateChange: Event<string>;
  fireTitleChange(): void;
}

export const ISearchTreeService = Symbol('ISearchTreeService');

export interface ISearchTreeService extends ITree {
  replaceValue: string;
  resultTotal: ResultTotal;
  initContextKey(dom: HTMLDivElement): void;
}

export interface IUIState {
  isToggleOpen: boolean;
  isDetailOpen: boolean;
  isMatchCase: boolean;
  isWholeWord: boolean;
  isUseRegexp: boolean;
  isOnlyOpenEditors: boolean;

  isIncludeIgnored: boolean;
}

export interface ContentSearchResult {
  /**
   * 该参数已经废弃
   */
  root?: string;

  /**
   * 文件Uri
   */
  fileUri: string;

  /**
   * 所在行号
   */
  line: number;

  /**
   * 匹配开始
   */
  matchStart: number;

  /**
   * 匹配长度
   */
  matchLength: number;

  /**
   * 整行的内容，出于性能考虑，存在 renderLineText 时为空
   */
  lineText?: string;

  /**
   * 过长的行内容，被裁剪后的开始位置
   */
  renderStart?: number;

  /**
   * 过长的行内容，被裁剪后的内容
   */
  renderLineText?: string;
}

export enum SEARCH_STATE {
  todo,
  doing,
  done,
  error,
}

export interface SendClientResult {
  data: ContentSearchResult[];
  id: number;
  searchState?: SEARCH_STATE;
  error?: string;
  docModelSearchedList?: string[];
}

export interface ResultTotal {
  fileNum: number;
  resultNum: number;
}

/**
 * 辅助搜索，补全通配符
 */
export function anchorGlob(glob: string, isApplyPre?: boolean): string {
  const pre = isApplyPre === false ? '' : '**/';

  if (strings.startsWith(glob, './')) {
    // 相对路径转换
    glob = glob.replace(/^.\//, '');
  }
  if (strings.endsWith(glob, '/')) {
    // 普通目录
    return `${pre}${glob}**`;
  }
  if (!/[*{(+@!^|?]/.test(glob) && !/\.[A-Za-z0-9]+$/.test(glob)) {
    // 不包含 Glob 特殊字符的普通目录
    return `${pre}${glob}/**`;
  }
  if (!strings.startsWith(glob, pre)) {
    return `${pre}${glob}`;
  }
  return glob;
}

export function getRoot(rootUris?: string[], uri?: string): string {
  let result = '';
  if (!rootUris || !uri) {
    return result;
  }
  rootUris.some((root) => {
    if (uri.indexOf(root) === 0) {
      result = root;
      return true;
    }
  });

  return result;
}

/**
 * 裁剪处理过长的结果，计算出 renderLineText、renderStart
 * @param insertResult
 */
export function cutShortSearchResult(insertResult: ContentSearchResult): ContentSearchResult {
  const result = Object.assign({}, insertResult);
  const { lineText, matchLength, matchStart } = result;
  const maxLineLength = 500;
  const maxMatchLength = maxLineLength;

  if (!lineText) {
    return result;
  }

  if (lineText.length > maxLineLength) {
    // 行内容太多的时候，裁剪行
    const preLength = 20;
    const start = matchStart - preLength > -1 ? matchStart - preLength : 0;
    result.renderLineText = lineText.slice(start, start + 500);
    delete result.lineText;
    result.renderStart = matchStart - start;
    result.matchLength = matchLength > maxMatchLength ? maxMatchLength : matchLength;
    return result;
  } else {
    // 将可见区域前移
    const preLength = 40;
    const start = matchStart - preLength > -1 ? matchStart - preLength : 0;
    result.renderLineText = lineText.slice(start, lineText.length);
    delete result.lineText;
    result.renderStart = matchStart - start;
    return result;
  }
}

export interface OpenSearchCmdOptions {
  includeValue: string;
}

/**
 * 用于排除 通过贪婪匹配后的，相对路径的glob 匹配到的所有路径的结果
 */
export class FilterFileWithGlobRelativePath {
  private matcherList: { relative: ParsedPattern; absolute: ParsedPattern }[] = [];

  constructor(roots: string[], globs: string[]) {
    if (roots.length < 1 || globs.length < 1) {
      return;
    }

    roots.forEach((root) => {
      const rootUri = new URI(root);

      globs.forEach((glob) => {
        if (strings.startsWith(glob, './')) {
          // 处理相对路径
          const relative = parseGlob(anchorGlob(glob));
          glob = glob.slice(2, glob.length);

          const pathStrWithExclude = rootUri.resolve(anchorGlob(glob, false)).path.toString();
          this.matcherList.push({
            relative,
            absolute: parseGlob(pathStrWithExclude),
          });
        }
      });
    });
  }

  test(uriString: string) {
    let result = true;

    if (this.matcherList.length < 1) {
      return result;
    }
    const pathStr = new URI(uriString).path.toString();

    this.matcherList.some((matchers) => {
      if (!matchers.relative(pathStr)) {
        return;
      } else {
        result = false;
      }
      result = matchers.absolute(pathStr);
      return result;
    });

    return result;
  }
}
