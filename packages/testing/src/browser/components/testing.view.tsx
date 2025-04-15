import React, { useEffect, useState } from 'react';

import { ViewContextKeyRegistry, localize, useInjectable } from '@Nuvio-MCP/ide-core-browser';
import { InlineMenuBar } from '@Nuvio-MCP/ide-core-browser/lib/components/actions';
import { LayoutViewSizeConfig } from '@Nuvio-MCP/ide-core-browser/lib/layout/constants';
import { AbstractContextMenuService, IContextMenu, MenuId } from '@Nuvio-MCP/ide-core-browser/lib/menu/next';
import { TitleBar } from '@Nuvio-MCP/ide-main-layout/lib/browser/accordion/titlebar.view';

import { Testing } from '../../common/constants';

import { TestingExplorerTree } from './testing.explorer.tree';
import styles from './testing.module.less';

export const TestingView = () => {
  const menuService = useInjectable<AbstractContextMenuService>(AbstractContextMenuService);
  const viewContextKeyRegistry = useInjectable<ViewContextKeyRegistry>(ViewContextKeyRegistry);
  const layoutViewSize = useInjectable<LayoutViewSizeConfig>(LayoutViewSizeConfig);

  const [menus, setMenus] = useState<IContextMenu>();

  useEffect(() => {
    const menu = menuService.createMenu({
      id: MenuId.ViewTitle,
      contextKeyService: viewContextKeyRegistry.getContextKeyService(Testing.ExplorerViewId),
    });
    setMenus(menu);
  }, []);

  return (
    <div className={styles.testing_container}>
      <TitleBar
        title={localize('test.title')}
        height={layoutViewSize.panelTitleBarHeight}
        menubar={menus ? <InlineMenuBar menus={menus}></InlineMenuBar> : null}
      />
      {/* 筛选器暂时先不搞 */}
      {/* <Input placeholder={'Filter (e.g. text, !exclude, @tag)'} addonAfter={<Icon icon='filter' />} /> */}
      <TestingExplorerTree />
    </div>
  );
};
