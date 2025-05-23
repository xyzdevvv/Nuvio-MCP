import { IInputBaseProps } from '@Nuvio-MCP/ide-components';
import { IMenubarItem, ISubmenuItem } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { ISumiMenuExtendInfo } from '@Nuvio-MCP/ide-core-common';
import { ThemeType } from '@Nuvio-MCP/ide-theme';

// eslint-disable-next-line import/no-restricted-paths
import { IExtensionContributions } from '../vscode/extension';

// eslint-disable-next-line import/no-restricted-paths
import type { IToolbarButtonContribution, IToolbarSelectContribution } from '../../browser/sumi/types';
// eslint-disable-next-line import/no-restricted-paths
import type { ITabBarViewContribution } from '../../browser/sumi-browser/types';

export interface IContributeMenubarItem extends Omit<IMenubarItem, 'label'> {
  title: IMenubarItem['label'];
}

export interface IContributedSubmenu extends Omit<ISubmenuItem, 'submenu' | 'label' | 'order' | 'iconClass'> {
  id: ISubmenuItem['submenu']; // submenu id
  title?: ISubmenuItem['label']; // label 后续对插件输出统一使用 title 字段
  when?: string;
  icon?: { [index in ThemeType]: string } | string;
}

export interface IBrowserView {
  type: 'add';
  view: Array<{
    id: string;
    icon: string;
    [prop: string]: any;
  }>;
}

export interface ISumiExtensionContributions extends IExtensionContributions {
  menubars?: IContributeMenubarItem[];
  browserViews?: {
    [location: string]: {
      type: 'add' | 'replace';
      view: ITabBarViewContribution[];
    };
  };
  toolbar?: {
    actions?: Array<IToolbarButtonContribution | IToolbarSelectContribution>;
  };
  viewsProxies?: string[];
  workerMain?: string;
  nodeMain?: string;
  browserMain?: string;
  // 针对 vscode contributes 中的 menus 的一些扩展
  menuExtend?: {
    [menuId: string]: Array<ISumiMenuExtendInfo>;
  };
  scm?: {
    additional?: {
      input?: Omit<IInputBaseProps, 'addonBefore' | 'addonAfter'> & { addonBefore?: string[]; addonAfter?: string[] };
    };
  };
}
