import { Event, IBaseMarkerManager, IMarker, IMatch } from '@Nuvio-MCP/ide-core-common';
import { ThemeType } from '@Nuvio-MCP/ide-theme';

import type { ITree } from '@Nuvio-MCP/ide-components';
import type { ViewBadge } from 'vscode';

export { MARKER_CONTAINER_ID } from '@Nuvio-MCP/ide-core-browser/lib/common/container-id';

export const IMarkerService = Symbol('IMarkerService');
export interface IMarkerService extends ITree {
  /**
   * 获得 Manager
   */
  getManager(): IBaseMarkerManager;

  /**
   * 获取问题数量
   */
  getBadge(): string | ViewBadge | undefined;

  /**
   * filter 内容变化时触发事件
   */
  onMarkerFilterChanged: Event<IFilterOptions | undefined>;
  /**
   * 获取主题类型
   */
  getThemeType(): ThemeType;
}

/**
 * marker 过滤条件
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IFilterOptions {}

/**
 * 过滤后的marker
 */
export interface IRenderableMarker extends IMarker {
  match?: boolean;
  matches?: IFilterMatches;
}

/**
 * marker item构建器，防止在其他地方散乱的构建代码
 */
export class MarkerItemBuilder {
  public static buildFilterItem(marker: IMarker, match: boolean, matches?: IFilterMatches): IRenderableMarker {
    return {
      ...marker,
      match,
      matches,
    };
  }
}

/**
 * filter detail postions
 */
export interface IFilterMatches {
  filenameMatches?: IMatch[] | undefined | null; // 文件名称
  messageMatches?: IMatch[] | undefined | null; // 信息
  sourceMatches?: IMatch[] | undefined | null; // 来源
  codeMatches?: IMatch[] | undefined | null; // 错误编码
}

// 可渲染marker model
export interface IRenderableMarkerModel {
  readonly resource: string;
  readonly icon: string;
  readonly filename: string;
  readonly longname: string;
  readonly markers: IRenderableMarker[];
  size: () => number;

  readonly match: boolean;
  readonly matches?: IFilterMatches;
}

export class MarkerModelBuilder {
  public static buildModel(
    resource: string,
    icon: string,
    filename: string,
    longname: string,
    markers: IRenderableMarker[],
  ): IRenderableMarkerModel {
    return {
      match: true,
      resource,
      icon,
      filename,
      longname,
      markers,
      size: () => markers.length,
    };
  }

  public static buildFilterModel(
    model: IRenderableMarkerModel,
    markers: IRenderableMarker[],
    parentMatch: boolean,
    childrenMatch: boolean,
    matches?: IFilterMatches,
  ): IRenderableMarkerModel {
    const match = parentMatch || childrenMatch;
    return {
      ...model,
      match,
      markers,
      matches,
      size: () => {
        if (match) {
          return markers.length;
        }
        let count = 0;
        markers.forEach((m) => {
          if (m.match) {
            count++;
          }
        });
        return count;
      },
    };
  }
}
